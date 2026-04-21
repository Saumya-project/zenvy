/* ============================
   DRIP STORE - Cart Logic
   ============================ */

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('cartContainer')) {
    loadCart();
  }
});

async function loadCart() {
  const container = document.getElementById('cartContainer');
  const summaryContainer = document.getElementById('cartSummary');
  if (!container) return;

  container.innerHTML = '<div class="text-center py-5"><div class="spinner-drip"></div></div>';

  try {
    let items = [];

    if (isLoggedIn()) {
      const res = await apiGet('/cart');
      items = res.data.items || [];
      // Save count
      localStorage.setItem('drip_cart_count', items.reduce((s, i) => s + i.qty, 0));
      updateCartBadge();
    } else {
      // Local cart - need to fetch product details
      const localItems = getLocalCart();
      if (localItems.length === 0) {
        renderEmptyCart(container, summaryContainer);
        return;
      }
      // For local cart, we store { productId, size, qty, name, price, image }
      items = localItems.map((item) => ({
        _id: item.productId + '_' + item.size,
        product: {
          _id: item.productId,
          name: item.name,
          price: item.price,
          discountPrice: item.discountPrice,
          images: [{ url: item.image }],
        },
        size: item.size,
        qty: item.qty,
      }));
    }

    if (items.length === 0) {
      renderEmptyCart(container, summaryContainer);
      return;
    }

    renderCartItems(container, items);
    renderCartSummary(summaryContainer, items);
  } catch (err) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">😰</div>
        <h4>Failed to load cart</h4>
        <p>${err.message}</p>
        <button class="btn btn-drip mt-3" onclick="loadCart()">Try Again</button>
      </div>
    `;
  }
}

function renderEmptyCart(container, summaryContainer) {
  container.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">🛒</div>
      <h4>Your cart is empty</h4>
      <p>Looks like you haven't added anything yet. Start shopping!</p>
      <a href="/pages/shop.html" class="btn btn-drip mt-3">Start Shopping</a>
    </div>
  `;
  if (summaryContainer) summaryContainer.innerHTML = '';
}

function renderCartItems(container, items) {
  container.innerHTML = items.map((item) => {
    const product = item.product;
    const img = product?.images?.[0]?.url || 'https://via.placeholder.com/80';
    const price = product?.discountPrice || product?.price || 0;

    return `
      <div class="cart-item" data-id="${item._id}">
        <img src="${img}" alt="${product?.name}" class="cart-item-img">
        <div class="cart-item-info">
          <div class="cart-item-name">${product?.name || 'Product'}</div>
          <div class="cart-item-size">Size: ${item.size}</div>
          <div class="text-purple fw-bold mt-1">${formatPrice(price)}</div>
        </div>
        <div class="qty-control">
          <button onclick="updateQty('${item._id}', ${item.qty - 1}, '${isLoggedIn() ? 'server' : 'local'}')">−</button>
          <span class="qty-value">${item.qty}</span>
          <button onclick="updateQty('${item._id}', ${item.qty + 1}, '${isLoggedIn() ? 'server' : 'local'}')">+</button>
        </div>
        <div class="fw-bold ms-3" style="min-width: 80px; text-align: right;">
          ${formatPrice(price * item.qty)}
        </div>
        <button class="btn btn-sm text-danger ms-2" onclick="removeItem('${item._id}', '${isLoggedIn() ? 'server' : 'local'}')">
          <i class="bi bi-trash3"></i>
        </button>
      </div>
    `;
  }).join('');
}

function renderCartSummary(container, items) {
  if (!container) return;

  let subtotal = 0;
  items.forEach((item) => {
    const price = item.product?.discountPrice || item.product?.price || 0;
    subtotal += price * item.qty;
  });

  const delivery = subtotal > 999 ? 0 : 99;
  const total = subtotal + delivery;

  container.innerHTML = `
    <div class="order-summary">
      <h5>Order Summary</h5>
      <div class="summary-row">
        <span>Subtotal (${items.length} items)</span>
        <span>${formatPrice(subtotal)}</span>
      </div>
      <div class="summary-row">
        <span>Delivery</span>
        <span>${delivery === 0 ? '<span class="text-success">FREE</span>' : formatPrice(delivery)}</span>
      </div>
      ${delivery > 0 ? '<small class="text-muted d-block mb-2">Free delivery on orders above ₹999</small>' : ''}
      <div class="summary-row summary-total">
        <span>Total</span>
        <span class="text-gradient">${formatPrice(total)}</span>
      </div>
      <a href="/pages/checkout.html" class="btn btn-drip w-100 mt-3">
        Proceed to Checkout <i class="bi bi-arrow-right"></i>
      </a>
      <a href="/pages/shop.html" class="btn btn-drip-outline w-100 mt-2 btn-drip-sm">
        Continue Shopping
      </a>
    </div>
  `;
}

async function updateQty(itemId, newQty, mode) {
  if (newQty < 1) {
    removeItem(itemId, mode);
    return;
  }

  try {
    if (mode === 'server') {
      await apiPut(`/cart/${itemId}`, { qty: newQty });
    } else {
      const cart = getLocalCart();
      const idx = cart.findIndex((i) => (i.productId + '_' + i.size) === itemId);
      if (idx > -1) {
        cart[idx].qty = newQty;
        saveLocalCart(cart);
      }
    }
    loadCart();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function removeItem(itemId, mode) {
  try {
    if (mode === 'server') {
      await apiDelete(`/cart/${itemId}`);
    } else {
      const cart = getLocalCart();
      const filtered = cart.filter((i) => (i.productId + '_' + i.size) !== itemId);
      saveLocalCart(filtered);
    }
    showToast('Item removed from cart');
    loadCart();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

/* ── Add to Cart (called from product page) ── */
async function addToCartHandler(productId, size, qty = 1, productData = {}) {
  if (!size) {
    showToast('Please select a size', 'error');
    return;
  }

  try {
    if (isLoggedIn()) {
      await apiPost('/cart', { productId, size, qty });
      // Update badge count
      const res = await apiGet('/cart');
      const count = res.data.items.reduce((s, i) => s + i.qty, 0);
      localStorage.setItem('drip_cart_count', count);
      updateCartBadge();
    } else {
      const cart = getLocalCart();
      const existing = cart.findIndex((i) => i.productId === productId && i.size === size);
      if (existing > -1) {
        cart[existing].qty += qty;
      } else {
        cart.push({
          productId,
          size,
          qty,
          name: productData.name || 'Product',
          price: productData.price || 0,
          discountPrice: productData.discountPrice || null,
          image: productData.image || '',
        });
      }
      saveLocalCart(cart);
    }
    showToast('Added to cart! 🛒');
  } catch (err) {
    showToast(err.message, 'error');
  }
}
