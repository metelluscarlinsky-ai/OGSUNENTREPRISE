const router = require('express').Router();
const db = require('../db');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'ogsun_secret_123';
router.use((req, res, next) => { try { if (jwt.verify(req.cookies.token, JWT_SECRET).role !== 'admin') throw new Error(); next(); } catch { res.status(403).json({ error: 'Akse refize' }); } });

router.get('/affiliates', async (req, res) => res.json((await db.query('SELECT * FROM affiliates ORDER BY created_at DESC')).rows));
router.patch('/affiliates/:id/status', async (req, res) => res.json((await db.query('UPDATE affiliates SET status=$1 WHERE id=$2 RETURNING *', [req.body.status, req.params.id])).rows[0]));
router.get('/partners', async (req, res) => res.json((await db.query('SELECT * FROM partner_sites')).rows));
router.post('/partners', async (req, res) => {
  const crypto = require('crypto');
  const key = 'ogsun_' + crypto.randomBytes(16).toString('hex');
  res.json((await db.query('INSERT INTO partner_sites (name, url, api_key) VALUES ($1,$2,$3) RETURNING *', [req.body.name, req.body.url, key])).rows[0]);
});
router.delete('/partners/:id', async (req, res) => { await db.query('DELETE FROM partner_sites WHERE id=$1', [req.params.id]); res.json({ ok: true }); });
router.get('/customers', async (req, res) => res.json((await db.query('SELECT s.*, a.name AS affiliate_name FROM sales s JOIN affiliates a ON a.id=s.affiliate_id ORDER BY s.created_at DESC')).rows));
router.get('/tasks', async (req, res) => res.json((await db.query('SELECT t.*, a.name AS affiliate_name FROM tasks t JOIN affiliates a ON a.id=t.affiliate_id ORDER BY t.created_at DESC')).rows));
router.patch('/tasks/:id/status', async (req, res) => res.json((await db.query('UPDATE tasks SET status=$1 WHERE id=$2 RETURNING *', [req.body.status, req.params.id])).rows[0]));
router.get('/notifications', async (req, res) => res.json((await db.query('SELECT n.*, a.name AS affiliate_name FROM notifications n JOIN affiliates a ON a.id=n.affiliate_id ORDER BY n.created_at DESC')).rows));
router.post('/notifications', async (req, res) => {
  if (req.body.affiliate_id === 'all') {
    const affs = await db.query('SELECT id FROM affiliates');
    for (let a of affs.rows) await db.query('INSERT INTO notifications (affiliate_id, message) VALUES ($1,$2)', [a.id, req.body.message]);
  } else await db.query('INSERT INTO notifications (affiliate_id, message) VALUES ($1,$2)', [req.body.affiliate_id, req.body.message]);
  res.json({ ok: true });
});
router.get('/analytics', async (req, res) => res.json({ monthly: (await db.query(`SELECT TO_CHAR(date_trunc('month', created_at),'YYYY-MM') as month, SUM(amount) as total_sales FROM sales GROUP BY 1 ORDER BY 1`)).rows, totals: (await db.query(`SELECT SUM(amount) as revenue, COUNT(*) as sales_count FROM sales`)).rows[0] }));
module.exports = router;
