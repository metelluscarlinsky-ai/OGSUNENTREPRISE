const router = require('express').Router();
const db = require('../db');
const { affiliateOnly } = require('../middleware/auth');

router.get('/me', affiliateOnly, async (req, res) => {
  const r = await db.query('SELECT id,name,email,referral_code FROM affiliates WHERE id=$1', [req.user.id]);
  if (!r.rows.length) return res.status(404).json({ error: 'Kont pa jwenn' });
  const aff = r.rows[0];
  aff.tracking_link = `https://ogsun-mache-lakay.onrender.com/?ref=${aff.referral_code}`;
  res.json(aff);
});

router.get('/portfolio', affiliateOnly, async (req, res) => {
  const id = req.user.id;
  const stats = await db.query(`SELECT COALESCE(SUM(amount),0) AS total_sales, COALESCE(SUM(commission),0) AS total_commission, COUNT(*)::int AS sales_count FROM sales WHERE affiliate_id=$1`, [id]);
  const customers = await db.query(`SELECT customer_name, service, amount, commission, site_source, status, created_at FROM sales WHERE affiliate_id=$1 ORDER BY created_at DESC`, [id]);
  const clicks = await db.query(`SELECT COUNT(*)::int AS total FROM clicks WHERE affiliate_id=$1`, [id]);
  res.json({ stats: stats.rows[0], customers: customers.rows, clicks: clicks.rows[0].total });
});

router.get('/notifications', affiliateOnly, async (req, res) => {
  const r = await db.query('SELECT * FROM notifications WHERE affiliate_id=$1 ORDER BY created_at DESC', [req.user.id]);
  res.json(r.rows);
});

router.patch('/notifications/:id/read', affiliateOnly, async (req, res) => {
  await db.query('UPDATE notifications SET is_read=TRUE WHERE id=$1 AND affiliate_id=$2', [req.params.id, req.user.id]);
  res.json({ ok: true });
});

module.exports = router;
