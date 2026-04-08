/**
 * Module: Table of Contents (Auto-generated)
 * Highlights the TOC item whose heading is the topmost visible one on the page.
 */
function initTOC() {
  const content = document.getElementById('markdown-content');
  const tocNav = document.getElementById('toc-nav');
  if (!content || !tocNav) return;

  const headings = content.querySelectorAll('h2, h3');
  if (headings.length === 0) return;

  const tocItems = [];

  headings.forEach((heading, index) => {
    if (!heading.id) {
      heading.id = 'section-' + index;
    }

    const item = document.createElement('a');
    item.className = 'toc-item' + (heading.tagName === 'H3' ? ' toc-h3' : '');
    item.textContent = heading.textContent.replace(/^\/\/\s*/, '');
    item.href = '#' + heading.id;
    item.addEventListener('click', (e) => {
      e.preventDefault();
      // 先清除hash再设置，确保即使点击同一个锚点也能触发滚动
      history.pushState(null, '', '#' + heading.id);
      // 使用手动计算确保标题露出（navbar 64px + 留白 36px = 100px）
      const targetTop = heading.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: targetTop, behavior: 'smooth' });
      // Close sidebar on mobile after clicking
      closeMobileSidebar();
    });

    tocNav.appendChild(item);
    tocItems.push({ element: item, heading: heading });
  });

  // Scroll-based active state: highlight the topmost visible heading in viewport
  function updateActiveHeading() {
    let activeIndex = -1;
    const navbarHeight = 90; // navbar offset (64px + buffer)

    // Strategy: find the first heading whose top is within or below the viewport top
    // i.e. the topmost heading currently visible on screen
    for (let i = 0; i < tocItems.length; i++) {
      const rect = tocItems[i].heading.getBoundingClientRect();
      if (rect.top >= navbarHeight && rect.top < window.innerHeight) {
        // This heading is visible in viewport — it's the topmost one
        activeIndex = i;
        break;
      }
    }

    // If no heading is found in viewport (all scrolled above), pick the last one
    // that has scrolled past the top
    if (activeIndex === -1) {
      for (let i = tocItems.length - 1; i >= 0; i--) {
        const rect = tocItems[i].heading.getBoundingClientRect();
        if (rect.top < navbarHeight) {
          activeIndex = i;
          break;
        }
      }
    }

    tocItems.forEach((item, i) => {
      item.element.classList.toggle('active', i === activeIndex);
    });
  }

  // Throttle scroll events for performance
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        updateActiveHeading();
        ticking = false;
      });
      ticking = true;
    }
  });

  // Initial check
  updateActiveHeading();
}
