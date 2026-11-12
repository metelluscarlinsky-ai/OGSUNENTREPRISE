require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();
app.set('trust proxy', 1);

// --- Sécurité ---
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// --- KÒREKSYON POU RENDER ---
// Sou Render, si Root Directory se 'server', process.cwd() se '.../src/server'.
// Kidonk nou monte yon nivo ('..') pou n jwenn dosye 'public' la.
const publicPath = path.join(process.cwd(), '..', 'public');

// Sèvi ak fichye statik yo (CSS, JS, imaj)
app.use(express.static(publicPath));

// --- API Routes ---
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/affiliate', require('./routes/affiliate'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/videos', require('./routes/videos'));

// --- Wout dirèk pou paj HTML yo (Pou evite erè ENOENT) ---
app.get('/', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(publicPath, 'admin.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(publicPath, 'dashboard.html'));
});

// --- 404 API ---
app.use('/api', (req, res) => res.status(404).json({ error: 'Wout pa egziste' }));

// --- Error handler ---
app.use((err, req, res, next) => {
  console.error('Erè:', err.message);
  res.status(500).json({ error: 'Erè sèvè' });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
  console.log('OGSUNENTERPRISE ap kouri sou pò ' + PORT);
});
