const router = require('express').Router();
const db = require('../db');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'ogsun_secret_123';
router.use((req, res, next) => { try { req.user = jwt.verify(req.cookies.token, JWT_SECRET); next(); } catch { res.status(403).json({ error: 'Akse refize' }); } });
router.get('/', async (req, res) => res.json((await db.query('SELECT * FROM tasks WHERE affiliate_id=$1 ORDER BY created_at DESC', [req.user.id])).rows));
router.post('/', async (req, res) => {
  const r = await db.query('INSERT INTO tasks (affiliate_id, description, proof_url) VALUES ($1,$2,$3) RETURNING *', [req.user.id, req.body.description, req.body.proof_url]);
  res.json(r.rows[0]);
});
module.exports = router;
