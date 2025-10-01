// admin-delete-quickfix.js
// Put AFTER supabase-init.js and after your add-product logic in admin.html
(async function(){
  // use existing client if available
  const supabase = window.supabase || (await (await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm')).createClient(
    "https://mcqrqmhsosihxzpeppuu.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jcXJxbWhzb3NpaHh6cGVwcHV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MjEzNjQsImV4cCI6MjA3MjI5NzM2NH0.noFkES6WfwZKpJuPiwOaHA-qa-5ckgk2zDy3PGb9wwI"
  ));

  const container = document.getElementById('productsContainer') || document.querySelector('.product-list') || document.querySelector('[data-admin-products]');
  if (!container) {
    console.error('quickfix: cannot find products container (#productsContainer or .product-list).');
    return;
  }

  container.addEventListener('click', async (ev) => {
    const delBtn = ev.target.closest('.delBtn, [data-action="delete"], button.delete');
    if (!delBtn) return;

    ev.preventDefault();
    const id = delBtn.dataset.id || delBtn.getAttribute('data-id');
    if (!id) { alert('Жою қатесі: id табылмады'); return; }
    if (!confirm('Өнімді жою? Бұл әрекет қайтымсыз.')) return;

    // show inline status if possible
    const row = delBtn.closest('.product-item, .card, .product-row') || delBtn.parentElement;
    let statusEl = row ? row.querySelector('.status') : null;
    if (!statusEl && row) { statusEl = document.createElement('div'); statusEl.className = 'status small muted'; row.appendChild(statusEl); }
    if (statusEl) statusEl.textContent = 'Жойылуда...';

    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) {
        console.error('DB delete error', error);
        if (statusEl) statusEl.textContent = 'DB жою қатесі: ' + (error.message || error.code);
        return;
      }
      // remove DOM row if present
      if (row && row.parentNode) row.parentNode.removeChild(row);

      // refresh page's own loader if present (safe)
      if (typeof window.loadProducts === 'function') await window.loadProducts();
      if (typeof window.loadProductList === 'function') await window.loadProductList();

      if (statusEl) statusEl.textContent = 'Өнім жойылды';
    } catch (err) {
      console.error('unexpected delete error', err);
      if (statusEl) statusEl.textContent = 'Жою қатесі: ' + (err.message || err);
    }
  });

  console.log('admin-delete-quickfix loaded — delegated delete clicks attached');
})();
