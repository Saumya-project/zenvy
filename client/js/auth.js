/* ============================
   DRIP STORE - Auth Logic
   ============================ */

document.addEventListener('DOMContentLoaded', () => {
  // If already logged in, redirect from login/register
  const path = window.location.pathname;
  if (isLoggedIn() && (path.includes('login') || path.includes('register'))) {
    window.location.href = '/pages/index.html';
    return;
  }

  // Login Form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  // Register Form
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', handleRegister);
  }
});

async function handleLogin(e) {
  e.preventDefault();

  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const btn = e.target.querySelector('button[type="submit"]');

  if (!email || !password) {
    showToast('Please fill in all fields', 'error');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Logging in...';

  try {
    const res = await apiPost('/auth/login', { email, password });
    saveAuth(res.data);

    // Merge local cart if exists
    const localCart = getLocalCart();
    if (localCart.length > 0) {
      try {
        await apiPost('/cart/merge', { items: localCart });
        localStorage.removeItem('drip_cart');
      } catch (err) {
        console.warn('Cart merge failed:', err);
      }
    }

    showToast('Welcome back! 🔥');
    setTimeout(() => {
      if (res.data.role === 'admin') {
        window.location.href = '/pages/admin/dashboard.html';
      } else {
        window.location.href = '/pages/index.html';
      }
    }, 800);
  } catch (err) {
    showToast(err.message, 'error');
    btn.disabled = false;
    btn.innerHTML = 'Login';
  }
}

async function handleRegister(e) {
  e.preventDefault();

  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const confirmPassword = document.getElementById('regConfirmPassword').value;
  const btn = e.target.querySelector('button[type="submit"]');

  if (!name || !email || !password) {
    showToast('Please fill in all fields', 'error');
    return;
  }

  if (password !== confirmPassword) {
    showToast('Passwords do not match', 'error');
    return;
  }

  if (password.length < 6) {
    showToast('Password must be at least 6 characters', 'error');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Creating account...';

  try {
    const res = await apiPost('/auth/register', { name, email, password });
    saveAuth(res.data);
    showToast('Account created! Welcome to the drip! 🔥');
    setTimeout(() => window.location.href = '/pages/index.html', 800);
  } catch (err) {
    showToast(err.message, 'error');
    btn.disabled = false;
    btn.innerHTML = 'Create Account';
  }
}
