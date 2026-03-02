import { Router } from 'express';
import { getDb, saveDatabase } from '../db.js';
import { broadcast } from '../socket.js';

const router = Router();

// List with search/filter/pagination
router.get('/', (req, res) => {
  const db = getDb();
  const { keyword, status, intention_level, source, page = 1, pageSize = 10 } = req.query;
  let where = [];
  let params = [];

  if (keyword) {
    where.push("(c.name LIKE ? OR c.phone LIKE ?)");
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  if (status) { where.push("c.status = ?"); params.push(status); }
  if (intention_level) { where.push("c.intention_level = ?"); params.push(intention_level); }
  if (source) { where.push("c.source = ?"); params.push(source); }

  const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

  // Use prepare for parameterized count query
  const countStmt = db.prepare(`SELECT COUNT(*) as total FROM customers c ${whereClause}`);
  if (params.length > 0) countStmt.bind(params);
  countStmt.step();
  const total = countStmt.getAsObject().total;
  countStmt.free();

  // For parameterized queries with LIMIT/OFFSET, use prepare
  const offset = (parseInt(page) - 1) * parseInt(pageSize);
  const sql = `SELECT c.*, u.name as owner_name FROM customers c LEFT JOIN users u ON c.owner_id = u.id ${whereClause} ORDER BY c.updated_at DESC LIMIT ? OFFSET ?`;
  const allParams = [...params, parseInt(pageSize), offset];

  const stmt = db.prepare(sql);
  stmt.bind(allParams);
  const list = [];
  while (stmt.step()) {
    list.push(stmt.getAsObject());
  }
  stmt.free();

  res.json({ code: 200, data: { list, total, page: parseInt(page), pageSize: parseInt(pageSize) } });
});

// Get one customer
router.get('/:id', (req, res) => {
  const db = getDb();
  const stmt = db.prepare('SELECT c.*, u.name as owner_name FROM customers c LEFT JOIN users u ON c.owner_id = u.id WHERE c.id = ?');
  stmt.bind([parseInt(req.params.id)]);
  if (stmt.step()) {
    const customer = stmt.getAsObject();
    stmt.free();

    // Get follow records
    const fstmt = db.prepare('SELECT cf.*, u.name as user_name FROM customer_follows cf LEFT JOIN users u ON cf.user_id = u.id WHERE cf.customer_id = ? ORDER BY cf.created_at DESC');
    fstmt.bind([parseInt(req.params.id)]);
    const follows = [];
    while (fstmt.step()) follows.push(fstmt.getAsObject());
    fstmt.free();

    res.json({ code: 200, data: { ...customer, follows } });
  } else {
    stmt.free();
    res.json({ code: 404, message: '客户不存在' });
  }
});

// Create
router.post('/', (req, res) => {
  const db = getDb();
  const { name, phone, gender, age, intention_level, source, address, province, city, district, remark, status } = req.body;
  db.run(`INSERT INTO customers (name, phone, gender, age, intention_level, source, address, province, city, district, remark, status, owner_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, phone||'', gender||'', age||0, intention_level||'C', source||'', address||'', province||'', city||'', district||'', remark||'', status||'potential', req.user.id]);
  saveDatabase();

  // Get the last inserted id
  const result = db.exec('SELECT last_insert_rowid() as id');
  const id = result[0].values[0][0];
  broadcast('customer:change', { action: 'create' });
  res.json({ code: 200, data: { id }, message: '添加成功' });
});

// Update
router.put('/:id', (req, res) => {
  const db = getDb();
  const { name, phone, gender, age, intention_level, source, address, province, city, district, remark, status } = req.body;
  db.run(`UPDATE customers SET name=?, phone=?, gender=?, age=?, intention_level=?, source=?, address=?, province=?, city=?, district=?, remark=?, status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
    [name, phone||'', gender||'', age||0, intention_level||'C', source||'', address||'', province||'', city||'', district||'', remark||'', status||'potential', parseInt(req.params.id)]);
  saveDatabase();
  broadcast('customer:change', { action: 'update', id: parseInt(req.params.id) });
  res.json({ code: 200, message: '更新成功' });
});

// Delete
router.delete('/:id', (req, res) => {
  const db = getDb();
  db.run('DELETE FROM customer_follows WHERE customer_id = ?', [parseInt(req.params.id)]);
  db.run('DELETE FROM customers WHERE id = ?', [parseInt(req.params.id)]);
  saveDatabase();
  broadcast('customer:change', { action: 'delete', id: parseInt(req.params.id) });
  res.json({ code: 200, message: '删除成功' });
});

// Add follow record
router.post('/:id/follow', (req, res) => {
  const db = getDb();
  const { content, follow_type, next_follow_time } = req.body;
  db.run(`INSERT INTO customer_follows (customer_id, user_id, content, follow_type, next_follow_time) VALUES (?, ?, ?, ?, ?)`,
    [parseInt(req.params.id), req.user.id, content, follow_type||'phone', next_follow_time||null]);
  db.run(`UPDATE customers SET updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [parseInt(req.params.id)]);
  saveDatabase();
  broadcast('customer:change', { action: 'follow', id: parseInt(req.params.id) });
  res.json({ code: 200, message: '跟进记录添加成功' });
});

// Assign customer
router.post('/:id/assign', (req, res) => {
  const db = getDb();
  const { owner_id } = req.body;
  db.run('UPDATE customers SET owner_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [owner_id, parseInt(req.params.id)]);
  saveDatabase();
  broadcast('customer:change', { action: 'assign', id: parseInt(req.params.id) });
  res.json({ code: 200, message: '分配成功' });
});

export default router;
