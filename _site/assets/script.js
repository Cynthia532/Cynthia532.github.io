/**
 * Main Entry: Sci-Fi Minimal Eco Personal Homepage
 * All module functions are loaded via separate <script> tags in default.html
 * This file only bootstraps them on DOMContentLoaded.
 */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initLanguage();
  initTOC();
  initParticles();
  initI18nLabels();
  initMobile();
});
