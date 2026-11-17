const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  connectionTimeoutMillis: 5000,
  statement_timeout: 10000,
  idleTimeoutMillis: 30000,
  keepAlive: true
});

pool.on('error', (err) => console.error('🔥 PG POOL ERROR:', err.message));
module.exports = { query: (text, params) => pool.query(text, params), pool };
