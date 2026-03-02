import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.NETLIFY_DATABASE_URL);

// Ensure the products table exists
async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description_kk TEXT DEFAULT '',
      description_ru TEXT DEFAULT '',
      price NUMERIC DEFAULT 0,
      category TEXT DEFAULT '',
      image_url TEXT DEFAULT '',
      sizes JSONB DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

export default async function handler(req) {
  try {
    await ensureTable();

    const url = new URL(req.url, "http://localhost");
    const method = req.method;

    // GET /api/products?category=dresses (optional filter)
    if (method === "GET") {
      const category = url.searchParams.get("category");
      const id = url.searchParams.get("id");

      if (id) {
        const rows = await sql`SELECT * FROM products WHERE id = ${id} LIMIT 1`;
        if (rows.length === 0) {
          return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
        }
        return new Response(JSON.stringify(rows[0]), { headers: { "Content-Type": "application/json" } });
      }

      let rows;
      if (category) {
        rows = await sql`SELECT * FROM products WHERE category = ${category} ORDER BY created_at DESC LIMIT 500`;
      } else {
        rows = await sql`SELECT * FROM products ORDER BY created_at DESC LIMIT 500`;
      }
      return new Response(JSON.stringify(rows), { headers: { "Content-Type": "application/json" } });
    }

    // POST /api/products — create new product
    if (method === "POST") {
      const body = await req.json();
      const { name, description_kk, description_ru, price, category, image_url, sizes } = body;

      if (!name || !category) {
        return new Response(JSON.stringify({ error: "name and category are required" }), { status: 400, headers: { "Content-Type": "application/json" } });
      }

      const sizesJson = typeof sizes === "string" ? sizes : JSON.stringify(sizes || []);

      const rows = await sql`
        INSERT INTO products (name, description_kk, description_ru, price, category, image_url, sizes)
        VALUES (${name}, ${description_kk || ""}, ${description_ru || ""}, ${price || 0}, ${category}, ${image_url || ""}, ${sizesJson}::jsonb)
        RETURNING *
      `;
      return new Response(JSON.stringify(rows[0]), { status: 201, headers: { "Content-Type": "application/json" } });
    }

    // PUT /api/products — update product
    if (method === "PUT") {
      const body = await req.json();
      const { id, name, description_kk, description_ru, price, category, image_url, sizes } = body;

      if (!id) {
        return new Response(JSON.stringify({ error: "id is required" }), { status: 400, headers: { "Content-Type": "application/json" } });
      }

      const sizesJson = typeof sizes === "string" ? sizes : JSON.stringify(sizes || []);

      const rows = await sql`
        UPDATE products SET
          name = COALESCE(${name}, name),
          description_kk = COALESCE(${description_kk}, description_kk),
          description_ru = COALESCE(${description_ru}, description_ru),
          price = COALESCE(${price}, price),
          category = COALESCE(${category}, category),
          image_url = COALESCE(${image_url}, image_url),
          sizes = COALESCE(${sizesJson}::jsonb, sizes)
        WHERE id = ${id}
        RETURNING *
      `;

      if (rows.length === 0) {
        return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify(rows[0]), { headers: { "Content-Type": "application/json" } });
    }

    // DELETE /api/products?id=123
    if (method === "DELETE") {
      const id = url.searchParams.get("id");
      if (!id) {
        return new Response(JSON.stringify({ error: "id is required" }), { status: 400, headers: { "Content-Type": "application/json" } });
      }
      await sql`DELETE FROM products WHERE id = ${id}`;
      return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { "Content-Type": "application/json" } });
  } catch (err) {
    console.error("products function error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}

export const config = {
  path: "/api/products"
};
