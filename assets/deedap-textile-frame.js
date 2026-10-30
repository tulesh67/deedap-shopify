(() => {
  function attach(frame) {
    if (!frame || frame.dataset.heightListener === 'true') return;
    frame.dataset.heightListener = 'true';

    window.addEventListener('message', (event) => {
      if (event.source !== frame.contentWindow) return;
      if (!event.data || event.data.type !== 'deedap-textile-height') return;

      const height = Number(event.data.height);
      if (!Number.isFinite(height)) return;
      frame.style.height = `${Math.max(1200, Math.min(height, 12000))}px`;
    });

    frame.addEventListener('load', () => {
      frame.contentWindow?.postMessage({ type: 'deedap-textile-request-height' }, '*');
    });
  }

  document.querySelectorAll('.deedap-textiles-frame').forEach(attach);
  document.addEventListener('shopify:section:load', (event) => {
    attach(event.target.querySelector('.deedap-textiles-frame'));
  });
})();
