import { Router } from 'express';
import { getDb, saveDatabase } from '../db.js';
import { broadcast } from '../socket.js';

const router = Router();

router.get('/', (req, res) => {
  const db = getDb();
  const { type, page = 1, pageSize = 20 } = req.query;
  let where = 'WHERE m.user_id = ?';
  let params = [req.user.id];
  if (type) { where += ' AND m.type = ?'; params.push(type); }

  // Use prepare for parameterized count query
  const countStmt = db.prepare(`SELECT COUNT(*) as total FROM messages m ${where}`);
  countStmt.bind(params);
  countStmt.step();
  const total = countStmt.getAsObject().total;
  countStmt.free();

  const offset = (parseInt(page) - 1) * parseInt(pageSize);
  const stmt = db.prepare(`SELECT * FROM messages m ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`);
  stmt.bind([...params, parseInt(pageSize), offset]);
  const list = [];
  while (stmt.step()) list.push(stmt.getAsObject());
  stmt.free();

  // Use prepare for parameterized unread count query
  const unreadStmt = db.prepare(`SELECT COUNT(*) as unread FROM messages WHERE user_id = ? AND is_read = 0`);
  unreadStmt.bind([req.user.id]);
  unreadStmt.step();
  const unread = unreadStmt.getAsObject().unread;
  unreadStmt.free();

  res.json({ code: 200, data: { list, total, unread } });
});

router.get('/:id', (req, res) => {
  const db = getDb();
  db.run('UPDATE messages SET is_read = 1 WHERE id = ?', [parseInt(req.params.id)]);
  saveDatabase();
  const stmt = db.prepare('SELECT * FROM messages WHERE id = ?');
  stmt.bind([parseInt(req.params.id)]);
  if (stmt.step()) {
    res.json({ code: 200, data: stmt.getAsObject() });
  } else {
    res.json({ code: 404, message: '消息不存在' });
  }
  stmt.free();
});

router.post('/read-all', (req, res) => {
  const db = getDb();
  db.run('UPDATE messages SET is_read = 1 WHERE user_id = ?', [req.user.id]);
  saveDatabase();
  broadcast('message:change', { action: 'read' });
  res.json({ code: 200, message: '已全部标为已读' });
});

export default router;
