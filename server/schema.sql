-- OGSUNENTERPRISE Database Schema (PostgreSQL)

CREATE TABLE IF NOT EXISTS affiliates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50) NOT NULL,
  service VARCHAR(50) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_affiliates_email ON affiliates(email);
CREATE INDEX IF NOT EXISTS idx_affiliates_status ON affiliates(status);

CREATE TABLE IF NOT EXISTS sales (
  id SERIAL PRIMARY KEY,
  affiliate_id INTEGER REFERENCES affiliates(id) ON DELETE CASCADE,
  customer_name VARCHAR(255) NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  commission NUMERIC(12,2) NOT NULL,
  service VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sales_affiliate ON sales(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_sales_created ON sales(created_at);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  affiliate_id INTEGER REFERENCES affiliates(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notif_affiliate ON notifications(affiliate_id);

CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  affiliate_id INTEGER REFERENCES affiliates(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tasks_affiliate ON tasks(affiliate_id);
