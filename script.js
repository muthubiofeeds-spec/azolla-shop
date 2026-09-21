/* ==========================================================================
   Muthu Bio Feeds — script.js
   Handles: mobile menu, cart drawer, WhatsApp order message, scroll reveal.
   To change prices, edit PRODUCTS below AND the prices in the HTML/JSON-LD.
   ========================================================================== */
(function () {
  'use strict';

  // ---------- Settings you may want to edit ----------
  var WA_NUMBER = '919894693414';        // WhatsApp number, country code first, no + or spaces
  var FREE_SHIPPING_ABOVE = 399;         // subtotal must be ABOVE this for free shipping
  var MAX_KG = 500;                      // safety limit per product
  var STORE_KEY = 'muthu-bio-feeds-cart-v1';
  var PRODUCTS = {
    'fresh':    { name: 'Fresh Azolla',    price: 70 },
    'powder':   { name: 'Azolla Powder',   price: 195 },
    'granules': { name: 'Azolla Granules', price: 210 }
  };

  document.documentElement.classList.add('js');

  // ---------- Small helpers ----------
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function inr(n) { return '\u20B9' + Number(n).toLocaleString('en-IN'); }
  function clampKg(v) {
    v = parseInt(v, 10);
    if (isNaN(v) || v < 1) v = 1;
    return v > MAX_KG ? MAX_KG : v;
  }

  // ---------- Cart state (saved in the browser so it survives page changes) ----------
  var cart = loadCart();   // { fresh: 2, powder: 1 }

  function loadCart() {
    var out = {};
    try {
      var raw = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
      Object.keys(PRODUCTS).forEach(function (id) {
        if (raw && raw[id]) out[id] = clampKg(raw[id]);
      });
    } catch (e) { /* storage blocked or bad data: start empty */ }
    return out;
  }
  function saveCart() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(cart)); } catch (e) { /* ignore */ }
  }
  function totalKg() { return Object.keys(cart).reduce(function (s, id) { return s + cart[id]; }, 0); }
  function subtotal() { return Object.keys(cart).reduce(function (s, id) { return s + cart[id] * PRODUCTS[id].price; }, 0); }
  function itemCount() { return Object.keys(cart).length; }
  function isFree() { return subtotal() > FREE_SHIPPING_ABOVE; }

  // ---------- Elements ----------
  var drawer = $('#cart-drawer');
  var overlay = $('#cart-overlay');
  var badge = $('#cart-badge');
  var listEl = $('#cart-list');
  var emptyEl = $('#cart-empty');
  var filledEl = $('#cart-filled');
  var subEl = $('#cart-subtotal');
  var shipEl = $('#cart-shipping');
  var hintEl = $('#cart-hint');
  var orderBtn = $('#order-btn');
  var statusEl = $('#cart-status');
  var lastFocus = null;

  // ---------- Render ----------
  function render(flashId) {
    var ids = Object.keys(cart);
    var html = '';
    ids.forEach(function (id) {
      var p = PRODUCTS[id], q = cart[id];
      html += '<li class="cart-item' + (id === flashId ? ' flash' : '') + '" data-id="' + id + '">' +
        '<div><div class="ci-name">' + p.name + '</div><div class="ci-price">' + inr(p.price) + ' per kg</div></div>' +
        '<div class="ci-total">' + inr(q * p.price) + '</div>' +
        '<div class="ci-actions">' +
          '<div class="stepper small">' +
            '<button type="button" data-cart-dec="' + id + '" aria-label="Decrease ' + p.name + ' quantity">\u2212</button>' +
            '<input type="number" min="1" max="' + MAX_KG + '" value="' + q + '" data-cart-input="' + id + '" aria-label="' + p.name + ' quantity in kg" inputmode="numeric">' +
            '<span class="unit">kg</span>' +
            '<button type="button" data-cart-inc="' + id + '" aria-label="Increase ' + p.name + ' quantity">+</button>' +
          '</div>' +
          '<button type="button" class="remove" data-cart-remove="' + id + '" aria-label="Remove ' + p.name + ' from cart">Remove</button>' +
        '</div></li>';
    });
    if (listEl) listEl.innerHTML = html;

    var has = ids.length > 0;
    if (emptyEl) emptyEl.hidden = has;
    if (filledEl) filledEl.hidden = !has;

    var sub = subtotal();
    if (subEl) subEl.textContent = inr(sub);
    if (shipEl) {
      shipEl.textContent = has ? (isFree() ? 'FREE' : 'Confirmed on WhatsApp') : '\u2014';
      shipEl.className = has && isFree() ? 'free' : '';
    }
    if (hintEl) {
      if (has && !isFree()) {
        hintEl.textContent = 'Add ' + inr(FREE_SHIPPING_ABOVE + 1 - sub) + ' more for free shipping (orders above ' + inr(FREE_SHIPPING_ABOVE) + ').';
      } else if (has) {
        hintEl.textContent = 'You have free shipping on this order.';
      } else { hintEl.textContent = ''; }
    }
    if (orderBtn) orderBtn.disabled = !has;

    if (badge) {
      var n = totalKg();
      badge.textContent = n > 99 ? '99+' : String(n);
      badge.classList.toggle('show', n > 0);
    }
    var cartBtn = $('#cart-btn');
    if (cartBtn) cartBtn.setAttribute('aria-label', 'Open cart, ' + totalKg() + ' kg in cart');
  }

  function bumpBadge() {
    if (!badge) return;
    badge.classList.remove('bump');
    void badge.offsetWidth;            // restart the animation
    badge.classList.add('bump');
  }

  // ---------- Cart actions ----------
  function addItem(id, qty) {
    if (!PRODUCTS[id]) return;
    cart[id] = clampKg((cart[id] || 0) + clampKg(qty));
    saveCart(); render(id); bumpBadge(); openDrawer();
    if (statusEl) statusEl.textContent = PRODUCTS[id].name + ' added. Cart total ' + inr(subtotal()) + '.';
  }
  function setQty(id, qty) {
    if (!cart[id]) return;
    cart[id] = clampKg(qty); saveCart(); render(); bumpBadge();
  }
  function removeItem(id) {
    delete cart[id]; saveCart(); render();
    if (statusEl) statusEl.textContent = PRODUCTS[id].name + ' removed from cart.';
  }

  // ---------- Drawer open / close ----------
  function openDrawer() {
    if (!drawer) return;
    lastFocus = document.activeElement;
    drawer.classList.add('open');
    overlay.classList.add('show');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lock');
    var btn = $('#cart-close');
    if (btn) setTimeout(function () { btn.focus(); }, 60);
  }
  function closeDrawer() {
    if (!drawer || !drawer.classList.contains('open')) return;
    drawer.classList.remove('open');
    overlay.classList.remove('show');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lock');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  // ---------- Mobile menu ----------
  var header = $('.site-header');
  var burger = $('#burger');
  function setMenu(open) {
    if (!header || !burger) return;
    header.classList.toggle('nav-open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }

  // ---------- WhatsApp message ----------
  function buildMessage(name, mobile, address) {
    var lines = ['Hello Muthu Bio Feeds, I would like to place an order:', ''];
    Object.keys(cart).forEach(function (id, i) {
      var p = PRODUCTS[id], q = cart[id];
      lines.push((i + 1) + '. ' + p.name + ' - ' + q + ' kg x ' + inr(p.price) + '/kg = ' + inr(q * p.price));
    });
    lines.push('');
    lines.push('Subtotal: ' + inr(subtotal()));
    lines.push('Shipping: ' + (isFree() ? 'FREE (order above ' + inr(FREE_SHIPPING_ABOVE) + ')' : 'To be confirmed on WhatsApp'));
    lines.push('');
    lines.push('Name: ' + name);
    lines.push('Mobile: ' + mobile);
    lines.push('Delivery address: ' + address);
    return lines.join('\n');
  }

  function fieldError(input, bad) {
    var f = input.closest('.field');
    if (f) f.classList.toggle('bad', bad);
    input.setAttribute('aria-invalid', bad ? 'true' : 'false');
    return bad;
  }

  function submitOrder(e) {
    e.preventDefault();
    if (!itemCount()) return;
    var nameI = $('#f-name'), mobI = $('#f-mobile'), addrI = $('#f-address');
    var name = nameI.value.trim();
    var mobile = mobI.value.replace(/[\s-]/g, '');
    var address = addrI.value.trim();

    var badName = fieldError(nameI, name.length < 2);
    // Accepts 10-digit Indian mobile numbers, optionally starting +91 / 91 / 0
    var digits = mobile.replace(/^\+?(91|0)?/, '');
    var badMob = fieldError(mobI, !/^[6-9]\d{9}$/.test(digits));
    var badAddr = fieldError(addrI, address.length < 8);
    if (badName || badMob || badAddr) {
      (badName ? nameI : badMob ? mobI : addrI).focus();
      return;
    }
    var url = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(buildMessage(name, '+91 ' + digits, address));
    var w = window.open(url, '_blank', 'noopener');
    if (!w) window.location.href = url;     // popup blocked: open in same tab
  }

  // ---------- Events (one delegated listener) ----------
  document.addEventListener('click', function (e) {
    var t = e.target;
    var el;

    if ((el = t.closest('[data-add]'))) {                      // "Add to cart" on cards / product pages
      var box = el.closest('[data-buy]');
      var input = box ? $('input', box) : null;
      addItem(el.getAttribute('data-add'), input ? input.value : 1);
      if (input) input.value = 1;
      return;
    }
    if ((el = t.closest('[data-step]'))) {                     // +/- on card steppers
      var inp = $('input', el.parentNode);
      inp.value = clampKg((parseInt(inp.value, 10) || 1) + parseInt(el.getAttribute('data-step'), 10));
      return;
    }
    if ((el = t.closest('[data-cart-inc]'))) { var a = el.getAttribute('data-cart-inc'); setQty(a, cart[a] + 1); return; }
    if ((el = t.closest('[data-cart-dec]'))) { var b = el.getAttribute('data-cart-dec'); setQty(b, cart[b] - 1); return; }
    if ((el = t.closest('[data-cart-remove]'))) { removeItem(el.getAttribute('data-cart-remove')); return; }
    if (t.closest('[data-open-cart]')) { setMenu(false); openDrawer(); return; }
    if (t.closest('[data-close-cart]')) { closeDrawer(); return; }
    if (t.closest('#burger')) { setMenu(!header.classList.contains('nav-open')); return; }
    if (t.closest('.nav a')) { setMenu(false); return; }
    if (header && !t.closest('.site-header')) setMenu(false);
  });

  // typing a quantity directly inside the cart
  document.addEventListener('change', function (e) {
    var id = e.target.getAttribute && e.target.getAttribute('data-cart-input');
    if (id) setQty(id, e.target.value);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeDrawer(); setMenu(false); }
    // keep Tab inside the open drawer
    if (e.key === 'Tab' && drawer && drawer.classList.contains('open')) {
      var f = $all('button, input, textarea, a[href]', drawer).filter(function (x) { return !x.disabled && x.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  window.addEventListener('resize', function () { if (window.innerWidth > 860) setMenu(false); });

  var form = $('#order-form');
  if (form) form.addEventListener('submit', submitOrder);
  if (form) $all('input, textarea', form).forEach(function (i) {
    i.addEventListener('input', function () { fieldError(i, false); });
  });

  // keep several open tabs in sync
  window.addEventListener('storage', function (e) { if (e.key === STORE_KEY) { cart = loadCart(); render(); } });

  // ---------- Scroll reveal (respects reduced motion) ----------
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var items = $all('.reveal');
  if (reduce || !('IntersectionObserver' in window)) {
    items.forEach(function (n) { n.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    items.forEach(function (n) { io.observe(n); });
  }

  // ---------- Opening the files straight from a folder (file://) ----------
  // Web servers open "folder/" as folder/index.html by themselves; a local folder does not.
  if (location.protocol === 'file:') {
    $all('a[href]').forEach(function (a) {
      var h = a.getAttribute('href');
      if (/^(https?:|mailto:|tel:|#)/.test(h)) return;
      var i = h.indexOf('#'), p = i < 0 ? h : h.slice(0, i), f = i < 0 ? '' : h.slice(i);
      if (p === './' || /\/$/.test(p)) a.setAttribute('href', p + 'index.html' + f);
    });
  }

  render();
})();
