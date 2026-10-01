import { supportsDesktopRoom, readLanguage } from './room-device.js';
const config = JSON.parse(document.getElementById('room-config').textContent);
const lang = readLanguage();
document.documentElement.lang = lang;
if (!supportsDesktopRoom()) {
  location.replace(config.classic[lang]);
} else if (config.homeEntry) {
  const roomURL = new URL(config.room, location.href);
  roomURL.searchParams.set('lang', lang);
  location.replace(roomURL);
} else {
  const loading = document.getElementById('room-loading');
  const root = document.getElementById('room-root');
  const progress = document.getElementById('loading-progress');
  const message = document.getElementById('loading-message');
  const copy = lang === 'zh'
    ? { title: '小屋正在醒来', assets: '正在为你开门…', room: '摆好桌椅，点亮小屋…', avatar: '整理好帽子和头发…', ready: '准备好啦，即将见面', error: '小屋暂时休息一下', failed: '房间暂时无法打开，可以先去经典主页看看。' }
    : { title: 'Waking up the little house', assets: 'Getting the door ready…', room: 'Making the room cozy…', avatar: 'A little finishing touch…', ready: 'All ready. Come on in!', error: 'The house is taking a break', failed: 'The room is unavailable. You can visit a classic homepage below.' };
  document.getElementById('loading-title').textContent = copy.title;
  progress.setAttribute('aria-label', lang === 'zh' ? '准备小屋' : 'Preparing the little house');
  let failed = false;
  let completed = 4;
  // Stage completion, not a timer or an invented download byte count.
  const advance = value => {
    if (failed) return;
    completed = Math.max(completed, value);
    const label = completed < 50 ? copy.assets : completed < 75 ? copy.room : completed < 95 ? copy.avatar : copy.ready;
    progress.setAttribute('aria-valuenow', String(completed));
    progress.setAttribute('aria-valuetext', label);
    document.getElementById('loading-fill').style.width = `${completed}%`;
    document.getElementById('loading-percent').textContent = `${completed}%`;
    message.textContent = label;
  };
  advance(4);
  const fail = () => {
    failed = true;
    root.hidden = true;
    loading.hidden = false;
    loading.classList.remove('is-ready'); loading.classList.add('is-error');
    progress.hidden = true;
    document.getElementById('loading-title').textContent = copy.error;
    message.textContent = copy.failed;
    loading.focus();
  };
  let timer;
  try {
    if (!config.js) throw new Error('Room assets have not been built.');
    let loaded = 0;
    const assetDone = () => advance(8 + Math.round(++loaded / (config.css.length + 1) * 40));
    advance(8);
    const styles = config.css.map(href => new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet'; link.href = href;
      link.onload = () => { assetDone(); resolve(); }; link.onerror = reject;
      document.head.append(link);
    }));
    const timeout = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Room load timed out')), 20000); });
    const module = import(config.js).then(room => { assetDone(); return room; });
    const [room] = await Promise.race([Promise.all([module, ...styles]), timeout]);
    clearTimeout(timer);
    // Render behind the loading screen. Reveal only after the first actual frame.
    root.hidden = false;
    await room.mountRoom(root, config, lang, fail, advance);
    if (!failed) {
      advance(100);
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      if (!failed) loading.classList.add('is-ready');
      await new Promise(resolve => setTimeout(resolve, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 350));
      if (!failed) { loading.hidden = true; document.getElementById('study-canvas')?.focus({ preventScroll: true }); }
    }
  } catch (error) { console.error('Room startup:', error); fail(); }
  finally { clearTimeout(timer); }
}
