// admin-fix2.js
// Place this after your supabase-init.js and firebase.js in admin.html
// Safe: does not touch add-product form, only manages the product list (delete/edit/save)

(async function(){
  // --------- Config / client ----------
  const SUPABASE_URL = "https://mcqrqmhsosihxzpeppuu.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jcXJxbWhzb3NpaHh6cGVwcHV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MjEzNjQsImV4cCI6MjA3MjI5NzM2NH0.noFkES6WfwZKpJuPiwOaHA-qa-5ckgk2zDy3PGb9wwI";
  const BUCKET = "product-images";

  async function getSupabase(){
    if (window.supabase && typeof window.supabase.from === 'function') return window.supabase;
    // fallback: create client
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    window.supabase = client;
    return client;
  }

  const supabase = await getSupabase();

  // --------- Helpers ----------
  const log = (...args) => { console.log('[admin-fix2]', ...args); };
  const el = id => document.getElementById(id);
  const q = sel => document.querySelector(sel);
  const qa = sel => Array.from(document.querySelectorAll(sel));

  function filenameFromPublicUrl(url){
    if(!url) return null;
    try {
      const u = new URL(url);
      const parts = u.pathname.split('/');
      const idx = parts.indexOf(BUCKET);
      if (idx >= 0 && parts.length > idx+1) return parts.slice(idx+1).join('/');
      return parts[parts.length-1];
    } catch(e){
      const parts = url.split('/');
      return parts[parts.length-1] || null;
    }
  }

  function showInlineStatus(btnOrRow, msg, bad){
    // find .status element inside same product-item row, otherwise alert
    const row = btnOrRow.closest && btnOrRow.closest('.product-item, .product-row, .card, .product-item-row') || null;
    if (row) {
      let s = row.querySelector('.status');
      if (!s) {
        s = document.createElement('div'); s.className = 'status small muted'; s.style.marginTop = '8px';
        row.appendChild(s);
      }
      s.textContent = msg;
      s.style.color = bad ? 'crimson' : '';
      if (!bad) setTimeout(()=> s.textContent = '', 1800);
    } else {
      console.log('status:', msg);
    }
  }

  // Try to find a products container automatically (common ids/classes)
  function findProductsContainer(){
    const ids = ['productsContainer','productList','product-list','productListContainer','products-list'];
    for (const id of ids) {
      const node = document.getElementById(id);
      if (node) return node;
    }
    const classes = ['product-list','product-listing','product-list-container','product-list-wrap','product-listing'];
    for (const c of classes){
      const node = document.querySelector('.' + c);
      if (node) return node;
    }
    // fallback: the first element with .product-item child
    const possible = document.querySelector('[data-admin-products]');
    if (possible) return possible;
    // last fallback: an element with id 'productsContainer' in your HTML, else null
    return document.getElementById('productsContainer') || null;
  }

  const container = findProductsContainer();
  if (!container) {
    console.error('admin-fix2: could not find products container. Make sure your admin.html has an element with id="productsContainer" or class="product-list" etc.');
    return;
  }

  // If your page already has a loadProductList or loadProducts function, use it; otherwise define a simple refresher
  async function refreshList(){
    // If page defines loadProducts or loadProductList, call it (keeps original add-product code intact)
    if (typeof window.loadProducts === 'function') {
      try { await window.loadProducts(); return; } catch(e){ log('window.loadProducts failed', e); }
    }
    if (typeof window.loadProductList === 'function') {
      try { await window.loadProductList(); return; } catch(e){ log('window.loadProductList failed', e); }
    }
    // else, fetch and render minimally (non-destructive)
    try {
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending:false }).limit(500);
      if (error) { container.innerHTML = '<div class="muted">Жүктеу қатесі: '+ (error.message||error.code) +'</div>'; return; }
      // simple render (keeps your add-product intact)
      container.innerHTML = '';
      data.forEach(p=>{
        const div = document.createElement('div');
        div.className = 'product-item card';
        div.dataset.id = p.id;
        div.innerHTML = `
          <img src="${p.image_url||''}" style="width:80px;height:80px;object-fit:cover;border-radius:6px;margin-right:10px;float:left"/>
          <div style="overflow:hidden">
            <strong>${p.name || p.name_kk || p.title || ''}</strong>
            <div class="small">${p.description||''}</div>
            <div style="margin-top:8px">
              <button class="saveBtn" data-id="${p.id}">Сақтау</button>
              <button class="delBtn" data-id="${p.id}">Жою</button>
            </div>
            <div style="clear:both"></div>
          </div>
        `;
        container.appendChild(div);
      });
    } catch(e){
      container.innerHTML = '<div class="muted">Жүктеу қатесі</div>';
      console.error(e);
    }
  }

  // Expose refresh so you can call manually
  window.adminRefreshProducts = refreshList;

  // Attach delegated click handler for save / delete (works even if items are rendered later)
  container.addEventListener('click', async (ev) => {
    const delBtn = ev.target.closest('.delBtn, button[data-action="delete"], [data-action="delete"]');
    if (delBtn) {
      ev.preventDefault();
      const id = delBtn.dataset.id || delBtn.getAttribute('data-id');
      if (!id) {
        alert('Жою қатесі: өнім id табылмады');
        return;
      }
      if (!confirm('Өнімді өшіру? Бұл қайтымсыз.')) return;
      showInlineStatus(delBtn, 'Жою...', false);
      try {
        // fetch product to discover image_url (best-effort)
        const { data: prod, error: fetchErr } = await supabase.from('products').select('image_url').eq('id', id).single();
        if (fetchErr && fetchErr.code !== 'PGRST116') { // PGRST116 = no rows? ignore maybe
          console.warn('fetch before delete error', fetchErr);
        }

        // delete DB row
        const { error: delErr } = await supabase.from('products').delete().eq('id', id);
        if (delErr) {
          showInlineStatus(delBtn, 'Жою қатесі: ' + (delErr.message||delErr.code), true);
          console.error('delete row error', delErr);
          return;
        }

        // attempt to remove storage file (if image_url present)
        if (prod && prod.image_url) {
          const fn = filenameFromPublicUrl(prod.image_url);
          if (fn) {
            const { error: rmErr } = await supabase.storage.from(BUCKET).remove([fn]);
            if (rmErr) {
              console.warn('failed to delete storage object', fn, rmErr);
              // not fatal: continue
            } else {
              log('removed storage file', fn);
            }
          }
        }

        // remove DOM row if present
        const row = delBtn.closest('.product-item, .card, .product-row');
        if (row && row.parentNode) row.parentNode.removeChild(row);

        // if page has a loader function, call it to refresh master list
        if (typeof window.loadProducts === 'function' || typeof window.loadProductList === 'function') {
          try { await new Promise(r=>setTimeout(r, 400)); await refreshList(); } catch(e){ log('refresh after delete failed', e); }
        }

        showInlineStatus(delBtn, 'Өнім жойылды', false);
        return;
      } catch(err) {
        console.error('delete handler error', err);
        showInlineStatus(delBtn, 'Жою қатесі: ' + (err.message||err), true);
        return;
      }
    }

    // Save handler (update product fields)
    const saveBtn = ev.target.closest('.saveBtn, button[data-action="save"]');
    if (saveBtn) {
      ev.preventDefault();
      const id = saveBtn.dataset.id || saveBtn.getAttribute('data-id');
      if (!id) { alert('Save error: id missing'); return; }

      showInlineStatus(saveBtn, 'Сақталуда...', false);
      try {
        // Try to find inputs inside the same row (supports multiple admin.html structures)
        const row = saveBtn.closest('.product-item, .card, .product-row') || saveBtn.parentElement;
        // pick common field selectors
        const nameInput = row.querySelector('input[data-field="name"], input[name="name"], input.name, input[data-name]');
        const priceInput = row.querySelector('input[data-field="price"], input[name="price"], input.price');
        const descInput = row.querySelector('textarea[data-field="description"], textarea[name="description"], textarea.description');
        const catInput = row.querySelector('input[data-field="category"], input[name="category"], input.category');

        const updates = {};
        if (nameInput) updates.name = nameInput.value.trim();
        if (priceInput) {
          const v = priceInput.value.trim();
          if (v !== '') updates.price = Number(v);
        }
        if (descInput) updates.description = descInput.value.trim();
        if (catInput) updates.category = catInput.value.trim();

        // If there is a file input inside the row, upload new image
        const fileInput = row.querySelector('input[type="file"][data-field="imageFile"], input[type="file"].image-file, input[type="file"]');
        if (fileInput && fileInput.files && fileInput.files[0]) {
          const file = fileInput.files[0];
          const filename = `${Date.now()}_${file.name.replace(/\s/g,'_')}`;
          const { error: upErr } = await supabase.storage.from(BUCKET).upload(filename, file, { upsert: false });
          if (upErr) {
            showInlineStatus(saveBtn, 'Сурет жүктелмеді: ' + (upErr.message||upErr.code), true);
            console.error('upload err', upErr);
            return;
          }
          const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(filename);
          updates.image_url = pub.publicUrl;

          // attempt to remove previous file if row had image_url
          try {
            const { data: prod, error: fetchErr } = await supabase.from('products').select('image_url').eq('id', id).single();
            if (!fetchErr && prod && prod.image_url) {
              const oldFn = filenameFromPublicUrl(prod.image_url);
              if (oldFn) {
                const { error: rmErr } = await supabase.storage.from(BUCKET).remove([oldFn]);
                if (rmErr) console.warn('failed to remove old file', rmErr);
              }
            }
          } catch(e){ /* ignore */ }
        }

        // run update
        const { error: updErr } = await supabase.from('products').update(updates).eq('id', id);
        if (updErr) {
          showInlineStatus(saveBtn, 'Сақтау қатесі: ' + (updErr.message||updErr.code), true);
          console.error('update error', updErr);
          return;
        }

        showInlineStatus(saveBtn, 'Сақталды', false);
        // refresh or remove edit highlights
        try { await refreshList(); } catch(e){ log('refresh after save failed', e); }
      } catch(err){
        console.error('save handler error', err);
        showInlineStatus(saveBtn, 'Сақтау қатесі: ' + (err.message||err), true);
      }
    }
  });

  // Initial refresh (if page doesn't have its own loader)
  try { await refreshList(); } catch(e){ log('initial refresh failed', e); }

  // expose function
  window.adminFix2Refresh = refreshList;
  log('admin-fix2 loaded — delegated handlers attached to container', container);
})();
