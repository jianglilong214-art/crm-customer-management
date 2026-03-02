import { Router } from 'express';
import { getDb } from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  const db = getDb();
  const { year, month } = req.query;
  let where = 'WHERE sr.user_id = ?';
  let params = [req.user.id];
  if (year) { where += ' AND sr.year = ?'; params.push(parseInt(year)); }
  if (month) { where += ' AND sr.month = ?'; params.push(parseInt(month)); }

  const stmt = db.prepare(`SELECT sr.*, u.name as user_name FROM salary_records sr LEFT JOIN users u ON sr.user_id = u.id ${where} ORDER BY sr.year DESC, sr.month DESC`);
  stmt.bind(params);
  const list = [];
  while (stmt.step()) list.push(stmt.getAsObject());
  stmt.free();

  res.json({ code: 200, data: list });
});

router.post('/calculate', (req, res) => {
  const { base_salary, commission_rate, sales_amount, bonus, deduction } = req.body;
  const commission = (commission_rate || 0) / 100 * (sales_amount || 0);
  const total = (base_salary || 0) + commission + (bonus || 0) - (deduction || 0);
  res.json({ code: 200, data: { base_salary, commission: Math.round(commission * 100) / 100, bonus, deduction, total: Math.round(total * 100) / 100 } });
});

export default router;
