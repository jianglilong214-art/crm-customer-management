import { Router } from 'express';
import { getDb, saveDatabase } from '../db.js';
import { broadcast } from '../socket.js';

const router = Router();

router.get('/', (req, res) => {
  const db = getDb();
  const { keyword, status, education, page = 1, pageSize = 10 } = req.query;
  let where = [];
  let params = [];

  if (keyword) {
    where.push("(t.name LIKE ? OR t.phone LIKE ? OR t.school LIKE ?)");
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }
  if (status) { where.push("t.status = ?"); params.push(status); }
  if (education) { where.push("t.education = ?"); params.push(education); }

  const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

  const countStmt = db.prepare(`SELECT COUNT(*) as total FROM talents t ${whereClause}`);
  if (params.length > 0) countStmt.bind(params);
  countStmt.step();
  const total = countStmt.getAsObject().total;
  countStmt.free();

  const offset = (parseInt(page) - 1) * parseInt(pageSize);
  const stmt = db.prepare(`SELECT t.*, u.name as assigned_name FROM talents t LEFT JOIN users u ON t.assigned_to = u.id ${whereClause} ORDER BY t.created_at DESC LIMIT ? OFFSET ?`);
  stmt.bind([...params, parseInt(pageSize), offset]);
  const list = [];
  while (stmt.step()) list.push(stmt.getAsObject());
  stmt.free();

  res.json({ code: 200, data: { list, total } });
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const stmt = db.prepare('SELECT t.*, u.name as assigned_name FROM talents t LEFT JOIN users u ON t.assigned_to = u.id WHERE t.id = ?');
  stmt.bind([parseInt(req.params.id)]);
  if (stmt.step()) {
    res.json({ code: 200, data: stmt.getAsObject() });
  } else {
    res.json({ code: 404, message: '人才不存在' });
  }
  stmt.free();
});

router.post('/', (req, res) => {
  const db = getDb();
  const { name, phone, gender, education, school, major, experience, remark } = req.body;
  db.run('INSERT INTO talents (name, phone, gender, education, school, major, experience, remark) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [name, phone||'', gender||'', education||'', school||'', major||'', experience||'', remark||'']);
  saveDatabase();
  broadcast('talent:change', { action: 'create' });
  res.json({ code: 200, message: '添加成功' });
});

router.post('/:id/assign', (req, res) => {
  const db = getDb();
  const { assigned_to } = req.body;
  db.run('UPDATE talents SET assigned_to = ?, status = ? WHERE id = ?', [assigned_to, 'assigned', parseInt(req.params.id)]);
  saveDatabase();
  broadcast('talent:change', { action: 'assign', id: parseInt(req.params.id) });
  res.json({ code: 200, message: '分配成功' });
});

export default router;
