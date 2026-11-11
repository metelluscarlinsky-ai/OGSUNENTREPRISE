const router = require('express').Router();
const db = require('../db');
const { affiliateOnly } = require('../middleware/auth');

router.get('/', affiliateOnly, async (req, res) => {
  const r = await db.query(
    'SELECT * FROM tasks WHERE affiliate_id=$1 ORDER BY created_at DESC',
    [req.user.id]
  );
  res.json(r.rows);
});

router.post('/', affiliateOnly, async (req, res) => {
  const { description } = req.body || {};
  if (!description || !description.trim())
    return res.status(400).json({ error: 'Deskripsyon obligatwa' });
  const r = await db.query(
    'INSERT INTO tasks (affiliate_id, description) VALUES ($1,$2) RETURNING *',
    [req.user.id, description.trim()]
  );
  res.json(r.rows[0]);
});

router.patch('/:id', affiliateOnly, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { completed } = req.body || {};
  const r = await db.query(
    'UPDATE tasks SET completed=$1 WHERE id=$2 AND affiliate_id=$3 RETURNING *',
    [!!completed, id, req.user.id]
  );
  if (!r.rows.length) return res.status(404).json({ error: 'Travay pa jwenn' });
  res.json(r.rows[0]);
});

router.delete('/:id', affiliateOnly, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  await db.query('DELETE FROM tasks WHERE id=$1 AND affiliate_id=$2', [id, req.user.id]);
  res.json({ ok: true });
});

module.exports = router;
