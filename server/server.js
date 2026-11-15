require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');

// Filet sekirite pou wè erè yo nan Render Logs
process.on('uncaughtException', (err) => {
  console.error('🔥 UNCATCHED EXCEPTION:', err);
  // Pa fèmen pwosesis la touswit pou w ka wè loj yo
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('🔥 UNHANDLED REJECTION:', reason);
});

const app = express();
app.set('trust proxy', 1);

// Middleware
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

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const publicPath = path.join(process.cwd(), '..', 'public');
app.use(express.static(publicPath));

// Wout API yo
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/affiliate', require('./routes/affiliate'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/videos', require('./routes/videos'));
app.use('/api/partner', require('./routes/api'));

app.get('/', (req, res) => res.sendFile(path.join(publicPath, 'index.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(publicPath, 'admin.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(publicPath, 'dashboard.html')));

app.use('/api', (req, res) => res.status(404).json({ error: 'Wout pa egziste' }));

// Error Handler Jeneral
app.use((err, req, res, next) => {
  console.error('🔥 EXPRESS ERROR:', err.message);
  console.error(err.stack);
  res.status(500).json({ error: 'Erè sèvè', details: err.message });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => { console.log('OGSUNENTERPRISE ap kouri sou pò ' + PORT); });
