/* Deedap — add-to-bag, live cart count, and the auto-rotating New Arrivals section.
   Plain JavaScript, no libraries. */
(function () {
  if (window.__ddInit) return;
  window.__ddInit = true;

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function root() {
    return (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) || '/';
  }

  function setCount(n) {
    document.querySelectorAll('[data-dd-cart-count]').forEach(function (el) { el.textContent = n; });
  }

  /* ---------- Add to bag ---------- */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-dd-add]');
    if (!btn) return;
    e.preventDefault();
    if (btn.classList.contains('is-busy')) return;
    btn.classList.add('is-busy');

    fetch(root() + 'cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ id: Number(btn.getAttribute('data-variant-id')), quantity: 1 })
    })
      .then(function (r) { if (!r.ok) throw new Error('add failed'); return r.json(); })
      .then(function () { return fetch(root() + 'cart.js', { headers: { Accept: 'application/json' } }); })
      .then(function (r) { return r.json(); })
      .then(function (cart) {
        setCount(cart.item_count);
        btn.classList.add('is-added');
        btn.setAttribute('aria-pressed', 'true');
        document.dispatchEvent(new CustomEvent('dd:cart-updated', { detail: cart }));
        setTimeout(function () {
          btn.classList.remove('is-added');
          btn.setAttribute('aria-pressed', 'false');
        }, 1800);
      })
      .catch(function () {
        var url = btn.getAttribute('data-product-url');
        if (url) window.location.href = url;
      })
      .then(function () { btn.classList.remove('is-busy'); });
  });

  /* ---------- New arrivals: rotate through categories ---------- */
  function initArrivals(el) {
    if (el.__ddArrivals) return;
    el.__ddArrivals = true;

    var panels = Array.prototype.slice.call(el.querySelectorAll('[data-dd-panel]'));
    var label = el.querySelector('[data-dd-label]');
    var bar = el.querySelector('[data-dd-bar]');
    var hold = el.querySelector('[data-dd-hold]') || el;
    var seconds = parseFloat(el.getAttribute('data-interval')) || 3;
    var index = 0, flip = false, paused = false, timer = null;

    function restartBar() {
      if (!bar) return;
      flip = !flip;
      bar.className = flip ? 'dd-bar' : 'dd-bar2';
    }

    function stagger(panel) {
      var tiles = panel.querySelectorAll('.dd-sq');
      tiles.forEach(function (t, i) {
        t.classList.remove('dd-pop', 'dd-pop2');
        t.style.animationDelay = (i * 0.08).toFixed(2) + 's';
        // alternate between two identical keyframes so the animation restarts
        t.classList.add(flip ? 'dd-pop' : 'dd-pop2');
      });
    }

    function show(i) {
      index = (i + panels.length) % panels.length;
      panels.forEach(function (p, n) { p.classList.toggle('is-active', n === index); });
      if (label) label.textContent = panels[index].getAttribute('data-label') || '';
      restartBar();
      stagger(panels[index]);
    }

    function tick() { if (!paused) show(index + 1); }

    function start() { stop(); timer = setInterval(tick, seconds * 1000); }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }

    hold.addEventListener('mouseenter', function () { paused = true; if (bar) bar.style.animationPlayState = 'paused'; });
    hold.addEventListener('mouseleave', function () { paused = false; if (bar) bar.style.animationPlayState = ''; });
    hold.addEventListener('focusin', function () { paused = true; });
    hold.addEventListener('focusout', function () { paused = false; });
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });

    var active = panels.findIndex(function (p) { return p.classList.contains('is-active'); });
    index = active > -1 ? active : 0;
    show(index);

    if (panels.length > 1 && !reduce) start();
    else if (bar) bar.style.display = 'none';
  }

  function initAll(scope) {
    (scope || document).querySelectorAll('[data-dd-arrivals]').forEach(initArrivals);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { initAll(); });
  else initAll();

  // Re-initialise when sections are edited in the theme editor.
  document.addEventListener('shopify:section:load', function (e) { initAll(e.target); });
})();
