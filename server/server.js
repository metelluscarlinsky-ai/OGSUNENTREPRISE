require('dotenv').config();
process.on('uncaughtException', (err) => console.error('🔥 UNCATCHED:', err.message));
process.on('unhandledRejection', (reason) => console.error('🔥 UNHANDLED:', reason));

const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();
app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const publicPath = path.join(__dirname, '..', 'public');
app.use(express.static(publicPath));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/affiliate', require('./routes/affiliate'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/partner', require('./routes/api'));

app.get('/', (req, res) => res.sendFile(path.join(publicPath, 'index.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(publicPath, 'admin.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(publicPath, 'dashboard.html')));
app.use('/api', (req, res) => res.status(404).json({ error: 'Wout pa egziste' }));

app.use((err, req, res, next) => {
  console.error('🔥 EXPRESS ERROR:', err.message);
  res.status(500).json({ error: 'Erè sèvè', details: err.message });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log(`✅ OGSUN ap kouri sou pò ${PORT}`));
