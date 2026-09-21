/* =========================================================
   Muthu Bio Feeds — Site Script
   ========================================================= */

(function () {
  "use strict";

  const WHATSAPP_NUMBER = "919894693414"; // +91 9894693414
  const FREE_SHIPPING_THRESHOLD = 399;

  // ---------- Footer year ----------
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ---------- Mobile nav toggle ----------
  const navToggle = document.getElementById("navToggle");
  const mainNav = document.getElementById("mainNav");
  if (navToggle && mainNav) {
    navToggle.addEventListener("click", function () {
      mainNav.classList.toggle("open");
    });
    mainNav.querySelectorAll(".nav-link, .nav-cta").forEach(function (link) {
      link.addEventListener("click", function () {
        mainNav.classList.remove("open");
      });
    });
  }

  // ---------- Quantity selectors on product cards ----------
  document.querySelectorAll(".product-card").forEach(function (card) {
    const input = card.querySelector(".qty-input");
    const minus = card.querySelector(".minus");
    const plus = card.querySelector(".plus");

    minus.addEventListener("click", function () {
      let val = parseInt(input.value, 10) || 1;
      if (val > 1) input.value = val - 1;
    });

    plus.addEventListener("click", function () {
      let val = parseInt(input.value, 10) || 1;
      input.value = val + 1;
    });
  });

  // ---------- Cart state ----------
  // cart = { id: { name, price, unit, qty } }
  let cart = {};
  let lastAddedId = null;

  const cartItemsEl = document.getElementById("cartItems");
  const cartEmptyMsg = document.getElementById("cartEmptyMsg");
  const cartSubtotalEl = document.getElementById("cartSubtotal");
  const cartShippingEl = document.getElementById("cartShipping");
  const cartTotalEl = document.getElementById("cartTotal");

  const drawerItemsEl = document.getElementById("drawerItems");
  const drawerEmptyMsg = document.getElementById("drawerEmptyMsg");
  const drawerTotalEl = document.getElementById("drawerTotal");
  const cartCountEl = document.getElementById("cartCount");

  const cartIconBtn = document.getElementById("cartIconBtn");
  const cartDrawer = document.getElementById("cartDrawer");
  const cartOverlay = document.getElementById("cartOverlay");
  const cartDrawerClose = document.getElementById("cartDrawerClose");
  const drawerCheckoutBtn = document.getElementById("drawerCheckoutBtn");

  function formatRupees(amount) {
    return "₹" + amount.toLocaleString("en-IN");
  }

  function getSubtotal() {
    return Object.values(cart).reduce(function (sum, item) {
      return sum + item.price * item.qty;
    }, 0);
  }

  function getItemCount() {
    return Object.values(cart).reduce(function (sum, item) {
      return sum + item.qty;
    }, 0);
  }

  function openCartDrawer() {
    cartDrawer.classList.add("open");
    cartOverlay.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function closeCartDrawer() {
    cartDrawer.classList.remove("open");
    cartOverlay.classList.remove("open");
    document.body.style.overflow = "";
  }

  if (cartIconBtn) cartIconBtn.addEventListener("click", openCartDrawer);
  if (cartDrawerClose) cartDrawerClose.addEventListener("click", closeCartDrawer);
  if (cartOverlay) cartOverlay.addEventListener("click", closeCartDrawer);
  if (drawerCheckoutBtn) drawerCheckoutBtn.addEventListener("click", closeCartDrawer);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeCartDrawer();
  });

  function buildItemRow(id, item) {
    const row = document.createElement("div");
    row.className = "cart-item";
    if (id === lastAddedId) row.classList.add("just-added");
    row.innerHTML =
      '<div>' +
        '<div class="cart-item-name">' + item.name + '</div>' +
        '<div class="cart-item-meta">' + item.qty + ' ' + item.unit + ' × ' + formatRupees(item.price) + '</div>' +
      '</div>' +
      '<div style="display:flex;align-items:center;gap:14px;">' +
        '<strong>' + formatRupees(item.price * item.qty) + '</strong>' +
        '<button class="cart-item-remove" data-id="' + id + '">Remove</button>' +
      '</div>';
    return row;
  }

  function renderInto(container, emptyMsgEl) {
    const items = Object.keys(cart);

    if (items.length === 0) {
      container.innerHTML = "";
      container.appendChild(emptyMsgEl);
      emptyMsgEl.style.display = "block";
      return;
    }

    emptyMsgEl.style.display = "none";
    container.innerHTML = "";

    items.forEach(function (id) {
      container.appendChild(buildItemRow(id, cart[id]));
    });

    container.querySelectorAll(".cart-item-remove").forEach(function (btn) {
      btn.addEventListener("click", function () {
        delete cart[btn.getAttribute("data-id")];
        renderCart();
      });
    });
  }

  function renderCart() {
    renderInto(cartItemsEl, cartEmptyMsg);
    renderInto(drawerItemsEl, drawerEmptyMsg);

    const subtotal = getSubtotal();
    const freeShipping = subtotal >= FREE_SHIPPING_THRESHOLD && subtotal > 0;

    cartSubtotalEl.textContent = formatRupees(subtotal);

    if (subtotal === 0) {
      cartShippingEl.textContent = "—";
    } else if (freeShipping) {
      cartShippingEl.textContent = "FREE";
    } else {
      cartShippingEl.textContent = "Confirmed on WhatsApp";
    }

    // Total shown is product subtotal only; shipping (if any) is confirmed on WhatsApp.
    cartTotalEl.textContent = formatRupees(subtotal);
    drawerTotalEl.textContent = formatRupees(subtotal);

    const count = getItemCount();
    cartCountEl.textContent = count;
    cartCountEl.style.display = count > 0 ? "block" : "none";
  }

  // ---------- Add to Order ----------
  document.querySelectorAll(".btn-add").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const card = btn.closest(".product-card");
      const id = card.getAttribute("data-id");
      const name = card.getAttribute("data-name");
      const price = parseFloat(card.getAttribute("data-price"));
      const unit = card.getAttribute("data-unit");
      const qty = parseInt(card.querySelector(".qty-input").value, 10) || 1;

      if (cart[id]) {
        cart[id].qty += qty;
      } else {
        cart[id] = { name: name, price: price, unit: unit, qty: qty };
      }

      lastAddedId = id;
      renderCart();

      // Immediate feedback: open the cart drawer so the customer
      // sees exactly what was added, right away.
      openCartDrawer();

      // Bump animation on the header cart icon
      if (cartIconBtn) {
        cartIconBtn.classList.remove("bump");
        void cartIconBtn.offsetWidth; // restart animation
        cartIconBtn.classList.add("bump");
      }

      const originalText = btn.textContent;
      btn.textContent = "Added ✓";
      btn.classList.add("added");
      setTimeout(function () {
        btn.textContent = originalText;
        btn.classList.remove("added");
      }, 1200);

      card.querySelector(".qty-input").value = 1;
    });
  });

  // ---------- Order on WhatsApp ----------
  const orderBtn = document.getElementById("orderWhatsappBtn");
  const nameInput = document.getElementById("custName");
  const mobileInput = document.getElementById("custMobile");
  const addressInput = document.getElementById("custAddress");

  orderBtn.addEventListener("click", function () {
    const items = Object.keys(cart);

    if (items.length === 0) {
      alert("Please add at least one product to your order.");
      document.getElementById("products").scrollIntoView({ behavior: "smooth" });
      return;
    }

    const name = nameInput.value.trim();
    const mobile = mobileInput.value.trim();
    const address = addressInput ? addressInput.value.trim() : "";
    if (!name || !mobile) {
      alert("Please enter your name and mobile number.");
      return;
    }
    if (!address) {
      alert("Please enter your delivery address.");
      return;
    }

    const subtotal = getSubtotal();
    const freeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
    const shippingText = freeShipping
      ? "FREE SHIPPING"
      : "Shipping charge to be confirmed on WhatsApp";

    let message = "Hello Muthu Bio Feeds, I would like to place an order:\n\n";

    items.forEach(function (id) {
      const item = cart[id];
      message += "• " + item.name + " — " + item.qty + " " + item.unit +
        " × " + formatRupees(item.price) + " = " + formatRupees(item.price * item.qty) + "\n";
    });

    message += "\nSubtotal: " + formatRupees(subtotal);
    message += "\nShipping: " + shippingText;
    message += "\n\nName: " + name;
    message += "\nMobile: " + mobile;
    message += "\nAddress: " + address;

    const url = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(message);
    window.open(url, "_blank");
  });

  // Initial render
  renderCart();

  // ---------- Gallery slider ----------
  const galleryTrack = document.getElementById("galleryTrack");
  const galleryPrev = document.querySelector(".gallery-prev");
  const galleryNext = document.querySelector(".gallery-next");
  if (galleryTrack && galleryPrev && galleryNext) {
    function galleryScrollAmount() {
      const slide = galleryTrack.querySelector(".gallery-slide");
      const gap = 20;
      return slide ? slide.offsetWidth + gap : 280;
    }
    galleryPrev.addEventListener("click", function () {
      galleryTrack.scrollBy({ left: -galleryScrollAmount(), behavior: "smooth" });
    });
    galleryNext.addEventListener("click", function () {
      galleryTrack.scrollBy({ left: galleryScrollAmount(), behavior: "smooth" });
    });
  }

  // ---------- Subtle scroll-reveal animation ----------
  const revealEls = document.querySelectorAll(".reveal, .reveal-stagger");
  if ("IntersectionObserver" in window && revealEls.length) {
    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(function (el) { observer.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in-view"); });
  }
})();
