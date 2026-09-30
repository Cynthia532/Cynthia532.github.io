/**
 * Module: Language Switch (EN / ZH)
 */
function initLanguage() {
  const langBtn = document.getElementById('lang-toggle');
  const langLabel = document.getElementById('lang-label');
  const currentLang = document.body.getAttribute('data-lang') || 'en';
  // Explicit page URLs win over preferences, including links from the room.
  if (!langBtn || !langLabel) return;
  try { localStorage.setItem('lang', currentLang); } catch { /* Optional storage. */ }

  updateLangLabel(langLabel, currentLang);

  langBtn.addEventListener('click', () => {
    const current = document.body.getAttribute('data-lang') || 'en';
    const target = current === 'en' ? 'zh' : 'en';
    try { localStorage.setItem('lang', target); } catch { /* Optional storage. */ }
    redirectToLang(target);
  });
}

function redirectToLang(lang) {
  const routes = { en: document.body.dataset.homeEn, zh: document.body.dataset.homeZh };
  if (routes[lang]) {
    window.location.assign(routes[lang]);
    return;
  }
  const path = window.location.pathname;
  const base = getBasePath();

  if (lang === 'zh') {
    if (!path.includes('_zh')) {
      const newPath = convertPathToLang(path, base, 'zh');
      window.location.href = newPath;
    }
  } else {
    if (path.includes('_zh')) {
      const newPath = convertPathToLang(path, base, 'en');
      window.location.href = newPath;
    }
  }
}

function convertPathToLang(path, base, lang) {
  if (lang === 'zh') {
    if (path === '/' || path === base || path === base + '/' || path.endsWith('/index.html') || path === base + '/index.html') {
      return base + '/index_zh.html';
    }
    return path.replace(/\.html$/, '_zh.html').replace(/\/$/, '_zh.html');
  } else {
    return path.replace('_zh.html', '.html').replace('_zh/', '/');
  }
}

function getBasePath() {
  const metaBase = document.querySelector('base');
  if (metaBase) return metaBase.getAttribute('href').replace(/\/$/, '');
  return '';
}

function updateLangLabel(el, lang) {
  if (lang === 'en') {
    el.innerHTML = '文/<strong>EN</strong>';
  } else {
    el.innerHTML = '<strong>文</strong>/EN';
  }
}
