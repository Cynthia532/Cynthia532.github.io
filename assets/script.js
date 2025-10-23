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

// About / Blog switch
document.addEventListener('DOMContentLoaded', () => {
  const aboutBtn = document.getElementById('about-btn');
  const blogBtn = document.getElementById('blog-btn');
  const aboutContent = document.getElementById('about-content');
  const blogFrame = document.getElementById('blog-frame');

  if (aboutBtn && blogBtn) {
    aboutBtn.onclick = () => {
      aboutBtn.classList.add('active');
      blogBtn.classList.remove('active');
      aboutContent.style.display = 'block';
      blogFrame.style.display = 'none';
    };
    blogBtn.onclick = () => {
      blogBtn.classList.add('active');
      aboutBtn.classList.remove('active');
      aboutContent.style.display = 'none';
      blogFrame.style.display = 'block';
    };
  }
});
