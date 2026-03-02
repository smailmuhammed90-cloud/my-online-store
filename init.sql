CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description_kk TEXT,
  description_ru TEXT,
  price NUMERIC,
  category TEXT,
  image_url TEXT,
  sizes JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
