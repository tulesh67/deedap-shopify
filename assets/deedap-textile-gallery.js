(function () {
  function updateGalleryCount(gallery) {
    const track = gallery.querySelector('[data-dd-gallery-track]');
    const counter = gallery.querySelector('[data-dd-gallery-count]');
    if (!track || !counter) return;
    const slides = track.querySelectorAll('.dd-textile-card__slide');
    const index = Math.min(slides.length, Math.max(1, Math.round(track.scrollLeft / track.clientWidth) + 1));
    counter.textContent = index + ' / ' + slides.length;
  }

  document.addEventListener('click', function (event) {
    const button = event.target.closest('[data-dd-gallery-step]');
    if (!button) return;
    const gallery = button.closest('[data-dd-textile-carousel]');
    const track = gallery && gallery.querySelector('[data-dd-gallery-track]');
    if (!track) return;
    const slides = track.querySelectorAll('.dd-textile-card__slide');
    if (slides.length < 2) return;
    const current = Math.round(track.scrollLeft / track.clientWidth);
    const step = Number(button.getAttribute('data-dd-gallery-step')) || 1;
    const next = (current + step + slides.length) % slides.length;
    track.scrollTo({ left: next * track.clientWidth, behavior: 'smooth' });
  });

  document.addEventListener('scroll', function (event) {
    const track = event.target;
    if (!track.matches || !track.matches('[data-dd-gallery-track]')) return;
    const gallery = track.closest('[data-dd-textile-carousel]');
    if (gallery) window.requestAnimationFrame(function () { updateGalleryCount(gallery); });
  }, true);
})();
