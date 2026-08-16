(function(){
  // Toggle sidebar collapsed state and persist to localStorage
  function toggleSidebar(){
    const sidebar = document.querySelector('.sidebar');
    if(!sidebar) return;
    const collapsed = sidebar.classList.toggle('collapsed');
    localStorage.setItem('fim_sidebar_collapsed', collapsed ? '1' : '0');
  }
  // Expose globally for inline onclick use
  window.toggleSidebar = toggleSidebar;

  // Quick search helper with debounce - routes to invoices view
  window.handleQuickSearch = (function(){
    let timer = null;
    return function(q){
      clearTimeout(timer);
      timer = setTimeout(function(){
        if(!q || q.trim() === '') return;
        if(typeof switchSection === 'function'){
          if(AppState.currentSection !== 'invoices'){
            switchSection('invoices').then(()=>{ if(typeof loadInvoices === 'function') loadInvoices(q); });
          } else {
            if(typeof loadInvoices === 'function') loadInvoices(q);
          }
        }
      }, 300);
    };
  })();

  // Initialize on DOM ready: restore sidebar state and attach button handler
  document.addEventListener('DOMContentLoaded', function(){
    const sidebar = document.querySelector('.sidebar');
    if(sidebar && localStorage.getItem('fim_sidebar_collapsed') === '1'){
      sidebar.classList.add('collapsed');
    }
    const btn = document.getElementById('sidebarToggle');
    if(btn) btn.addEventListener('click', toggleSidebar);
  });
})();
