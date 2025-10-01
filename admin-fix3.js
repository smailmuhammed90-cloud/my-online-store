// admin-fix3.js
// Robust delegated product list edit/delete handlers.
// Place AFTER supabase-init.js and firebase.js in admin.html.

(async function(){
  const BUCKET = "product-images";
  const SUPABASE_URL = "https://mcqrqmhsosihxzpeppuu.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jcXJxbWhzb3NpaHh6cGVwcHV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MjEzNjQsImV4cCI6MjA3MjI5NzM2NH0.noFkES6WfwZKpJuPiwOaHA-qa-5ckgk2zDy3PGb9wwI";

  // get supabase client (use existing window.supabase if present)
  async function getSupabase(){
    if (window.supabase && typeof window.supabase.from === 'function') return window.supabase;
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    window.supabase = client;
    return client;
  }

  const supabase = await getSupabase();
  const log = (...a)=>console.log('[admin-fix3]',...a);
  const containerCandidates = [
    'productsContainer','productList','product-list','productListContainer','products-list'
  ];

  // try to find a container element where products are listed
  let container = null;
  for (const id of containerCandidates) {
    const el = document.getElementById(id);
    if (el) { container = el; break; }
  }
  if (!container) {
    // fallback: look for element with class product-list or product-listing or attribute data-admin-products
    container = document.querySelector('.product-list, .product-listing, [data-admin-products]') || document.getElementById('productsContainer');
  }
  if (!container) {
    console.error('[admin-fix3] Could not find product list container. Ensure admin.html has id="productsContainer" or class="product-list".');
    return;
  }

  // utility: extract filename from Supabase public URL
  function filenameFromPublicUrl(url){
    if (!url) return null;
    try {
      const u = new URL(url);
      const path = u.pathname.split('/');
      const idx = path.indexOf(BUCKET);
      if (idx >= 0 && path.length > idx+1) return path.slice(idx+1).join('/');
      return path[path.length-1];
    } catch(e){
      // fallback
      const parts = url.split('/');
      return parts[parts.length-1] || null;
    }
  }

  function showRowStatus(elem, message, bad=false){
    const row = elem.closest && (elem.closest('.product-item') || elem.closest('.card') || elem.closest('.product-row')) || null;
    if (!row) { console.log('[admin-fix3 status]', message); return; }
    let s = row.querySelector('.status');
    if (!s) {
      s = document.createElement('div'); s.className = 'status small muted'; s.style.marginTop='8px';
      row.appendChild(s);
    }
    s.textContent = message;
    s.style.color = bad ? 'crimson' : '';
    if (!bad) setTimeout(()=>{ if (s) s.textContent=''; }, 2000);
  }

  // delegated click handler for delete/save
  container.addEventListener('click', async (ev) => {
    const delBtn = ev.target.closest('.delBtn, [data-action="delete"], button.delete');
    if (delBtn) {
      ev.preventDefault();
      const id = delBtn.dataset.id || delBtn.getAttribute('data-id');
      if (!id) { alert('Delete failed — id not found'); return; }
      if (!confirm('Өнімді жою? Бұл әрекет қайтымсыз.')) return;

      showRowStatus(delBtn, 'Жою...', false);
      try {
        // Attempt to read product image_url (best-effort)
        let imageUrl = null;
        try {
          const { data: prod, error: fetchErr } = await supabase.from('products').select('image_url').eq('id', id).single();
          if (fetchErr) {
            log('fetch before delete error', fetchErr);
          } else if (prod && prod.image_url) {
            imageUrl = prod.image_url;
          }
        } catch(fetchErr) {
          log('exception when fetching product before delete', fetchErr);
        }

        // Delete DB row
        const { error: delErr } = await supabase.from('products').delete().eq('id', id);
        if (delErr) {
          showRowStatus(delBtn, 'DB жою қатесі: ' + (delErr.message || delErr.code), true);
          console.error('delete error', delErr);
          return;
        }

        // Try to delete storage object if imageUrl known
        if (imageUrl) {
          const fn = filenameFromPublicUrl(imageUrl);
          if (fn) {
            const { error: rmErr } = await supabase.storage.from(BUCKET).remove([fn]);
            if (rmErr) {
              console.warn('failed to remove storage object', fn, rmErr);
              // Not fatal — continue
            } else {
              log('Removed storage file', fn);
            }
          }
        }

        // Remove DOM row if exists
        const row = delBtn.closest('.product-item, .card, .product-row');
        if (row && row.parentNode) row.parentNode.removeChild(row);

        // Try to refresh master list if page provides loader (keeps add-product code intact)
        if (typeof window.loadProducts === 'function') await window.loadProducts();
        if (typeof window.loadProductList === 'function') await window.loadProductList();

        showRowStatus(delBtn, 'Өнім жойылды', false);
      } catch(err) {
        console.error('delete handler error', err);
        showRowStatus(delBtn, 'Жою қатесі: ' + (err.message || err), true);
      }
      return;
    }

    const saveBtn = ev.target.closest('.saveBtn, [data-action="save"], button.save');
    if (saveBtn) {
      ev.preventDefault();
      const id = saveBtn.dataset.id || saveBtn.getAttribute('data-id');
      if (!id) { alert('Save failed — id not found'); return; }

      showRowStatus(saveBtn, 'Сақталуда...', false);

      try {
        const row = saveBtn.closest('.product-item, .card, .product-row') || saveBtn.parentElement;

        // find common input/select/textarea fields inside the row
        const nameInput = row.querySelector('input[data-field="name"], input[name="name"], input.name');
        const priceInput = row.querySelector('input[data-field="price"], input[name="price"], input.price');
        const descInput = row.querySelector('textarea[data-field="description"], textarea[name="description"], textarea.description');
        const catInput = row.querySelector('input[data-field="category"], input[name="category"], input.category');

        const updates = {};
        if (nameInput) updates.name = nameInput.value.trim();
        if (priceInput && priceInput.value !== '') updates.price = Number(priceInput.value);
        if (descInput) updates.description = descInput.value.trim();
        if (catInput) updates.category = catInput.value.trim();

        // optional image file input
        const fileInput = row.querySelector('input[type="file"][data-field="imageFile"], input[type="file"].image-file, input[type="file"]');
        if (fileInput && fileInput.files && fileInput.files[0]) {
          const file = fileInput.files[0];
          const filename = `${Date.now()}_${file.name.replace(/\s/g,'_')}`;
          const { error: upErr } = await supabase.storage.from(BUCKET).upload(filename, file, { upsert: false });
          if (upErr) { showRowStatus(saveBtn, 'Сурет жүктелмеді: ' + (upErr.message || upErr.code), true); return; }
          const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(filename);
          updates.image_url = pub.publicUrl;

          // optionally remove previous image (best-effort)
          try {
            const { data: old, error: oldErr } = await supabase.from('products').select('image_url').eq('id', id).single();
            if (!oldErr && old && old.image_url) {
              const oldFn = filenameFromPublicUrl(old.image_url);
              if (oldFn) {
                const { error: rmOldErr } = await supabase.storage.from(BUCKET).remove([oldFn]);
                if (rmOldErr) console.warn('failed to remove old image', rmOldErr);
              }
            }
          } catch(e){ /* ignore */ }
        }

        // perform update
        const { error: updErr } = await supabase.from('products').update(updates).eq('id', id);
        if (updErr) { showRowStatus(saveBtn, 'Сақтау қатесі: ' + (updErr.message||updErr.code), true); console.error('update err', updErr); return; }

        showRowStatus(saveBtn, 'Сақталды', false);
        // refresh list via page's loader if present
        if (typeof window.loadProducts === 'function') await window.loadProducts();
        if (typeof window.loadProductList === 'function') await window.loadProductList();

      } catch(err) {
        console.error('save handler error', err);
        showRowStatus(saveBtn, 'Сақтау қатесі: ' + (err.message || err), true);
      }
      return;
    }
  });

  // initial refresh if page has no loader
  if (typeof window.loadProducts !== 'function' && typeof window.loadProductList !== 'function') {
    // basic initial load (non-invasive)
    try {
      const { data, error } = await supabase.from('products').select('*').order('created_at',{ascending:false}).limit(500);
      if (error) {
        log('initial fetch error', error);
      } else {
        // if container is empty, render simple rows so the delegated handler has nodes to act on
        if (!container.querySelector('.product-item') && data && data.length) {
          container.innerHTML = '';
          data.forEach(p => {
            const div = document.createElement('div');
            div.className = 'product-item card';
            div.dataset.id = p.id;
            div.innerHTML = `
              <img src="${p.image_url||''}" style="width:80px;height:80px;object-fit:cover;border-radius:6px;float:left;margin-right:10px"/>
              <div style="overflow:hidden">
                <strong>${p.name||p.name_kk||''}</strong>
                <div class="small">${p.description||''}</div>
                <div style="margin-top:8px">
                  <button class="saveBtn" data-id="${p.id}">Сақтау</button>
                  <button class="delBtn" data-id="${p.id}">Жою</button>
                </div>
              </div>
            `;
            container.appendChild(div);
          });
        }
      }
    } catch(e) { log('initial load exception', e); }
  }

  log('admin-fix3 ready — delegated handlers attached to product list container', container);
  window.adminFix3Refresh = async ()=> {
    if (typeof window.loadProducts === 'function') return window.loadProducts();
    if (typeof window.loadProductList === 'function') return window.loadProductList();
    // else simple refresh:
    const { data, error } = await supabase.from('products').select('*').order('created_at',{ascending:false}).limit(500);
    if (!error && data) {
      container.innerHTML = '';
      data.forEach(p => {
        const div = document.createElement('div');
        div.className = 'product-item card';
        div.dataset.id = p.id;
        div.innerHTML = `
          <img src="${p.image_url||''}" style="width:80px;height:80px;object-fit:cover;border-radius:6px;float:left;margin-right:10px"/>
          <div style="overflow:hidden">
            <strong>${p.name||p.name_kk||''}</strong>
            <div class="small">${p.description||''}</div>
            <div style="margin-top:8px">
              <button class="saveBtn" data-id="${p.id}">Сақтау</button>
              <button class="delBtn" data-id="${p.id}">Жою</button>
            </div>
          </div>
        `;
        container.appendChild(div);
      });
    } else {
      log('refresh failed', error);
    }
  };
})();
