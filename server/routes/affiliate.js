const router = require('express').Router();
const db = require('../db');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'ogsun_secret_123';
router.use((req, res, next) => { try { req.user = jwt.verify(req.cookies.token, JWT_SECRET); next(); } catch { res.status(403).json({ error: 'Akse refize' }); } });

router.get('/me', async (req, res) => {
  const r = await db.query('SELECT id,name,email,referral_code FROM affiliates WHERE id=$1', [req.user.id]);
  const aff = r.rows[0];
  aff.tracking_link = `https://ogsun-mache-lakay.onrender.com/?ref=${aff.referral_code}`;
  res.json(aff);
});
router.get('/portfolio', async (req, res) => {
  const stats = await db.query('SELECT SUM(amount) as total_sales, SUM(commission) as total_commission, COUNT(*) as sales_count FROM sales WHERE affiliate_id=$1', [req.user.id]);
  const customers = await db.query('SELECT * FROM sales WHERE affiliate_id=$1 ORDER BY created_at DESC', [req.user.id]);
  res.json({ stats: stats.rows[0], customers: customers.rows });
});
router.get('/notifications', async (req, res) => res.json((await db.query('SELECT * FROM notifications WHERE affiliate_id=$1 ORDER BY created_at DESC', [req.user.id])).rows));
module.exports = router;
