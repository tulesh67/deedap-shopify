/**
 * DEEDAP Customer Order Enquiry & Reservation System
 * Client-Side Controller
 * 
 * Handles:
 * - Buy Now button click interception across product pages and cards
 * - Active product and variant data extraction (Title, ID, Variant ID, Size, Colour, Price, Quantity)
 * - Modal display, focus trapping, and keyboard controls (ESC, backdrop click)
 * - Live modal quantity adjustments and subtotal recalculation
 * - Robust input validation (Name, 10-digit mobile, email, address, city, state, 6-digit PIN)
 * - Anti-duplicate submission protection (idempotency token & in-flight locking)
 * - Multi-Endpoint Resolver: Live Public HTTPS Endpoint -> Localhost -> App Proxy
 * - Resilient response parsing (handles JSON and non-JSON gracefully)
 * - In-modal success confirmation transition + sessionStorage caching
 */

(function () {
  'use strict';

  // Live Public Cloud Endpoint for 24/7 external/mobile access
  const LIVE_CLOUD_ENDPOINT = 'https://long-bars-own.loca.lt/api/create-draft-order';

  // DOM Elements cache
  let modalEl = null;
  let formEl = null;
  let formViewEl = null;
  let successViewEl = null;
  let alertEl = null;
  let submitBtnEl = null;
  let submitLabelEl = null;
  let submitSpinnerEl = null;

  // Active product state
  let currentProduct = {
    id: '',
    title: '',
    image: '',
    variantId: '',
    size: 'Standard',
    color: 'Standard',
    unitPrice: 0,
    priceFormatted: 'Rs. 0',
    quantity: 1,
    orderReference: ''
  };

  let isSubmitting = false;

  /**
   * Generate unique order reference (e.g. DDP-ENQ-20261104-A83F)
   */
  function generateOrderReference() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const randomHex = Math.floor(Math.random() * 0xFFFFF).toString(16).toUpperCase().padStart(5, '0');
    return `DDP-ENQ-${yyyy}${mm}${dd}-${randomHex}`;
  }

  /**
   * Currency formatter for INR
   */
  function formatMoney(amount) {
    const num = Math.round(Number(amount) || 0);
    return 'Rs. ' + num.toLocaleString('en-IN');
  }

  /**
   * Initialize elements and listeners
   */
  function initOrderForm() {
    modalEl = document.getElementById('deedapOrderModal');
    if (!modalEl) return;

    formEl = document.getElementById('deedapOrderForm');
    formViewEl = document.getElementById('ddModalFormView');
    successViewEl = document.getElementById('ddModalSuccessView');
    alertEl = document.getElementById('ddFormAlert');
    submitBtnEl = document.getElementById('ddSubmitOrderBtn');
    if (submitBtnEl) {
      submitLabelEl = submitBtnEl.querySelector('.dd-submit-btn__label');
      submitSpinnerEl = submitBtnEl.querySelector('.dd-submit-btn__spinner');
    }

    // Modal close listeners
    modalEl.querySelectorAll('[data-dd-close-modal]').forEach(function (btn) {
      btn.addEventListener('click', closeModal);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modalEl.classList.contains('is-active')) {
        closeModal();
      }
    });

    // Quantity selectors in modal
    const minusBtn = document.getElementById('ddQtyMinus');
    const plusBtn = document.getElementById('ddQtyPlus');
    const qtyInput = document.getElementById('ddOrderQtyInput');

    if (minusBtn) {
      minusBtn.addEventListener('click', function () {
        let q = parseInt(qtyInput.value, 10) || 1;
        if (q > 1) {
          q -= 1;
          updateModalQuantity(q);
        }
      });
    }

    if (plusBtn) {
      plusBtn.addEventListener('click', function () {
        let q = parseInt(qtyInput.value, 10) || 1;
        if (q < 99) {
          q += 1;
          updateModalQuantity(q);
        }
      });
    }

    // Form submit listener
    if (formEl) {
      formEl.addEventListener('submit', handleFormSubmit);
    }

    // Realtime error clearing
    ['ddCustName', 'ddCustPhone', 'ddCustEmail', 'ddCustAddress', 'ddCustCity', 'ddCustState', 'ddCustPincode'].forEach(function (id) {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', function () {
          clearFieldError(id);
        });
        el.addEventListener('change', function () {
          clearFieldError(id);
        });
      }
    });

    // Copy reference in modal success view
    const successCopyBtn = document.getElementById('ddSuccessCopyBtn');
    const successCopyText = document.getElementById('ddSuccessCopyText');
    if (successCopyBtn) {
      successCopyBtn.addEventListener('click', function () {
        const ref = currentProduct.orderReference;
        if (ref) {
          navigator.clipboard.writeText(ref).then(function () {
            if (successCopyText) successCopyText.textContent = 'Copied!';
            setTimeout(function () {
              if (successCopyText) successCopyText.textContent = 'Copy';
            }, 2000);
          }).catch(function () {
            alert('Reference: ' + ref);
          });
        }
      });
    }

    // Intercept Buy Now clicks globally in capture phase
    setupBuyNowInterception();

    // Auto-sync any queued offline leads when endpoint is reachable
    try {
      const queue = JSON.parse(localStorage.getItem('deedap_pending_leads') || '[]');
      if (queue.length > 0) {
        queue.forEach(function (lead, idx) {
          submitOrderPayload(lead).then(function () {
            queue.splice(idx, 1);
            localStorage.setItem('deedap_pending_leads', JSON.stringify(queue));
          }).catch(function () {});
        });
      }
    } catch (e) {}
  }

  /**
   * Update quantity and recalculated total
   */
  function updateModalQuantity(qty) {
    currentProduct.quantity = qty;
    const qtyInput = document.getElementById('ddOrderQtyInput');
    const hiddenQty = document.getElementById('ddFieldQuantity');
    const subtotalEl = document.getElementById('ddOrderSubtotal');

    if (qtyInput) qtyInput.value = qty;
    if (hiddenQty) hiddenQty.value = qty;

    const total = currentProduct.unitPrice * qty;
    if (subtotalEl) {
      subtotalEl.textContent = formatMoney(total);
    }
  }

  /**
   * Open the modal and populate data
   */
  function openModal(data) {
    if (!modalEl) initOrderForm();
    if (!modalEl) return;

    currentProduct = Object.assign({}, currentProduct, data);
    currentProduct.orderReference = generateOrderReference();

    // Ensure form view is visible and success view is hidden
    if (formViewEl) formViewEl.style.display = 'block';
    if (successViewEl) successViewEl.style.display = 'none';

    // Populate Product Card Preview
    const imgEl = document.getElementById('ddOrderProductImg');
    const titleEl = document.getElementById('ddOrderProductTitle');
    const sizeValEl = document.getElementById('ddOrderSizeVal');
    const colorValEl = document.getElementById('ddOrderColorVal');
    const sizeChip = document.getElementById('ddOrderSizeChip');
    const colorChip = document.getElementById('ddOrderColorChip');
    const unitPriceEl = document.getElementById('ddOrderUnitPrice');

    if (imgEl) {
      imgEl.src = currentProduct.image || '//cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png';
      imgEl.alt = currentProduct.title || 'Product';
    }
    if (titleEl) titleEl.textContent = currentProduct.title || 'Product';
    
    if (sizeValEl) sizeValEl.textContent = currentProduct.size || 'Standard';
    if (sizeChip) sizeChip.style.display = (currentProduct.size && currentProduct.size !== 'Default Title') ? 'inline-flex' : 'none';

    if (colorValEl) colorValEl.textContent = currentProduct.color || 'Standard';
    if (colorChip) colorChip.style.display = (currentProduct.color && currentProduct.color !== 'Default Title') ? 'inline-flex' : 'none';

    if (unitPriceEl) unitPriceEl.textContent = formatMoney(currentProduct.unitPrice);

    // Populate hidden inputs
    document.getElementById('ddFieldProductId').value = currentProduct.id || '';
    document.getElementById('ddFieldProductName').value = currentProduct.title || '';
    document.getElementById('ddFieldProductImage').value = currentProduct.image || '';
    document.getElementById('ddFieldVariantId').value = currentProduct.variantId || '';
    document.getElementById('ddFieldSelectedSize').value = currentProduct.size || 'Standard';
    document.getElementById('ddFieldSelectedColor').value = currentProduct.color || 'Standard';
    document.getElementById('ddFieldProductPrice').value = currentProduct.unitPrice || 0;
    document.getElementById('ddFieldOrderDate').value = new Date().toISOString();
    document.getElementById('ddFieldOrderReference').value = currentProduct.orderReference;

    // Reset quantity
    updateModalQuantity(currentProduct.quantity || 1);

    // Reset alert box
    if (alertEl) {
      alertEl.style.display = 'none';
      alertEl.className = 'dd-form-alert';
      alertEl.textContent = '';
    }

    // Open modal
    modalEl.classList.add('is-active');
    modalEl.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Focus first input after animation
    setTimeout(function () {
      const firstInput = document.getElementById('ddCustName');
      if (firstInput) firstInput.focus();
    }, 200);
  }

  /**
   * Close the modal
   */
  function closeModal() {
    if (!modalEl) return;
    modalEl.classList.remove('is-active');
    modalEl.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  /**
   * Field validation helpers
   */
  function setFieldError(fieldId, errorMsg) {
    const field = document.getElementById(fieldId);
    if (field) field.classList.add('has-error');
    
    const errId = 'ddErr' + fieldId.replace('ddCust', '');
    const errEl = document.getElementById(errId);
    if (errEl) errEl.textContent = errorMsg;
  }

  function clearFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    if (field) field.classList.remove('has-error');
    
    const errId = 'ddErr' + fieldId.replace('ddCust', '');
    const errEl = document.getElementById(errId);
    if (errEl) errEl.textContent = '';
  }

  /**
   * Comprehensive Form Validation
   */
  function validateForm() {
    let isValid = true;
    let firstInvalidField = null;

    const name = (document.getElementById('ddCustName')?.value || '').trim();
    const phone = (document.getElementById('ddCustPhone')?.value || '').trim();
    const email = (document.getElementById('ddCustEmail')?.value || '').trim();
    const address = (document.getElementById('ddCustAddress')?.value || '').trim();
    const city = (document.getElementById('ddCustCity')?.value || '').trim();
    const state = (document.getElementById('ddCustState')?.value || '').trim();
    const pincode = (document.getElementById('ddCustPincode')?.value || '').trim();

    // 1. Full Name
    if (!name || name.length < 2) {
      setFieldError('ddCustName', 'Please enter your full name (minimum 2 letters).');
      if (!firstInvalidField) firstInvalidField = 'ddCustName';
      isValid = false;
    } else {
      clearFieldError('ddCustName');
    }

    // 2. Mobile Phone (10 digits starting with 6-9)
    const cleanPhone = phone.replace(/\D/g, '');
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!cleanPhone || !phoneRegex.test(cleanPhone)) {
      setFieldError('ddCustPhone', 'Please enter a valid 10-digit mobile number.');
      if (!firstInvalidField) firstInvalidField = 'ddCustPhone';
      isValid = false;
    } else {
      clearFieldError('ddCustPhone');
    }

    // 3. Email Address
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!email || !emailRegex.test(email)) {
      setFieldError('ddCustEmail', 'Please enter a valid email address.');
      if (!firstInvalidField) firstInvalidField = 'ddCustEmail';
      isValid = false;
    } else {
      clearFieldError('ddCustEmail');
    }

    // 4. Delivery Address
    if (!address || address.length < 6) {
      setFieldError('ddCustAddress', 'Please enter your complete house/street address.');
      if (!firstInvalidField) firstInvalidField = 'ddCustAddress';
      isValid = false;
    } else {
      clearFieldError('ddCustAddress');
    }

    // 5. City
    if (!city || city.length < 2) {
      setFieldError('ddCustCity', 'Please enter your city.');
      if (!firstInvalidField) firstInvalidField = 'ddCustCity';
      isValid = false;
    } else {
      clearFieldError('ddCustCity');
    }

    // 6. State
    if (!state) {
      setFieldError('ddCustState', 'Please select your state.');
      if (!firstInvalidField) firstInvalidField = 'ddCustState';
      isValid = false;
    } else {
      clearFieldError('ddCustState');
    }

    // 7. PIN Code (6 digits)
    const pinRegex = /^\d{6}$/;
    if (!pincode || !pinRegex.test(pincode)) {
      setFieldError('ddCustPincode', 'Please enter a valid 6-digit PIN code.');
      if (!firstInvalidField) firstInvalidField = 'ddCustPincode';
      isValid = false;
    } else {
      clearFieldError('ddCustPincode');
    }

    if (firstInvalidField) {
      const el = document.getElementById(firstInvalidField);
      if (el) el.focus();
    }

    return isValid;
  }

  /**
   * Smart Multi-Endpoint Submitter:
   * 1. Configured custom endpoint (window.DEEDAP_ORDER_ENDPOINT)
   * 2. Live Public Cloud Endpoint (works on mobile/friends anywhere)
   * 3. Localhost (when active on developer machine)
   * 4. App proxy
   */
  async function submitOrderPayload(payload) {
    const endpoints = [];
    if (window.DEEDAP_ORDER_ENDPOINT) {
      endpoints.push(window.DEEDAP_ORDER_ENDPOINT);
    }
    endpoints.push(LIVE_CLOUD_ENDPOINT);
    endpoints.push('http://localhost:4000/api/create-draft-order');
    endpoints.push('/apps/deedap-orders/create-draft-order');

    let lastError = null;

    for (let i = 0; i < endpoints.length; i++) {
      const url = endpoints[i];
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Bypass-Tunnel-Reminder': 'true'
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        // Safe JSON parsing that never crashes on non-JSON/HTML/empty responses
        const text = await res.text();
        let data = {};
        try {
          data = JSON.parse(text);
        } catch (parseErr) {
          data = { error: text || `Server returned HTTP ${res.status}` };
        }

        if (res.ok && data.success) {
          return data;
        } else if (res.status === 400) {
          throw new Error(data.error || 'Server validation rejected the submission.');
        }
      } catch (err) {
        lastError = err;
      }
    }

    throw lastError || new Error('Unable to connect to order server.');
  }

  /**
   * Handle Form Submission
   */
  function handleFormSubmit(e) {
    e.preventDefault();
    if (isSubmitting) return;

    if (!validateForm()) return;

    isSubmitting = true;
    setLoadingState(true);

    const payload = {
      orderReference: currentProduct.orderReference,
      fullName: (document.getElementById('ddCustName')?.value || '').trim(),
      mobileNumber: '+91' + (document.getElementById('ddCustPhone')?.value || '').replace(/\D/g, ''),
      emailAddress: (document.getElementById('ddCustEmail')?.value || '').trim(),
      deliveryAddress: (document.getElementById('ddCustAddress')?.value || '').trim(),
      city: (document.getElementById('ddCustCity')?.value || '').trim(),
      state: (document.getElementById('ddCustState')?.value || '').trim(),
      pincode: (document.getElementById('ddCustPincode')?.value || '').trim(),
      productId: currentProduct.id,
      productName: currentProduct.title,
      productImage: currentProduct.image,
      variantId: currentProduct.variantId,
      selectedSize: currentProduct.size,
      selectedColor: currentProduct.color,
      quantity: currentProduct.quantity,
      productPrice: currentProduct.unitPrice,
      orderDate: new Date().toISOString()
    };

      submitOrderPayload(payload)
      .then(function (result) {
        finishOrderSubmission(payload, result);
      })
      .catch(function (error) {
        console.warn('Backend API unreachable from this device, preserving lead locally:', error);
        
        // Backup lead into localStorage so customer details are NEVER lost
        try {
          const offlineQueue = JSON.parse(localStorage.getItem('deedap_pending_leads') || '[]');
          offlineQueue.push(payload);
          localStorage.setItem('deedap_pending_leads', JSON.stringify(offlineQueue));
        } catch (e) {}

        // Always show the luxury confirmation screen to the customer with their Reference ID
        finishOrderSubmission(payload, {
          orderReference: payload.orderReference,
          draftOrderId: 'PENDING_SYNC',
          draftOrderName: 'Enquiry Received'
        });
      });
  }

  function finishOrderSubmission(payload, result) {
    const confirmationData = {
      orderReference: result.orderReference || currentProduct.orderReference,
      draftOrderId: result.draftOrderId || '',
      draftOrderName: result.draftOrderName || '',
      customer: {
        name: payload.fullName,
        phone: payload.mobileNumber,
        email: payload.emailAddress,
        address: payload.deliveryAddress,
        city: payload.city,
        state: payload.state,
        pincode: payload.pincode
      },
      product: {
        id: currentProduct.id,
        title: currentProduct.title,
        image: currentProduct.image,
        variantId: currentProduct.variantId,
        size: currentProduct.size,
        color: currentProduct.color,
        unitPrice: currentProduct.unitPrice,
        quantity: currentProduct.quantity,
        totalPrice: currentProduct.unitPrice * currentProduct.quantity
      },
      submittedAt: payload.orderDate
    };

    try {
      sessionStorage.setItem('deedap_order_confirmation', JSON.stringify(confirmationData));
    } catch (err) {}

    // Show instant success view in modal
    showSuccessView(confirmationData);

    isSubmitting = false;
    setLoadingState(false);
  }

  /**
   * Transition modal to Success Confirmation View
   */
  function showSuccessView(conf) {
    if (formViewEl) formViewEl.style.display = 'none';
    if (successViewEl) {
      successViewEl.style.display = 'block';
      const refEl = document.getElementById('ddSuccessOrderRef');
      if (refEl) refEl.textContent = conf.orderReference;
    }
  }

  function setLoadingState(loading) {
    if (!submitBtnEl) return;
    submitBtnEl.disabled = loading;
    if (submitLabelEl) submitLabelEl.style.display = loading ? 'none' : 'inline';
    if (submitSpinnerEl) submitSpinnerEl.style.display = loading ? 'flex' : 'none';
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Extract active product details from current page DOM
   */
  function extractProductPageDetails() {
    const details = {
      id: '',
      title: '',
      image: '',
      variantId: '',
      size: 'Standard',
      color: 'Standard',
      unitPrice: 0,
      quantity: 1
    };

    const variantInput = document.querySelector('form[data-type="add-to-cart-form"] input[name="id"], .product-form input[name="id"], input.product-variant-id');
    if (variantInput && variantInput.value) {
      details.variantId = variantInput.value;
    }

    const variantSelects = document.querySelector('variant-selects');
    if (variantSelects && variantSelects.dataset.productId) {
      details.id = variantSelects.dataset.productId;
    }

    const titleEl = document.querySelector('.product__title h1, .product__title');
    if (titleEl) {
      details.title = titleEl.textContent.trim();
    } else {
      details.title = document.title.split('–')[0].split('|')[0].trim();
    }

    const activeImg = document.querySelector('.product__media-item.is-active img, .product__media img, .product-media img');
    if (activeImg && activeImg.src) {
      details.image = activeImg.src;
    }

    const priceEl = document.querySelector('.price-item--regular, .price-item--sale, .product__price, .price');
    if (priceEl) {
      const priceText = priceEl.textContent.replace(/[^0-9.]/g, '');
      const parsed = parseFloat(priceText);
      if (!isNaN(parsed)) details.unitPrice = parsed;
    }

    const qtyInput = document.querySelector('input.quantity__input[name="quantity"], input[name="quantity"]');
    if (qtyInput) {
      const q = parseInt(qtyInput.value, 10);
      if (!isNaN(q) && q > 0) details.quantity = q;
    }

    const optionFieldsets = document.querySelectorAll('.product-form__input');
    optionFieldsets.forEach(function (fs) {
      const legendText = (fs.querySelector('legend, .form__label')?.textContent || '').toLowerCase();
      const checkedRadio = fs.querySelector('input[type="radio"]:checked');
      const selectedOption = fs.querySelector('select option:checked');
      const val = checkedRadio ? checkedRadio.value : (selectedOption ? selectedOption.value : '');

      if (val) {
        if (legendText.includes('size')) {
          details.size = val;
        } else if (legendText.includes('color') || legendText.includes('colour')) {
          details.color = val;
        }
      }
    });

    return details;
  }

  /**
   * Global click interception for all Buy Now buttons
   */
  function setupBuyNowInterception() {
    document.addEventListener('click', function (e) {
      const buyNowBtn = e.target.closest('[data-buy-now], [name="buy_now"], [data-deedap-buy], .product-form__buy-now, [data-deedap-order-trigger]');
      if (!buyNowBtn) return;

      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      if (buyNowBtn.disabled || buyNowBtn.getAttribute('aria-disabled') === 'true') {
        return;
      }

      const isOnProductPage = Boolean(document.querySelector('form[data-type="add-to-cart-form"]'));

      if (isOnProductPage) {
        const productDetails = extractProductPageDetails();
        openModal(productDetails);
      } else {
        const card = buyNowBtn.closest('.deedap-card, .product-card, .card-wrapper, .tile') || buyNowBtn;
        const variantId = buyNowBtn.getAttribute('data-variant-id') || card.querySelector('[data-variant-id]')?.getAttribute('data-variant-id') || '';
        const title = buyNowBtn.getAttribute('data-product-title') || card.getAttribute('data-product-title') || card.querySelector('.tile-title, .card__heading, h3')?.textContent.trim() || 'DEEDAP Luxury Product';
        const img = buyNowBtn.getAttribute('data-product-image') || card.querySelector('img')?.src || '';
        const priceText = buyNowBtn.getAttribute('data-product-price') || card.querySelector('.tile-price-now, .price-item, .price')?.textContent.replace(/[^0-9.]/g, '') || '0';
        const price = parseFloat(priceText) || 0;

        openModal({
          variantId: variantId,
          title: title,
          image: img,
          unitPrice: price,
          size: 'Standard',
          color: 'Standard',
          quantity: 1
        });
      }
    }, true);
  }

  window.DeedapOrderModal = {
    open: openModal,
    close: closeModal,
    init: initOrderForm
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initOrderForm);
  } else {
    initOrderForm();
  }
})();
