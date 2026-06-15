/**
 * Soul Store — components.js
 * Adds to EVERY page automatically:
 * 1. Floating WhatsApp button (Static, elegant, no aggressive pulse)
 * 2. Professional dark footer (replaces the existing minimal one)
 */
(function () {
  'use strict';
  var WA  = '77755614670';
  var IG  = 'https://www.instagram.com/soul_store.kz';
  var YR  = new Date().getFullYear();

  /* ─── Styles ─────────────────────────────────────────────── */
  var style = document.createElement('style');
  style.textContent = [
    /* WhatsApp button - Removed pulse, made elegant */
    '#ss-wa{position:fixed;bottom:32px;right:32px;width:60px;height:60px;',
    'background:#1A1A19;border: 1px solid rgba(255,255,255,0.1);border-radius:50%;display:flex;align-items:center;',
    'justify-content:center;box-shadow:0 12px 30px rgba(0,0,0,.15);',
    'z-index:9999;text-decoration:none;transition:transform .3s ease,box-shadow .3s ease;}',
    '#ss-wa:hover{transform:translateY(-4px);',
    'box-shadow:0 16px 40px rgba(0,0,0,.2); background:#2C2C2A;}',

    /* Tooltip */
    '#ss-wa-tip{position:fixed;bottom:46px;right:108px;background:#FFFFFF;',
    'color:#1A1A19;font-size:12px;font-weight:500;padding:10px 16px;',
    'border-radius:4px;box-shadow:0 10px 25px rgba(0,0,0,.05);white-space:nowrap;opacity:0;pointer-events:none;',
    'transition:opacity .3s ease, transform .3s ease; transform:translateX(10px);font-family:Inter,system-ui,sans-serif;z-index:9998; letter-spacing: 0.5px; border: 1px solid #E8E6E1;}',
    '#ss-wa:hover + #ss-wa-tip{opacity:1; transform:translateX(0);}',

    /* Footer shell */
    '.ss-ft{background:#1A1A19;color:rgba(255,255,255,.6);',
    'font-family:Inter,system-ui,sans-serif;font-size:14px;',
    'line-height:1.8;padding:80px 24px 0;margin-top:0px;}',
    '.ss-ft a{color:rgba(255,255,255,.6);text-decoration:none;transition:color .3s;}',
    '.ss-ft a:hover{color:#fff;}',

    /* Footer grid */
    '.ss-ft-grid{display:grid;grid-template-columns:1.6fr 1fr 1fr 1fr;',
    'gap:60px;max-width:1160px;margin:0 auto;padding-bottom:80px;}',
    '@media(max-width:900px){.ss-ft-grid{grid-template-columns:1fr 1fr;gap:40px;}}',
    '@media(max-width:560px){.ss-ft-grid{grid-template-columns:1fr;gap:40px;}}',

    /* Footer column headings */
    '.ss-ft h5{color:#fff;font-size:11px;font-weight:500;letter-spacing:.2em;',
    'text-transform:uppercase;margin:0 0 24px;}',
    '.ss-ft ul{list-style:none;padding:0;margin:0;}',
    '.ss-ft ul li{margin-bottom:12px;}',

    /* Brand block */
    '.ss-ft-brand{font-family:"Playfair Display",serif;font-size:24px;font-weight:400;color:#fff;letter-spacing:-.3px;margin:0 0 8px;}',
    '.ss-ft-sub{font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.4);margin:0 0 24px;}',

    /* Social buttons */
    '.ss-ft-socials{display:flex;gap:12px;margin-top:32px;flex-wrap:wrap;}',
    '.ss-ft-btn{display:inline-flex;align-items:center;gap:10px;padding:10px 18px;',
    'border:1px solid rgba(255,255,255,.15);border-radius:4px;font-size:12px;letter-spacing:0.5px;text-transform:uppercase;',
    'font-weight:500;color:rgba(255,255,255,.8)!important;transition:all .3s!important;}',
    '.ss-ft-btn:hover{border-color:rgba(255,255,255,.4)!important;',
    'color:#fff!important;background:rgba(255,255,255,.05);}',

    /* Payment chips */
    '.ss-pay-chip{display:flex;align-items:center;gap:12px;padding:12px 0;',
    'margin-bottom:0; border-bottom:1px solid rgba(255,255,255,.05);',
    'font-size:13px;font-weight:400;color:rgba(255,255,255,.8);}',
    '.ss-pay-chip:last-of-type{border-bottom:none;}',

    /* Delivery items */
    '.ss-del{margin-bottom:20px;}',
    '.ss-del-name{font-weight:500;color:rgba(255,255,255,.9);font-size:13px; margin-bottom:4px;}',
    '.ss-del-note{font-size:12px;color:rgba(255,255,255,.4);font-weight:300;}',

    /* Bottom bar */
    '.ss-ft-bar{border-top:1px solid rgba(255,255,255,.1);padding:32px 24px;}',
    '.ss-ft-bar-inner{max-width:1160px;margin:0 auto;display:flex;',
    'justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;',
    'font-size:12px;font-weight:300;color:rgba(255,255,255,.4); letter-spacing:0.5px;}',
  ].join('');
  document.head.appendChild(style);

  /* ─── WhatsApp button ─────────────────────────────────────── */
  var wa = document.createElement('a');
  wa.id   = 'ss-wa';
  wa.href = 'https://wa.me/' + WA + '?text=' +
    encodeURIComponent('Сәлем, Soul Store! Сұрақ қойғым келеді 🙏');
  wa.target = '_blank';
  wa.rel    = 'noopener';
  wa.setAttribute('aria-label', 'WhatsApp');
  wa.innerHTML =
    '<svg width="28" height="28" viewBox="0 0 24 24" fill="#fff">' +
    '<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15' +
    '-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475' +
    '-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52' +
    '.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207' +
    '-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372' +
    '-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 ' +
    '5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 ' +
    '1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347' +
    'm-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648' +
    '-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 ' +
    '5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884' +
    'm8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 ' +
    '4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 ' +
    '11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>';
  document.body.appendChild(wa);

  var tip = document.createElement('span');
  tip.id = 'ss-wa-tip';
  tip.textContent = 'Связаться с нами';
  document.body.appendChild(tip);

  /* ─── Footer ──────────────────────────────────────────────── */
  var igIcon =
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
    '<rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>';

  var waIcon =
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>';

  var ccIcon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>';
  var bankIcon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>';
  var cashIcon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>';

  var ft = document.createElement('footer');
  ft.className = 'ss-ft';
  ft.innerHTML =
    '<div class="ss-ft-grid">' +

    /* col 1 — brand */
    '<div>' +
      '<p class="ss-ft-brand">Soul Store</p>' +
      '<p class="ss-ft-sub">Женская одежда · Казахстан</p>' +
      '<p style="font-weight: 300;">Скромная, стильная, качественная одежда с доставкой по всему Казахстану.</p>' +
      '<div class="ss-ft-socials">' +
        '<a href="' + IG + '" target="_blank" rel="noopener" class="ss-ft-btn">' + igIcon + 'Instagram</a>' +
        '<a href="https://wa.me/' + WA + '" target="_blank" rel="noopener" class="ss-ft-btn">' + waIcon + 'WhatsApp</a>' +
      '</div>' +
    '</div>' +

    /* col 2 — catalogue */
    '<div>' +
      '<h5>Каталог</h5>' +
      '<ul>' +
        '<li><a href="/dresses.html">Платья / Көйлектер</a></li>' +
        '<li><a href="/sundresses.html">Сарафаны / Сарафандар</a></li>' +
        '<li><a href="/suits.html">Костюмы / Костюмдер</a></li>' +
        '<li><a href="/hijabs.html">Хиджабы / Орамалдар</a></li>' +
        '<li><a href="/shirts.html">Рубашки / Жейделер</a></li>' +
        '<li><a href="/sweaters.html">Кофты / Кофталар</a></li>' +
        '<li><a href="/jeans.html">Джинсы / Джинсылар</a></li>' +
        '<li><a href="/skirts.html">Юбки / Юбкалар</a></li>' +
        '<li><a href="/pants.html">Брюки / Шалбарлар</a></li>' +
        '<li><a href="/jackets.html">Жакеты / Жакеттер</a></li>' +
        '<li style="margin-top: 24px;"><a href="/about.html">О нас / Біз туралы</a></li>' +
        '<li><a href="/contact.html">Контакты / Байланыс</a></li>' +
      '</ul>' +
    '</div>' +

    /* col 3 — payment */
    '<div>' +
      '<h5>Оплата</h5>' +
      '<div class="ss-pay-chip">' + ccIcon + 'Kaspi QR / Перевод</div>' +
      '<div class="ss-pay-chip">' + bankIcon + 'Банковский перевод</div>' +
      '<div class="ss-pay-chip">' + cashIcon + 'Наличные (Астана)</div>' +
      '<p style="font-size:12px;color:rgba(255,255,255,.3);margin-top:20px; font-weight:300;">' +
        'Реквизиты пришлёт менеджер в WhatsApp после оформления заказа.' +
      '</p>' +
    '</div>' +

    /* col 4 — delivery */
    '<div>' +
      '<h5>Доставка</h5>' +
      '<div class="ss-del"><div class="ss-del-name">Казпочта</div><div class="ss-del-note">5–7 рабочих дней</div></div>' +
      '<div class="ss-del"><div class="ss-del-name">Яндекс Доставка</div><div class="ss-del-note">1–3 дня, крупные города</div></div>' +
      '<div class="ss-del"><div class="ss-del-name">СДЭК</div><div class="ss-del-note">3–5 рабочих дней</div></div>' +
      '<div class="ss-del"><div class="ss-del-name">Самовывоз · Астана</div><div class="ss-del-note">Бесплатно, по договорённости</div></div>' +
    '</div>' +

    '</div>' + 

    '<div class="ss-ft-bar">' +
      '<div class="ss-ft-bar-inner">' +
        '<span>© ' + YR + ' Soul Store · Казахстан</span>' +
        '<span>Астана · soul_store.kz</span>' +
      '</div>' +
    '</div>';

  /* Replace existing minimal footer, or append */
  var old = document.querySelector('footer');
  if (old) { old.replaceWith(ft); } else { document.body.appendChild(ft); }

})();
