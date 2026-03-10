
import { neon } from '@neondatabase/serverless';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

function send(res, data, status = 200) {
  Object.entries(cors).forEach(([k, v]) => res.setHeader(k, v));
  res.status(status).json(data);
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    Object.entries(cors).forEach(([k, v]) => res.setHeader(k, v));
    return res.status(204).end();
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return send(res, { error: 'DATABASE_URL is not set in Vercel environment variables.' }, 500);
  }

  const sql = neon(connectionString);

  try {
    await sql`
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
      )
    `;

    const { method } = req;
    const { id, category } = req.query;

    if (method === 'GET') {
      if (id) {
        const rows = await sql`SELECT * FROM products WHERE id = ${Number(id)}`;
        if (rows.length === 0) return send(res, { error: 'Not found' }, 404);
        return send(res, rows[0]);
      }
      const rows = category
        ? await sql`SELECT * FROM products WHERE category = ${category} ORDER BY created_at DESC LIMIT 500`
        : await sql`SELECT * FROM products ORDER BY created_at DESC LIMIT 500`;
      return send(res, rows);
    }

    if (method === 'POST') {
      const { name, description_kk, description_ru, price, category, image_url, sizes } = req.body || {};
      if (!name || !price) return send(res, { error: 'Name and price are required' }, 400);
      const sizesValue = sizes ? (typeof sizes === 'string' ? sizes : JSON.stringify(sizes)) : null;
      const rows = await sql`
        INSERT INTO products (name, description_kk, description_ru, price, category, image_url, sizes)
        VALUES (${name}, ${description_kk || null}, ${description_ru || null}, ${Number(price)},
                ${category || null}, ${image_url || null}, ${sizesValue}::jsonb)
        RETURNING *
      `;
      return send(res, rows[0], 201);
    }

    if (method === 'PUT') {
      const { id: bodyId, name, description_kk, description_ru, price, category, image_url, sizes } = req.body || {};
      const targetId = id || bodyId;
      if (!targetId) return send(res, { error: 'Missing id' }, 400);
      const sizesValue = sizes ? (typeof sizes === 'string' ? sizes : JSON.stringify(sizes)) : null;
      const rows = await sql`
        UPDATE products SET
          name = ${name}, description_kk = ${description_kk || null},
          description_ru = ${description_ru || null}, price = ${Number(price)},
          category = ${category || null}, image_url = ${image_url || null},
          sizes = ${sizesValue}::jsonb
        WHERE id = ${Number(targetId)} RETURNING *
      `;
      if (rows.length === 0) return send(res, { error: 'Not found' }, 404);
      return send(res, rows[0]);
    }

    if (method === 'DELETE') {
      if (!id) return send(res, { error: 'Missing id' }, 400);
      const rows = await sql`DELETE FROM products WHERE id = ${Number(id)} RETURNING id`;
      if (rows.length === 0) return send(res, { error: 'Not found' }, 404);
      return send(res, { ok: true });
    }

    return send(res, { error: 'Method not allowed' }, 405);

  } catch (e) {
    console.error('API error:', e);
    return send(res, { error: e.message || 'Internal server error' }, 500);
  }
}
