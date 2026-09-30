import { HATS, TOPS, type Lang, type Outfit, type TargetId, type Area } from './domain';
export type Config = { classic: Record<Lang, string>; pdf: string; blog: string };
const words = {
  zh: {
    language: 'EN', walk: '移动', or: '或', rotate: '旋转', drag: '左键拖动',
    door: '推门进入', bell: '门铃 · 经典主页', exit: '出门', 'cv-zh': '中文', 'cv-en': 'English',
    blog: '技术笔记', papers: 'Publications', wardrobe: '衣柜', close: '关闭',
    near: '点击', far: '走近一点', empty: '这里正在慢慢装满，敬请期待。',
    hats: '帽子', tops: '上衣', reset: '恢复默认', saved: '装扮保存在当前浏览器。',
    unsaved: '装扮已更换；当前浏览器无法保存偏好。', pdf: '下载现有 PDF ↗', full: '打开普通版 ↗',
    cap: '棒球帽', beret: '贝雷帽', bucket: '渔夫帽', none: '不戴帽子', grey: '灰蓝', pink: '草莓粉', yellow: '奶油黄',
    blogLink: '打开博客页面 ↗'
  },
  en: {
    language: '中文', walk: 'Move', or: 'or', rotate: 'Rotate', drag: 'Left-drag',
    door: 'Come inside', bell: 'Doorbell · Classic homepage', exit: 'Step outside', 'cv-zh': '中文', 'cv-en': 'English',
    blog: 'Notes & blog', papers: 'Publications', wardrobe: 'Wardrobe', close: 'Close',
    near: 'Click', far: 'A little closer', empty: 'A little space for things to come.',
    hats: 'Hats', tops: 'Tops', reset: 'Restore default', saved: 'Your outfit is saved in this browser.',
    unsaved: 'Outfit changed. This browser cannot save preferences.', pdf: 'Download current PDF ↗', full: 'Open classic page ↗',
    cap: 'Baseball cap', beret: 'Beret', bucket: 'Bucket hat', none: 'No hat', grey: 'Grey & blue', pink: 'Strawberry', yellow: 'Butter',
    blogLink: 'Open the blog ↗'
  }
};
type Word = keyof typeof words.zh;
export class RoomUI {
  canvas: HTMLCanvasElement;
  dialog: HTMLDialogElement;
  private lang: Lang;
  private area: Area = 'porch';
  private noticeTimer = 0;
  onTarget: (id: TargetId) => void = () => {};
  onClose: () => void = () => {};
  onLanguage: () => void = () => {};
  onOutfit: (value: Outfit) => void = () => {};
  constructor(public root: HTMLElement, private config: Config, lang: Lang) {
    this.lang = lang;
    root.innerHTML = `
      <div class="study-scene"><canvas id="study-canvas" tabindex="0" aria-label="3D room"></canvas></div>
      <header class="study-header">
        <button id="room-language" aria-label="Switch language / 切换语言"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/></svg><span data-word="language"></span></button>
      </header>
      <div id="hover-label" class="hover-label" hidden></div>
      <p id="room-notice" class="room-notice" role="status" aria-live="polite" hidden></p>
      <div id="movement-hint" class="movement-hint"><span class="hint-group"><span class="key-group"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></span><span data-word="or"></span><span class="key-group"><kbd>↑</kbd><kbd>←</kbd><kbd>↓</kbd><kbd>→</kbd></span><span data-word="walk"></span></span><span class="hint-group"><span class="key-group"><kbd>Q</kbd><kbd>E</kbd></span><span data-word="or"></span><span data-word="drag"></span><span data-word="rotate"></span></span></div>
      <div id="scene-actions" class="scene-actions" aria-label="Objects"></div>
      <dialog id="study-dialog" class="study-dialog" aria-labelledby="dialog-title">
        <header><h2 id="dialog-title"></h2><button id="close-panel"><kbd>Esc</kbd><span data-word="close"></span></button></header>
        <div id="document-body" class="document-body" tabindex="0"></div>
        <footer id="dialog-footer"></footer>
      </dialog>`;
    this.canvas = root.querySelector('canvas')!;
    this.dialog = root.querySelector('dialog')!;
    root.querySelector('#room-language')!.addEventListener('click', () => this.onLanguage());
    root.querySelector('#close-panel')!.addEventListener('click', () => this.onClose());
    this.dialog.addEventListener('cancel', e => { e.preventDefault(); this.onClose(); });
    this.dialog.addEventListener('click', event => {
      const a = (event.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
      if (!a) return;
      const id = decodeURIComponent(a.hash.slice(1));
      const heading = this.dialog.querySelector<HTMLElement>(`[id="${CSS.escape(id)}"]`);
      if (heading) { event.preventDefault(); heading.scrollIntoView({ block: 'start' }); }
    });
    this.setLanguage(lang);
  }
  t(key: Word) { return words[this.lang][key]; }
  setLanguage(lang: Lang) {
    this.lang = lang; document.documentElement.lang = lang;
    this.root.querySelectorAll<HTMLElement>('[data-word]').forEach(el => { el.textContent = this.t(el.dataset.word as Word); });
    this.canvas.setAttribute('aria-label', lang === 'zh' ? '3D 小书房；WASD 或方向键移动，Q/E 或左键拖动旋转视角' : '3D study; WASD or arrows to move, Q/E or left-drag to rotate');
    this.setArea(this.area);
  }
  setArea(area: Area) {
    this.area = area;
    const actions = this.root.querySelector('#scene-actions')!; actions.replaceChildren();
    const ids: TargetId[] = area === 'porch' ? ['door', 'bell'] : ['cv-zh', 'cv-en', 'blog', 'papers', 'wardrobe', 'exit'];
    for (const id of ids) {
      const button = document.createElement('button'); button.className = 'scene-action'; button.dataset.target = id; button.textContent = this.t(id);
      button.addEventListener('click', () => this.onTarget(id)); actions.append(button);
    }
  }
  updateReach(reachable: (id: TargetId) => boolean) {
    this.root.querySelectorAll<HTMLButtonElement>('[data-target]').forEach(b => {
      b.dataset.near = String(reachable(b.dataset.target as TargetId));
      b.title = this.t(reachable(b.dataset.target as TargetId) ? 'near' : 'far');
    });
    (this.root.querySelector('#movement-hint') as HTMLElement).hidden = this.dialog.open;
  }
  markWalking() { this.root.querySelector('#movement-hint')!.classList.add('learned'); }
  hover(id: TargetId | null, near: boolean, x = 0, y = 0) {
    const el = this.root.querySelector<HTMLElement>('#hover-label')!; el.hidden = id === null;
    this.canvas.style.cursor = id ? 'pointer' : 'default';
    if (!id) return;
    el.textContent = `${this.t(id)} · ${this.t(near ? 'near' : 'far')}`;
    el.style.left = `${Math.min(x + 18, window.innerWidth - 240)}px`;
    el.style.top = `${Math.min(y + 18, window.innerHeight - 65)}px`;
  }
  notice(key: Word) {
    const el = this.root.querySelector<HTMLElement>('#room-notice')!;
    el.textContent = this.t(key); el.hidden = false; clearTimeout(this.noticeTimer);
    this.noticeTimer = window.setTimeout(() => { el.hidden = true; }, 2800);
  }
  openPanel(id: TargetId, outfit: Outfit) {
    const body = this.root.querySelector<HTMLElement>('#document-body')!;
    const footer = this.root.querySelector<HTMLElement>('#dialog-footer')!;
    body.replaceChildren(); footer.replaceChildren(); body.scrollTop = 0;
    this.root.querySelector('#dialog-title')!.textContent = this.t(id);
    this.dialog.dataset.panel = id; this.dialog.classList.toggle('wardrobe-dialog', id === 'wardrobe');
    const link = (text: string, href: string) => {
      const a = document.createElement('a'); a.textContent = text; a.href = href; a.target = '_blank'; a.rel = 'noopener noreferrer'; footer.append(a);
    };
    if (id === 'cv-en' || id === 'cv-zh') {
      const lang: Lang = id === 'cv-zh' ? 'zh' : 'en';
      const template = document.getElementById(`resume-${lang}`) as HTMLTemplateElement;
      body.append(template.content.cloneNode(true)); body.lang = lang;
      link(this.t('full'), this.config.classic[lang]); link(this.t('pdf'), this.config.pdf);
    } else if (id === 'blog' || id === 'papers') {
      const template = document.getElementById(id === 'blog' ? 'blog-items' : 'publication-items') as HTMLTemplateElement;
      if (template.content.querySelector('li')) body.append(template.content.cloneNode(true));
      else { const p = document.createElement('p'); p.className = 'empty-shelf'; p.textContent = this.t('empty'); body.append(p); }
      body.lang = this.lang;
      if (id === 'blog') link(this.t('blogLink'), this.config.blog);
    } else if (id === 'wardrobe') {
      body.lang = this.lang;
      for (const [key, options, title] of [['hat', HATS, 'hats'], ['top', TOPS, 'tops']] as const) {
        const field = document.createElement('fieldset'); const legend = document.createElement('legend'); legend.textContent = this.t(title); field.append(legend);
        for (const value of options) {
          const button = document.createElement('button'); button.textContent = this.t(value);
          button.dataset.outfitKey = key; button.dataset.outfitValue = value;
          field.append(button);
        }
        body.append(field);
      }
      const reset = document.createElement('button'); reset.textContent = this.t('reset'); reset.dataset.resetOutfit = '';
      reset.addEventListener('click', () => this.onOutfit({ version: 1, hat: 'cap', top: 'grey' })); body.append(reset);
      const p = document.createElement('p'); p.id = 'outfit-note'; p.textContent = this.t('saved'); footer.append(p);
      this.refreshOutfit(outfit, true);
    }
    if (!this.dialog.open) this.dialog.showModal();
    this.root.querySelector<HTMLButtonElement>('#close-panel')!.focus();
  }
  refreshOutfit(outfit: Outfit, saved: boolean) {
    for (const button of this.dialog.querySelectorAll<HTMLButtonElement>('[data-outfit-key]')) {
      const key = button.dataset.outfitKey as 'hat' | 'top';
      button.setAttribute('aria-pressed', String(outfit[key] === button.dataset.outfitValue));
      // Replace handlers to retain the other, most recently selected slot.
      button.onclick = () => this.onOutfit({ ...outfit, [key]: button.dataset.outfitValue } as Outfit);
    }
    const note = this.dialog.querySelector('#outfit-note'); if (note) note.textContent = this.t(saved ? 'saved' : 'unsaved');
  }
  closePanel() { this.dialog.close(); }
  dispose() { clearTimeout(this.noticeTimer); this.dialog.close(); this.root.replaceChildren(); }
}
