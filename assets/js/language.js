/**
 * Module: Language Switch (EN / ZH)
 */
function initLanguage() {
  const langBtn = document.getElementById('lang-toggle');
  const langLabel = document.getElementById('lang-label');
  const currentLang = document.body.getAttribute('data-lang') || 'en';
  const savedLang = localStorage.getItem('lang');

  // If saved language differs from page lang, redirect
  if (savedLang && savedLang !== currentLang) {
    redirectToLang(savedLang);
    return;
  }

  updateLangLabel(langLabel, currentLang);

  langBtn.addEventListener('click', () => {
    const current = document.body.getAttribute('data-lang') || 'en';
    const target = current === 'en' ? 'zh' : 'en';
    localStorage.setItem('lang', target);
    redirectToLang(target);
  });
}

function redirectToLang(lang) {
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
