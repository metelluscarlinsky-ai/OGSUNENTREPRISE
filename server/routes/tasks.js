const router = require('express').Router();
const db = require('../db');
const { affiliateOnly } = require('../middleware/auth');
router.get('/', affiliateOnly, async (req, res) => res.json((await db.query('SELECT * FROM tasks WHERE affiliate_id=$1 ORDER BY created_at DESC', [req.user.id])).rows));
router.post('/', affiliateOnly, async (req, res) => {
  const r = await db.query('INSERT INTO tasks (affiliate_id, description, proof_url) VALUES ($1,$2,$3) RETURNING *', [req.user.id, req.body.description, req.body.proof_url]);
  res.json(r.rows[0]);
});
module.exports = router;
