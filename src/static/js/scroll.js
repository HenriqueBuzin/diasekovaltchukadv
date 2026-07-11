/* src/static/js/scroll.js */

(function () {
  function initNavigation() {
    document.querySelectorAll('.nav-item a[href^="#"]').forEach(function (link) {
      link.addEventListener('click', function (event) {
        const target = document.querySelector(link.getAttribute('href'));
        if (!target) return;

        event.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });

        const menu = document.getElementById('navbarSupportedContent');
        if (menu && menu.classList.contains('show') && window.bootstrap) {
          window.bootstrap.Collapse.getOrCreateInstance(menu).hide();
        }
      });
    });
  }

  window.DKNavigation = { initNavigation };
  document.addEventListener('DOMContentLoaded', initNavigation, { once: true });
})();
