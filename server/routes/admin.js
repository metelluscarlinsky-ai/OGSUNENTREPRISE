const router = require('express').Router();
const db = require('../db');
const { adminOnly } = require('../middleware/auth');
const crypto = require('crypto');

// ===== SIT PATNÈ (NOUVO) =====
router.get('/partners', adminOnly, async (req, res) => {
  const r = await db.query('SELECT * FROM partner_sites ORDER BY created_at DESC');
  res.json(r.rows);
});

router.post('/partners', adminOnly, async (req, res) => {
  try {
    const { name, url } = req.body;
    if (!name) return res.status(400).json({ error: 'Non sit la obligatwa' });

    // Jenere yon kle inik (API Key)
    const api_key = 'ogsun_' + crypto.randomBytes(16).toString('hex');

    const r = await db.query(
      'INSERT INTO partner_sites (name, url, api_key) VALUES ($1, $2, $3) RETURNING *',
      [name, url || '', api_key]
    );
    res.json(r.rows[0]);
  } catch (e) {
    if (e.code === '23505') return res.status(400).json({ error: 'Sit sa a deja egziste' });
    res.status(500).json({ error: 'Erè' });
  }
});

router.patch('/partners/:id/status', adminOnly, async (req, res) => {
  const r = await db.query('UPDATE partner_sites SET status=$1 WHERE id=$2 RETURNING *', [req.body.status, req.params.id]);
  res.json(r.rows[0]);
});

router.delete('/partners/:id', adminOnly, async (req, res) => {
  await db.query('DELETE FROM partner_sites WHERE id=$1', [req.params.id]);
  res.json({ ok: true });
});

// ===== RÈT FONKSYON YO (Afilye, Vant, Kliyan, elatriye) =====
router.get('/affiliates', adminOnly, async (req, res) => {
  const r = await db.query(`SELECT id,name,email,phone,service,status,referral_code,created_at FROM affiliates ORDER BY created_at DESC`);
  res.json(r.rows);
});

router.patch('/affiliates/:id/status', adminOnly, async (req, res) => {
  const r = await db.query('UPDATE affiliates SET status=$1 WHERE id=$2 RETURNING id,status', [req.body.status, req.params.id]);
  res.json(r.rows[0]);
});

router.get('/tasks', adminOnly, async (req, res) => {
  const r = await db.query(`SELECT t.*, a.name AS affiliate_name FROM tasks t JOIN affiliates a ON a.id = t.affiliate_id ORDER BY t.created_at DESC`);
  res.json(r.rows);
});

router.patch('/tasks/:id/status', adminOnly, async (req, res) => {
  const r = await db.query('UPDATE tasks SET status=$1 WHERE id=$2 RETURNING *', [req.body.status, req.params.id]);
  res.json(r.rows[0]);
});

router.get('/customers', adminOnly, async (req, res) => {
  const r = await db.query(`SELECT s.*, a.name AS affiliate_name, a.referral_code FROM sales s JOIN affiliates a ON a.id = s.affiliate_id ORDER BY s.created_at DESC`);
  res.json(r.rows);
});

router.post('/sales', adminOnly, async (req, res) => {
  const { affiliate_id, customer_name, amount, service, site_source } = req.body;
  const amt = parseFloat(amount);
  const commission = +(amt * 0.10).toFixed(2);
  const r = await db.query(
    `INSERT INTO sales (affiliate_id, customer_name, amount, commission, service, site_source, status) VALUES ($1, $2, $3, $4, $5, $6, 'pending') RETURNING *`,
    [affiliate_id, customer_name, amt, commission, service, site_source || 'Manyèl']
  );
  res.json(r.rows[0]);
});

router.patch('/sales/:id/status', adminOnly, async (req, res) => {
  const r = await db.query('UPDATE sales SET status=$1 WHERE id=$2 RETURNING *', [req.body.status, req.params.id]);
  res.json(r.rows[0]);
});

router.get('/sales', adminOnly, async (req, res) => {
  const r = await db.query(`SELECT s.*, a.name AS affiliate_name FROM sales s JOIN affiliates a ON a.id = s.affiliate_id ORDER BY s.created_at DESC`);
  res.json(r.rows);
});

router.post('/notifications', adminOnly, async (req, res) => {
  const { affiliate_id, message } = req.body;
  if (affiliate_id === 'all') {
    const affs = await db.query('SELECT id FROM affiliates WHERE status=$1', ['active']);
    for (let a of affs.rows) await db.query('INSERT INTO notifications (affiliate_id, message) VALUES ($1,$2)', [a.id, message]);
    return res.json({ count: affs.rows.length });
  }
  await db.query('INSERT INTO notifications (affiliate_id, message) VALUES ($1,$2)', [affiliate_id, message]);
  res.json({ count: 1 });
});

router.get('/notifications', adminOnly, async (req, res) => {
  const r = await db.query(`SELECT n.*, a.name AS affiliate_name FROM notifications n JOIN affiliates a ON a.id = n.affiliate_id ORDER BY n.created_at DESC LIMIT 100`);
  res.json(r.rows);
});

router.get('/analytics', adminOnly, async (req, res) => {
  const monthly = await db.query(`SELECT TO_CHAR(date_trunc('month', created_at), 'YYYY-MM') AS month, COALESCE(SUM(amount),0) AS total_sales FROM sales WHERE created_at >= NOW() - INTERVAL '12 months' GROUP BY 1 ORDER BY 1`);
  const totals = await db.query(`SELECT COALESCE(SUM(amount),0) AS revenue, COALESCE(SUM(commission),0) AS commission, COUNT(*)::int AS sales_count FROM sales`);
  const counts = await db.query(`SELECT (SELECT COUNT(*)::int FROM affiliates) AS affiliates, (SELECT COUNT(*)::int FROM affiliates WHERE status='active') AS active_affiliates`);
  res.json({ monthly: monthly.rows, totals: totals.rows[0], counts: counts.rows[0] });
});

module.exports = router;
