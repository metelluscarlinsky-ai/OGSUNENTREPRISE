const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'ogsun_secret_123';
function authRequired(req, res, next) {
  try {
    const token = (req.cookies && req.cookies.token) || (req.headers.authorization || '').replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Pa konekte' });
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) { return res.status(401).json({ error: 'Token envalid' }); }
}
function adminOnly(req, res, next) {
  authRequired(req, res, () => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Akse refize' });
    next();
  });
}
function affiliateOnly(req, res, next) {
  authRequired(req, res, () => {
    if (req.user.role !== 'affiliate') return res.status(403).json({ error: 'Akse refize' });
    next();
  });
}
module.exports = { authRequired, adminOnly, affiliateOnly, JWT_SECRET };
