import { Router } from 'express';
import { getDb } from '../db.js';

const router = Router();

router.get('/stats', (req, res) => {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];

  const totalCustomers = db.exec('SELECT COUNT(*) FROM customers')[0]?.values[0][0] || 0;
  const todayNew = db.exec(`SELECT COUNT(*) FROM customers WHERE date(created_at) = '${today}'`)[0]?.values[0][0] || 0;
  const todayFollows = db.exec(`SELECT COUNT(*) FROM customer_follows WHERE date(created_at) = '${today}'`)[0]?.values[0][0] || 0;
  const signedCount = db.exec("SELECT COUNT(*) FROM customers WHERE status = 'signed'")[0]?.values[0][0] || 0;
  const todayAttendance = db.exec(`SELECT COUNT(*) FROM attendance WHERE date = '${today}'`)[0]?.values[0][0] || 0;

  // Customer trend (last 7 days)
  const trend = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const count = db.exec(`SELECT COUNT(*) FROM customers WHERE date(created_at) = '${dateStr}'`)[0]?.values[0][0] || 0;
    trend.push({ date: dateStr, count });
  }

  // Source distribution
  const sourceResult = db.exec("SELECT source, COUNT(*) as count FROM customers WHERE source != '' GROUP BY source");
  const sourceDistribution = [];
  if (sourceResult.length > 0) {
    sourceResult[0].values.forEach(row => {
      sourceDistribution.push({ name: row[0], value: row[1] });
    });
  }

  // Intention distribution
  const intentionResult = db.exec("SELECT intention_level, COUNT(*) as count FROM customers GROUP BY intention_level");
  const intentionDistribution = [];
  if (intentionResult.length > 0) {
    intentionResult[0].values.forEach(row => {
      intentionDistribution.push({ name: row[0] + '级', value: row[1] });
    });
  }

  // Status distribution
  const statusResult = db.exec("SELECT status, COUNT(*) as count FROM customers GROUP BY status");
  const statusDistribution = [];
  if (statusResult.length > 0) {
    statusResult[0].values.forEach(row => {
      const labels = { potential: '潜在客户', followed: '跟进中', signed: '已签约' };
      statusDistribution.push({ name: labels[row[0]] || row[0], value: row[1] });
    });
  }

  res.json({
    code: 200,
    data: {
      totalCustomers,
      todayNew,
      todayFollows,
      signedCount,
      todayAttendance,
      trend,
      sourceDistribution,
      intentionDistribution,
      statusDistribution
    }
  });
});

export default router;
