const router = require('express').Router();
const db = require('../db');
const { adminOnly } = require('../middleware/auth');
const { sendActivationEmail } = require('../mailer');

// ===== Afilye =====
router.get('/affiliates', adminOnly, async (req, res) => {
  const r = await db.query(
    `SELECT id,name,email,phone,service,status,created_at
     FROM affiliates ORDER BY created_at DESC`
  );
  res.json(r.rows);
});

router.patch('/affiliates/:id/status', adminOnly, async (req, res) => {
  const { status } = req.body || {};
  if (!['active', 'pending', 'suspended'].includes(status))
    return res.status(400).json({ error: 'Estati pa valid' });
  
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ error: 'ID pa valid' });
  
  const r = await db.query(
    'UPDATE affiliates SET status=$1 WHERE id=$2 RETURNING id,status,name,email',
    [status, id]
  );
  
  if (!r.rows.length) return res.status(404).json({ error: 'Afilye pa jwenn' });
  
  const affiliate = r.rows[0];

  // Voye imèl si se yon aktivasyon
  if (status === 'active' && affiliate.email) {
    sendActivationEmail(affiliate.email, affiliate.name);
  }

  res.json(affiliate);
});

// ===== Vant =====
router.post('/sales', adminOnly, async (req, res) => {
  try {
    const { affiliate_id, customer_name, amount, service, status } = req.body || {};
    if (!affiliate_id || !customer_name || !amount || !service)
      return res.status(400).json({ error: 'Tout chan obligatwa' });
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0)
      return res.status(400).json({ error: 'Montan pa valid' });
    const commission = +(amt * 0.10).toFixed(2);

    const aff = await db.query('SELECT id FROM affiliates WHERE id=$1', [affiliate_id]);
    if (!aff.rows.length) return res.status(404).json({ error: 'Afilye pa jwenn' });

    const r = await db.query(
      `INSERT INTO sales (affiliate_id,customer_name,amount,commission,service,status)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [affiliate_id, customer_name.trim(), amt, commission, service, status || 'pending']
    );
    res.json(r.rows[0]);
  } catch (e) {
    console.error('sale:', e);
    res.status(500).json({ error: 'Erè sèvè' });
  }
});

router.get('/sales', adminOnly, async (req, res) => {
  const r = await db.query(
    `SELECT s.*, a.name AS affiliate_name
     FROM sales s JOIN affiliates a ON a.id = s.affiliate_id
     ORDER BY s.created_at DESC`
  );
  res.json(r.rows);
});

router.patch('/sales/:id/status', adminOnly, async (req, res) => {
  const { status } = req.body || {};
  if (!['pending', 'paid'].includes(status))
    return res.status(400).json({ error: 'Estati pa valid' });
  const id = parseInt(req.params.id, 10);
  const r = await db.query(
    'UPDATE sales SET status=$1 WHERE id=$2 RETURNING *',
    [status, id]
  );
  if (!r.rows.length) return res.status(404).json({ error: 'Vant pa jwenn' });
  res.json(r.rows[0]);
});

// ===== Kliyan =====
router.get('/customers', adminOnly, async (req, res) => {
  const r = await db.query(
    `SELECT s.customer_name, s.service, s.amount, s.created_at,
            a.name AS affiliate_name
     FROM sales s JOIN affiliates a ON a.id = s.affiliate_id
     ORDER BY s.created_at DESC`
  );
  res.json(r.rows);
});

// ===== Notifikasyon =====
router.post('/notifications', adminOnly, async (req, res) => {
  try {
    const { affiliate_id, message } = req.body || {};
    if (!message || !message.trim())
      return res.status(400).json({ error: 'Mesaj obligatwa' });

    if (affiliate_id === 'all' || affiliate_id === null || affiliate_id === undefined) {
      const affs = await db.query('SELECT id FROM affiliates WHERE status=$1', ['active']);
      if (!affs.rows.length) return res.json({ message: 'Pa gen afilye aktif', count: 0 });
      const values = affs.rows.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(',');
      const params = [];
      affs.rows.forEach(a => { params.push(a.id, message.trim()); });
      await db.query(`INSERT INTO notifications (affiliate_id, message) VALUES ${values}`, params);
      return res.json({ message: 'Voye bay tout moun', count: affs.rows.length });
    }

    const id = parseInt(affiliate_id, 10);
    if (!id) return res.status(400).json({ error: 'ID afilye pa valid' });
    const check = await db.query('SELECT id FROM affiliates WHERE id=$1', [id]);
    if (!check.rows.length) return res.status(404).json({ error: 'Afilye pa jwenn' });

    await db.query(
      'INSERT INTO notifications (affiliate_id, message) VALUES ($1,$2)',
      [id, message.trim()]
    );
    res.json({ message: 'Notifikasyon voye', count: 1 });
  } catch (e) {
    console.error('notif:', e);
    res.status(500).json({ error: 'Erè sèvè' });
  }
});

router.get('/notifications', adminOnly, async (req, res) => {
  const r = await db.query(
    `SELECT n.*, a.name AS affiliate_name
     FROM notifications n JOIN affiliates a ON a.id = n.affiliate_id
     ORDER BY n.created_at DESC LIMIT 100`
  );
  res.json(r.rows);
});

// ===== Analytique =====
router.get('/analytics', adminOnly, async (req, res) => {
  const monthly = await db.query(`
    SELECT TO_CHAR(date_trunc('month', created_at), 'YYYY-MM') AS month,
           COALESCE(SUM(amount),0) AS total_sales,
           COALESCE(SUM(commission),0) AS total_commission,
           COUNT(*)::int AS count
    FROM sales
    WHERE created_at >= NOW() - INTERVAL '12 months'
    GROUP BY 1 ORDER BY 1
  `);
  const totals = await db.query(`
    SELECT
      COALESCE(SUM(amount),0) AS revenue,
      COALESCE(SUM(commission),0) AS commission,
      COUNT(*)::int AS sales_count
    FROM sales
  `);
  const counts = await db.query(`
    SELECT
      (SELECT COUNT(*)::int FROM affiliates) AS affiliates,
      (SELECT COUNT(*)::int FROM affiliates WHERE status='active') AS active_affiliates,
      (SELECT COUNT(*)::int FROM affiliates WHERE status='pending') AS pending_affiliates
  `);
  res.json({
    monthly: monthly.rows,
    totals: totals.rows[0],
    counts: counts.rows[0]
  });
});

module.exports = router;
