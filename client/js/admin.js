/* ============================
   Admin Logic
   ============================ */

document.addEventListener('DOMContentLoaded', () => {
  // Auth check
  if (!isLoggedIn() || !isAdmin()) {
    showToast('Admin access required', 'error');
    setTimeout(() => (window.location.href = '/pages/login.html'), 1000);
    return;
  }

  // Dashboard
  if (document.getElementById('adminStats')) {
    loadDashboard();
  }

  // Products management
  if (document.getElementById('adminProductsTable')) {
    loadAdminProducts();
    setupProductForm();
  }

  // Orders management
  if (document.getElementById('adminOrdersTable')) {
    loadAdminOrders();
  }
});

/* ── Dashboard ── */
async function loadDashboard() {
  try {
    const [ordersRes, productsRes, usersRes] = await Promise.all([
      apiGet('/orders'),
      apiGet('/products/admin/all'),
      apiGet('/auth/users'),
    ]);

    const orders = ordersRes.data || [];
    const revenue = ordersRes.totalRevenue || 0;
    const products = productsRes.data || [];
    const users = usersRes.data || [];

    // Stats
    document.getElementById('statRevenue').textContent = formatPrice(revenue);
    document.getElementById('statOrders').textContent = orders.length;
    document.getElementById('statProducts').textContent = products.length;
    document.getElementById('statUsers').textContent = users.length;

    // Recent orders
    const tbody = document.getElementById('recentOrdersBody');
    if (tbody) {
      const recent = orders.slice(0, 10);
      tbody.innerHTML = recent.map((order) => `
        <tr>
          <td><small class="text-muted">#${order._id.slice(-8)}</small></td>
          <td>${order.user?.name || 'N/A'}</td>
          <td>${order.items.length} items</td>
          <td>${formatPrice(order.totalAmount)}</td>
          <td><span class="status-badge status-${order.orderStatus}">${order.orderStatus}</span></td>
          <td><small>${new Date(order.createdAt).toLocaleDateString()}</small></td>
        </tr>
      `).join('');
    }
  } catch (err) {
    showToast('Failed to load dashboard: ' + err.message, 'error');
  }
}

/* ── Admin Products ── */
let allAdminProducts = [];

async function loadAdminProducts() {
  const tbody = document.getElementById('adminProductsBody');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4"><div class="spinner-drip"></div></td></tr>';

  try {
    const res = await apiGet('/products/admin/all');
    allAdminProducts = res.data || [];
    renderAdminProducts(allAdminProducts);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Failed: ${err.message}</td></tr>`;
  }
}

function renderAdminProducts(products) {
  const tbody = document.getElementById('adminProductsBody');
  if (!tbody) return;

  if (products.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4">No products found</td></tr>';
    return;
  }

  tbody.innerHTML = products.map((p) => {
    const img = p.images?.[0]?.url || 'https://via.placeholder.com/50';
    return `
      <tr>
        <td><img src="${img}" alt="${p.name}" width="50" height="50" style="object-fit:cover; border-radius:8px;"></td>
        <td><strong>${p.name}</strong></td>
        <td><span class="tag-badge">${p.category}</span></td>
        <td>${formatPrice(p.discountPrice || p.price)}</td>
        <td>${p.sizes.reduce((s, sz) => s + sz.stock, 0)}</td>
        <td><span class="status-badge ${p.isActive ? 'status-delivered' : 'status-cancelled'}">${p.isActive ? 'Active' : 'Inactive'}</span></td>
        <td>
          <button class="btn btn-sm btn-drip-outline btn-drip-sm me-1" onclick="editProduct('${p._id}')">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-sm btn-drip btn-drip-sm btn-drip-danger" onclick="deleteProduct('${p._id}')">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function setupProductForm() {
  const form = document.getElementById('productForm');
  if (!form) return;

  // Search filter
  const searchInput = document.getElementById('adminProductSearch');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.toLowerCase();
      const filtered = allAdminProducts.filter(
        (p) => p.name.toLowerCase().includes(q) || p.category.includes(q)
      );
      renderAdminProducts(filtered);
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('name', document.getElementById('prodName').value);
    formData.append('description', document.getElementById('prodDesc').value);
    formData.append('price', document.getElementById('prodPrice').value);
    formData.append('discountPrice', document.getElementById('prodDiscountPrice').value || '');
    formData.append('category', document.getElementById('prodCategory').value);
    formData.append('isFeatured', document.getElementById('prodFeatured').checked);

    // Parse sizes
    const sizes = [];
    document.querySelectorAll('.size-input-row').forEach((row) => {
      const size = row.querySelector('.size-name').value;
      const stock = row.querySelector('.size-stock').value;
      if (size) sizes.push({ size, stock: Number(stock) || 0 });
    });
    formData.append('sizes', JSON.stringify(sizes));

    const tagsVal = document.getElementById('prodTags').value;
    if (tagsVal) formData.append('tags', tagsVal);

    // Images
    const imageInput = document.getElementById('prodImages');
    if (imageInput && imageInput.files.length > 0) {
      for (const file of imageInput.files) {
        formData.append('images', file);
      }
    }

    const editId = form.dataset.editId;
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving...';

    try {
      if (editId) {
        await apiPut(`/products/${editId}`, formData);
        showToast('Product updated! ✅');
      } else {
        await apiPost('/products', formData);
        showToast('Product created! 🎉');
      }

      // Close modal and reload
      const modal = bootstrap.Modal.getInstance(document.getElementById('productModal'));
      if (modal) modal.hide();
      form.reset();
      form.dataset.editId = '';
      loadAdminProducts();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = editId ? 'Update Product' : 'Add Product';
    }
  });
}

async function editProduct(id) {
  const product = allAdminProducts.find((p) => p._id === id);
  if (!product) return;

  document.getElementById('productModalLabel').textContent = 'Edit Product';
  document.getElementById('prodName').value = product.name;
  document.getElementById('prodDesc').value = product.description;
  document.getElementById('prodPrice').value = product.price;
  document.getElementById('prodDiscountPrice').value = product.discountPrice || '';
  document.getElementById('prodCategory').value = product.category;
  document.getElementById('prodFeatured').checked = product.isFeatured;
  document.getElementById('prodTags').value = (product.tags || []).join(', ');

  // Fill sizes
  const sizesContainer = document.getElementById('sizesContainer');
  sizesContainer.innerHTML = '';
  (product.sizes || []).forEach((s) => addSizeRow(s.size, s.stock));

  const form = document.getElementById('productForm');
  form.dataset.editId = id;

  const modal = new bootstrap.Modal(document.getElementById('productModal'));
  modal.show();
}

function addSizeRow(size = '', stock = 0) {
  const container = document.getElementById('sizesContainer');
  const row = document.createElement('div');
  row.className = 'size-input-row d-flex gap-2 mb-2 align-items-center';
  row.innerHTML = `
    <select class="form-select form-select-sm size-name" style="background:var(--bg-secondary); color:var(--text-primary); border-color:var(--border-color); width:100px;">
      <option value="XS" ${size === 'XS' ? 'selected' : ''}>XS</option>
      <option value="S" ${size === 'S' ? 'selected' : ''}>S</option>
      <option value="M" ${size === 'M' ? 'selected' : ''}>M</option>
      <option value="L" ${size === 'L' ? 'selected' : ''}>L</option>
      <option value="XL" ${size === 'XL' ? 'selected' : ''}>XL</option>
      <option value="XXL" ${size === 'XXL' ? 'selected' : ''}>XXL</option>
      <option value="Free Size" ${size === 'Free Size' ? 'selected' : ''}>Free Size</option>
    </select>
    <input type="number" class="form-control form-control-sm size-stock" value="${stock}" min="0" placeholder="Stock" style="background:var(--bg-secondary); color:var(--text-primary); border-color:var(--border-color); width:80px;">
    <button type="button" class="btn btn-sm text-danger" onclick="this.parentElement.remove()"><i class="bi bi-x-circle"></i></button>
  `;
  container.appendChild(row);
}

async function deleteProduct(id) {
  if (!confirm('Are you sure you want to delete this product?')) return;

  try {
    await apiDelete(`/products/${id}`);
    showToast('Product deleted');
    loadAdminProducts();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function openAddProductModal() {
  document.getElementById('productModalLabel').textContent = 'Add New Product';
  document.getElementById('productForm').reset();
  document.getElementById('productForm').dataset.editId = '';
  document.getElementById('sizesContainer').innerHTML = '';
  addSizeRow('M', 10);
  addSizeRow('L', 10);
  const modal = new bootstrap.Modal(document.getElementById('productModal'));
  modal.show();
}

/* ── Admin Orders ── */
async function loadAdminOrders() {
  const tbody = document.getElementById('adminOrdersBody');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4"><div class="spinner-drip"></div></td></tr>';

  try {
    const statusFilter = document.getElementById('orderStatusFilter')?.value || '';
    const endpoint = statusFilter ? `/orders?status=${statusFilter}` : '/orders';
    const res = await apiGet(endpoint);
    const orders = res.data || [];

    if (orders.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4">No orders found</td></tr>';
      return;
    }

    tbody.innerHTML = orders.map((order) => `
      <tr>
        <td><small class="text-muted">#${order._id.slice(-8)}</small></td>
        <td>${order.user?.name || 'N/A'}<br><small class="text-muted">${order.user?.email || ''}</small></td>
        <td>${order.items.map((i) => `${i.name || 'Product'} (${i.size} ×${i.qty})`).join('<br>')}</td>
        <td>${formatPrice(order.totalAmount)}</td>
        <td><span class="status-badge status-${order.paymentInfo?.status || 'pending'}">${order.paymentInfo?.status || 'pending'}</span></td>
        <td>
          <select class="form-select form-select-sm" onchange="updateOrderStatus('${order._id}', this.value)" 
            style="background:var(--bg-secondary); color:var(--text-primary); border-color:var(--border-color); width:130px;">
            <option value="pending" ${order.orderStatus === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="confirmed" ${order.orderStatus === 'confirmed' ? 'selected' : ''}>Confirmed</option>
            <option value="shipped" ${order.orderStatus === 'shipped' ? 'selected' : ''}>Shipped</option>
            <option value="delivered" ${order.orderStatus === 'delivered' ? 'selected' : ''}>Delivered</option>
            <option value="cancelled" ${order.orderStatus === 'cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
        </td>
        <td><small>${new Date(order.createdAt).toLocaleDateString()}</small></td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">${err.message}</td></tr>`;
  }
}

async function updateOrderStatus(orderId, status) {
  try {
    await apiPut(`/orders/${orderId}/status`, { orderStatus: status });
    showToast(`Order updated to ${status}`);
  } catch (err) {
    showToast(err.message, 'error');
    loadAdminOrders();
  }
}
