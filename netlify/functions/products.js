import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://mcqrqmhsosihxzpeppuu.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jcXJxbWhzb3NpaHh6cGVwcHV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MjEzNjQsImV4cCI6MjA3MjI5NzM2NH0.noFkES6WfwZKpJuPiwOaHA-qa-5ckgk2zDy3PGb9wwI';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default async (req, context) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  const category = url.searchParams.get('category');

  try {
    // GET — list or single product
    if (req.method === 'GET') {
      if (id) {
        const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
        if (error) return new Response(JSON.stringify({ error: error.message }), { status: 404, headers });
        return new Response(JSON.stringify(data), { status: 200, headers });
      }

      let query = supabase.from('products').select('*').order('created_at', { ascending: false });
      if (category) query = query.eq('category', category);
      const { data, error } = await query.limit(500);
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
      return new Response(JSON.stringify(data || []), { status: 200, headers });
    }

    // POST — create product
    if (req.method === 'POST') {
      const body = await req.json();
      const { data, error } = await supabase.from('products').insert([body]).select();
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers });
      return new Response(JSON.stringify(data[0] || data), { status: 201, headers });
    }

    // PUT — update product
    if (req.method === 'PUT') {
      const body = await req.json();
      const productId = body.id;
      if (!productId) return new Response(JSON.stringify({ error: 'id required' }), { status: 400, headers });
      delete body.id;
      const { data, error } = await supabase.from('products').update(body).eq('id', productId).select();
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers });
      return new Response(JSON.stringify(data[0] || data), { status: 200, headers });
    }

    // DELETE — remove product
    if (req.method === 'DELETE') {
      const delId = url.searchParams.get('id');
      if (!delId) return new Response(JSON.stringify({ error: 'id required' }), { status: 400, headers });
      const { error } = await supabase.from('products').delete().eq('id', delId);
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers });
      return new Response(JSON.stringify({ success: true }), { status: 200, headers });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
  }
};

export const config = {
  path: "/api/products"
};
