import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { getDb, saveDatabase } from '../db.js';
import { generateToken } from '../middleware/auth.js';

const router = Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.json({ code: 400, message: '请输入用户名和密码' });

  const db = getDb();
  const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
  stmt.bind([username]);

  if (stmt.step()) {
    const row = stmt.getAsObject();
    if (bcrypt.compareSync(password, row.password)) {
      const token = generateToken(row);
      const { password: _, ...userInfo } = row;
      res.json({ code: 200, data: { token, user: userInfo }, message: '登录成功' });
    } else {
      res.json({ code: 400, message: '密码错误' });
    }
  } else {
    res.json({ code: 400, message: '用户不存在' });
  }
  stmt.free();
});

router.post('/register', (req, res) => {
  const { username, password, name, phone } = req.body;
  if (!username || !password || !name) return res.json({ code: 400, message: '请填写完整信息' });

  const db = getDb();
  const check = db.prepare('SELECT id FROM users WHERE username = ?');
  check.bind([username]);
  if (check.step()) {
    check.free();
    return res.json({ code: 400, message: '用户名已存在' });
  }
  check.free();

  const hashed = bcrypt.hashSync(password, 10);
  db.run('INSERT INTO users (username, password, name, phone) VALUES (?, ?, ?, ?)', [username, hashed, name, phone || '']);
  saveDatabase();
  res.json({ code: 200, message: '注册成功' });
});

router.post('/change-password', (req, res) => {
  const { userId, oldPassword, newPassword } = req.body;
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  stmt.bind([userId]);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    if (!bcrypt.compareSync(oldPassword, row.password)) {
      stmt.free();
      return res.json({ code: 400, message: '原密码错误' });
    }
    const hashed = bcrypt.hashSync(newPassword, 10);
    db.run('UPDATE users SET password = ? WHERE id = ?', [hashed, userId]);
    saveDatabase();
    stmt.free();
    res.json({ code: 200, message: '密码修改成功' });
  } else {
    stmt.free();
    res.json({ code: 400, message: '用户不存在' });
  }
});

export default router;
