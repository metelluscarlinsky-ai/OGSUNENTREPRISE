const { Pool } = require('pg');
require('dotenv').config();

const isProd = process.env.DATABASE_URL &&
  (process.env.DATABASE_URL.includes('render.com') || process.env.NODE_ENV === 'production');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProd ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000
});

pool.on('error', (err) => console.error('PG Pool error:', err.message));

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
