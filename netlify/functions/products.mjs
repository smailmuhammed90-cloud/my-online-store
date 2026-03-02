import { neon } from '@neondatabase/serverless';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}

export default async (req) => {
  const method = req.method;

  // Handle CORS preflight — no body for 204
  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is not set');
    return json({
      error: 'DATABASE_URL environment variable is not set. Add it in Netlify site settings (Site configuration > Environment variables).'
    }, 500);
  }

  const sql = neon(connectionString);

  try {
    // Auto-create table if it doesn't exist
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

    const url = new URL(req.url);

    if (method === 'GET') {
      const id = url.searchParams.get('id');
      const category = url.searchParams.get('category');

      if (id) {
        const rows = await sql`SELECT * FROM products WHERE id = ${Number(id)}`;
        if (rows.length === 0) return json({ error: 'Not found' }, 404);
        return json(rows[0]);
      }

      let rows;
      if (category) {
        rows = await sql`SELECT * FROM products WHERE category = ${category} ORDER BY created_at DESC LIMIT 500`;
      } else {
        rows = await sql`SELECT * FROM products ORDER BY created_at DESC LIMIT 500`;
      }
      return json(rows);
    }

    if (method === 'POST') {
      const body = await req.json();
      const { name, description_kk, description_ru, price, category, image_url, sizes } = body;

      if (!name || !price) {
        return json({ error: 'Name and price are required' }, 400);
      }

      const sizesValue = sizes ? (typeof sizes === 'string' ? sizes : JSON.stringify(sizes)) : null;

      const rows = await sql`
        INSERT INTO products (name, description_kk, description_ru, price, category, image_url, sizes)
        VALUES (${name}, ${description_kk || null}, ${description_ru || null}, ${Number(price)}, ${category || null}, ${image_url || null}, ${sizesValue}::jsonb)
        RETURNING *
      `;
      return json(rows[0], 201);
    }

    if (method === 'PUT') {
      const body = await req.json();
      const { id, name, description_kk, description_ru, price, category, image_url, sizes } = body;
      if (!id) return json({ error: 'Missing id' }, 400);

      const sizesValue = sizes ? (typeof sizes === 'string' ? sizes : JSON.stringify(sizes)) : null;

      const rows = await sql`
        UPDATE products SET
          name = ${name},
          description_kk = ${description_kk || null},
          description_ru = ${description_ru || null},
          price = ${Number(price)},
          category = ${category || null},
          image_url = ${image_url || null},
          sizes = ${sizesValue}::jsonb
        WHERE id = ${Number(id)}
        RETURNING *
      `;
      if (rows.length === 0) return json({ error: 'Not found' }, 404);
      return json(rows[0]);
    }

    if (method === 'DELETE') {
      const id = url.searchParams.get('id');
      if (!id) return json({ error: 'Missing id' }, 400);

      const rows = await sql`DELETE FROM products WHERE id = ${Number(id)} RETURNING id`;
      if (rows.length === 0) return json({ error: 'Not found' }, 404);
      return json({ ok: true });
    }

    return json({ error: 'Method not allowed' }, 405);
  } catch (e) {
    console.error('Products API error:', e);
    return json({ error: e.message || 'Internal server error' }, 500);
  }
};

export const config = {
  path: "/api/products"
};
