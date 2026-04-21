/* ============================
   DRIP STORE - Checkout Logic
   (Demo Payment Mode)
   ============================ */

let checkoutItems = [];
let checkoutTotal = 0;

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('checkoutForm')) return;

  if (!isLoggedIn()) {
    showToast('Please login to checkout', 'error');
    setTimeout(() => (window.location.href = '/pages/login.html'), 1000);
    return;
  }

  loadCheckoutData();
  loadSavedAddresses();

  document.getElementById('checkoutForm').addEventListener('submit', handleCheckout);
});

async function loadCheckoutData() {
  const summaryEl = document.getElementById('checkoutSummary');
  if (!summaryEl) return;

  try {
    const res = await apiGet('/cart');
    checkoutItems = res.data.items || [];

    if (checkoutItems.length === 0) {
      showToast('Your cart is empty', 'error');
      setTimeout(() => (window.location.href = '/pages/shop.html'), 1000);
      return;
    }

    let subtotal = 0;
    let itemsHtml = '';

    checkoutItems.forEach((item) => {
      const price = item.product?.discountPrice || item.product?.price || 0;
      subtotal += price * item.qty;
      itemsHtml += `
        <div class="d-flex justify-content-between align-items-center mb-2">
          <div>
            <span class="fw-bold">${item.product?.name || 'Product'}</span>
            <small class="text-muted d-block">Size: ${item.size} × ${item.qty}</small>
          </div>
          <span>${formatPrice(price * item.qty)}</span>
        </div>
      `;
    });

    const delivery = subtotal > 999 ? 0 : 99;
    checkoutTotal = subtotal + delivery;

    summaryEl.innerHTML = `
      <div class="order-summary">
        <h5>Order Summary</h5>
        ${itemsHtml}
        <hr class="border-secondary">
        <div class="summary-row">
          <span>Subtotal</span>
          <span>${formatPrice(subtotal)}</span>
        </div>
        <div class="summary-row">
          <span>Delivery</span>
          <span>${delivery === 0 ? '<span class="text-success">FREE</span>' : formatPrice(delivery)}</span>
        </div>
        <div class="summary-row summary-total">
          <span>Total</span>
          <span class="text-gradient">${formatPrice(checkoutTotal)}</span>
        </div>
        <div class="mt-3 p-2 text-center" style="background:rgba(16,185,129,0.1); border-radius:var(--radius-sm);">
          <small class="text-success"><i class="bi bi-shield-check me-1"></i>Demo Payment — No real charges</small>
        </div>
      </div>
    `;
  } catch (err) {
    summaryEl.innerHTML = `<p class="text-danger">Failed to load cart: ${err.message}</p>`;
  }
}

async function loadSavedAddresses() {
  const container = document.getElementById('savedAddresses');
  if (!container) return;

  try {
    const res = await apiGet('/auth/me');
    const addresses = res.data.addresses || [];

    if (addresses.length === 0) {
      container.innerHTML = '<p class="text-muted">No saved addresses</p>';
      return;
    }

    container.innerHTML = addresses.map((addr, i) => `
      <div class="address-card" style="cursor: pointer;" onclick="fillAddress(this)" 
        data-street="${addr.street}" data-city="${addr.city}" 
        data-state="${addr.state}" data-pincode="${addr.pincode}">
        <div class="address-label">${addr.label || 'Address ' + (i + 1)}</div>
        <div>${addr.street}, ${addr.city}, ${addr.state} - ${addr.pincode}</div>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = '';
  }
}

function fillAddress(el) {
  document.getElementById('street').value = el.dataset.street;
  document.getElementById('city').value = el.dataset.city;
  document.getElementById('state').value = el.dataset.state;
  document.getElementById('pincode').value = el.dataset.pincode;

  // Highlight selected
  document.querySelectorAll('.address-card').forEach((c) => c.classList.remove('neon-border'));
  el.classList.add('neon-border');
}

async function handleCheckout(e) {
  e.preventDefault();

  const street = document.getElementById('street').value.trim();
  const city = document.getElementById('city').value.trim();
  const state = document.getElementById('state').value.trim();
  const pincode = document.getElementById('pincode').value.trim();

  if (!street || !city || !state || !pincode) {
    showToast('Please fill in complete address', 'error');
    return;
  }

  const btn = document.getElementById('payBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Processing payment...';

  try {
    // Prepare order items
    const items = checkoutItems.map((item) => ({
      product: item.product._id,
      name: item.product.name,
      image: item.product.images?.[0]?.url || '',
      size: item.size,
      qty: item.qty,
      price: item.product.discountPrice || item.product.price,
    }));

    // Step 1: Create the order
    const orderRes = await apiPost('/orders', {
      items,
      shippingAddress: { street, city, state, pincode },
      totalAmount: checkoutTotal,
    });

    const { paymentId } = orderRes.data;

    // Step 2: Simulate a short payment processing delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Step 3: Confirm demo payment
    await apiPost('/orders/verify-payment', { paymentId });

    // Show success
    showToast('Payment successful! Order confirmed 🎉');
    setTimeout(() => (window.location.href = '/pages/profile.html'), 1500);
  } catch (err) {
    showToast(err.message, 'error');
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-bag-check-fill me-2"></i>Place Order';
  }
}
