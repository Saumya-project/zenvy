/* ============================
   DRIP STORE - API Wrapper
   ============================ */

const BASE = '/api/v1';

/**
 * Core fetch wrapper that auto-attaches JWT token
 */
async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('drip_token');

  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  // Don't set Content-Type for FormData (browser will set multipart boundary)
  if (options.body instanceof FormData) {
    delete defaultHeaders['Content-Type'];
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`${BASE}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }

    return data;
  } catch (error) {
    if (error.message === 'Failed to fetch') {
      throw new Error('Network error. Please check your connection.');
    }
    throw error;
  }
}

/**
 * GET request
 */
async function apiGet(endpoint) {
  return apiFetch(endpoint, { method: 'GET' });
}

/**
 * POST request with JSON body
 */
async function apiPost(endpoint, body) {
  const options = { method: 'POST' };
  if (body instanceof FormData) {
    options.body = body;
  } else {
    options.body = JSON.stringify(body);
  }
  return apiFetch(endpoint, options);
}

/**
 * PUT request with JSON body
 */
async function apiPut(endpoint, body) {
  const options = { method: 'PUT' };
  if (body instanceof FormData) {
    options.body = body;
  } else {
    options.body = JSON.stringify(body);
  }
  return apiFetch(endpoint, options);
}

/**
 * DELETE request
 */
async function apiDelete(endpoint) {
  return apiFetch(endpoint, { method: 'DELETE' });
}

/* ── Auth Helper Functions ── */
function getUser() {
  const user = localStorage.getItem('drip_user');
  return user ? JSON.parse(user) : null;
}

function getToken() {
  return localStorage.getItem('drip_token');
}

function isLoggedIn() {
  return !!getToken();
}

function isAdmin() {
  const user = getUser();
  return user && user.role === 'admin';
}

function saveAuth(data) {
  localStorage.setItem('drip_token', data.token);
  localStorage.setItem('drip_user', JSON.stringify({
    _id: data._id,
    name: data.name,
    email: data.email,
    role: data.role,
  }));
}

function clearAuth() {
  localStorage.removeItem('drip_token');
  localStorage.removeItem('drip_user');
}

/* ── Toast Notification ── */
function showToast(message, type = 'success') {
  // Remove existing toasts
  document.querySelectorAll('.toast-drip').forEach(el => el.remove());

  const toast = document.createElement('div');
  toast.className = 'toast-drip';
  toast.innerHTML = `
    <div class="alert-drip ${type}">
      <div class="d-flex align-items-center gap-2">
        <i class="bi ${type === 'success' ? 'bi-check-circle-fill text-success' : 'bi-exclamation-circle-fill text-danger'}"></i>
        <span>${message}</span>
      </div>
    </div>
  `;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/* ── Navbar Rendering ── */
function renderNavbar() {
  const user = getUser();
  const cartCount = getLocalCartCount();

  const adminLinks = user && user.role === 'admin' ? `
    <li class="nav-item dropdown">
      <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
        <i class="bi bi-shield-lock"></i> Admin
      </a>
      <ul class="dropdown-menu dropdown-menu-dark">
        <li><a class="dropdown-item" href="/pages/admin/dashboard.html">Dashboard</a></li>
        <li><a class="dropdown-item" href="/pages/admin/products.html">Products</a></li>
        <li><a class="dropdown-item" href="/pages/admin/orders.html">Orders</a></li>
      </ul>
    </li>
  ` : '';

  const authLinks = user ? `
    <li class="nav-item">
      <a class="nav-link" href="/pages/profile.html">
        <i class="bi bi-person-circle"></i> ${user.name.split(' ')[0]}
      </a>
    </li>
    <li class="nav-item">
      <a class="nav-link" href="#" id="logoutBtn">
        <i class="bi bi-box-arrow-right"></i> Logout
      </a>
    </li>
  ` : `
    <li class="nav-item">
      <a class="nav-link" href="/pages/login.html">
        <i class="bi bi-box-arrow-in-right"></i> Login
      </a>
    </li>
  `;

  const nav = document.getElementById('mainNavbar');
  if (nav) {
    nav.innerHTML = `
      <div class="container">
        <a class="navbar-brand" href="/pages/index.html">🔥 DRIP STORE</a>
        <button class="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navContent">
          <i class="bi bi-list text-white fs-4"></i>
        </button>
        <div class="collapse navbar-collapse" id="navContent">
          <ul class="navbar-nav mx-auto">
            <li class="nav-item">
              <a class="nav-link" href="/pages/index.html">Home</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="/pages/shop.html">Shop</a>
            </li>
            ${adminLinks}
          </ul>
          <ul class="navbar-nav">
            <li class="nav-item">
              <a class="nav-link" href="/pages/cart.html">
                <span class="cart-icon-wrapper">
                  <i class="bi bi-bag-fill"></i>
                  <span class="cart-badge" id="cartBadge" style="display:${cartCount > 0 ? 'flex' : 'none'}">${cartCount}</span>
                </span>
              </a>
            </li>
            ${authLinks}
          </ul>
        </div>
      </div>
    `;

    // Attach logout handler
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        clearAuth();
        localStorage.removeItem('drip_cart');
        showToast('Logged out successfully');
        setTimeout(() => window.location.href = '/pages/index.html', 500);
      });
    }
  }
}

/* ── Local Cart (for non-logged-in users) ── */
function getLocalCart() {
  const cart = localStorage.getItem('drip_cart');
  return cart ? JSON.parse(cart) : [];
}

function saveLocalCart(items) {
  localStorage.setItem('drip_cart', JSON.stringify(items));
  updateCartBadge();
}

function getLocalCartCount() {
  if (isLoggedIn()) {
    const count = localStorage.getItem('drip_cart_count');
    return count ? parseInt(count) : 0;
  }
  const cart = getLocalCart();
  return cart.reduce((sum, item) => sum + item.qty, 0);
}

function updateCartBadge() {
  const badge = document.getElementById('cartBadge');
  const count = getLocalCartCount();
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }
}

/* ── Price Formatter ── */
function formatPrice(price) {
  return '₹' + Number(price).toLocaleString('en-IN');
}

/* ── Star Rating HTML ── */
function starRating(rating) {
  let stars = '';
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(rating)) {
      stars += '<i class="bi bi-star-fill"></i>';
    } else if (i === Math.ceil(rating) && rating % 1 !== 0) {
      stars += '<i class="bi bi-star-half"></i>';
    } else {
      stars += '<i class="bi bi-star"></i>';
    }
  }
  return stars;
}

/* ── Product Card HTML ── */
function productCardHTML(product) {
  const img = product.images && product.images.length > 0
    ? product.images[0].url
    : 'https://via.placeholder.com/400x400?text=No+Image';
  const discountPercent = product.discountPrice
    ? Math.round((1 - product.discountPrice / product.price) * 100)
    : 0;

  return `
    <div class="col-6 col-md-4 col-lg-3 mb-4">
      <div class="product-card" onclick="window.location.href='/pages/product.html?id=${product._id}'">
        <div class="card-img-wrapper">
          <img src="${img}" alt="${product.name}" loading="lazy">
          ${discountPercent > 0 ? `<span class="discount-badge">-${discountPercent}%</span>` : ''}
        </div>
        <div class="card-body">
          <span class="product-category">${product.category}</span>
          <h6 class="product-name">${product.name}</h6>
          <div class="product-rating">
            <span class="stars">${starRating(product.ratings?.average || 0)}</span>
            <span class="count">(${product.ratings?.count || 0})</span>
          </div>
          <div class="product-price">
            <span class="price-current">${formatPrice(product.discountPrice || product.price)}</span>
            ${product.discountPrice ? `<span class="price-original">${formatPrice(product.price)}</span>` : ''}
          </div>
        </div>
      </div>
    </div>
  `;
}

/* ── Footer Rendering ── */
function renderFooter() {
  const footer = document.getElementById('mainFooter');
  if (footer) {
    footer.innerHTML = `
      <div class="container">
        <div class="row">
          <div class="col-md-4 mb-3">
            <div class="footer-brand">🔥 DRIP STORE</div>
            <p class="footer-text">Wear the Vibe. Gen-Z streetwear for the bold and expressive.</p>
            <div class="social-icons mt-3">
              <a href="#"><i class="bi bi-instagram"></i></a>
              <a href="#"><i class="bi bi-twitter-x"></i></a>
              <a href="#"><i class="bi bi-tiktok"></i></a>
              <a href="#"><i class="bi bi-youtube"></i></a>
            </div>
          </div>
          <div class="col-md-2 mb-3">
            <h6 class="text-white fw-bold mb-3">Shop</h6>
            <a href="/pages/shop.html?category=tshirt" class="footer-link">T-Shirts</a>
            <a href="/pages/shop.html?category=hoodie" class="footer-link">Hoodies</a>
            <a href="/pages/shop.html?category=jogger" class="footer-link">Joggers</a>
            <a href="/pages/shop.html?category=co-ord" class="footer-link">Co-ords</a>
            <a href="/pages/shop.html?category=accessories" class="footer-link">Accessories</a>
          </div>
          <div class="col-md-2 mb-3">
            <h6 class="text-white fw-bold mb-3">Account</h6>
            <a href="/pages/profile.html" class="footer-link">Profile</a>
            <a href="/pages/cart.html" class="footer-link">Cart</a>
            <a href="/pages/profile.html" class="footer-link">Orders</a>
          </div>
          <div class="col-md-4 mb-3">
            <h6 class="text-white fw-bold mb-3">Stay Updated</h6>
            <p class="footer-text">Get the latest drops straight to your inbox.</p>
            <div class="input-group mt-2">
              <input type="email" class="form-control bg-dark border-secondary text-white" placeholder="your@email.com">
              <button class="btn btn-drip btn-drip-sm" type="button">Subscribe</button>
            </div>
          </div>
        </div>
        <hr class="border-secondary mt-3">
        <p class="text-center text-muted mb-0 py-2">© ${new Date().getFullYear()} DRIP STORE. All rights reserved. Made with 🔥</p>
      </div>
    `;
  }
}

/* ── Initialize Navbar + Footer on every page ── */
document.addEventListener('DOMContentLoaded', () => {
  renderNavbar();
  renderFooter();
  updateCartBadge();
});
