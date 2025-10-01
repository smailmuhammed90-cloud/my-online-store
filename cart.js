// cart.js — include this at the BOTTOM of every page (before </body>)

(function () {
  // Run after DOM ready
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(() => {
    // Utility: safe get element
    const $ = (id) => document.getElementById(id);

    // CART ICON CLICK (safe)
    const cartIcon = $('cart-icon');
    if (cartIcon) {
      cartIcon.addEventListener('click', () => {
        window.location.href = 'cart.html';
      });
    }

    // CART COUNT (safe)
    function updateCartCount() {
      try {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const countEl = $('cart-count');
        if (countEl) countEl.textContent = cart.length;
      } catch (e) {
        console.error('updateCartCount error', e);
      }
    }
    updateCartCount();

    // Event delegation for .add-to-cart (works for static & dynamic buttons)
    document.body.addEventListener('click', (e) => {
      const btn = e.target.closest && e.target.closest('.add-to-cart');
      if (!btn) return;

      // Prevent double-handling
      e.preventDefault();

      // Read data attributes (validate)
      const name = btn.dataset.name;
      const priceRaw = btn.dataset.price;
      const img = btn.dataset.img || '';

      if (!name || !priceRaw) {
        console.warn('add-to-cart button missing data-name or data-price', btn);
        alert('Product data missing — contact admin.');
        return;
      }

      const price = parseInt(priceRaw, 10);
      if (Number.isNaN(price)) {
        console.warn('invalid price on add-to-cart', priceRaw);
        alert('Product price invalid — contact admin.');
        return;
      }

      // Build item
      const item = { name, price, img, qty: 1 };

      // Save to localStorage
      try {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        cart.push(item);
        localStorage.setItem('cart', JSON.stringify(cart));
      } catch (err) {
        console.error('Failed to save cart', err);
        alert('Failed to add to cart (storage error).');
        return;
      }

      // Update badge (immediate)
      updateCartCount();

      // Redirect to cart page
      window.location.href = 'cart.html';
    });
  });
})();
