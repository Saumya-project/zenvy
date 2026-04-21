/* ============================
   DRIP STORE - Shop Logic
   ============================ */

let currentPage = 1;
let currentFilters = {
  category: [],
  size: '',
  minPrice: 0,
  maxPrice: 10000,
  search: '',
  sort: 'newest',
};

document.addEventListener('DOMContentLoaded', () => {
  // Check URL params for pre-set filters
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('category')) {
    currentFilters.category = [urlParams.get('category')];
  }
  if (urlParams.get('search')) {
    currentFilters.search = urlParams.get('search');
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = currentFilters.search;
  }

  initFilters();
  loadProducts();
});

function initFilters() {
  // Category checkboxes
  document.querySelectorAll('.category-check').forEach((cb) => {
    if (currentFilters.category.includes(cb.value)) {
      cb.checked = true;
    }
    cb.addEventListener('change', () => {
      currentFilters.category = Array.from(
        document.querySelectorAll('.category-check:checked')
      ).map((el) => el.value);
      currentPage = 1;
      loadProducts();
    });
  });

  // Size filter buttons
  document.querySelectorAll('.size-filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.size-filter-btn').forEach((b) => b.classList.remove('active'));
      if (currentFilters.size === btn.dataset.size) {
        currentFilters.size = '';
      } else {
        btn.classList.add('active');
        currentFilters.size = btn.dataset.size;
      }
      currentPage = 1;
      loadProducts();
    });
  });

  // Price range
  const priceRange = document.getElementById('priceRange');
  const priceLabel = document.getElementById('priceLabel');
  if (priceRange) {
    priceRange.addEventListener('input', () => {
      currentFilters.maxPrice = Number(priceRange.value);
      if (priceLabel) priceLabel.textContent = formatPrice(priceRange.value);
    });
    priceRange.addEventListener('change', () => {
      currentPage = 1;
      loadProducts();
    });
  }

  // Sort dropdown
  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      currentFilters.sort = sortSelect.value;
      currentPage = 1;
      loadProducts();
    });
  }

  // Search
  const searchInput = document.getElementById('searchInput');
  let searchTimeout;
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        currentFilters.search = searchInput.value.trim();
        currentPage = 1;
        loadProducts();
      }, 400);
    });
  }

  // Clear filters
  const clearBtn = document.getElementById('clearFilters');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      currentFilters = {
        category: [],
        size: '',
        minPrice: 0,
        maxPrice: 10000,
        search: '',
        sort: 'newest',
      };
      currentPage = 1;
      document.querySelectorAll('.category-check').forEach((cb) => (cb.checked = false));
      document.querySelectorAll('.size-filter-btn').forEach((b) => b.classList.remove('active'));
      if (priceRange) priceRange.value = 10000;
      if (priceLabel) priceLabel.textContent = '₹10,000';
      if (sortSelect) sortSelect.value = 'newest';
      if (searchInput) searchInput.value = '';
      loadProducts();
    });
  }
}

async function loadProducts() {
  const grid = document.getElementById('productGrid');
  if (!grid) return;

  grid.innerHTML = '<div class="col-12 text-center py-5"><div class="spinner-drip"></div></div>';

  try {
    let params = `?page=${currentPage}&limit=12&sort=${currentFilters.sort}`;
    if (currentFilters.category.length > 0) params += `&category=${currentFilters.category.join(',')}`;
    if (currentFilters.size) params += `&size=${currentFilters.size}`;
    if (currentFilters.minPrice > 0) params += `&minPrice=${currentFilters.minPrice}`;
    if (currentFilters.maxPrice < 10000) params += `&maxPrice=${currentFilters.maxPrice}`;
    if (currentFilters.search) params += `&search=${encodeURIComponent(currentFilters.search)}`;

    const res = await apiGet(`/products${params}`);
    const products = res.data;
    const pagination = res.pagination;

    if (products.length === 0) {
      grid.innerHTML = `
        <div class="col-12">
          <div class="empty-state">
            <div class="empty-icon">🔍</div>
            <h4>No products found</h4>
            <p>Try adjusting your filters or search terms</p>
          </div>
        </div>
      `;
      document.getElementById('paginationContainer').innerHTML = '';
      return;
    }

    grid.innerHTML = products.map((p) => productCardHTML(p)).join('');

    // Update results count
    const countEl = document.getElementById('resultsCount');
    if (countEl) countEl.textContent = `${pagination.total} products found`;

    // Render pagination
    renderPagination(pagination);
  } catch (err) {
    grid.innerHTML = `
      <div class="col-12">
        <div class="empty-state">
          <div class="empty-icon">😰</div>
          <h4>Failed to load products</h4>
          <p>${err.message}</p>
          <button class="btn btn-drip mt-3" onclick="loadProducts()">Try Again</button>
        </div>
      </div>
    `;
  }
}

function renderPagination(pagination) {
  const container = document.getElementById('paginationContainer');
  if (!container || pagination.pages <= 1) {
    if (container) container.innerHTML = '';
    return;
  }

  let html = '<nav><ul class="pagination pagination-drip justify-content-center">';

  // Previous
  html += `
    <li class="page-item ${pagination.page <= 1 ? 'disabled' : ''}">
      <a class="page-link" href="#" onclick="goToPage(${pagination.page - 1}); return false;">
        <i class="bi bi-chevron-left"></i>
      </a>
    </li>
  `;

  // Page numbers
  const start = Math.max(1, pagination.page - 2);
  const end = Math.min(pagination.pages, pagination.page + 2);

  for (let i = start; i <= end; i++) {
    html += `
      <li class="page-item ${i === pagination.page ? 'active' : ''}">
        <a class="page-link" href="#" onclick="goToPage(${i}); return false;">${i}</a>
      </li>
    `;
  }

  // Next
  html += `
    <li class="page-item ${pagination.page >= pagination.pages ? 'disabled' : ''}">
      <a class="page-link" href="#" onclick="goToPage(${pagination.page + 1}); return false;">
        <i class="bi bi-chevron-right"></i>
      </a>
    </li>
  `;

  html += '</ul></nav>';
  container.innerHTML = html;
}

function goToPage(page) {
  currentPage = page;
  loadProducts();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ── Featured Products (for homepage) ── */
async function loadFeaturedProducts() {
  const grid = document.getElementById('featuredGrid');
  if (!grid) return;

  grid.innerHTML = '<div class="col-12 text-center py-5"><div class="spinner-drip"></div></div>';

  try {
    const res = await apiGet('/products/featured');
    if (res.data.length === 0) {
      grid.innerHTML = '<p class="text-center text-muted">No featured products yet</p>';
      return;
    }
    grid.innerHTML = res.data.map((p) => productCardHTML(p)).join('');
  } catch (err) {
    grid.innerHTML = '<p class="text-center text-muted">Failed to load featured products</p>';
  }
}
