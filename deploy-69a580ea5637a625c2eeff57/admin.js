// admin-fix.js
// Module: improved admin product list (edit/delete with storage cleanup)
// Requires: supabase client available as window.supabase OR will create its own client
//           Firebase auth available as window.auth / firebase.auth()
// Put this file after supabase-init.js and firebase.js in admin.html.

const SUPABASE_URL = "https://mcqrqmhsosihxzpeppuu.supabase.co"; // your project
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jcXJxbWhzb3NpaHh6cGVwcHV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MjEzNjQsImV4cCI6MjA3MjI5NzM2NH0.noFkES6WfwZKpJuPiwOaHA-qa-5ckgk2zDy3PGb9wwI";
const BUCKET = "product-images";

async function getSupabaseClient() {
  if (window.supabase && typeof window.supabase.from === "function") return window.supabase;
  // fallback: create client locally
  const { createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  window.supabase = client;
  return client;
}

function el(id) { return document.getElementById(id); }
function log(...args){ console.log("[admin-fix]", ...args); }

// extract filename from public URL: expects .../product-images/<filename>
function filenameFromPublicUrl(url){
  if (!url) return null;
  try {
    const u = new URL(url);
    // path like: /storage/v1/object/public/product-images/<filename>
    const parts = u.pathname.split('/');
    const idx = parts.indexOf('product-images');
    if (idx >= 0 && parts.length > idx+1) {
      return parts.slice(idx+1).join('/');
    }
    // fallback: last path segment
    return parts[parts.length-1];
  } catch(e){
    // fallback: try simple split
    const parts = url.split('/');
    return parts[parts.length-1] || null;
  }
}

(async function initAdminFix(){
  const supabase = await getSupabaseClient();

  // DOM
  const productsContainer = el('productsContainer'); // matches admin.html id
  const addStatus = el('addStatus'); // optional status slot
  if (!productsContainer) {
    console.error("admin-fix: #productsContainer not found in admin.html. Make sure container id matches.");
    return;
  }

  // ensure user is admin (if admin.html already enforces, this is safe)
  if (typeof firebase !== 'undefined' && typeof firebase.auth === 'function') {
    const user = firebase.auth().currentUser;
    if (!user) {
      // the page likely already redirects to login; still continue but show message
      productsContainer.innerHTML = '<div class="muted">Кіру қажет — авторизация болмаған.</div>';
      return;
    }
  }

  // Helper: show in-page messages
  function setStatus(msg, bad){
    if (!addStatus) return;
    addStatus.textContent = msg || '';
    addStatus.style.color = bad ? 'crimson' : '';
    if (msg && !bad) setTimeout(()=> { if(addStatus) addStatus.textContent = ''; }, 2500);
  }

  // Load & render
  async function loadProducts(){
    productsContainer.innerHTML = 'Жүктелуде...';
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false }).limit(1000);
    if (error) {
      productsContainer.innerHTML = `<div class="muted">Өнімдерді жүктеу қатесі: ${error.message}</div>`;
      console.error("loadProducts error:", error);
      return;
    }
    renderProducts(data || []);
  }

  // Render list with editable inputs & controls
  function renderProducts(items){
    productsContainer.innerHTML = '';
    if (!items || items.length === 0) {
      productsContainer.innerHTML = '<div class="muted">Өнімдер жоқ</div>';
      return;
    }

    items.forEach(p => {
      const id = p.id;
      const wrapper = document.createElement('div');
      wrapper.className = 'card product-item';
      // create inner HTML with editable fields
      wrapper.innerHTML = `
        <div style="display:flex;gap:12px;align-items:center">
          <img class="thumb" src="${p.image_url||''}" style="width:90px;height:90px;object-fit:cover;border-radius:6px" />
          <div style="flex:1">
            <div style="display:flex;gap:8px;align-items:center">
              <input data-field="name" data-id="${id}" value="${escapeHtml(p.name||p.name_kk||'')}" style="padding:6px;border-radius:6px;border:1px solid #ddd;min-width:200px" />
              <input data-field="price" data-id="${id}" value="${p.price ?? ''}" type="number" style="width:120px;padding:6px;border-radius:6px;border:1px solid #ddd" />
              <input data-field="category" data-id="${id}" value="${escapeHtml(p.category||'')}" placeholder="category" style="padding:6px;border-radius:6px;border:1px solid #ddd" />
            </div>
            <textarea data-field="description" data-id="${id}" rows="2" style="margin-top:8px;padding:6px;border-radius:6px;border:1px solid #ddd;width:100%">${escapeHtml(p.description||'')}</textarea>
            <div style="margin-top:8px;display:flex;gap:8px;align-items:center">
              <label style="display:inline-flex;flex-direction:column;gap:6px;cursor:pointer">
                <span class="small">Суретті өзгерту</span>
                <input data-field="imageFile" data-id="${id}" type="file" accept="image/*" style="display:block" />
              </label>
              <button class="btn saveBtn" data-id="${id}">Сақтау</button>
              <button class="btn btn-danger delBtn" data-id="${id}">Жою</button>
              <a href="${p.image_url || '#'}" target="_blank" class="small" style="margin-left:auto">Көрініс</a>
            </div>
            <div class="muted small status" data-id="${id}" style="margin-top:8px"></div>
          </div>
        </div>
      `;
      productsContainer.appendChild(wrapper);

      // wire preview for file input (so admin sees selected image)
      const fileInput = wrapper.querySelector('input[type="file"][data-field="imageFile"]');
      const imgEl = wrapper.querySelector('img.thumb');
      if (fileInput) {
        fileInput.addEventListener('change', (ev) => {
          const f = ev.target.files[0];
          if (f) {
            const url = URL.createObjectURL(f);
            imgEl.src = url;
          } else {
            // revert to current image (if any) - do nothing
          }
        });
      }
    });

    // attach save / delete handlers after render
    attachHandlers();
  }

  function escapeHtml(s){ if(!s && s !== 0) return ''; return String(s).replace(/[&<>"']/g, (m)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

  // Attach actions to save and delete
  function attachHandlers(){
    // Save buttons
    productsContainer.querySelectorAll('.saveBtn').forEach(btn=>{
      btn.onclick = async () => {
        const id = btn.dataset.id;
        const statusEl = productsContainer.querySelector(`.status[data-id="${id}"]`);
        try {
          statusEl.textContent = 'Жаңарту...';
          // gather fields
          const nameEl = productsContainer.querySelector(`input[data-id="${id}"][data-field="name"]`);
          const priceEl = productsContainer.querySelector(`input[data-id="${id}"][data-field="price"]`);
          const categoryEl = productsContainer.querySelector(`input[data-id="${id}"][data-field="category"]`);
          const descEl = productsContainer.querySelector(`textarea[data-id="${id}"][data-field="description"]`);
          const fileInput = productsContainer.querySelector(`input[data-id="${id}"][data-field="imageFile"]`);

          const updates = {};
          if (nameEl) updates.name = nameEl.value.trim();
          if (priceEl) updates.price = priceEl.value ? Number(priceEl.value) : null;
          if (categoryEl) updates.category = categoryEl.value.trim();
          if (descEl) updates.description = descEl.value.trim();

          // handle new image upload (if selected)
          if (fileInput && fileInput.files && fileInput.files[0]) {
            const file = fileInput.files[0];
            const filename = `${Date.now()}_${file.name.replace(/\s/g,'_')}`;
            const { error: uploadError } = await supabase.storage.from(BUCKET).upload(filename, file, { upsert: false });
            if (uploadError) {
              console.error("upload error", uploadError);
              statusEl.textContent = 'Суретті жүктеу қатесі: ' + (uploadError.message || uploadError.code);
              return;
            }
            // get public url
            const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(filename);
            updates.image_url = pub.publicUrl;

            // Optionally remove previous image if exists
            // fetch existing product image filename
            const { data: existing } = await supabase.from('products').select('image_url').eq('id', id).single();
            if (existing && existing.image_url) {
              const oldFn = filenameFromPublicUrl(existing.image_url);
              if (oldFn) {
                // attempt remove old file (ignore errors)
                const { error: removeErr } = await supabase.storage.from(BUCKET).remove([oldFn]);
                if (removeErr) {
                  // not fatal — log it
                  console.warn("Failed to remove old image:", oldFn, removeErr);
                } else {
                  log('Removed old image', oldFn);
                }
              }
            }
          }

          // cleanup updates: remove null price if empty
          if (updates.price === null) delete updates.price;

          // run update
          const { error: updateErr } = await supabase.from('products').update(updates).eq('id', id);
          if (updateErr) {
            statusEl.textContent = 'Сақтау қатесі: ' + (updateErr.message || updateErr.code);
            console.error("update error", updateErr);
            return;
          }

          statusEl.textContent = 'Сақталды';
          setTimeout(()=> { if (statusEl) statusEl.textContent = ''; }, 1500);
          // refresh list to reflect changes (safer than manual DOM edits)
          await loadProducts();
        } catch(err) {
          console.error("Save handler error:", err);
          if (statusEl) statusEl.textContent = 'Қате: ' + (err.message || err);
        }
      };
    });

    // Delete buttons
    productsContainer.querySelectorAll('.delBtn').forEach(btn=>{
      btn.onclick = async () => {
        const id = btn.dataset.id;
        if (!confirm('Өнімді жоюға сенімдісіз бе? Бұл әрекет қайтымсыз болуы мүмкін.')) return;
        const statusEl = productsContainer.querySelector(`.status[data-id="${id}"]`);
        try {
          statusEl.textContent = 'Жою...';
          // get product to find image_url
          const { data: prodData, error: fetchErr } = await supabase.from('products').select('image_url').eq('id', id).single();
          if (fetchErr) {
            console.warn('Failed to fetch product before delete', fetchErr);
            // still attempt delete row
          }
          // delete row
          const { error: delErr } = await supabase.from('products').delete().eq('id', id);
          if (delErr) {
            statusEl.textContent = 'Жою қатесі: ' + (delErr.message || delErr.code);
            console.error("delete row error", delErr);
            return;
          }
          // if image exists, delete storage object (best-effort)
          if (prodData && prodData.image_url) {
            const fn = filenameFromPublicUrl(prodData.image_url);
            if (fn) {
              const { error: rmErr } = await supabase.storage.from(BUCKET).remove([fn]);
              if (rmErr) {
                console.warn('Failed to remove storage object', fn, rmErr);
                // not fatal, continue
              } else {
                log('Removed file from storage:', fn);
              }
            }
          }
          // success
          setStatus('Өнім жойылды');
          await loadProducts();
        } catch(err){
          console.error('Delete error', err);
          if (statusEl) statusEl.textContent = 'Жою қатесі: ' + (err.message || err);
        }
      };
    });
  }

  // initial load
  await loadProducts();

  // expose reload
  window.adminRefreshProducts = loadProducts;

})();
const desc_kk = document.getElementById('p_desc_kk').value.trim();
const desc_ru = document.getElementById('p_desc_ru').value.trim();
const sizesStr = document.getElementById('p_sizes').value.trim();
const sizes = sizesStr ? sizesStr.split(',').map(s => s.trim()) : [];

const row = { 
  name, 
  description_kk: desc_kk, 
  description_ru: desc_ru, 
  price, 
  category, 
  image_url,
  sizes: JSON.stringify(sizes) // Store as JSON string; parse in frontend
};