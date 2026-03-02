import { Router } from 'express';
import { getDb, saveDatabase } from '../db.js';
import { broadcast } from '../socket.js';

const router = Router();

router.get('/', (req, res) => {
  const db = getDb();
  const { status } = req.query;
  let sql = 'SELECT * FROM projects';
  let params = [];
  if (status) { sql += ' WHERE status = ?'; params.push(status); }
  sql += ' ORDER BY created_at DESC';

  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const list = [];
  while (stmt.step()) list.push(stmt.getAsObject());
  stmt.free();
  res.json({ code: 200, data: list });
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM projects WHERE id = ?');
  stmt.bind([parseInt(req.params.id)]);
  if (stmt.step()) {
    const project = stmt.getAsObject();
    stmt.free();
    const estmt = db.prepare('SELECT pe.*, u.name as creator_name FROM project_events pe LEFT JOIN users u ON pe.created_by = u.id WHERE pe.project_id = ? ORDER BY pe.created_at DESC');
    estmt.bind([parseInt(req.params.id)]);
    const events = [];
    while (estmt.step()) events.push(estmt.getAsObject());
    estmt.free();
    res.json({ code: 200, data: { ...project, events } });
  } else {
    stmt.free();
    res.json({ code: 404, message: '项目不存在' });
  }
});

router.post('/', (req, res) => {
  const db = getDb();
  const { name, description, address, status, start_date, end_date } = req.body;
  db.run('INSERT INTO projects (name, description, address, status, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?)',
    [name, description||'', address||'', status||'active', start_date||'', end_date||'']);
  saveDatabase();
  broadcast('project:change', { action: 'create' });
  res.json({ code: 200, message: '项目创建成功' });
});

router.post('/:id/events', (req, res) => {
  const db = getDb();
  const { title, content, type } = req.body;
  db.run('INSERT INTO project_events (project_id, title, content, type, created_by) VALUES (?, ?, ?, ?, ?)',
    [parseInt(req.params.id), title, content||'', type||'info', req.user.id]);
  saveDatabase();
  broadcast('project:change', { action: 'event', id: parseInt(req.params.id) });
  res.json({ code: 200, message: '事件添加成功' });
});

export default router;
