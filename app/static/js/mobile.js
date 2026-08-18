/**
 * FIM mobile app shell — same API and branding as the desktop ledger.
 */
(function () {
  const state = {
    tab: 'home',
    people: 'customers',
    moreView: 'menu',
  };

  function el(id) {
    return document.getElementById(id);
  }

  function preferredMode() {
    const saved = localStorage.getItem('fim_ui');
    if (saved === 'mobile' || saved === 'desktop') return saved;
    return 'mobile';
  }

  function applyMode(mode) {
    document.body.classList.toggle('app-mode-mobile', mode === 'mobile');
    document.body.classList.toggle('app-mode-desktop', mode !== 'mobile');
    const stage = el('phoneStage');
    if (stage) stage.hidden = false;
    syncFab();
  }

  function useMobile() {
    localStorage.setItem('fim_ui', 'mobile');
    applyMode('mobile');
    refresh();
  }

  function useDesktop() {
    localStorage.setItem('fim_ui', 'desktop');
    applyMode('desktop');
  }

  function setTab(tab) {
    state.tab = tab;
    state.moreView = tab === 'more' ? state.moreView : 'menu';
    document.querySelectorAll('.m-tab').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    document.querySelectorAll('.m-screen').forEach((screen) => {
      screen.classList.toggle('active', screen.id === `m-screen-${tab}`);
    });
    if (tab === 'more') showMoreView(state.moreView);
    syncFab();
    const map = {
      home: 'dashboard',
      invoices: 'invoices',
      people: state.people === 'products' ? 'products' : 'customers',
      more: AppState.currentSection,
    };
    if (tab !== 'more' && typeof switchSection === 'function') {
      switchSection(map[tab] || 'dashboard');
    }
  }

  function syncFab() {
    const fab = el('mFab');
    if (!fab) return;
    const show = document.body.classList.contains('app-mode-mobile') && (state.tab === 'home' || state.tab === 'invoices');
    fab.classList.toggle('hidden', !show);
  }

  function empty(title, hint) {
    return `<div class="m-empty"><strong>${escapeHtml(title)}</strong><p>${escapeHtml(hint)}</p></div>`;
  }

  function money(amount, currency) {
    return escapeHtml(formatMoney(amount, currency));
  }

  function renderHome() {
    const data = AppState.lastDashboard;
    if (!data) {
      el('mHomeMetrics').innerHTML = empty('Loading', 'Fetching your ledger…');
      el('mHomeRecent').innerHTML = '';
      return;
    }
    el('mHomeMetrics').innerHTML = `
      <article class="m-metric"><b>Invoiced</b><strong>${money(data.total_invoiced, data.currency)}</strong></article>
      <article class="m-metric paid"><b>Paid</b><strong>${money(data.total_paid, data.currency)}</strong></article>
      <article class="m-metric due"><b>Outstanding</b><strong>${money(data.total_outstanding, data.currency)}</strong></article>
      <article class="m-metric overdue"><b>Overdue</b><strong>${money(data.total_overdue, data.currency)}</strong></article>
    `;
    const docs = data.recent_documents || [];
    el('mHomeRecent').innerHTML = docs.length
      ? docs.map((doc) => `
          <article class="m-card">
            <div class="m-card-top">
              <div>
                <strong>${escapeHtml(doc.document_number)}</strong>
                <div class="m-card-meta">${escapeHtml(doc.document_type)} · ${escapeHtml(doc.issue_date)}</div>
              </div>
              <span class="status-badge badge-${escapeHtml(doc.status)}">${escapeHtml(formatStatus(doc.status))}</span>
            </div>
            <div class="m-card-top" style="margin-top:10px">
              <small>${money(doc.grand_total, doc.currency)}</small>
              ${doc.pdf_url ? `<a class="btn btn-secondary btn-sm" href="${escapeHtml(doc.pdf_url)}" target="_blank" rel="noopener">PDF</a>` : ''}
            </div>
          </article>
        `).join('')
      : empty('No documents yet', 'Create your first invoice to see activity.');
  }

  function renderInvoices() {
    const list = AppState.lastInvoices || [];
    const box = el('mInvoiceList');
    if (!box) return;
    if (!list.length) {
      box.innerHTML = empty('No invoices', 'Create an invoice or change filters.');
      return;
    }
    box.innerHTML = list.map((inv) => `
      <article class="m-card">
        <div class="m-card-top">
          <div>
            <strong>${escapeHtml(inv.document_number)}</strong>
            <div class="m-card-meta">${escapeHtml(inv.issue_date)} · due ${escapeHtml(inv.due_date || '—')}</div>
          </div>
          <span class="status-badge badge-${escapeHtml(inv.status)}">${escapeHtml(formatStatus(inv.status))}</span>
        </div>
        <div class="m-card-meta">${money(inv.grand_total, inv.currency)} · due ${money(inv.amount_due, inv.currency)}</div>
        <div class="m-card-actions">
          ${inv.pdf_url ? `<a class="btn btn-secondary btn-sm" href="${escapeHtml(inv.pdf_url)}" target="_blank" rel="noopener">PDF</a>` : ''}
          <button type="button" class="btn btn-primary btn-sm" onclick="openRecordPaymentModal('${inv.id}', '${escapeHtml(inv.document_number)}', ${Number(inv.amount_due) || 0}, '${escapeHtml(inv.currency)}')">Pay</button>
        </div>
      </article>
    `).join('');
  }

  function renderPeople() {
    const box = el('mPeopleList');
    if (!box) return;
    if (state.people === 'products') {
      const list = AppState.productsCache || [];
      box.innerHTML = list.length
        ? list.map((p) => `
            <button type="button" class="m-card" onclick="openEditProductModal('${p.id}')">
              <div class="m-card-top">
                <strong>${escapeHtml(p.name)}</strong>
                <span class="money">${money(p.price, p.currency)}</span>
              </div>
              <div class="m-card-meta">${escapeHtml(p.sku || 'No SKU')} · ${escapeHtml(p.unit)}</div>
            </button>
          `).join('')
        : empty('No items', 'Add a product or service.');
      return;
    }
    const list = AppState.customersCache || [];
    box.innerHTML = list.length
      ? list.map((c) => `
          <button type="button" class="m-card" onclick="openEditCustomerModal('${c.id}')">
            <div class="m-card-top">
              <strong>${escapeHtml(c.display_name)}</strong>
            </div>
            <div class="m-card-meta">${escapeHtml(c.company_name || c.email || c.phone || 'No contact')}</div>
          </button>
        `).join('')
      : empty('No customers', 'Add a client to start invoicing.');
  }

  function docCards(list, kind) {
    if (!list.length) return empty(`No ${kind} yet`, 'Nothing here for this business.');
    return list.map((row) => `
      <article class="m-card">
        <div class="m-card-top">
          <div>
            <strong>${escapeHtml(row.document_number || row.receipt_number || '—')}</strong>
            <div class="m-card-meta">${escapeHtml(row.issue_date || row.payment_date || '')}</div>
          </div>
          <span class="status-badge badge-${escapeHtml(row.status || 'issued')}">${escapeHtml(formatStatus(row.status || row.payment_method || 'issued'))}</span>
        </div>
        <div class="m-card-meta">${money(row.grand_total ?? row.amount, row.currency)}</div>
      </article>
    `).join('');
  }

  function renderMoreList() {
    const box = el('mMoreList');
    const title = el('mMoreTitle');
    const views = {
      quotations: ['Quotations', AppState.lastQuotations || []],
      estimates: ['Estimates', AppState.lastEstimates || []],
      receipts: ['Receipts', AppState.lastReceipts || []],
      businesses: ['Businesses', AppState.businesses || []],
      keys: ['API keys', AppState.lastApiKeys || []],
    };
    const current = views[state.moreView];
    if (!current || !box) return;
    title.textContent = current[0];
    if (state.moreView === 'businesses') {
      box.innerHTML = current[1].length
        ? current[1].map((b) => `
            <button type="button" class="m-card" onclick="openEditBusinessModal('${b.id}')">
              <strong>${escapeHtml(b.trading_name || b.name)}</strong>
              <div class="m-card-meta">${escapeHtml(b.default_currency)} · ${escapeHtml(b.city || b.country || '')}</div>
            </button>
          `).join('')
        : empty('No businesses', 'Create a business profile.');
      return;
    }
    if (state.moreView === 'settings') {
      title.textContent = 'Settings';
      box.innerHTML = `
        <button type="button" class="m-menu-item" onclick="triggerBackupExport()">Export backup</button>
        <label class="m-menu-item file-btn">Restore backup
          <input type="file" accept=".zip" hidden onchange="handleBackupRestore(event)">
        </label>
        <p class="m-empty">Password changes stay on the desktop workspace.</p>
      `;
      return;
    }
    if (state.moreView === 'keys') {
      box.innerHTML = current[1].length
        ? current[1].map((k) => `
            <article class="m-card">
              <strong>${escapeHtml(k.name)}</strong>
              <div class="m-card-meta"><code>${escapeHtml(k.key_prefix)}</code></div>
            </article>
          `).join('')
        : empty('No keys', 'Generate a scoped API key from desktop or settings.');
      return;
    }
    box.innerHTML = docCards(current[1], current[0].toLowerCase());
  }

  function showMoreView(view) {
    state.moreView = view;
    const menu = el('mMoreMenu');
    const listWrap = el('mMoreListWrap');
    if (view === 'menu') {
      if (menu) menu.hidden = false;
      if (listWrap) listWrap.hidden = true;
      return;
    }
    if (menu) menu.hidden = true;
    if (listWrap) listWrap.hidden = false;
    const section = { quotations: 'quotations', estimates: 'estimates', receipts: 'receipts', businesses: 'businesses', keys: 'api-keys', settings: 'settings' }[view];
    if (section && typeof switchSection === 'function') switchSection(section);
    renderMoreList();
  }

  function refresh() {
    const biz = (AppState.businesses || []).find((b) => b.id === AppState.activeBusinessId);
    const nameEl = el('mBusinessName');
    if (nameEl) nameEl.textContent = biz ? (biz.trading_name || biz.name) : 'Your ledger';
    const hello = el('mHelloName');
    if (hello) hello.textContent = (AppState.currentUser?.full_name || 'there').split(' ')[0];
    renderHome();
    renderInvoices();
    renderPeople();
    if (state.tab === 'more' && state.moreView !== 'menu') renderMoreList();
  }

  function bind() {
    document.querySelectorAll('.m-tab').forEach((btn) => {
      btn.addEventListener('click', () => setTab(btn.dataset.tab));
    });
    document.querySelectorAll('.m-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.m-chip').forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        const select = el('invoiceStatusFilter');
        if (select) select.value = chip.dataset.status || '';
        if (typeof loadInvoices === 'function') loadInvoices();
      });
    });
    const search = el('mInvoiceSearch');
    if (search) {
      search.addEventListener('input', () => {
        const desktop = el('invoicesSearchInput');
        if (desktop) desktop.value = search.value;
        if (typeof loadInvoices === 'function') loadInvoices();
      });
    }
    document.querySelectorAll('[data-people]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.people = btn.dataset.people;
        document.querySelectorAll('[data-people]').forEach((b) => b.classList.toggle('active', b === btn));
        if (state.people === 'products' && typeof loadProducts === 'function') loadProducts();
        else if (typeof loadCustomers === 'function') loadCustomers();
        renderPeople();
      });
    });
    document.querySelectorAll('[data-more]').forEach((btn) => {
      btn.addEventListener('click', () => showMoreView(btn.dataset.more));
    });
    el('mMoreBack')?.addEventListener('click', () => showMoreView('menu'));
    el('openMobileApp')?.addEventListener('click', useMobile);
    el('useDesktopWorkspace')?.addEventListener('click', useDesktop);
    el('mFab')?.addEventListener('click', () => {
      if (typeof openNewDocumentModal === 'function') openNewDocumentModal('invoice');
    });
  }

  window.FIMMobile = {
    useMobile,
    useDesktop,
    refresh,
    notify() { refresh(); },
  };

  document.addEventListener('DOMContentLoaded', () => {
    bind();
    applyMode(preferredMode());
  });
})();
