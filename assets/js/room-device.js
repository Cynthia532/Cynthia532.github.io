/** Shared, dependency-free gate. Never import the renderer from this module. */
export function supportsDesktopRoom(nav = navigator, media = window.matchMedia.bind(window)) {
  const ua = nav.userAgent || '';
  const ipad = /Mac/i.test(nav.platform || '') && nav.maxTouchPoints > 1;
  const mobile = nav.userAgentData?.mobile || /Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(ua) || ipad;
  return !mobile && media('(any-pointer: fine)').matches && media('(any-hover: hover)').matches;
}
export function readLanguage() {
  const explicit = new URLSearchParams(location.search).get('lang');
  if (explicit === 'en' || explicit === 'zh') return explicit;
  try {
    const saved = localStorage.getItem('lang');
    if (saved === 'en' || saved === 'zh') return saved;
  } catch { /* Browser storage is optional. */ }
  return navigator.language.startsWith('zh') ? 'zh' : 'en';
}
