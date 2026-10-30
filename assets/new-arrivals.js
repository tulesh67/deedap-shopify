/**
 * DEEDAP New Arrivals Strip Component
 * Vanilla JavaScript (no libraries)
 * - Auto-rotates every 3s through "All New" + each collection
 * - Updates live category indicator in header
 * - Pauses on hover
 * - Restarts 2px progress bar & staggered pop animations
 * - AJAX add-to-cart via /cart/add.js
 */

class DeedapNewArrivals {
  constructor(container) {
    this.container = container;
    this.panels = Array.from(container.querySelectorAll('.na-panel'));
    this.activeLabel = container.querySelector('#naActiveLabel');
    this.seeAllLink = container.querySelector('#naSeeAllLink');
    this.progBar = container.querySelector('.na-bar-el');
    this.defaultSeeAllUrl = this.seeAllLink ? this.seeAllLink.getAttribute('data-default-url') : '';

    this.interval = parseInt(container.getAttribute('data-interval') || '3000', 10);
    this.autoRotate = container.getAttribute('data-auto-rotate') === 'true';

    this.currentIndex = 0;
    this.flip = 0;
    this.timer = null;
    this.isPaused = false;

    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.init();
  }

  init() {
    if (!this.panels.length) return;

    // Hover pauses rotation & progress bar
    this.container.addEventListener('mouseenter', () => {
      this.isPaused = true;
    });

    this.container.addEventListener('mouseleave', () => {
      this.isPaused = false;
    });

    // AJAX Add to Bag
    this.container.querySelectorAll('.na-addb[data-variant-id]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.addToCart(btn);
      });
    });

    // Start 3s rotation timer
    if (this.autoRotate && !this.prefersReducedMotion) {
      this.startTimer();
    }
  }

  startTimer() {
    this.stopTimer();
    this.timer = setInterval(() => {
      if (!this.isPaused) {
        this.next();
      }
    }, this.interval);
  }

  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  next() {
    if (this.panels.length <= 1) return;
    const nextIndex = (this.currentIndex + 1) % this.panels.length;
    this.goToIndex(nextIndex);
  }

  goToIndex(index) {
    if (index < 0 || index >= this.panels.length) return;
    this.currentIndex = index;
    this.flip++;

    const activePanel = this.panels[index];
    const label = activePanel.getAttribute('data-label') || 'All New';
    const collectionUrl = activePanel.getAttribute('data-url') || this.defaultSeeAllUrl;

    // 1. Update active panel with staggered pop animation
    this.panels.forEach((panel, i) => {
      if (i === index) {
        panel.classList.add('is-active');

        const tiles = panel.querySelectorAll('.na-sq');
        const popClass = this.flip % 2 === 0 ? 'na-pop' : 'na-pop2';
        const oldClass = this.flip % 2 === 0 ? 'na-pop2' : 'na-pop';

        tiles.forEach((tile, tileIdx) => {
          tile.classList.remove(oldClass);
          void tile.offsetWidth;
          tile.classList.add(popClass);
          tile.style.animationDelay = (tileIdx * 0.08).toFixed(2) + 's';
        });

        panel.scrollLeft = 0;
      } else {
        panel.classList.remove('is-active');
      }
    });

    // 2. Update Header Category Indicator
    if (this.activeLabel) {
      this.activeLabel.style.opacity = '0';
      setTimeout(() => {
        this.activeLabel.textContent = label;
        this.activeLabel.style.opacity = '1';
      }, 150);
    }

    // 3. Update "SEE ALL NEW" Link
    if (this.seeAllLink) {
      this.seeAllLink.setAttribute('href', collectionUrl);
    }

    // 4. Restart 2px Progress Bar
    if (this.progBar && !this.prefersReducedMotion) {
      const barClass = this.flip % 2 === 0 ? 'na-bar' : 'na-bar2';
      const oldBarClass = this.flip % 2 === 0 ? 'na-bar2' : 'na-bar';
      this.progBar.classList.remove(oldBarClass);
      void this.progBar.offsetWidth;
      this.progBar.classList.add(barClass);
    }

    // 5. Reset interval cycle
    if (this.autoRotate && !this.prefersReducedMotion) {
      this.startTimer();
    }
  }

  addToCart(button) {
    const variantId = button.getAttribute('data-variant-id');
    const hasMultipleVariants = button.getAttribute('data-has-multiple-variants') === 'true';
    const productUrl = button.getAttribute('data-product-url');

    if (hasMultipleVariants && productUrl) {
      window.location.href = productUrl;
      return;
    }

    if (!variantId) {
      // Store has no products created in Shopify Admin database yet
      window.location.href = '/cart';
      return;
    }

    button.disabled = true;
    const originalSvg = button.innerHTML;

    fetch(window.Shopify && window.Shopify.routes ? window.Shopify.routes.root + 'cart/add.js' : '/cart/add.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        id: variantId,
        quantity: 1
      })
    })
      .then((res) => {
        if (!res.ok) throw new Error('Error adding to bag');
        return res.json();
      })
      .then((item) => {
        button.setAttribute('aria-pressed', 'true');
        button.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>';

        // Update cart bubbles and open drawer
        this.updateCartBubbles();
        const drawer = document.querySelector('cart-drawer');
        if (drawer && typeof drawer.open === 'function') {
          drawer.open();
        }

        setTimeout(() => {
          button.setAttribute('aria-pressed', 'false');
          button.innerHTML = originalSvg;
          button.disabled = false;
        }, 2000);
      })
      .catch((err) => {
        console.error('AJAX add-to-cart error:', err);
        button.disabled = false;
      });
  }

  updateCartBubbles() {
    fetch('/cart.js')
      .then((r) => r.json())
      .then((cart) => {
        const countElements = document.querySelectorAll('#deedapCartCount, .dd-bagb span, #cart-icon-bubble span, .cart-count, .cart-count-bubble, [data-cart-count]');
        countElements.forEach((el) => {
          el.textContent = cart.item_count;
        });
      })
      .catch(() => {});
  }

  destroy() {
    this.stopTimer();
  }
}

function initNewArrivals() {
  document.querySelectorAll('[data-section-type="new-arrivals"]').forEach((section) => {
    if (!section._deedapArrivalsInstance) {
      section._deedapArrivalsInstance = new DeedapNewArrivals(section);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNewArrivals);
} else {
  initNewArrivals();
}

document.addEventListener('shopify:section:load', (e) => {
  const section = e.target.querySelector('[data-section-type="new-arrivals"]');
  if (section) {
    new DeedapNewArrivals(section);
  }
});

document.addEventListener('shopify:section:unload', (e) => {
  const section = e.target.querySelector('[data-section-type="new-arrivals"]');
  if (section && section._deedapArrivalsInstance) {
    section._deedapArrivalsInstance.destroy();
  }
});
