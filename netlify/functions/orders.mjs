import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.NETLIFY_DATABASE_URL);

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      user_email TEXT NOT NULL,
      items JSONB DEFAULT '[]'::jsonb,
      total NUMERIC DEFAULT 0,
      delivery TEXT DEFAULT 'home',
      payment TEXT DEFAULT '',
      city TEXT DEFAULT '',
      address TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

export default async function handler(req) {
  try {
    await ensureTable();

    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { "Content-Type": "application/json" } });
    }

    const body = await req.json();
    const { user_email, items, total, delivery, payment, city, address, phone, status } = body;

    if (!user_email || !items || items.length === 0) {
      return new Response(JSON.stringify({ error: "user_email and items are required" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    const rows = await sql`
      INSERT INTO orders (user_email, items, total, delivery, payment, city, address, phone, status)
      VALUES (${user_email}, ${JSON.stringify(items)}::jsonb, ${total || 0}, ${delivery || "home"}, ${payment || ""}, ${city || ""}, ${address || ""}, ${phone || ""}, ${status || "pending"})
      RETURNING *
    `;

    return new Response(JSON.stringify(rows[0]), { status: 201, headers: { "Content-Type": "application/json" } });
  } catch (err) {
    console.error("orders function error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}

export const config = {
  path: "/api/orders"
};
