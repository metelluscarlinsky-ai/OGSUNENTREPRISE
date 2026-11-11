const router = require('express').Router();
const db = require('../db');
const { affiliateOnly } = require('../middleware/auth');

router.get('/me', affiliateOnly, async (req, res) => {
  const r = await db.query(
    'SELECT id,name,email,phone,service,status,created_at FROM affiliates WHERE id=$1',
    [req.user.id]
  );
  if (!r.rows.length) return res.status(404).json({ error: 'Kont pa jwenn' });
  res.json(r.rows[0]);
});

router.get('/portfolio', affiliateOnly, async (req, res) => {
  const id = req.user.id;
  const stats = await db.query(
    `SELECT
        COALESCE(SUM(amount),0) AS total_sales,
        COALESCE(SUM(commission),0) AS total_commission,
        COALESCE(SUM(CASE WHEN status='paid' THEN commission ELSE 0 END),0) AS paid_commission,
        COALESCE(SUM(CASE WHEN status='pending' THEN commission ELSE 0 END),0) AS pending_commission,
        COUNT(*)::int AS sales_count
     FROM sales WHERE affiliate_id=$1`,
    [id]
  );
  const customers = await db.query(
    `SELECT customer_name, service, amount, commission, status, created_at
     FROM sales WHERE affiliate_id=$1 ORDER BY created_at DESC`,
    [id]
  );
  res.json({ stats: stats.rows[0], customers: customers.rows });
});

router.get('/notifications', affiliateOnly, async (req, res) => {
  const r = await db.query(
    'SELECT id,message,is_read,created_at FROM notifications WHERE affiliate_id=$1 ORDER BY created_at DESC',
    [req.user.id]
  );
  res.json(r.rows);
});

router.patch('/notifications/:id/read', affiliateOnly, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  await db.query(
    'UPDATE notifications SET is_read=TRUE WHERE id=$1 AND affiliate_id=$2',
    [id, req.user.id]
  );
  res.json({ ok: true });
});

module.exports = router;
