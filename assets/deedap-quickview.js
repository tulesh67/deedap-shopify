/**
 * DEEDAP Direct Product Navigation (Flipkart Style)
 * Clicking any product on the home page or catalog opens the dedicated Product Page directly.
 */
document.addEventListener('click', function (e) {
  // 1. If clicking the round "+" button, let the AJAX add-to-bag handle it
  if (e.target.closest('.na-addb, .na-sqadd, .dd-addb, .dd-sqadd, [data-dd-add]')) {
    return;
  }

  // 2. If clicking an <a> link directly, let the browser navigate naturally
  const clickedLink = e.target.closest('a');
  if (clickedLink && clickedLink.getAttribute('href') && clickedLink.getAttribute('href') !== '#') {
    return;
  }

  // 3. If clicking anywhere on the product card container, navigate directly to the product
  const card = e.target.closest('.na-sq, .dd-sq, [data-product-card], .deedap-card, .card-wrapper');
  if (card) {
    const link = card.querySelector('a[href]:not([href="#"]):not([href=""])') || card.querySelector('a');
    if (link && link.href && !link.href.endsWith('#')) {
      window.location.href = link.href;
    }
  }
});
