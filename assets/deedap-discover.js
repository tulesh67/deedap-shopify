(() => {
  const initDiscover = (root = document) => {
    const sections = root.querySelectorAll ? root.querySelectorAll('[data-deedap-discover]') : [];
    sections.forEach((section) => {
      if (section.dataset.discoverReady === 'true') return;
      section.dataset.discoverReady = 'true';
      const filters = Array.from(section.querySelectorAll('[data-discover-filter]'));
      const cards = Array.from(section.querySelectorAll('[data-discover-category]'));
      const status = section.querySelector('[data-discover-status]');
      const empty = section.querySelector('[data-discover-no-results]');
      filters.forEach((filter) => {
        filter.addEventListener('click', () => {
          const selected = filter.dataset.discoverFilter;
          let visible = 0;
          filters.forEach((button) => {
            const active = button === filter;
            button.classList.toggle('is-active', active);
            button.setAttribute('aria-pressed', String(active));
          });
          cards.forEach((card) => {
            const show = selected === 'all' || card.dataset.discoverCategory === selected;
            card.hidden = !show;
            if (show) visible += 1;
          });
          if (status) status.textContent = `Showing ${visible} ${visible === 1 ? 'product' : 'products'}.`;
          if (empty) empty.hidden = visible !== 0;
        });
      });
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => initDiscover());
  else initDiscover();
  document.addEventListener('shopify:section:load', (event) => initDiscover(event.target));
})();