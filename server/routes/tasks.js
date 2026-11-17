const router = require('express').Router();
const db = require('../db');
const { affiliateOnly } = require('../middleware/auth');

router.get('/', affiliateOnly, async (req, res) => {
  try {
    const r = await db.query('SELECT * FROM tasks WHERE affiliate_id=$1 ORDER BY created_at DESC', [req.user.id]);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: 'Erè' }); }
});

router.post('/', affiliateOnly, async (req, res) => {
  try {
    const { description, proof_url } = req.body;
    
    // KONTWÒL STRIK: Prèv la dwe gen omwen 10 karaktè (lyen oswa deskripsyon)
    if (!proof_url || proof_url.trim().length < 10) {
      return res.status(400).json({ error: 'Prèv la twò kout. Tanpri mete yon lyen oswa yon deskripsyon ki gen omwen 10 karaktè.' });
    }
    if (!description) {
      return res.status(400).json({ error: 'Non travay la obligatwa.' });
    }

    const r = await db.query(
      'INSERT INTO tasks (affiliate_id, description, proof_url) VALUES ($1,$2,$3) RETURNING *',
      [req.user.id, description, proof_url.trim()]
    );
    res.json(r.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erè sèvè' });
  }
});

module.exports = router;
