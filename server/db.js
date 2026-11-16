const { Pool } = require('pg');
require('dotenv').config();

// Sekirite: Verifye si DATABASE_URL egziste
if (!process.env.DATABASE_URL) {
  console.error('🔥 ERÈ: DATABASE_URL pa defini nan Environment Variables!');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Obligatwa pou Neon
  max: 10,
  idleTimeoutMillis: 30000
});

pool.on('error', (err) => {
  console.error('🔥 PG POOL ERROR:', err.message);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
