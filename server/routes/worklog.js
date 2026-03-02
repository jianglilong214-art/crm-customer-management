import { Router } from 'express';
import { getDb, saveDatabase } from '../db.js';
import { broadcast } from '../socket.js';

const router = Router();

router.get('/', (req, res) => {
  const db = getDb();
  const { page = 1, pageSize = 10, startDate, endDate } = req.query;
  let where = 'WHERE user_id = ?';
  let params = [req.user.id];
  if (startDate) { where += ' AND date >= ?'; params.push(startDate); }
  if (endDate) { where += ' AND date <= ?'; params.push(endDate); }

  const countStmt = db.prepare(`SELECT COUNT(*) as total FROM work_logs ${where}`);
  countStmt.bind(params);
  countStmt.step();
  const total = countStmt.getAsObject().total;
  countStmt.free();

  const offset = (parseInt(page) - 1) * parseInt(pageSize);
  const stmt = db.prepare(`SELECT * FROM work_logs ${where} ORDER BY date DESC LIMIT ? OFFSET ?`);
  stmt.bind([...params, parseInt(pageSize), offset]);
  const list = [];
  while (stmt.step()) list.push(stmt.getAsObject());
  stmt.free();

  res.json({ code: 200, data: { list, total } });
});

router.post('/', (req, res) => {
  const db = getDb();
  const { content, customer_count, call_count, visit_count, date } = req.body;
  const logDate = date || new Date().toISOString().split('T')[0];
  db.run(`INSERT INTO work_logs (user_id, content, customer_count, call_count, visit_count, date) VALUES (?, ?, ?, ?, ?, ?)`,
    [req.user.id, content, customer_count || 0, call_count || 0, visit_count || 0, logDate]);
  saveDatabase();
  broadcast('worklog:change', { action: 'create' });
  res.json({ code: 200, message: '日志提交成功' });
});

export default router;
