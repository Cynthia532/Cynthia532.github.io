/**
 * Module: Mobile Interactions
 * Handles sidebar toggle, nav drawer, and overlay for mobile devices
 */

function initMobile() {
  createMobileTocButton();
  createSidebarOverlay();
  initMobileMenuBtn();
}

/* --- Mobile TOC floating button --- */
function createMobileTocButton() {
  const btn = document.createElement('button');
  btn.className = 'mobile-toc-btn';
  btn.setAttribute('aria-label', 'Toggle table of contents');
  btn.innerHTML = '☰';
  btn.addEventListener('click', toggleMobileSidebar);
  document.body.appendChild(btn);
}

/* --- Overlay behind sidebar --- */
function createSidebarOverlay() {
  const overlay = document.createElement('div');
  overlay.className = 'sidebar-overlay';
  overlay.id = 'sidebar-overlay';
  overlay.addEventListener('click', closeMobileSidebar);
  document.body.appendChild(overlay);
}

/* --- Mobile hamburger menu for nav links --- */
function initMobileMenuBtn() {
  const menuBtn = document.getElementById('mobile-menu-btn');
  const drawer = document.getElementById('mobile-nav-drawer');
  if (!menuBtn || !drawer) return;

  menuBtn.addEventListener('click', () => {
    const isOpen = drawer.classList.contains('open');
    drawer.classList.toggle('open');
    menuBtn.innerHTML = isOpen ? '☰' : '✕';
  });

  // Close drawer when a nav item is clicked
  drawer.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      drawer.classList.remove('open');
      menuBtn.innerHTML = '☰';
    });
  });
}

/* --- Toggle sidebar (used on tablet/mobile) --- */
function toggleMobileSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (!sidebar) return;

  const isOpen = sidebar.classList.contains('open');
  if (isOpen) {
    closeMobileSidebar();
  } else {
    sidebar.classList.add('open');
    if (overlay) overlay.classList.add('active');
  }
}

/* --- Close sidebar --- */
function closeMobileSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (sidebar) sidebar.classList.remove('open');
  if (overlay) overlay.classList.remove('active');
}
