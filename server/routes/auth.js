const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET } = require('../middleware/auth');

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 3600 * 1000
};

router.post('/register', async (req, res) => {
  try {
    let { name, email, phone, service, password } = req.body || {};
    if (!name || !email || !phone || !service || !password)
      return res.status(400).json({ error: 'Tout chan obligatwa' });
    if (String(password).length < 6)
      return res.status(400).json({ error: 'Modpas dwe gen omwen 6 karaktè' });
    email = String(email).toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ error: 'Imèl pa valid' });

    const exists = await db.query('SELECT id FROM affiliates WHERE email=$1', [email]);
    if (exists.rows.length)
      return res.status(409).json({ error: 'Imèl sa a deja anrejistre' });

    const hash = await bcrypt.hash(password, 10);
    const r = await db.query(
      `INSERT INTO affiliates (name,email,phone,service,password_hash,status)
       VALUES ($1,$2,$3,$4,$5,'pending') RETURNING id, name, email, status`,
      [name.trim(), email, phone.trim(), service, hash]
    );
    res.json({ message: 'Kont kreye. Tann aktivasyon Admin.', affiliate: r.rows[0] });
  } catch (e) {
    console.error('register:', e);
    res.status(500).json({ error: 'Erè sèvè' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Imèl ak modpas obligatwa' });
    const r = await db.query('SELECT * FROM affiliates WHERE email=$1', [String(email).toLowerCase()]);
    if (!r.rows.length) return res.status(401).json({ error: 'Imèl oswa modpas pa kòrèk' });
    const aff = r.rows[0];
    if (aff.status === 'suspended') return res.status(403).json({ error: 'Kont ou sispann' });
    if (aff.status === 'pending') return res.status(403).json({ error: 'Kont ou poko aktive' });

    const ok = await bcrypt.compare(password, aff.password_hash);
    if (!ok) return res.status(401).json({ error: 'Imèl oswa modpas pa kòrèk' });

    const token = jwt.sign(
      { id: aff.id, role: 'affiliate', name: aff.name },
      JWT_SECRET, { expiresIn: '7d' }
    );
    res.cookie('token', token, COOKIE_OPTS);
    res.json({ message: 'OK', role: 'affiliate', name: aff.name });
  } catch (e) {
    console.error('login:', e);
    res.status(500).json({ error: 'Erè sèvè' });
  }
});

router.post('/admin-login', (req, res) => {
  const { password } = req.body || {};
  const adminPass = process.env.ADMIN_PASSWORD || 'Carlinsky';
  if (!password || password !== adminPass)
    return res.status(401).json({ error: 'Modpas pa kòrèk' });

  const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '12h' });
  res.cookie('token', token, { ...COOKIE_OPTS, maxAge: 12 * 3600 * 1000 });
  res.json({ message: 'OK', role: 'admin' });
});

router.get('/me', (req, res) => {
  try {
    const token = req.cookies && req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Pa konekte' });
    res.json(jwt.verify(token, JWT_SECRET));
  } catch {
    res.status(401).json({ error: 'Token envalid' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Deconnexion' });
});

module.exports = router;
