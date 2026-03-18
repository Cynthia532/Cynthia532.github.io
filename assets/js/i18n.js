/**
 * Module: i18n Label Update
 */
function initI18nLabels() {
  const lang = document.body.getAttribute('data-lang') || 'en';
  document.querySelectorAll('[data-en][data-zh]').forEach(el => {
    el.textContent = lang === 'zh' ? el.getAttribute('data-zh') : el.getAttribute('data-en');
  });
}
