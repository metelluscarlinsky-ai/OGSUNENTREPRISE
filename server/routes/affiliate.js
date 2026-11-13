const router = require('express').Router();
const db = require('../db');
const { affiliateOnly } = require('../middleware/auth');

router.get('/me', affiliateOnly, async (req, res) => {
  try {
    const r = await db.query(
      'SELECT id,name,email,phone,service,status,referral_code,balance,created_at FROM affiliates WHERE id=$1',
      [req.user.id]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'Kont pa jwenn' });
    
    const aff = r.rows[0];
    // Kreye link inik la
    aff.tracking_link = `https://ogsun-mache-lakay.onrender.com/?ref=${aff.referral_code}`;
    res.json(aff);
  } catch (e) {
    res.status(500).json({ error: 'Erè sèvè' });
  }
});

router.get('/portfolio', affiliateOnly, async (req, res) => {
  try {
    const id = req.user.id;
    
    // Estatistik jeneral
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
    
    // Kliyan yo
    const customers = await db.query(
      `SELECT customer_name, service, amount, commission, status, created_at
       FROM sales WHERE affiliate_id=$1 ORDER BY created_at DESC`,
      [id]
    );
    
    // Klik yo
    const clicks = await db.query(
      `SELECT COUNT(*)::int AS total FROM clicks WHERE affiliate_id=$1`, [id]
    );

    // Peman yo
    const payments = await db.query(
      `SELECT id, amount, method, status, created_at FROM payments WHERE affiliate_id=$1 ORDER BY created_at DESC`, [id]
    );

    res.json({ 
      stats: stats.rows[0], 
      customers: customers.rows,
      clicks: clicks.rows[0].total,
      payments: payments.rows
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erè baz done' });
  }
});

router.get('/notifications', affiliateOnly, async (req, res) => {
  try {
    const r = await db.query(
      'SELECT id,message,is_read,created_at FROM notifications WHERE affiliate_id=$1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: 'Erè' }); }
});

router.patch('/notifications/:id/read', affiliateOnly, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await db.query(
      'UPDATE notifications SET is_read=TRUE WHERE id=$1 AND affiliate_id=$2',
      [id, req.user.id]
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: 'Erè' }); }
});

module.exports = router;
