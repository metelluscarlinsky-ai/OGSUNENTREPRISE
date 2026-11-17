const { Pool } = require('pg');
require('dotenv').config();

if (!process.env.DATABASE_URL) {
  console.error('🔥 ERÈ: DATABASE_URL pa defini nan Environment Variables!');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  // Fòse yon limit tan pou koneksyon an (5 segond)
  connectionTimeoutMillis: 5000,
  // Kenbe koneksyon an vivan
  keepAlive: true
});

pool.on('error', (err) => {
  console.error('🔥 PG POOL ERROR:', err.message);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
