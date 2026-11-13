const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Obligatwa pou Neon
  max: 10,
  idleTimeoutMillis: 30000,
  options: '-c search_path=public' // Fòse chèche tab yo nan 'public'
});

pool.on('error', (err) => console.error('PG Pool error:', err.message));

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
