// admin-fix-final.js
// Delegated handlers for Save / Delete — defensive: deletes DB row even if select fails.
// Include AFTER supabase-init.js in admin.html.

(async function(){
  // Use existing global supabase client if available
  const supabase = window.supabase || await (await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm')).createClient(
    "https://mcqrqmhsosihxzpeppuu.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jcXJxbWhzb3NpaHh6cGVwcHV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MjEzNjQsImV4cCI6MjA3MjI5NzM2NH0.noFkES6WfwZKpJuPiwOaHA-qa-5ckgk2zDy3PGb9wwI"
  );

  const BUCKET = 'product-images';
  const container = document.getElementById('productsContainer') || document.querySelector('.product-list') || document.querySelector('[data-admin-products]');
  if (!container) {
    console.error('admin-fix-final: cannot find products container (#productsContainer or .product-list).');
    return;
  }

  function filenameFromPublicUrl(url){
    if(!url) return null;
    try {
      const u = new URL(url);
      const parts = u.pathname.split('/');
      const idx = parts.indexOf(BUCKET);
      if (idx>=0 && parts.length>idx+1) return parts.slice(idx+1).join('/');
      return parts[parts.length-1];
    } catch(e){ const p = url.split('/'); return p[p.length-1] || null; }
  }

  function showRowStatus(elem, text, bad=false){
    const row = elem.closest('.product-item, .card, .product-row') || elem.parentElement;
    if (!row) return alert(text);
    let s = row.querySelector('.status');
    if (!s){ s = document.createElement('div'); s.className = 'status small muted'; s.style.marginTop='8px'; row.appendChild(s); }
    s.textContent = text; s.style.color = bad ? 'crimson' : '';
    if (!bad) setTimeout(()=> s.textContent = '', 2000);
  }

  container.addEventListener('click', async (ev) => {
    const delBtn = ev.target.closest('.delBtn, [data-action="delete"], button.delete');
    if (delBtn) {
      ev.preventDefault();
      const id = delBtn.dataset.id || delBtn.getAttribute('data-id');
      if (!id) { alert('Жою қатесі: id табылмады'); return; }
      if (!confirm('Өнімді жою? Бұл әрекет қайтымсыз.')) return;

      showRowStatus(delBtn, 'Жойылуда...');
      // attempt to read image_url first (may fail under current RLS; that's okay)
      let imageUrl = null;
      try {
        const { data: prod, error: fetchErr } = await supabase.from('products').select('image_url').eq('id', id).single();
        if (!fetchErr && prod && prod.image_url) imageUrl = prod.image_url;
      } catch(e) {
        console.warn('select image_url failed (RLS?), will proceed to delete row anyway', e);
      }

      // delete DB row
      try {
        const { error: delErr } = await supabase.from('products').delete().eq('id', id);
        if (delErr) { showRowStatus(delBtn, 'DB жою қатесі: ' + (delErr.message||delErr.code), true); console.error(delErr); return; }
      } catch(e){ showRowStatus(delBtn, 'DB жою қатесі: ' + e.message, true); console.error(e); return; }

      // attempt to delete image from storage (best-effort)
      if (imageUrl) {
        try {
          const fn = filenameFromPublicUrl(imageUrl);
          if (fn) {
            const { error: rmErr } = await supabase.storage.from(BUCKET).remove([fn]);
            if (rmErr) console.warn('failed to remove storage file', rmErr);
          }
        } catch(e){ console.warn('storage remove failed', e); }
      }

      // remove row from DOM
      const rowDom = delBtn.closest('.product-item, .card, .product-row');
      if (rowDom && rowDom.parentNode) rowDom.parentNode.removeChild(rowDom);

      // try to call existing loader (keep add-product untouched)
      if (typeof window.loadProducts === 'function') await window.loadProducts();
      if (typeof window.loadProductList === 'function') await window.loadProductList();

      showRowStatus(delBtn, 'Өнім жойылды');
      return;
    }

    const saveBtn = ev.target.closest('.saveBtn, [data-action="save"], button.save');
    if (saveBtn) {
      ev.preventDefault();
      const id = saveBtn.dataset.id || saveBtn.getAttribute('data-id');
      if (!id) { alert('Сақтау қатесі: id табылмады'); return; }

      showRowStatus(saveBtn, 'Сақталуда...');
      try {
        const row = saveBtn.closest('.product-item, .card, .product-row') || saveBtn.parentElement;
        // find inputs inside row; support multiple naming schemes
        const nameInput = row.querySelector('input[data-field="name"], input[name="name"], input.name');
        const priceInput = row.querySelector('input[data-field="price"], input[name="price"], input.price');
        const descInput = row.querySelector('textarea[data-field="description"], textarea[name="description"], textarea.description');
        const catInput = row.querySelector('input[data-field="category"], input[name="category"], input.category');

        const updates = {};
        if (nameInput) updates.name = nameInput.value.trim();
        if (priceInput) {
          const v = priceInput.value.trim();
          if (v !== '') {
            const num = Number(v);
            if (Number.isNaN(num)) { showRowStatus(saveBtn, 'Баға дұрыс емес', true); return; }
            updates.price = num;
          } else {
            updates.price = null;
          }
        }
        if (descInput) updates.description = descInput.value.trim();
        if (catInput) updates.category = catInput.value.trim();

        // optional file input -> upload
        const fileInput = row.querySelector('input[type="file"][data-field="imageFile"], input[type="file"].image-file, input[type="file"]');
        if (fileInput && fileInput.files && fileInput.files[0]) {
          const f = fileInput.files[0];
          const filename = `${Date.now()}_${f.name.replace(/\s/g,'_')}`;
          const { error: upErr } = await supabase.storage.from(BUCKET).upload(filename, f, { upsert: false });
          if (upErr) { showRowStatus(saveBtn, 'Сурет жүктелмеді: ' + (upErr.message||upErr.code), true); return; }
          const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(filename);
          updates.image_url = pub.publicUrl;
          // attempt to delete old file after successful upload (nonfatal)
          try {
            const { data: old, error: oldErr } = await supabase.from('products').select('image_url').eq('id', id).single();
            if (!oldErr && old && old.image_url) {
              const oldFn = filenameFromPublicUrl(old.image_url);
              if (oldFn) {
                const { error: rmErr } = await supabase.storage.from(BUCKET).remove([oldFn]);
                if (rmErr) console.warn('failed to remove old image', rmErr);
              }
            }
          } catch(e){ /* ignore */ }
        }

        // remove nulls
        if (updates.price === null) delete updates.price;

        const { error: updateErr } = await supabase.from('products').update(updates).eq('id', id);
        if (updateErr) { showRowStatus(saveBtn, 'Сақтау қатесі: ' + (updateErr.message||updateErr.code), true); console.error(updateErr); return; }

        // refresh list if existent
        if (typeof window.loadProducts === 'function') await window.loadProducts();
        if (typeof window.loadProductList === 'function') await window.loadProductList();

        showRowStatus(saveBtn, 'Сақталды');
      } catch(e){ console.error('save handler error', e); showRowStatus(saveBtn, 'Сақтау қатесі: '+(e.message||e), true); }
      return;
    }
  });

  console.log('admin-fix-final loaded — Save/Delete delegated handlers attached.');
})();
