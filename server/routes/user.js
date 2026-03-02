import { Router } from 'express';
import { getDb, saveDatabase } from '../db.js';
import { broadcast } from '../socket.js';

const router = Router();

router.get('/info', (req, res) => {
  const db = getDb();
  const stmt = db.prepare('SELECT id, username, name, phone, email, avatar, role, department, status, created_at FROM users WHERE id = ?');
  stmt.bind([req.user.id]);
  if (stmt.step()) {
    res.json({ code: 200, data: stmt.getAsObject() });
  } else {
    res.json({ code: 404, message: '用户不存在' });
  }
  stmt.free();
});

router.put('/info', (req, res) => {
  const db = getDb();
  const { name, phone, email } = req.body;
  db.run('UPDATE users SET name = ?, phone = ?, email = ? WHERE id = ?', [name, phone||'', email||'', req.user.id]);
  saveDatabase();
  broadcast('user:change', { action: 'update' });
  res.json({ code: 200, message: '更新成功' });
});

router.get('/list', (req, res) => {
  const db = getDb();
  const stmt = db.prepare('SELECT id, username, name, phone, role, department FROM users WHERE status = 1 ORDER BY id');
  const list = [];
  while (stmt.step()) list.push(stmt.getAsObject());
  stmt.free();
  res.json({ code: 200, data: list });
});

export default router;
