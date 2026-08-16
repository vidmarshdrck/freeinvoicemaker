/**
 * Free Invoice Maker - Single Page Application Core Controller
 */

const AppState = {
  activeBusinessId: localStorage.getItem('fim_active_business_id') || null,
  businesses: [],
  currentSection: 'dashboard',
  authToken: localStorage.getItem('fim_token') || null,
  currentUser: null,
  productsCache: [],
  customersCache: [],
  signaturePad: null,
};

// API Helper
async function apiCall(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (AppState.authToken) {
    headers['Authorization'] = `Bearer ${AppState.authToken}`;
  }

  // File uploads or formData shouldn't set Content-Type header
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  try {
    const res = await fetch(endpoint, { ...options, headers });
    if (res.status === 401) {
      if (!endpoint.includes('/auth/login') && !endpoint.includes('/health')) {
        showLoginModal();
      }
    }
    const data = await res.json();
    if (!res.ok || data.success === false) {
      const errMessage = data?.error?.message || data?.detail?.message || 'Operation failed';
      throw new Error(errMessage);
    }
    return data;
  } catch (err) {
    console.error(`API Error on ${endpoint}:`, err);
    throw err;
  }
}

// Toast Notifications
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Modal Helpers
function openModal(modalId) {
  const m = document.getElementById(modalId);
  if (m) m.classList.add('active');
}

function closeModal(modalId) {
  const m = document.getElementById(modalId);
  if (m) m.classList.remove('active');
}

// App Initialization
document.addEventListener('DOMContentLoaded', async () => {
  initNavigation();
  initSignaturePad();
  await checkAuthStatus();
  await loadBusinesses();
  await switchSection('dashboard');
});

function initSignaturePad() {
  const canvas = document.getElementById('signatureCanvas');
  if (canvas) {
    AppState.signaturePad = new SmoothSignaturePad(canvas);
  }
}

function initNavigation() {
  document.querySelectorAll('.nav-item').forEach((item) => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const target = item.getAttribute('data-section');
      if (target) switchSection(target);
    });
  });

  const bizSelect = document.getElementById('topBusinessSelect');
  if (bizSelect) {
    bizSelect.addEventListener('change', async (e) => {
      AppState.activeBusinessId = e.target.value;
      localStorage.setItem('fim_active_business_id', AppState.activeBusinessId);
      await refreshCurrentSection();
    });
  }
}

async function switchSection(sectionId) {
  AppState.currentSection = sectionId;

  document.querySelectorAll('.nav-item').forEach((i) => {
    i.classList.toggle('active', i.getAttribute('data-section') === sectionId);
  });

  document.querySelectorAll('.view-section').forEach((s) => {
    s.classList.toggle('active', s.id === `section-${sectionId}`);
  });

  await refreshCurrentSection();
}

async function refreshCurrentSection() {
  switch (AppState.currentSection) {
    case 'dashboard':
      await loadDashboard();
      break;
    case 'businesses':
      await loadBusinessesList();
      break;
    case 'customers':
      await loadCustomers();
      break;
    case 'products':
      await loadProducts();
      break;
    case 'invoices':
      await loadInvoices();
      break;
    case 'quotations':
      await loadQuotations();
      break;
    case 'estimates':
      await loadEstimates();
      break;
    case 'receipts':
      await loadReceipts();
      break;
    case 'api-keys':
      await loadApiKeys();
      break;
    case 'settings':
      await loadSettings();
      break;
  }
}

// Authentication
async function checkAuthStatus() {
  try {
    const res = await apiCall('/api/v1/auth/me');
    AppState.currentUser = res.data;
    if (document.getElementById('currentUserName')) document.getElementById('currentUserName').innerText = res.data.full_name || res.data.email;
    if (document.getElementById('currentUserEmail')) document.getElementById('currentUserEmail').innerText = res.data.email;
  } catch {
    // If not logged in, auto-login with default admin if local
    try {
      const loginRes = await apiCall('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'admin@freeinvoicemaker.local',
          password: 'admin123',
        }),
      });
      AppState.authToken = loginRes.data.access_token;
      localStorage.setItem('fim_token', AppState.authToken);
      AppState.currentUser = loginRes.data.user;
      if (document.getElementById('currentUserName')) document.getElementById('currentUserName').innerText = AppState.currentUser.full_name || AppState.currentUser.email;
      if (document.getElementById('currentUserEmail')) document.getElementById('currentUserEmail').innerText = AppState.currentUser.email;
    } catch {
      showLoginModal();
    }
  }
}

function showLoginModal() {
  openModal('loginModal');
}

// Businesses
async function loadBusinesses() {
  try {
    const res = await apiCall('/api/v1/businesses');
    AppState.businesses = res.data || [];

    const select = document.getElementById('topBusinessSelect');
    if (!select) return;

    select.innerHTML = '';
    AppState.businesses.forEach((b) => {
      const opt = document.createElement('option');
      opt.value = b.id;
      opt.textContent = b.trading_name || b.name;
      select.appendChild(opt);
    });

    if (AppState.businesses.length > 0) {
      if (!AppState.activeBusinessId || !AppState.businesses.some((b) => b.id === AppState.activeBusinessId)) {
        const def = AppState.businesses.find((b) => b.is_default) || AppState.businesses[0];
        AppState.activeBusinessId = def.id;
        localStorage.setItem('fim_active_business_id', def.id);
      }
      select.value = AppState.activeBusinessId;
    }
  } catch (err) {
    console.error('Failed to load businesses:', err);
  }
}

async function loadBusinessesList() {
  const container = document.getElementById('businessesTableBody');
  if (!container) return;

  container.innerHTML = '<tr><td colspan="6" style="text-align:center;">Loading business profiles...</td></tr>';
  try {
    const res = await apiCall('/api/v1/businesses');
    const list = res.data || [];

    if (list.length === 0) {
      container.innerHTML = '<tr><td colspan="6" style="text-align:center;">No businesses found.</td></tr>';
      return;
    }

    container.innerHTML = list
      .map(
        (b) => `
      <tr>
        <td><strong>${b.trading_name || b.name}</strong> ${b.is_default ? '<span class="status-badge badge-paid">Default</span>' : ''}</td>
        <td>${b.registration_number || '-'}</td>
        <td>${b.tax_number || '-'}</td>
        <td>${b.email || '-'} / ${b.phone || '-'}</td>
        <td>${b.default_currency} (${b.template_name})</td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="openSignatureModal('${b.id}')">Signature</button>
          <button class="btn btn-danger btn-sm" onclick="deleteBusiness('${b.id}')">Delete</button>
        </td>
      </tr>
    `
      )
      .join('');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function openCreateBusinessModal() {
  const name = prompt('Enter Business Name:');
  if (!name || !name.strip()) return;
  const currency = prompt('Default Currency (e.g. USD, ZMW, EUR):', 'USD') || 'USD';

  apiCall('/api/v1/businesses', {
    method: 'POST',
    body: JSON.stringify({ name: name.trim(), default_currency: currency.trim() }),
  })
    .then(async () => {
      showToast('Business profile created!');
      await loadBusinesses();
      await loadBusinessesList();
    })
    .catch((err) => showToast(err.message, 'error'));
}

async function deleteBusiness(id) {
  if (!confirm('Are you sure you want to delete this business profile?')) return;
  try {
    await apiCall(`/api/v1/businesses/${id}`, { method: 'DELETE' });
    showToast('Business profile deleted.');
    await loadBusinesses();
    await loadBusinessesList();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Dashboard
async function loadDashboard() {
  if (!AppState.activeBusinessId) return;

  try {
    const res = await apiCall(`/api/v1/stats/dashboard?business_id=${AppState.activeBusinessId}`);
    const data = res.data;

    document.getElementById('statTotalInvoiced').innerText = `${data.currency} ${Number(data.total_invoiced).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    document.getElementById('statTotalPaid').innerText = `${data.currency} ${Number(data.total_paid).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    document.getElementById('statTotalOutstanding').innerText = `${data.currency} ${Number(data.total_outstanding).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    document.getElementById('statTotalOverdue').innerText = `${data.currency} ${Number(data.total_overdue).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

    document.getElementById('countInvoices').innerText = data.count_invoices;
    document.getElementById('countReceipts').innerText = data.count_receipts;

    const recentContainer = document.getElementById('recentDocumentsTableBody');
    if (!recentContainer) return;

    if (!data.recent_documents || data.recent_documents.length === 0) {
      recentContainer.innerHTML = '<tr><td colspan="6" style="text-align:center;">No recent documents found.</td></tr>';
      return;
    }

    recentContainer.innerHTML = data.recent_documents
      .map(
        (doc) => `
      <tr>
        <td><strong>${doc.document_number}</strong></td>
        <td><span class="status-badge badge-draft">${doc.document_type}</span></td>
        <td>${doc.issue_date}</td>
        <td>${doc.currency} ${Number(doc.grand_total).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
        <td><span class="status-badge badge-${doc.status}">${doc.status}</span></td>
        <td>
          <a href="${doc.pdf_url}" target="_blank" class="btn btn-secondary btn-sm">PDF</a>
        </td>
      </tr>
    `
      )
      .join('');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Customers
async function loadCustomers(search = '') {
  if (!AppState.activeBusinessId) return;

  const container = document.getElementById('customersTableBody');
  if (!container) return;

  try {
    const qParam = search ? `&q=${encodeURIComponent(search)}` : '';
    const res = await apiCall(`/api/v1/customers?business_id=${AppState.activeBusinessId}${qParam}`);
    AppState.customersCache = res.data || [];

    if (AppState.customersCache.length === 0) {
      container.innerHTML = '<tr><td colspan="6" style="text-align:center;">No customers found.</td></tr>';
      return;
    }

    container.innerHTML = AppState.customersCache
      .map(
        (c) => `
      <tr>
        <td><strong>${c.display_name}</strong></td>
        <td>${c.company_name || '-'}</td>
        <td>${c.email || '-'}</td>
        <td>${c.phone || '-'}</td>
        <td>${c.city || ''}, ${c.country}</td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="viewCustomerDetail('${c.id}')">View</button>
          <button class="btn btn-danger btn-sm" onclick="deleteCustomer('${c.id}')">Delete</button>
        </td>
      </tr>
    `
      )
      .join('');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function openCreateCustomerModal() {
  const name = prompt('Customer / Company Name:');
  if (!name) return;
  const email = prompt('Customer Email (optional):') || '';
  const phone = prompt('Customer Phone (optional):') || '';

  apiCall('/api/v1/customers', {
    method: 'POST',
    body: JSON.stringify({
      business_id: AppState.activeBusinessId,
      display_name: name,
      email: email || null,
      phone: phone || null,
    }),
  })
    .then(() => {
      showToast('Customer created!');
      loadCustomers();
    })
    .catch((err) => showToast(err.message, 'error'));
}

async function viewCustomerDetail(id) {
  try {
    const res = await apiCall(`/api/v1/customers/${id}`);
    const c = res.data;
    const s = c.summary || {};
    alert(
      `Customer: ${c.display_name}\nEmail: ${c.email || '-'}\nTotal Invoiced: $${s.total_invoiced || '0.00'}\nTotal Paid: $${s.total_paid || '0.00'}\nOutstanding: $${s.outstanding_amount || '0.00'}`
    );
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteCustomer(id) {
  if (!confirm('Are you sure you want to delete this customer?')) return;
  try {
    await apiCall(`/api/v1/customers/${id}`, { method: 'DELETE' });
    showToast('Customer deleted.');
    await loadCustomers();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function exportCustomersCSV() {
  window.open(`/api/v1/import-export/customers/csv?business_id=${AppState.activeBusinessId}`, '_blank');
}

async function importCustomersCSV(input) {
  const file = input.files[0];
  if (!file) return;
  const formData = new FormData();
  formData.append('file', file);
  try {
    const res = await apiCall(`/api/v1/import-export/customers/csv?business_id=${AppState.activeBusinessId}`, {
      method: 'POST',
      body: formData,
    });
    showToast(res.message);
    await loadCustomers();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Products
async function loadProducts(search = '') {
  if (!AppState.activeBusinessId) return;

  const container = document.getElementById('productsTableBody');
  if (!container) return;

  try {
    const qParam = search ? `&q=${encodeURIComponent(search)}` : '';
    const res = await apiCall(`/api/v1/products?business_id=${AppState.activeBusinessId}${qParam}`);
    AppState.productsCache = res.data || [];

    if (AppState.productsCache.length === 0) {
      container.innerHTML = '<tr><td colspan="6" style="text-align:center;">No products or services found.</td></tr>';
      return;
    }

    container.innerHTML = AppState.productsCache
      .map(
        (p) => `
      <tr>
        <td><strong>${p.name}</strong></td>
        <td>${p.sku || '-'}</td>
        <td>${p.unit}</td>
        <td>${p.currency} ${Number(p.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
        <td>${p.tax_rate}%</td>
        <td>
          <button class="btn btn-danger btn-sm" onclick="deleteProduct('${p.id}')">Delete</button>
        </td>
      </tr>
    `
      )
      .join('');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function openCreateProductModal() {
  const name = prompt('Product / Service Name:');
  if (!name) return;
  const priceStr = prompt('Price (e.g. 150.00):', '100.00') || '0.00';
  const unit = prompt('Unit (e.g. unit, hrs, items):', 'unit') || 'unit';

  apiCall('/api/v1/products', {
    method: 'POST',
    body: JSON.stringify({
      business_id: AppState.activeBusinessId,
      name: name,
      price: parseFloat(priceStr) || 0,
      unit: unit,
    }),
  })
    .then(() => {
      showToast('Product created!');
      loadProducts();
    })
    .catch((err) => showToast(err.message, 'error'));
}

async function deleteProduct(id) {
  if (!confirm('Are you sure you want to delete this item?')) return;
  try {
    await apiCall(`/api/v1/products/${id}`, { method: 'DELETE' });
    showToast('Product deleted.');
    await loadProducts();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function exportProductsCSV() {
  window.open(`/api/v1/import-export/products/csv?business_id=${AppState.activeBusinessId}`, '_blank');
}

async function importProductsCSV(input) {
  const file = input.files[0];
  if (!file) return;
  const formData = new FormData();
  formData.append('file', file);
  try {
    const res = await apiCall(`/api/v1/import-export/products/csv?business_id=${AppState.activeBusinessId}`, {
      method: 'POST',
      body: formData,
    });
    showToast(res.message);
    await loadProducts();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Invoices
async function loadInvoices(statusFilter = '') {
  if (!AppState.activeBusinessId) return;

  const container = document.getElementById('invoicesTableBody');
  if (!container) return;

  try {
    const sParam = statusFilter ? `&status=${encodeURIComponent(statusFilter)}` : '';
    const res = await apiCall(`/api/v1/invoices?business_id=${AppState.activeBusinessId}${sParam}`);
    const list = res.data || [];

    if (list.length === 0) {
      container.innerHTML = '<tr><td colspan="7" style="text-align:center;">No invoices found.</td></tr>';
      return;
    }

    container.innerHTML = list
      .map(
        (inv) => `
      <tr>
        <td><strong>${inv.document_number}</strong></td>
        <td>${inv.issue_date}</td>
        <td>${inv.due_date || '-'}</td>
        <td>${inv.currency} ${Number(inv.grand_total).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
        <td>${inv.currency} ${Number(inv.amount_due).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
        <td><span class="status-badge badge-${inv.status}">${inv.status}</span></td>
        <td>
          <a href="${inv.pdf_url}" target="_blank" class="btn btn-secondary btn-sm">PDF</a>
          <button class="btn btn-primary btn-sm" onclick="openRecordPaymentModal('${inv.id}', '${inv.document_number}', ${inv.amount_due}, '${inv.currency}')">Pay</button>
          <button class="btn btn-danger btn-sm" onclick="deleteDocumentRow('${inv.id}')">Delete</button>
        </td>
      </tr>
    `
      )
      .join('');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Quotations
async function loadQuotations() {
  if (!AppState.activeBusinessId) return;

  const container = document.getElementById('quotationsTableBody');
  if (!container) return;

  try {
    const res = await apiCall(`/api/v1/quotations?business_id=${AppState.activeBusinessId}`);
    const list = res.data || [];

    if (list.length === 0) {
      container.innerHTML = '<tr><td colspan="6" style="text-align:center;">No quotations found.</td></tr>';
      return;
    }

    container.innerHTML = list
      .map(
        (q) => `
      <tr>
        <td><strong>${q.document_number}</strong></td>
        <td>${q.issue_date}</td>
        <td>${q.expiry_date || '-'}</td>
        <td>${q.currency} ${Number(q.grand_total).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
        <td><span class="status-badge badge-${q.status}">${q.status}</span></td>
        <td>
          <a href="${q.pdf_url}" target="_blank" class="btn btn-secondary btn-sm">PDF</a>
          ${q.status !== 'converted' ? `<button class="btn btn-primary btn-sm" onclick="convertDocToInvoice('${q.id}', 'quotations')">Convert to Invoice</button>` : ''}
          <button class="btn btn-danger btn-sm" onclick="deleteDocumentRow('${q.id}')">Delete</button>
        </td>
      </tr>
    `
      )
      .join('');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Estimates
async function loadEstimates() {
  if (!AppState.activeBusinessId) return;

  const container = document.getElementById('estimatesTableBody');
  if (!container) return;

  try {
    const res = await apiCall(`/api/v1/estimates?business_id=${AppState.activeBusinessId}`);
    const list = res.data || [];

    if (list.length === 0) {
      container.innerHTML = '<tr><td colspan="6" style="text-align:center;">No estimates found.</td></tr>';
      return;
    }

    container.innerHTML = list
      .map(
        (e) => `
      <tr>
        <td><strong>${e.document_number}</strong></td>
        <td>${e.issue_date}</td>
        <td>${e.expiry_date || '-'}</td>
        <td>${e.currency} ${Number(e.grand_total).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
        <td><span class="status-badge badge-${e.status}">${e.status}</span></td>
        <td>
          <a href="${e.pdf_url}" target="_blank" class="btn btn-secondary btn-sm">PDF</a>
          ${e.status !== 'converted' ? `<button class="btn btn-primary btn-sm" onclick="convertDocToInvoice('${e.id}', 'estimates')">Convert to Invoice</button>` : ''}
          <button class="btn btn-danger btn-sm" onclick="deleteDocumentRow('${e.id}')">Delete</button>
        </td>
      </tr>
    `
      )
      .join('');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Receipts
async function loadReceipts() {
  if (!AppState.activeBusinessId) return;

  const container = document.getElementById('receiptsTableBody');
  if (!container) return;

  try {
    const res = await apiCall(`/api/v1/receipts?business_id=${AppState.activeBusinessId}`);
    const list = res.data || [];

    if (list.length === 0) {
      container.innerHTML = '<tr><td colspan="6" style="text-align:center;">No payment receipts found.</td></tr>';
      return;
    }

    container.innerHTML = list
      .map(
        (r) => `
      <tr>
        <td><strong>${r.receipt_number || '-'}</strong></td>
        <td>${r.payment_date}</td>
        <td>${r.payment_method}</td>
        <td>${r.reference_number || '-'}</td>
        <td><strong>${r.currency} ${Number(r.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></td>
        <td>
          <a href="${r.pdf_url}" target="_blank" class="btn btn-secondary btn-sm">PDF</a>
          <button class="btn btn-danger btn-sm" onclick="deletePayment('${r.id}')">Delete</button>
        </td>
      </tr>
    `
      )
      .join('');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// API Keys
async function loadApiKeys() {
  const container = document.getElementById('apiKeysTableBody');
  if (!container) return;

  try {
    const res = await apiCall('/api/v1/api-keys');
    const list = res.data || [];

    if (list.length === 0) {
      container.innerHTML = '<tr><td colspan="6" style="text-align:center;">No API keys generated yet.</td></tr>';
      return;
    }

    container.innerHTML = list
      .map(
        (k) => `
      <tr>
        <td><strong>${k.name}</strong></td>
        <td><code>${k.key_prefix}</code></td>
        <td><code>${k.scopes}</code></td>
        <td>${new Date(k.created_at).toLocaleDateString()}</td>
        <td>${k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : 'Never'}</td>
        <td>
          <button class="btn btn-danger btn-sm" onclick="revokeApiKey('${k.id}')">Revoke</button>
        </td>
      </tr>
    `
      )
      .join('');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Settings
async function loadSettings() {
  // Settings view is static with form handlers
}

// Conversion helper
async function convertDocToInvoice(id, routePrefix) {
  if (!confirm('Convert this document into a new Invoice?')) return;
  try {
    const res = await apiCall(`/api/v1/${routePrefix}/${id}/convert-to-invoice`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
    showToast(res.message || 'Converted to invoice successfully!');
    await switchSection('invoices');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteDocumentRow(id) {
  if (!confirm('Are you sure you want to delete this document?')) return;
  try {
    await apiCall(`/api/v1/documents/${id}`, { method: 'DELETE' });
    showToast('Document deleted.');
    await refreshCurrentSection();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deletePayment(id) {
  if (!confirm('Are you sure you want to delete this payment receipt?')) return;
  try {
    await apiCall(`/api/v1/payments/${id}`, { method: 'DELETE' });
    showToast('Payment deleted.');
    await refreshCurrentSection();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Dynamic Document Item Row Builder
function addDocumentItemRow(data = {}) {
  const container = document.getElementById('docItemsTableBody');
  if (!container) return;

  const row = document.createElement('tr');
  row.className = 'doc-item-row';
  row.innerHTML = `
    <td>
      <input type="text" class="form-control item-name" placeholder="Item / Service Name" value="${data.name || ''}" required>
      <input type="text" class="form-control item-desc" placeholder="Description (optional)" style="margin-top:4px; font-size:12px;" value="${data.description || ''}">
    </td>
    <td style="width: 80px;">
      <input type="text" class="form-control item-unit" value="${data.unit || 'unit'}">
    </td>
    <td style="width: 80px;">
      <input type="number" class="form-control item-qty" step="any" min="0.01" value="${data.quantity || 1}" oninput="recalculateDocForm()">
    </td>
    <td style="width: 110px;">
      <input type="number" class="form-control item-price" step="0.01" min="0" value="${data.unit_price || 0}" oninput="recalculateDocForm()">
    </td>
    <td style="width: 75px;">
      <input type="number" class="form-control item-disc" step="0.1" min="0" max="100" value="${data.discount_rate || 0}" oninput="recalculateDocForm()">
    </td>
    <td style="width: 75px;">
      <input type="number" class="form-control item-tax" step="0.1" min="0" value="${data.tax_rate || 0}" oninput="recalculateDocForm()">
    </td>
    <td style="width: 110px; text-align: right; vertical-align: middle;">
      <strong class="item-total-display">$0.00</strong>
    </td>
    <td style="width: 40px; text-align: center; vertical-align: middle;">
      <button type="button" class="btn btn-secondary btn-sm" onclick="this.closest('tr').remove(); recalculateDocForm();">✕</button>
    </td>
  `;
  container.appendChild(row);
  recalculateDocForm();
}

function recalculateDocForm() {
  let subtotal = 0;
  let totalDiscount = 0;
  let totalTax = 0;

  const rows = document.querySelectorAll('.doc-item-row');
  rows.forEach((r) => {
    const qty = parseFloat(r.querySelector('.item-qty').value) || 0;
    const price = parseFloat(r.querySelector('.item-price').value) || 0;
    const discRate = parseFloat(r.querySelector('.item-disc').value) || 0;
    const taxRate = parseFloat(r.querySelector('.item-tax').value) || 0;

    const raw = qty * price;
    const disc = raw * (discRate / 100);
    const afterDisc = raw - disc;
    const tax = afterDisc * (taxRate / 100);
    const lineTotal = afterDisc + tax;

    subtotal += raw;
    totalDiscount += disc;
    totalTax += tax;

    r.querySelector('.item-total-display').innerText = lineTotal.toFixed(2);
  });

  const grandTotal = subtotal - totalDiscount + totalTax;

  if (document.getElementById('docSummarySubtotal')) document.getElementById('docSummarySubtotal').innerText = subtotal.toFixed(2);
  if (document.getElementById('docSummaryDiscount')) document.getElementById('docSummaryDiscount').innerText = totalDiscount.toFixed(2);
  if (document.getElementById('docSummaryTax')) document.getElementById('docSummaryTax').innerText = totalTax.toFixed(2);
  if (document.getElementById('docSummaryGrandTotal')) document.getElementById('docSummaryGrandTotal').innerText = grandTotal.toFixed(2);
}

// Create Document Modal
async function openNewDocumentModal(docType = 'invoice') {
  if (AppState.customersCache.length === 0) {
    await loadCustomers();
  }

  if (AppState.customersCache.length === 0) {
    alert('Please create at least one customer first.');
    openCreateCustomerModal();
    return;
  }

  document.getElementById('documentModalTitle').innerText = `Create ${docType.toUpperCase()}`;
  document.getElementById('docFormDocType').value = docType;
  document.getElementById('docFormId').value = '';
  document.getElementById('docItemsTableBody').innerHTML = '';

  const today = new Date().toISOString().split('T')[0];
  document.getElementById('docIssueDate').value = today;

  const dueWrap = document.getElementById('docDueDateWrap');
  const expWrap = document.getElementById('docExpiryDateWrap');

  if (docType === 'quotation' || docType === 'estimate') {
    if (dueWrap) dueWrap.style.display = 'none';
    if (expWrap) expWrap.style.display = 'block';
  } else {
    if (dueWrap) dueWrap.style.display = 'block';
    if (expWrap) expWrap.style.display = 'none';
  }

  const custSelect = document.getElementById('docCustomerSelect');
  custSelect.innerHTML = AppState.customersCache.map((c) => `<option value="${c.id}">${c.display_name}</option>`).join('');

  addDocumentItemRow();
  openModal('documentModal');
}

async function handleDocumentSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const docId = form.docId.value;
  const docType = form.docType.value;

  const items = [];
  document.querySelectorAll('.doc-item-row').forEach((r, idx) => {
    items.push({
      item_order: idx,
      name: r.querySelector('.item-name').value,
      description: r.querySelector('.item-desc').value || null,
      unit: r.querySelector('.item-unit').value || 'unit',
      quantity: parseFloat(r.querySelector('.item-qty').value) || 1,
      unit_price: parseFloat(r.querySelector('.item-price').value) || 0,
      discount_rate: parseFloat(r.querySelector('.item-disc').value) || 0,
      tax_rate: parseFloat(r.querySelector('.item-tax').value) || 0,
    });
  });

  const payload = {
    business_id: AppState.activeBusinessId,
    customer_id: form.customerId.value,
    document_type: docType,
    document_number: form.documentNumber.value || null,
    issue_date: form.issueDate.value,
    due_date: form.dueDate?.value || null,
    expiry_date: form.expiryDate?.value || null,
    currency: form.currency.value || 'USD',
    notes: form.notes?.value || null,
    terms: form.terms?.value || null,
    template_name: form.templateName?.value || 'modern',
    items: items,
  };

  try {
    if (docId) {
      await apiCall(`/api/v1/documents/${docId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      showToast(`${docType.toUpperCase()} updated successfully.`);
    } else {
      await apiCall(`/api/v1/documents`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      showToast(`${docType.toUpperCase()} created successfully.`);
    }
    closeModal('documentModal');
    await refreshCurrentSection();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Payment Recording Modal
function openRecordPaymentModal(docId, docNum, dueAmount, currency) {
  document.getElementById('payModalDocId').value = docId;
  document.getElementById('payModalDocNumber').innerText = docNum;
  document.getElementById('payModalAmount').value = dueAmount;
  document.getElementById('payModalCurrency').innerText = currency;
  document.getElementById('payModalDate').value = new Date().toISOString().split('T')[0];
  openModal('recordPaymentModal');
}

async function handlePaymentSubmit(e) {
  e.preventDefault();
  const form = e.target;

  const payload = {
    business_id: AppState.activeBusinessId,
    document_id: form.docId.value || null,
    amount: parseFloat(form.amount.value),
    payment_date: form.paymentDate.value,
    payment_method: form.paymentMethod.value,
    reference_number: form.refNumber.value || null,
    notes: form.notes.value || null,
    generate_receipt: true,
  };

  try {
    await apiCall('/api/v1/payments', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    showToast('Payment recorded and receipt generated!');
    closeModal('recordPaymentModal');
    await refreshCurrentSection();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// API Key Generation Modal
function openCreateApiKeyModal() {
  document.getElementById('apiKeyName').value = '';
  openModal('createApiKeyModal');
}

async function handleApiKeySubmit(e) {
  e.preventDefault();
  const name = document.getElementById('apiKeyName').value;
  const scopes = Array.from(document.querySelectorAll('.scope-checkbox:checked'))
    .map((c) => c.value)
    .join(',');

  try {
    const res = await apiCall('/api/v1/api-keys', {
      method: 'POST',
      body: JSON.stringify({
        name,
        scopes: scopes || '*',
        business_id: AppState.activeBusinessId,
      }),
    });
    closeModal('createApiKeyModal');

    document.getElementById('newRawApiKeyDisplay').value = res.data.raw_key;
    openModal('keyCreatedModal');
    await loadApiKeys();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function revokeApiKey(id) {
  if (!confirm('Are you sure you want to revoke and delete this API key?')) return;
  try {
    await apiCall(`/api/v1/api-keys/${id}`, { method: 'DELETE' });
    showToast('API key revoked.');
    await loadApiKeys();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Signature Canvas Modal
let targetSignatureBusinessId = null;

function openSignatureModal(bizId) {
  targetSignatureBusinessId = bizId;
  if (AppState.signaturePad) {
    AppState.signaturePad.clear();
  }
  openModal('signatureModal');
}

async function saveDrawnSignature() {
  if (!AppState.signaturePad || AppState.signaturePad.isEmpty) {
    showToast('Please draw a signature first.', 'error');
    return;
  }

  const dataUrl = AppState.signaturePad.toDataURL();
  const formData = new FormData();
  formData.append('signature_data', dataUrl);

  try {
    await apiCall(`/api/v1/businesses/${targetSignatureBusinessId}/signature`, {
      method: 'POST',
      body: formData,
    });
    showToast('Signature saved successfully!');
    closeModal('signatureModal');
    await loadBusinessesList();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Password Change
async function handleChangePasswordSubmit(e) {
  e.preventDefault();
  const form = e.target;
  try {
    await apiCall('/api/v1/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({
        current_password: form.current_password.value,
        new_password: form.new_password.value,
      }),
    });
    showToast('Password changed successfully.');
    form.reset();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Backup & Settings
async function triggerBackupExport() {
  try {
    const res = await fetch('/api/v1/backups/export', {
      headers: { Authorization: `Bearer ${AppState.authToken}` },
    });
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `free_invoice_maker_backup_${new Date().toISOString().slice(0, 10)}.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    showToast('Backup archive downloaded!');
  } catch (err) {
    showToast('Failed to download backup', 'error');
  }
}

async function handleBackupRestore(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (!confirm('Restoring this backup will replace current data. Continue?')) return;

  const formData = new FormData();
  formData.append('file', file);

  try {
    await apiCall('/api/v1/backups/restore', {
      method: 'POST',
      body: formData,
    });
    showToast('Backup restored successfully! Reloading...');
    setTimeout(() => window.location.reload(), 1500);
  } catch (err) {
    showToast(err.message, 'error');
  }
}
