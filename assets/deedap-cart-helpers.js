/**
 * DEEDAP AJAX Add to cart, Buy now, and cart drawer sync.
 */

function deedapStoreRoot() {
  return window.Shopify && window.Shopify.routes && window.Shopify.routes.root
    ? window.Shopify.routes.root
    : '/';
}

function deedapCheckoutUrl() {
  return deedapStoreRoot() + 'checkout';
}

function deedapRefreshCartDrawer() {
  const cartDrawer = document.querySelector('cart-drawer');
  return fetch(deedapStoreRoot() + '?sections=cart-drawer,cart-icon-bubble')
    .then((res) => res.json())
    .then((sections) => {
      const drawerInner = document.querySelector('#CartDrawer');
      if (drawerInner && sections['cart-drawer']) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(sections['cart-drawer'], 'text/html');
        const newContent = doc.querySelector('#CartDrawer');
        if (newContent) drawerInner.innerHTML = newContent.innerHTML;
      }

      const iconBubble = document.getElementById('cart-icon-bubble');
      if (iconBubble && sections['cart-icon-bubble']) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(sections['cart-icon-bubble'], 'text/html');
        const nextIcon = doc.getElementById('cart-icon-bubble');
        if (nextIcon) iconBubble.innerHTML = nextIcon.innerHTML;
      }

      if (cartDrawer && typeof cartDrawer.open === 'function') {
        cartDrawer.classList.remove('is-empty');
        cartDrawer.open();
      }
    })
    .catch(() => {
      if (cartDrawer && typeof cartDrawer.open === 'function') cartDrawer.open();
    });
}

function deedapQuickAdd(variantId, title, priceFormatted, imageSrc, options) {
  const buyNow = Boolean(options && options.buyNow);
  const formData = {
    items: [
      {
        id: Number(variantId),
        quantity: 1,
      },
    ],
  };

  return fetch(deedapStoreRoot() + 'cart/add.js', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(formData),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.status) {
        throw new Error(data.description || data.message || 'Could not add to cart');
      }

      if (buyNow) {
        window.location.href = deedapCheckoutUrl();
        return data;
      }

      const deedapBadge = document.getElementById('deedapCartCount');
      if (deedapBadge) {
        const current = parseInt(deedapBadge.textContent, 10) || 0;
        deedapBadge.textContent = current + 1;
      }

      return deedapRefreshCartDrawer().then(() => data);
    });
}

document.addEventListener('click', function (event) {
  const chip = event.target.closest('[data-deedap-variant]');
  if (chip && !chip.disabled) {
    const card = chip.closest('[data-deedap-actions], .deedap-card');
    const host = chip.closest('.deedap-card') || card;
    if (host) {
      host.querySelectorAll('[data-deedap-variant]').forEach(function (item) {
        item.classList.toggle('active', item === chip);
      });
      const variantId = chip.getAttribute('data-deedap-variant');
      host.querySelectorAll('[data-deedap-add], [data-deedap-buy]').forEach(function (button) {
        button.setAttribute('data-variant-id', variantId);
      });
      const hiddenId = host.querySelector('input[name="id"]');
      if (hiddenId) hiddenId.value = variantId;
    }
    return;
  }

  const buyBtn = event.target.closest('[data-deedap-buy]');
  const addBtn = event.target.closest('[data-deedap-add]');
  if (!buyBtn && !addBtn) return;

  event.preventDefault();
  const btn = buyBtn || addBtn;
  if (btn.disabled || btn.classList.contains('is-busy')) return;

  const variantId = btn.getAttribute('data-variant-id');
  if (!variantId) return;

  btn.classList.add('is-busy');
  deedapQuickAdd(variantId, '', '', '', { buyNow: Boolean(buyBtn) }).catch(function (error) {
    console.warn('DEEDAP cart action failed', error);
    window.alert(error.message || 'This product could not be added right now.');
  }).finally(function () {
    btn.classList.remove('is-busy');
  });
});
