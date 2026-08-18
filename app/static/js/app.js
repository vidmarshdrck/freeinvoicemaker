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

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatMoney(amount, currency = '') {
  const n = Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return currency ? `${currency} ${n}` : n;
}

function formatStatus(status) {
  return String(status || '').replace(/_/g, ' ');
}

function emptyRow(cols, title, hint) {
  return `<tr><td colspan="${cols}"><div class="empty-state"><div class="empty-state-title">${escapeHtml(title)}</div><p>${escapeHtml(hint)}</p></div></td></tr>`;
}

function setAuthedChrome(user) {
  AppState.currentUser = user;
  const name = user?.full_name || user?.email || 'Administrator';
  const email = user?.email || '';
  const nameEl = document.getElementById('currentUserName');
  const emailEl = document.getElementById('currentUserEmail');
  const avatarEl = document.getElementById('userAvatar');
  if (nameEl) nameEl.textContent = name;
  if (emailEl) emailEl.textContent = email;
  if (avatarEl) avatarEl.textContent = (name || 'A').trim().charAt(0).toUpperCase();
  if (window.FIMMobile) window.FIMMobile.notify();
}

function showLoginGate(message) {
  const gate = document.getElementById('loginGate');
  const err = document.getElementById('loginError');
  if (gate) gate.classList.add('active');
  document.body.classList.add('is-locked');
  if (err) {
    if (message) {
      err.textContent = message;
      err.classList.add('active');
    } else {
      err.textContent = '';
      err.classList.remove('active');
    }
  }
}

function hideLoginGate() {
  const gate = document.getElementById('loginGate');
  if (gate) gate.classList.remove('active');
  document.body.classList.remove('is-locked');
}

// API Helper
async function apiCall(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (AppState.authToken) {
    headers['Authorization'] = `Bearer ${AppState.authToken}`;
  }

  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  try {
    const res = await fetch(endpoint, { ...options, headers });
    if (res.status === 401) {
      if (!endpoint.includes('/auth/login') && !endpoint.includes('/health')) {
        showLoginGate();
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
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'opacity 0.15s ease, transform 0.15s ease';
    setTimeout(() => toast.remove(), 180);
  }, 3500);
}

// Modal Helpers
function openModal(modalId) {
  const m = document.getElementById(modalId);
  if (m) {
    m.classList.add('active');
    const focusable = m.querySelector('input, select, textarea, button');
    if (focusable) focusable.focus();
  }
}

function closeModal(modalId) {
  const m = document.getElementById(modalId);
  if (m) m.classList.remove('active');
}

function closeTopModal() {
  const open = [...document.querySelectorAll('.modal-backdrop.active')];
  const top = open[open.length - 1];
  if (top) top.classList.remove('active');
}

// Generic confirmation helper that returns a Promise resolving to true/false
function showConfirm(title, message, confirmText = 'Confirm') {
  return new Promise((resolve) => {
    const modal = document.getElementById('confirmModal');
    if (!modal) {
      resolve(window.confirm(message));
      return;
    }
    document.getElementById('confirmModalTitle').textContent = title || 'Confirm';
    document.getElementById('confirmModalMessage').textContent = message || 'Are you sure?';
    const btn = document.getElementById('confirmModalConfirmBtn');
    const cancelBtn = modal.querySelector('.modal-footer .btn-secondary');
    const closeBtn = modal.querySelector('.modal-close');
    btn.textContent = confirmText || 'Confirm';

    function finish(value) {
      btn.removeEventListener('click', onConfirm);
      cancelBtn?.removeEventListener('click', onCancel);
      closeBtn?.removeEventListener('click', onCancel);
      closeModal('confirmModal');
      resolve(value);
    }

    function onConfirm() { finish(true); }
    function onCancel() { finish(false); }

    btn.addEventListener('click', onConfirm);
    cancelBtn?.addEventListener('click', onCancel);
    closeBtn?.addEventListener('click', onCancel);
    openModal('confirmModal');
  });
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeTopModal();
});

// App Initialization
document.addEventListener('DOMContentLoaded', async () => {
  initNavigation();
  initSignaturePad();
  const authed = await checkAuthStatus();
  if (!authed) return;
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

  if (window.closeMobileSidebar) window.closeMobileSidebar();
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
  if (!AppState.authToken) {
    showLoginGate();
    return false;
  }
  try {
    const res = await apiCall('/api/v1/auth/me');
    setAuthedChrome(res.data);
    hideLoginGate();
    return true;
  } catch {
    localStorage.removeItem('fim_token');
    AppState.authToken = null;
    showLoginGate();
    return false;
  }
}

function showLoginModal() {
  showLoginGate();
}

async function handleLoginSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const btn = document.getElementById('loginSubmitBtn');
  const err = document.getElementById('loginError');
  if (err) {
    err.textContent = '';
    err.classList.remove('active');
  }
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Signing in...';
  }
  try {
    const loginRes = await apiCall('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: form.email.value.trim(),
        password: form.password.value,
      }),
    });
    AppState.authToken = loginRes.data.access_token;
    localStorage.setItem('fim_token', AppState.authToken);
    setAuthedChrome(loginRes.data.user);
    hideLoginGate();
    form.reset();
    await loadBusinesses();
    await switchSection('dashboard');
  } catch (error) {
    showLoginGate(error.message || 'Invalid email or password.');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Sign in';
    }
  }
}

async function handleLogout() {
  try {
    await apiCall('/api/v1/auth/logout', { method: 'POST' });
  } catch {
    // Cookie clear is best-effort; always drop the local token.
  }
  AppState.authToken = null;
  AppState.currentUser = null;
  localStorage.removeItem('fim_token');
  showLoginGate();
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
    if (window.FIMMobile) window.FIMMobile.notify();
  } catch (err) {
    console.error('Failed to load businesses:', err);
  }
}

async function loadBusinessesList() {
  const container = document.getElementById('businessesTableBody');
  if (!container) return;

  container.innerHTML = emptyRow(6, 'Loading', 'Fetching business profiles...');
  try {
    const res = await apiCall('/api/v1/businesses');
    const list = res.data || [];

    if (list.length === 0) {
      container.innerHTML = emptyRow(6, 'No businesses yet', 'Create a profile to start invoicing.');
      return;
    }

    container.innerHTML = list
      .map(
        (b) => `
      <tr>
        <td><strong>${escapeHtml(b.trading_name || b.name)}</strong> ${b.is_default ? '<span class="status-badge badge-paid">Default</span>' : ''}</td>
        <td>${escapeHtml(b.registration_number || '-')}</td>
        <td>${escapeHtml(b.tax_number || '-')}</td>
        <td>${escapeHtml(b.email || '-')} / ${escapeHtml(b.phone || '-')}</td>
        <td>${escapeHtml(b.default_currency)} (${escapeHtml(b.template_name)})</td>
        <td>
          <div class="table-actions">
            <button type="button" class="btn btn-secondary btn-sm" onclick="openEditBusinessModal('${b.id}')">Edit</button>
            <button type="button" class="btn btn-secondary btn-sm" onclick="openSignatureModal('${b.id}')">Signature</button>
            <button type="button" class="btn btn-danger btn-sm" onclick="deleteBusiness('${b.id}')">Delete</button>
          </div>
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
  const form = document.getElementById('businessForm');
  form.reset();
  document.getElementById('businessFormId').value = '';
  document.getElementById('businessModalTitle').innerText = 'Add Business';
  document.getElementById('businessFormSaveBtn').disabled = false;
  document.getElementById('businessFormSaveBtn').innerText = 'Save Business';
  document.getElementById('businessFormSaveBtn').style.display = '';
  Array.from(form.querySelectorAll('input, textarea, select')).forEach((i) => i.removeAttribute('disabled'));
  openModal('businessModal');
}

async function openEditBusinessModal(id) {
  try {
    const res = await apiCall(`/api/v1/businesses/${id}`);
    const b = res.data;
    const form = document.getElementById('businessForm');
    form.reset();
    document.getElementById('businessFormId').value = b.id;
    document.getElementById('businessName').value = b.name || '';
    document.getElementById('businessTradingName').value = b.trading_name || '';
    document.getElementById('businessEmail').value = b.email || '';
    document.getElementById('businessPhone').value = b.phone || '';
    document.getElementById('businessWebsite').value = b.website || '';
    document.getElementById('businessAddress').value = b.address || '';
    document.getElementById('businessCity').value = b.city || '';
    document.getElementById('businessCountry').value = b.country || '';
    document.getElementById('businessCurrency').value = b.default_currency || 'USD';
    document.getElementById('businessRegistration').value = b.registration_number || '';
    document.getElementById('businessTaxNumber').value = b.tax_number || '';
    document.getElementById('businessPaymentInfo').value = b.payment_instructions || '';
    document.getElementById('businessModalTitle').innerText = 'Edit Business';
    document.getElementById('businessFormSaveBtn').disabled = false;
    document.getElementById('businessFormSaveBtn').innerText = 'Save Business';
    document.getElementById('businessFormSaveBtn').style.display = '';
    Array.from(form.querySelectorAll('input, textarea, select')).forEach((i) => i.removeAttribute('disabled'));
    openModal('businessModal');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteBusiness(id) {
  if (!(await showConfirm('Delete Business', 'Are you sure you want to delete this business profile?', 'Delete'))) return;
  try {
    await apiCall(`/api/v1/businesses/${id}`, { method: 'DELETE' });
    showToast('Business profile deleted.');
    await loadBusinesses();
    await loadBusinessesList();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function handleBusinessSubmit(e) {
  e.preventDefault();
  const saveBtn = document.getElementById('businessFormSaveBtn');
  saveBtn.disabled = true;
  saveBtn.innerText = 'Saving...';
  const id = document.getElementById('businessFormId').value || null;
  const payload = {
    name: document.getElementById('businessName').value.trim(),
    trading_name: document.getElementById('businessTradingName').value.trim() || null,
    email: document.getElementById('businessEmail').value.trim() || null,
    phone: document.getElementById('businessPhone').value.trim() || null,
    website: document.getElementById('businessWebsite').value.trim() || null,
    address: document.getElementById('businessAddress').value.trim() || null,
    city: document.getElementById('businessCity').value.trim() || null,
    country: document.getElementById('businessCountry').value.trim() || null,
    default_currency: document.getElementById('businessCurrency').value || 'USD',
    registration_number: document.getElementById('businessRegistration').value.trim() || null,
    tax_number: document.getElementById('businessTaxNumber').value.trim() || null,
    payment_instructions: document.getElementById('businessPaymentInfo').value.trim() || null,
  };
  try {
    let savedBusiness;
    if (id) {
      const response = await apiCall(`/api/v1/businesses/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      savedBusiness = response.data;
      showToast('Business updated successfully');
    } else {
      const response = await apiCall('/api/v1/businesses', { method: 'POST', body: JSON.stringify(payload) });
      savedBusiness = response.data;
      document.getElementById('businessFormId').value = savedBusiness.id;
      showToast('Business created successfully');
    }

    const logo = document.getElementById('businessLogo').files[0];
    if (logo) {
      const logoForm = new FormData();
      logoForm.append('file', logo);
      await apiCall(`/api/v1/businesses/${savedBusiness.id}/logo`, {
        method: 'POST',
        body: logoForm,
      });
      showToast('Business logo uploaded successfully');
    }

    closeModal('businessModal');
    await loadBusinesses();
    await loadBusinessesList();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerText = 'Save Business';
  }
}

// Dashboard
async function loadDashboard() {
  if (!AppState.activeBusinessId) return;

  try {
    const res = await apiCall(`/api/v1/stats/dashboard?business_id=${AppState.activeBusinessId}`);
    const data = res.data;
    AppState.lastDashboard = data;
    if (window.FIMMobile) window.FIMMobile.notify();

    document.getElementById('statTotalInvoiced').innerText = formatMoney(data.total_invoiced, data.currency);
    document.getElementById('statTotalPaid').innerText = formatMoney(data.total_paid, data.currency);
    document.getElementById('statTotalOutstanding').innerText = formatMoney(data.total_outstanding, data.currency);
    document.getElementById('statTotalOverdue').innerText = formatMoney(data.total_overdue, data.currency);

    document.getElementById('countInvoices').innerText = data.count_invoices;
    document.getElementById('countReceipts').innerText = data.count_receipts;

    const recentContainer = document.getElementById('recentDocumentsTableBody');
    if (!recentContainer) return;

    if (!data.recent_documents || data.recent_documents.length === 0) {
      recentContainer.innerHTML = emptyRow(6, 'No documents yet', 'Create an invoice or quotation to see activity here.');
      return;
    }

    recentContainer.innerHTML = data.recent_documents
      .map(
        (doc) => `
      <tr>
        <td><strong>${escapeHtml(doc.document_number)}</strong></td>
        <td><span class="status-badge badge-draft">${escapeHtml(doc.document_type)}</span></td>
        <td>${escapeHtml(doc.issue_date)}</td>
        <td class="num">${escapeHtml(formatMoney(doc.grand_total, doc.currency))}</td>
        <td><span class="status-badge badge-${escapeHtml(doc.status)}">${escapeHtml(formatStatus(doc.status))}</span></td>
        <td>
          <a href="${escapeHtml(doc.pdf_url || '#')}" target="_blank" rel="noopener" class="btn btn-secondary btn-sm">PDF</a>
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
    if (window.FIMMobile) window.FIMMobile.notify();

    if (AppState.customersCache.length === 0) {
      container.innerHTML = emptyRow(6, 'No customers yet', 'Add a client to start creating invoices.');
      return;
    }

    container.innerHTML = AppState.customersCache
      .map(
        (c) => `
      <tr>
        <td><strong>${escapeHtml(c.display_name)}</strong></td>
        <td>${escapeHtml(c.company_name || '-')}</td>
        <td>${escapeHtml(c.email || '-')}</td>
        <td>${escapeHtml(c.phone || '-')}</td>
        <td>${escapeHtml([c.city, c.country].filter(Boolean).join(', ') || '-')}</td>
        <td>
          <div class="table-actions">
            <button type="button" class="btn btn-secondary btn-sm" onclick="openEditCustomerModal('${c.id}')">Edit</button>
            <button type="button" class="btn btn-danger btn-sm" onclick="deleteCustomer('${c.id}')">Delete</button>
          </div>
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
  const form = document.getElementById('customerForm');
  form.reset();
  document.getElementById('customerFormId').value = '';
  document.getElementById('customerModalTitle').innerText = 'Add Customer';
  const saveBtn = document.getElementById('customerFormSaveBtn');
  saveBtn.disabled = false;
  saveBtn.innerText = 'Save Customer';
  Array.from(form.querySelectorAll('input, textarea')).forEach((i) => i.removeAttribute('disabled'));
  document.getElementById('customerFormSaveBtn').style.display = '';
  openModal('customerModal');
}

async function openEditCustomerModal(id) {
  try {
    const res = await apiCall(`/api/v1/customers/${id}`);
    const c = res.data;
    document.getElementById('customerFormId').value = c.id;
    document.getElementById('customerDisplayName').value = c.display_name || '';
    document.getElementById('customerCompany').value = c.company_name || '';
    document.getElementById('customerEmail').value = c.email || '';
    document.getElementById('customerPhone').value = c.phone || '';
    document.getElementById('customerAddress').value = c.address || '';
    document.getElementById('customerCity').value = c.city || '';
    document.getElementById('customerCountry').value = c.country || '';
    document.getElementById('customerTaxNumber').value = c.tax_number || '';
    document.getElementById('customerNotes').value = c.notes || '';
    document.getElementById('customerModalTitle').innerText = 'Edit Customer';
    const form = document.getElementById('customerForm');
    Array.from(form.querySelectorAll('input, textarea')).forEach((i) => i.removeAttribute('disabled'));
    const saveBtn = document.getElementById('customerFormSaveBtn');
    saveBtn.style.display = '';
    saveBtn.disabled = false;
    saveBtn.innerText = 'Save Customer';
    openModal('customerModal');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function viewCustomerDetail(id) {
  return openEditCustomerModal(id);
}

async function deleteCustomer(id) {
  if (!(await showConfirm('Delete Customer', 'Are you sure you want to delete this customer?', 'Delete'))) return;
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

async function handleCustomerSubmit(e) {
  e.preventDefault();
  const saveBtn = document.getElementById('customerFormSaveBtn');
  saveBtn.disabled = true;
  saveBtn.innerText = 'Saving...';
  const id = document.getElementById('customerFormId').value || null;
  const payload = {
    business_id: AppState.activeBusinessId,
    display_name: document.getElementById('customerDisplayName').value.trim(),
    company_name: document.getElementById('customerCompany').value.trim() || null,
    email: document.getElementById('customerEmail').value.trim() || null,
    phone: document.getElementById('customerPhone').value.trim() || null,
    address: document.getElementById('customerAddress').value.trim() || null,
    city: document.getElementById('customerCity').value.trim() || null,
    country: document.getElementById('customerCountry').value.trim() || null,
    tax_number: document.getElementById('customerTaxNumber').value.trim() || null,
    notes: document.getElementById('customerNotes').value.trim() || null,
  };
  try {
    if (id) {
      await apiCall(`/api/v1/customers/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      showToast('Customer updated successfully');
    } else {
      await apiCall('/api/v1/customers', { method: 'POST', body: JSON.stringify(payload) });
      showToast('Customer created successfully');
    }
    closeModal('customerModal');
    await loadCustomers();
  } catch (err) {
    showToast(err.message || 'Failed to save customer', 'error');
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerText = 'Save Customer';
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
    if (window.FIMMobile) window.FIMMobile.notify();

    if (AppState.productsCache.length === 0) {
      container.innerHTML = emptyRow(6, 'No items yet', 'Add products or services to reuse on invoices.');
      return;
    }

    container.innerHTML = AppState.productsCache
      .map(
        (p) => `
      <tr>
        <td><strong>${escapeHtml(p.name)}</strong></td>
        <td>${escapeHtml(p.sku || '-')}</td>
        <td>${escapeHtml(p.unit)}</td>
        <td class="num">${escapeHtml(formatMoney(p.price, p.currency))}</td>
        <td>${escapeHtml(p.tax_rate)}%</td>
        <td>
          <div class="table-actions">
            <button type="button" class="btn btn-secondary btn-sm" onclick="openEditProductModal('${p.id}')">Edit</button>
            <button type="button" class="btn btn-danger btn-sm" onclick="deleteProduct('${p.id}')">Delete</button>
          </div>
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
  const form = document.getElementById('productForm');
  form.reset();
  document.getElementById('productFormId').value = '';
  document.getElementById('productModalTitle').innerText = 'Add Product / Service';
  document.getElementById('productFormSaveBtn').disabled = false;
  document.getElementById('productFormSaveBtn').innerText = 'Save Item';
  document.getElementById('productFormSaveBtn').style.display = '';
  Array.from(form.querySelectorAll('input, textarea, select')).forEach((i) => i.removeAttribute('disabled'));
  openModal('productModal');
}

async function openEditProductModal(id) {
  try {
    const res = await apiCall(`/api/v1/products/${id}`);
    const p = res.data;
    document.getElementById('productFormId').value = p.id;
    document.getElementById('productName').value = p.name || '';
    document.getElementById('productSku').value = p.sku || '';
    document.getElementById('productUnit').value = p.unit || 'unit';
    document.getElementById('productCurrency').value = p.currency || 'USD';
    document.getElementById('productPrice').value = p.price ?? 0;
    document.getElementById('productTax').value = p.tax_rate ?? 0;
    document.getElementById('productType').value = p.type || 'product';
    document.getElementById('productDescription').value = p.description || '';
    document.getElementById('productModalTitle').innerText = 'Edit Product / Service';
    const form = document.getElementById('productForm');
    Array.from(form.querySelectorAll('input, textarea, select')).forEach((i) => i.removeAttribute('disabled'));
    const saveBtn = document.getElementById('productFormSaveBtn');
    saveBtn.style.display = '';
    saveBtn.disabled = false;
    saveBtn.innerText = 'Save Item';
    openModal('productModal');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteProduct(id) {
  if (!(await showConfirm('Delete Item', 'Are you sure you want to delete this item?', 'Delete'))) return;
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

async function handleProductSubmit(e) {
  e.preventDefault();
  const saveBtn = document.getElementById('productFormSaveBtn');
  saveBtn.disabled = true;
  saveBtn.innerText = 'Saving...';
  const id = document.getElementById('productFormId').value || null;
  const payload = {
    business_id: AppState.activeBusinessId,
    name: document.getElementById('productName').value.trim(),
    sku: document.getElementById('productSku').value.trim() || null,
    unit: document.getElementById('productUnit').value || 'unit',
    currency: document.getElementById('productCurrency').value || 'USD',
    price: parseFloat(document.getElementById('productPrice').value) || 0,
    tax_rate: parseFloat(document.getElementById('productTax').value) || 0,
    type: document.getElementById('productType').value || 'product',
    description: document.getElementById('productDescription').value.trim() || null,
  };
  try {
    if (id) {
      await apiCall(`/api/v1/products/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      showToast('Product updated successfully');
    } else {
      await apiCall('/api/v1/products', { method: 'POST', body: JSON.stringify(payload) });
      showToast('Product created successfully');
    }
    closeModal('productModal');
    await loadProducts();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerText = 'Save Item';
  }
}

// Invoices
async function loadInvoices() {
  if (!AppState.activeBusinessId) return;

  const container = document.getElementById('invoicesTableBody');
  if (!container) return;
  const search = document.getElementById('invoicesSearchInput')?.value?.trim() || '';
  const statusFilter = document.getElementById('invoiceStatusFilter')?.value || '';

  try {
    const params = new URLSearchParams({ business_id: AppState.activeBusinessId });
    if (statusFilter) params.set('status', statusFilter);
    if (search) params.set('q', search);
    const res = await apiCall(`/api/v1/invoices?${params.toString()}`);
    const list = res.data || [];
    AppState.lastInvoices = list;
    if (window.FIMMobile) window.FIMMobile.notify();

    if (list.length === 0) {
      container.innerHTML = emptyRow(7, 'No invoices found', 'Create an invoice or adjust your filters.');
      return;
    }

    container.innerHTML = list
      .map(
        (inv) => `
      <tr>
        <td><strong>${escapeHtml(inv.document_number)}</strong></td>
        <td>${escapeHtml(inv.issue_date)}</td>
        <td>${escapeHtml(inv.due_date || '-')}</td>
        <td class="num">${escapeHtml(formatMoney(inv.grand_total, inv.currency))}</td>
        <td class="num">${escapeHtml(formatMoney(inv.amount_due, inv.currency))}</td>
        <td><span class="status-badge badge-${escapeHtml(inv.status)}">${escapeHtml(formatStatus(inv.status))}</span></td>
        <td>
          <div class="table-actions">
            <a href="${escapeHtml(inv.pdf_url || '#')}" target="_blank" rel="noopener" class="btn btn-secondary btn-sm">PDF</a>
            <button type="button" class="btn btn-primary btn-sm" onclick="openRecordPaymentModal('${inv.id}', '${escapeHtml(inv.document_number)}', ${Number(inv.amount_due) || 0}, '${escapeHtml(inv.currency)}')">Pay</button>
            <button type="button" class="btn btn-danger btn-sm" onclick="deleteDocumentRow('${inv.id}')">Delete</button>
          </div>
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
    AppState.lastQuotations = list;
    if (window.FIMMobile) window.FIMMobile.notify();

    if (list.length === 0) {
      container.innerHTML = emptyRow(6, 'No quotations yet', 'Create a quotation and convert it to an invoice when accepted.');
      return;
    }

    container.innerHTML = list
      .map(
        (q) => `
      <tr>
        <td><strong>${escapeHtml(q.document_number)}</strong></td>
        <td>${escapeHtml(q.issue_date)}</td>
        <td>${escapeHtml(q.expiry_date || '-')}</td>
        <td class="num">${escapeHtml(formatMoney(q.grand_total, q.currency))}</td>
        <td><span class="status-badge badge-${escapeHtml(q.status)}">${escapeHtml(formatStatus(q.status))}</span></td>
        <td>
          <div class="table-actions">
            <a href="${escapeHtml(q.pdf_url || '#')}" target="_blank" rel="noopener" class="btn btn-secondary btn-sm">PDF</a>
            ${q.status !== 'converted' ? `<button type="button" class="btn btn-primary btn-sm" onclick="convertDocToInvoice('${q.id}', 'quotations')">Convert</button>` : ''}
            <button type="button" class="btn btn-danger btn-sm" onclick="deleteDocumentRow('${q.id}')">Delete</button>
          </div>
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
    AppState.lastEstimates = list;
    if (window.FIMMobile) window.FIMMobile.notify();

    if (list.length === 0) {
      container.innerHTML = emptyRow(6, 'No estimates yet', 'Draft an estimate and convert it once the client approves.');
      return;
    }

    container.innerHTML = list
      .map(
        (est) => `
      <tr>
        <td><strong>${escapeHtml(est.document_number)}</strong></td>
        <td>${escapeHtml(est.issue_date)}</td>
        <td>${escapeHtml(est.expiry_date || '-')}</td>
        <td class="num">${escapeHtml(formatMoney(est.grand_total, est.currency))}</td>
        <td><span class="status-badge badge-${escapeHtml(est.status)}">${escapeHtml(formatStatus(est.status))}</span></td>
        <td>
          <div class="table-actions">
            <a href="${escapeHtml(est.pdf_url || '#')}" target="_blank" rel="noopener" class="btn btn-secondary btn-sm">PDF</a>
            ${est.status !== 'converted' ? `<button type="button" class="btn btn-primary btn-sm" onclick="convertDocToInvoice('${est.id}', 'estimates')">Convert</button>` : ''}
            <button type="button" class="btn btn-danger btn-sm" onclick="deleteDocumentRow('${est.id}')">Delete</button>
          </div>
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
    AppState.lastReceipts = list;
    if (window.FIMMobile) window.FIMMobile.notify();

    if (list.length === 0) {
      container.innerHTML = emptyRow(6, 'No receipts yet', 'Record a payment on an invoice to generate a receipt.');
      return;
    }

    container.innerHTML = list
      .map(
        (r) => `
      <tr>
        <td><strong>${escapeHtml(r.receipt_number || '-')}</strong></td>
        <td>${escapeHtml(r.payment_date)}</td>
        <td>${escapeHtml(r.payment_method)}</td>
        <td>${escapeHtml(r.reference_number || '-')}</td>
        <td class="num"><strong>${escapeHtml(formatMoney(r.amount, r.currency))}</strong></td>
        <td>
          <div class="table-actions">
            <a href="${escapeHtml(r.pdf_url || '#')}" target="_blank" rel="noopener" class="btn btn-secondary btn-sm">PDF</a>
            <button type="button" class="btn btn-danger btn-sm" onclick="deletePayment('${r.id}')">Delete</button>
          </div>
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
    AppState.lastApiKeys = list;
    if (window.FIMMobile) window.FIMMobile.notify();

    if (list.length === 0) {
      container.innerHTML = emptyRow(6, 'No API keys yet', 'Generate a scoped key for Hermes, n8n, or your own scripts.');
      return;
    }

    container.innerHTML = list
      .map(
        (k) => `
      <tr>
        <td><strong>${escapeHtml(k.name)}</strong></td>
        <td><code>${escapeHtml(k.key_prefix)}</code></td>
        <td><code>${escapeHtml(k.scopes)}</code></td>
        <td>${escapeHtml(new Date(k.created_at).toLocaleDateString())}</td>
        <td>${k.last_used_at ? escapeHtml(new Date(k.last_used_at).toLocaleDateString()) : 'Never'}</td>
        <td>
          <button type="button" class="btn btn-danger btn-sm" onclick="revokeApiKey('${k.id}')">Revoke</button>
        </td>
      </tr>
    `
      )
      .join('');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function loadSettings() {
  // Settings view is static with form handlers
}

async function convertDocToInvoice(id, routePrefix) {
  if (!(await showConfirm('Convert Document', 'Convert this document into a new Invoice?', 'Convert'))) return;
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
  if (!(await showConfirm('Delete Document', 'Are you sure you want to delete this document?', 'Delete'))) return;
  try {
    await apiCall(`/api/v1/documents/${id}`, { method: 'DELETE' });
    showToast('Document deleted.');
    await refreshCurrentSection();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deletePayment(id) {
  if (!(await showConfirm('Delete Payment', 'Are you sure you want to delete this payment receipt?', 'Delete'))) return;
  try {
    await apiCall(`/api/v1/payments/${id}`, { method: 'DELETE' });
    showToast('Payment deleted.');
    await refreshCurrentSection();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function addDocumentItemRow(data = {}) {
  const container = document.getElementById('docItemsTableBody');
  if (!container) return;

  const row = document.createElement('tr');
  row.className = 'doc-item-row';
  row.innerHTML = `
    <td>
      <input type="text" class="form-control item-name" placeholder="Item / Service Name" value="${escapeHtml(data.name || '')}" required>
      <input type="text" class="form-control item-desc" placeholder="Description (optional)" style="margin-top:4px; font-size:12px;" value="${escapeHtml(data.description || '')}">
    </td>
    <td style="width: 80px;">
      <input type="text" class="form-control item-unit" value="${escapeHtml(data.unit || 'unit')}">
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
      <strong class="item-total-display money">0.00</strong>
    </td>
    <td style="width: 40px; text-align: center; vertical-align: middle;">
      <button type="button" class="btn btn-ghost btn-sm" aria-label="Remove row" onclick="this.closest('tr').remove(); recalculateDocForm();">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
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

async function openNewDocumentModal(docType = 'invoice') {
  if (AppState.customersCache.length === 0) {
    await loadCustomers();
  }

  if (AppState.customersCache.length === 0) {
    showToast('Please create at least one customer first.', 'error');
    openCreateCustomerModal();
    return;
  }

  document.getElementById('documentModalTitle').innerText = `Create ${docType.charAt(0).toUpperCase()}${docType.slice(1)}`;
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
  custSelect.innerHTML = AppState.customersCache
    .map((c) => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.display_name)}</option>`)
    .join('');

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
  if (!(await showConfirm('Revoke API Key', 'Are you sure you want to revoke and delete this API key?', 'Revoke'))) return;
  try {
    await apiCall(`/api/v1/api-keys/${id}`, { method: 'DELETE' });
    showToast('API key revoked.');
    await loadApiKeys();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

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

async function triggerBackupExport() {
  try {
    const res = await fetch('/api/v1/backups/export', { headers: { Authorization: `Bearer ${AppState.authToken}` } });
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

  if (!(await showConfirm('Restore Backup', 'Restoring this backup will replace current data. Continue?', 'Restore'))) return;

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

