(function () {
  const MOBILE_BP = 900;

  function isMobile() {
    return window.matchMedia(`(max-width: ${MOBILE_BP}px)`).matches;
  }

  function closeMobileSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const backdrop = document.getElementById('sidebarBackdrop');
    if (sidebar) sidebar.classList.remove('mobile-open');
    if (backdrop) {
      backdrop.classList.remove('active');
      backdrop.hidden = true;
    }
  }

  function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const backdrop = document.getElementById('sidebarBackdrop');
    if (!sidebar) return;

    if (isMobile()) {
      const open = sidebar.classList.toggle('mobile-open');
      if (backdrop) {
        backdrop.hidden = !open;
        backdrop.classList.toggle('active', open);
      }
      return;
    }

    const collapsed = sidebar.classList.toggle('collapsed');
    localStorage.setItem('fim_sidebar_collapsed', collapsed ? '1' : '0');
  }

  window.toggleSidebar = toggleSidebar;
  window.closeMobileSidebar = closeMobileSidebar;

  window.handleQuickSearch = (function () {
    let timer = null;
    return function (q) {
      clearTimeout(timer);
      timer = setTimeout(function () {
        if (!q || q.trim() === '') return;
        if (typeof switchSection === 'function') {
          const apply = () => {
            const input = document.getElementById('invoicesSearchInput');
            if (input) input.value = q;
            if (typeof loadInvoices === 'function') loadInvoices();
          };
          if (AppState.currentSection !== 'invoices') {
            switchSection('invoices').then(apply);
          } else {
            apply();
          }
        }
      }, 300);
    };
  })();

  document.addEventListener('DOMContentLoaded', function () {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar && !isMobile() && localStorage.getItem('fim_sidebar_collapsed') === '1') {
      sidebar.classList.add('collapsed');
    }
    const btn = document.getElementById('sidebarToggle');
    if (btn) btn.addEventListener('click', toggleSidebar);
    const backdrop = document.getElementById('sidebarBackdrop');
    if (backdrop) backdrop.addEventListener('click', closeMobileSidebar);
    window.addEventListener('resize', function () {
      if (!isMobile()) closeMobileSidebar();
    });
  });
})();
