const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const JWT_SECRET = process.env.JWT_SECRET || 'ogsun_secret_123';
router.post('/register', async (req, res) => {
  try {
    let { name, email, phone, service, password } = req.body;
    email = String(email).toLowerCase().trim();
    const existing = await db.query('SELECT id FROM affiliates WHERE email=$1', [email]);
    if (existing.rows.length) return res.status(409).json({ error: 'Imèl deja itilize' });
    const hash = await bcrypt.hash(password, 10);
    const r = await db.query(`INSERT INTO affiliates (name,email,phone,service,password_hash) VALUES ($1,$2,$3,$4,$5) RETURNING id`, [name, email, phone, service, hash]);
    await db.query(`UPDATE affiliates SET referral_code = 'OGSUN-' || LPAD(id::text, 4, '0') WHERE id = $1`, [r.rows[0].id]);
    res.json({ message: 'Kont kreye' });
  } catch (e) { res.status(500).json({ error: 'Erè' }); }
});
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const r = await db.query('SELECT * FROM affiliates WHERE email=$1', [String(email).toLowerCase()]);
    if (!r.rows.length) return res.status(401).json({ error: 'Pa kòrèk' });
    const aff = r.rows[0];
    if (aff.status === 'pending') return res.status(403).json({ error: 'Kont poko aktive' });
    if (!(await bcrypt.compare(password, aff.password_hash))) return res.status(401).json({ error: 'Pa kòrèk' });
    const token = jwt.sign({ id: aff.id, role: 'affiliate', name: aff.name }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, { httpOnly: true, sameSite: 'lax', secure: true });
    res.json({ message: 'OK' });
  } catch (e) { res.status(500).json({ error: 'Erè' }); }
});
router.post('/admin-login', (req, res) => {
  if (req.body.password !== (process.env.ADMIN_PASSWORD || 'Carlinsky')) return res.status(401).json({ error: 'Modpas pa kòrèk' });
  const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '12h' });
  res.cookie('token', token, { httpOnly: true, sameSite: 'lax', secure: true });
  res.json({ message: 'OK' });
});
router.get('/me', (req, res) => {
  try { res.json(jwt.verify(req.cookies.token, JWT_SECRET)); } catch { res.status(401).json({ error: 'Pa konekte' }); }
});
router.post('/logout', (req, res) => { res.clearCookie('token'); res.json({ message: 'OK' }); });
module.exports = router;
