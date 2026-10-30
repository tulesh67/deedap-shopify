(() => {
  const style = document.createElement('style');
  style.textContent = `
    [data-deedap-scroll-header] {
      transition: translate .34s cubic-bezier(.2,.8,.2,1), opacity .24s ease;
      will-change: translate, opacity;
    }
    [data-deedap-scroll-header].deedap-scroll-header-hidden {
      translate: 0 calc(-100% - 24px) !important;
      opacity: 0 !important;
      pointer-events: none !important;
    }
  `;
  document.head.appendChild(style);

  const headers = () => document.querySelectorAll('[data-deedap-scroll-header]');
  const show = () => headers().forEach(header => header.classList.remove('deedap-scroll-header-hidden'));
  const hide = () => headers().forEach(header => header.classList.add('deedap-scroll-header-hidden'));

  let lastY = window.scrollY || document.documentElement.scrollTop || 0;
  let directionDistance = 0;
  let pending = false;
  const update = () => {
    const y = window.scrollY || document.documentElement.scrollTop || 0;
    const delta = y - lastY;
    lastY = y;

    if (y < 100) {
      directionDistance = 0;
      show();
    } else if (delta > 0) {
      directionDistance = directionDistance > 0 ? directionDistance + delta : delta;
      if (directionDistance > 8) {
        hide();
        directionDistance = 0;
      }
    } else if (delta < 0) {
      directionDistance = directionDistance < 0 ? directionDistance + delta : delta;
      if (directionDistance < -8) {
        show();
        directionDistance = 0;
      }
    }
    pending = false;
  };

  window.addEventListener('scroll', () => {
    if (pending) return;
    pending = true;
    window.requestAnimationFrame(update);
  }, { passive: true });
})();
