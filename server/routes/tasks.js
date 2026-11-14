const router = require('express').Router();
const db = require('../db');
const { affiliateOnly } = require('../middleware/auth');

// Wè tout travay afilye a
router.get('/', affiliateOnly, async (req, res) => {
  try {
    const r = await db.query(
      'SELECT * FROM tasks WHERE affiliate_id=$1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: 'Erè' }); }
});

// Soumèt yon nouvo travay ak prèv
router.post('/', affiliateOnly, async (req, res) => {
  try {
    const { description, type, proof_url } = req.body || {};
    if (!description || !description.trim())
      return res.status(400).json({ error: 'Deskripsyon obligatwa' });

    const r = await db.query(
      `INSERT INTO tasks (affiliate_id, description, type, proof_url, status)
       VALUES ($1, $2, $3, $4, 'pending') RETURNING *`,
      [req.user.id, description.trim(), type || 'custom', proof_url || null]
    );
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: 'Erè sèvè' }); }
});

// Efase yon travay ki poko apwouve
router.delete('/:id', affiliateOnly, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await db.query(
      "DELETE FROM tasks WHERE id=$1 AND affiliate_id=$2 AND status='pending'",
      [id, req.user.id]
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: 'Erè' }); }
});

module.exports = router;
