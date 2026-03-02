import { Router } from 'express';
import { getDb } from '../db.js';

const router = Router();

// Team list
router.get('/', (req, res) => {
  const db = getDb();
  const stmt = db.prepare(`SELECT t.*, u.name as leader_name FROM teams t LEFT JOIN users u ON t.leader_id = u.id ORDER BY t.id`);
  const list = [];
  while (stmt.step()) list.push(stmt.getAsObject());
  stmt.free();
  res.json({ code: 200, data: list });
});

// Team ranking - must be before /:id to avoid route conflict
router.get('/ranking/list', (req, res) => {
  const db = getDb();
  const { days = 7 } = req.query;
  const daysInt = parseInt(days);
  const stmt = db.prepare(`SELECT t.id, t.name,
    COALESCE(SUM(ts.score), 0) as total_score,
    COALESCE(SUM(ts.customer_count), 0) as total_customers,
    COALESCE(SUM(ts.sign_count), 0) as total_signs
    FROM teams t
    LEFT JOIN team_scores ts ON t.id = ts.team_id AND ts.date >= date('now', ? || ' days')
    GROUP BY t.id ORDER BY total_score DESC`);
  stmt.bind(['-' + daysInt]);
  const list = [];
  while (stmt.step()) list.push(stmt.getAsObject());
  stmt.free();
  res.json({ code: 200, data: list });
});

// Individual ranking
router.get('/ranking/individual', (req, res) => {
  const db = getDb();
  const results = db.exec(`SELECT u.id, u.name, u.department,
    COUNT(DISTINCT c.id) as customer_count,
    COUNT(DISTINCT CASE WHEN c.status = 'signed' THEN c.id END) as sign_count
    FROM users u
    LEFT JOIN customers c ON c.owner_id = u.id
    WHERE u.role != 'admin'
    GROUP BY u.id ORDER BY sign_count DESC, customer_count DESC`);

  const list = [];
  if (results.length > 0) {
    const cols = results[0].columns;
    results[0].values.forEach(row => {
      const obj = {};
      cols.forEach((c, i) => obj[c] = row[i]);
      list.push(obj);
    });
  }
  res.json({ code: 200, data: list });
});

// Team detail with members
router.get('/:id', (req, res) => {
  const db = getDb();
  const stmt = db.prepare(`SELECT t.*, u.name as leader_name FROM teams t LEFT JOIN users u ON t.leader_id = u.id WHERE t.id = ?`);
  stmt.bind([parseInt(req.params.id)]);
  if (stmt.step()) {
    const team = stmt.getAsObject();
    stmt.free();
    const mstmt = db.prepare(`SELECT u.id, u.name, u.phone, u.department FROM team_members tm JOIN users u ON tm.user_id = u.id WHERE tm.team_id = ?`);
    mstmt.bind([parseInt(req.params.id)]);
    const members = [];
    while (mstmt.step()) members.push(mstmt.getAsObject());
    mstmt.free();
    res.json({ code: 200, data: { ...team, members } });
  } else {
    stmt.free();
    res.json({ code: 404, message: '团队不存在' });
  }
});

export default router;
