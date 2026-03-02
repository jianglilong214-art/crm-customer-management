import { Router } from 'express';
import { getDb, saveDatabase } from '../db.js';
import { broadcast } from '../socket.js';

const router = Router();

// Get attendance records
router.get('/', (req, res) => {
  const db = getDb();
  const { month, year, page = 1, pageSize = 31 } = req.query;
  let where = 'WHERE user_id = ?';
  let params = [req.user.id];
  if (year && month) {
    where += ` AND date LIKE ?`;
    params.push(`${year}-${String(month).padStart(2, '0')}%`);
  }
  const offset = (parseInt(page) - 1) * parseInt(pageSize);
  const stmt = db.prepare(`SELECT * FROM attendance ${where} ORDER BY date DESC LIMIT ? OFFSET ?`);
  stmt.bind([...params, parseInt(pageSize), offset]);
  const list = [];
  while (stmt.step()) list.push(stmt.getAsObject());
  stmt.free();

  const countStmt = db.prepare(`SELECT COUNT(*) as total FROM attendance ${where}`);
  countStmt.bind(params);
  countStmt.step();
  const total = countStmt.getAsObject().total;
  countStmt.free();

  res.json({ code: 200, data: { list, total } });
});

// Today's status
router.get('/today', (req, res) => {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];
  const stmt = db.prepare('SELECT * FROM attendance WHERE user_id = ? AND date = ?');
  stmt.bind([req.user.id, today]);
  if (stmt.step()) {
    res.json({ code: 200, data: stmt.getAsObject() });
  } else {
    res.json({ code: 200, data: null });
  }
  stmt.free();
});

// Sign in
router.post('/sign-in', (req, res) => {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const { location } = req.body;

  const check = db.prepare('SELECT * FROM attendance WHERE user_id = ? AND date = ?');
  check.bind([req.user.id, today]);
  if (check.step()) {
    check.free();
    return res.json({ code: 400, message: '今日已签到' });
  }
  check.free();

  const hour = new Date().getHours();
  const status = hour >= 9 ? 'late' : 'normal';
  db.run('INSERT INTO attendance (user_id, sign_in_time, location, status, date) VALUES (?, ?, ?, ?, ?)',
    [req.user.id, now, location || '公司', status, today]);
  saveDatabase();
  broadcast('attendance:change', { action: 'sign-in' });
  res.json({ code: 200, message: status === 'late' ? '签到成功（迟到）' : '签到成功' });
});

// Sign out
router.post('/sign-out', (req, res) => {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

  const check = db.prepare('SELECT * FROM attendance WHERE user_id = ? AND date = ?');
  check.bind([req.user.id, today]);
  if (check.step()) {
    const row = check.getAsObject();
    check.free();
    if (row.sign_out_time) return res.json({ code: 400, message: '今日已签退' });
    db.run('UPDATE attendance SET sign_out_time = ? WHERE id = ?', [now, row.id]);
    saveDatabase();
    broadcast('attendance:change', { action: 'sign-out' });
    res.json({ code: 200, message: '签退成功' });
  } else {
    check.free();
    res.json({ code: 400, message: '请先签到' });
  }
});

export default router;
