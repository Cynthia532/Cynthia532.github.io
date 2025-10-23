function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

document.addEventListener('DOMContentLoaded', () => {
  const themeBtn = document.getElementById('theme-toggle');
  const langBtn = document.getElementById('lang-toggle');
  const savedTheme = localStorage.getItem('theme');
  const savedLang = localStorage.getItem('lang');

  if (savedTheme === 'dark') document.body.classList.add('dark');
  if (savedLang === 'zh') switchLang('zh');

  themeBtn.onclick = () => {
    document.body.classList.toggle('dark');
    localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
  };

  langBtn.onclick = () => {
    const current = document.body.getAttribute('data-lang') === 'zh' ? 'en' : 'zh';
    switchLang(current);
    localStorage.setItem('lang', current);
  };
});

function switchLang(lang) {
  document.body.setAttribute('data-lang', lang);
  document.querySelectorAll('[data-lang]').forEach(el => {
    el.style.display = el.getAttribute('data-lang') === lang ? 'block' : 'none';
  });
}
