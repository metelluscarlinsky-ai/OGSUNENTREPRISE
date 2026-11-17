const router = require('express').Router();
const db = require('../db');
const { adminOnly } = require('../middleware/auth');
router.get('/affiliates', adminOnly, async (req, res) => res.json((await db.query('SELECT * FROM affiliates ORDER BY created_at DESC')).rows));
router.patch('/affiliates/:id/status', adminOnly, async (req, res) => res.json((await db.query('UPDATE affiliates SET status=$1 WHERE id=$2 RETURNING *', [req.body.status, req.params.id])).rows[0]));
router.get('/partners', adminOnly, async (req, res) => res.json((await db.query('SELECT * FROM partner_sites')).rows));
router.post('/partners', adminOnly, async (req, res) => {
  const crypto = require('crypto');
  const key = 'ogsun_' + crypto.randomBytes(16).toString('hex');
  res.json((await db.query('INSERT INTO partner_sites (name, url, api_key) VALUES ($1,$2,$3) RETURNING *', [req.body.name, req.body.url, key])).rows[0]);
});
router.delete('/partners/:id', adminOnly, async (req, res) => { await db.query('DELETE FROM partner_sites WHERE id=$1', [req.params.id]); res.json({ ok: true }); });
router.get('/customers', adminOnly, async (req, res) => res.json((await db.query('SELECT s.*, a.name AS affiliate_name FROM sales s JOIN affiliates a ON a.id=s.affiliate_id ORDER BY s.created_at DESC')).rows));
router.get('/tasks', adminOnly, async (req, res) => res.json((await db.query('SELECT t.*, a.name AS affiliate_name FROM tasks t JOIN affiliates a ON a.id=t.affiliate_id ORDER BY t.created_at DESC')).rows));
router.patch('/tasks/:id/status', adminOnly, async (req, res) => res.json((await db.query('UPDATE tasks SET status=$1 WHERE id=$2 RETURNING *', [req.body.status, req.params.id])).rows[0]));
router.get('/analytics', adminOnly, async (req, res) => res.json({ monthly: (await db.query(`SELECT TO_CHAR(date_trunc('month', created_at),'YYYY-MM') as month, SUM(amount) as total_sales FROM sales GROUP BY 1 ORDER BY 1`)).rows, totals: (await db.query(`SELECT SUM(amount) as revenue, COUNT(*) as sales_count FROM sales`)).rows[0] }));
module.exports = router;
