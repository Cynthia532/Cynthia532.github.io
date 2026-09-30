import * as THREE from 'three';
import './style.css';
import { createWorld, disposeTree } from './world';
import { createAvatar } from './avatar';
import { RoomUI, type Config } from './ui';
import { direction, move, inReach, parseOutfit, type Area, type Lang, type TargetId } from './domain';

type PanelId = Exclude<TargetId, 'door' | 'bell' | 'exit'>;
const PANEL_IDS: PanelId[] = ['cv-zh', 'cv-en', 'blog', 'papers', 'wardrobe'];
const MOVE_KEYS = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);
const ROTATE_KEYS = new Set(['KeyQ', 'KeyE']);
const ease = (t: number) => t * t * (3 - 2 * t);

export function mountRoom(root: HTMLElement, config: Config, initialLang: Lang, onFailure: () => void) {
  const ui = new RoomUI(root, config, initialLang);
  const context = ui.canvas.getContext('webgl2', { antialias: true, alpha: false });
  if (!context) throw new Error('WebGL 2 is unavailable.');
  const renderer = new THREE.WebGLRenderer({ canvas: ui.canvas, context, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.NeutralToneMapping;
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0xeceee7);
  scene.add(new THREE.HemisphereLight(0xfffaf0, 0x9caea1, 2.2));
  const sun = new THREE.DirectionalLight(0xfff4dc, 3.2); sun.position.set(-3, 9, 6); sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024); sun.shadow.camera.left = -8; sun.shadow.camera.right = 8;
  sun.shadow.camera.top = 8; sun.shadow.camera.bottom = -8; sun.shadow.bias = -0.0003; scene.add(sun);
  const world = createWorld(scene);
  let outfit = parseOutfit(null);
  try { outfit = parseOutfit(localStorage.getItem('study.outfit.v1')); } catch { /* Optional storage. */ }
  const avatar = createAvatar(scene, outfit); avatar.root.position.set(0, 0, 4.55);
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 80);
  const lookAt = new THREE.Vector3(0, 1, 3.6);
  camera.position.set(0, 4.6, 11.5); camera.lookAt(lookAt);
  let area: Area = 'porch';
  let phase: 'explore' | 'transition' | 'panel' = 'explore';
  let lang = initialLang;
  let activePanel: PanelId | null = null;
  let desiredPanel: PanelId | null = null;
  let changingPanel = false;
  let dressingWalking = false;
  let dressingStart: { position: THREE.Vector3; rotation: number } | null = null;
  let closingHistory = false;
  let disposed = false;
  let hovered: TargetId | null = null;
  let pointer: { x: number; y: number } | null = null;
  let press: { id: number; startX: number; startY: number; x: number; y: number; dragged: boolean; time: number } | null = null;
  const orbit: Record<Area, { yaw: number; tilt: number }> = { porch: { yaw: 0, tilt: 0 }, room: { yaw: 0, tilt: 0 } };
  let lastTime = performance.now();
  let lastStats = 0;
  const keys = new Set<string>();
  const abort = new AbortController(); const listenerOptions = { signal: abort.signal };
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const raycaster = new THREE.Raycaster(); const ndc = new THREE.Vector2();
  const session = Math.random().toString(36).slice(2);
  const tweens: { start: number; duration: number; update: (t: number) => void; resolve: () => void }[] = [];
  const paperHomes = new Map([...world.papers].map(([key, paper]) => [key, { position: paper.position.clone(), quaternion: paper.quaternion.clone() }]));
  const canonicalURL = new URL(location.href);
  if (canonicalURL.hash.startsWith('#view=')) canonicalURL.hash = '';
  history.replaceState({ ...history.state, studySession: session, studyPanel: null }, '', canonicalURL);

  function cancelDrag() {
    const id = press?.id; press = null;
    if (id !== undefined && ui.canvas.hasPointerCapture(id)) ui.canvas.releasePointerCapture(id);
  }
  function clearKeys() { keys.clear(); cancelDrag(); }
  function tween(duration: number, update: (t: number) => void): Promise<void> {
    return new Promise(resolve => {
      if (disposed) { resolve(); return; }
      tweens.push({ start: performance.now(), duration: reducedMotion.matches ? Math.min(duration, 120) : duration, update, resolve });
    });
  }
  function cameraPose() {
    if (activePanel === 'wardrobe' && innerWidth <= 650) return {
      position: avatar.root.position.clone().add(new THREE.Vector3(0, 2.8, 7)),
      target: avatar.root.position.clone().add(new THREE.Vector3(0, -0.1, 0))
    };
    if (activePanel === 'wardrobe') return {
      position: avatar.root.position.clone().add(new THREE.Vector3(0, 2.1, 4.1)),
      target: avatar.root.position.clone().add(new THREE.Vector3(0.85, 0.85, 0))
    };
    const narrow = Math.max(1, 1.25 / (innerWidth / innerHeight));
    const pose = area === 'porch'
      ? { position: new THREE.Vector3(0, 4.6 * narrow, 3.6 + 7.9 * narrow), target: new THREE.Vector3(0, 1, 3.6) }
      : { position: new THREE.Vector3(0, 8.2 * narrow, 10.8 * narrow), target: new THREE.Vector3(0, 0.45, -0.25) };
    const offset = pose.position.clone().sub(pose.target); const radius = offset.length();
    const elevation = Math.asin(offset.y / radius) + orbit[area].tilt;
    const horizontal = radius * Math.cos(elevation);
    pose.position.copy(pose.target).add(new THREE.Vector3(
      Math.sin(orbit[area].yaw) * horizontal, Math.sin(elevation) * radius, Math.cos(orbit[area].yaw) * horizontal
    ));
    return pose;
  }
  function rotateView(yaw: number, tilt = 0) {
    const view = orbit[area];
    // Keep the porch in front of the facade; the cutaway room permits a full orbit.
    view.yaw = area === 'porch' ? THREE.MathUtils.clamp(view.yaw + yaw, -Math.PI / 3, Math.PI / 3)
      : Math.atan2(Math.sin(view.yaw + yaw), Math.cos(view.yaw + yaw));
    view.tilt = THREE.MathUtils.clamp(view.tilt + tilt, -0.2, 0.4);
    const pose = cameraPose(); camera.position.copy(pose.position); lookAt.copy(pose.target); camera.lookAt(lookAt);
    ui.markWalking();
  }
  async function changeCamera() {
    const from = camera.position.clone(); const fromLook = lookAt.clone(); const to = cameraPose();
    await tween(550, t => { camera.position.lerpVectors(from, to.position, ease(t)); lookAt.lerpVectors(fromLook, to.target, ease(t)); camera.lookAt(lookAt); });
  }
  function resize() {
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight, false);
    if (phase !== 'transition') { const to = cameraPose(); camera.position.copy(to.position); lookAt.copy(to.target); camera.lookAt(lookAt); }
  }
  resize(); window.addEventListener('resize', resize, listenerOptions);
  window.addEventListener('blur', clearKeys, listenerOptions);
  document.addEventListener('visibilitychange', () => { clearKeys(); lastTime = performance.now(); }, listenerOptions);
  ui.canvas.addEventListener('blur', clearKeys, listenerOptions);
  window.addEventListener('keydown', event => {
    if (event.ctrlKey || event.altKey || event.metaKey || event.isComposing) return;
    if (phase !== 'explore' || ui.dialog.open || document.activeElement !== ui.canvas || (!MOVE_KEYS.has(event.code) && !ROTATE_KEYS.has(event.code))) return;
    event.preventDefault(); keys.add(event.code);
  }, listenerOptions);
  window.addEventListener('keyup', event => { keys.delete(event.code); }, listenerOptions);

  function classic() {
    clearKeys();
    try { localStorage.setItem('lang', lang); } catch { /* Explicit destination still wins. */ }
    location.assign(config.classic[lang]);
  }
  async function enter() {
    if (phase !== 'explore' || area !== 'porch') return;
    phase = 'transition'; clearKeys(); ui.hover(null, false);
    const start = avatar.root.position.clone();
    await tween(350, t => { avatar.root.position.lerpVectors(start, new THREE.Vector3(0, 0, 4.25), ease(t)); avatar.root.rotation.y = Math.PI; });
    if (disposed) return;
    world.interior.visible = true;
    await tween(400, t => { world.door.rotation.y = ease(t) * Math.PI / 2; });
    if (disposed) return;
    area = 'room'; ui.setArea(area);
    await Promise.all([
      changeCamera(),
      tween(650, t => { avatar.root.position.z = THREE.MathUtils.lerp(4.25, 2.1, ease(t)); if (t > 0.55) world.front.visible = false; })
    ]);
    if (disposed) return;
    phase = 'explore'; ui.canvas.focus();
  }
  async function leave() {
    if (phase !== 'explore' || area !== 'room') return;
    phase = 'transition'; clearKeys();
    if (Math.hypot(avatar.root.position.x, avatar.root.position.z - 2.25) > 1.3) {
      // A brief scene dissolve skips a long return walk without crossing furniture.
      await tween(180, t => { ui.canvas.style.opacity = String(1 - t); });
      avatar.root.position.set(0, 0, 2.3);
      await tween(180, t => { ui.canvas.style.opacity = String(t); });
    }
    const start = avatar.root.position.clone();
    await tween(300, t => avatar.root.position.lerpVectors(start, new THREE.Vector3(0, 0, 2.3), ease(t)));
    if (disposed) return;
    avatar.root.rotation.y = 0; world.front.visible = true;
    area = 'porch'; ui.setArea(area);
    await Promise.all([changeCamera(), tween(650, t => { avatar.root.position.z = THREE.MathUtils.lerp(2.3, 4.55, ease(t)); })]);
    await tween(350, t => { world.door.rotation.y = (1 - ease(t)) * Math.PI / 2; });
    if (disposed) return;
    world.interior.visible = false; phase = 'explore'; ui.canvas.focus();
  }
  async function liftPaper(id: PanelId, up: boolean) {
    if (id !== 'cv-en' && id !== 'cv-zh') return;
    const key = id.slice(3); const paper = world.papers.get(key)!; const home = paperHomes.get(key)!;
    const fromPosition = paper.position.clone(); const fromQuaternion = paper.quaternion.clone(); const fromScale = paper.scale.x;
    const end = up ? camera.position.clone().add(camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(4)) : home.position;
    const endQuaternion = up ? camera.quaternion.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2)) : home.quaternion;
    paper.visible = true;
    await tween(up ? 650 : 430, t => {
      paper.position.lerpVectors(fromPosition, end, ease(t));
      paper.quaternion.slerpQuaternions(fromQuaternion, endQuaternion, ease(t));
      paper.scale.setScalar(THREE.MathUtils.lerp(fromScale, up ? 1.65 : 1, ease(t)));
    });
    if (up) paper.visible = false;
  }
  async function wardrobeDoors(open: boolean) {
    const starts = world.wardrobeDoors.map(door => door.rotation.y);
    await tween(400, t => world.wardrobeDoors.forEach((door, i) => {
      const end = open ? (i === 0 ? -1 : 1) * Math.PI / 2.7 : 0;
      door.rotation.y = THREE.MathUtils.lerp(starts[i], end, ease(t));
    }));
  }
  async function walkForDressing(destination: THREE.Vector3) {
    const start = avatar.root.position.clone();
    const distance = start.distanceTo(destination);
    if (distance < 0.01) return;
    dressingWalking = true;
    avatar.root.rotation.y = Math.atan2(destination.x - start.x, destination.z - start.z);
    await tween(Math.min(850, distance / 2.1 * 1000), t => avatar.root.position.lerpVectors(start, destination, ease(t)));
    dressingWalking = false;
  }
  async function stageDressing(open: boolean) {
    // Use the clear aisle beside the desk, then step in front of the cabinet doors.
    // Restore the visitor's position when closing so the camera never traps them behind a door.
    if (open) {
      dressingStart = { position: avatar.root.position.clone(), rotation: avatar.root.rotation.y };
      await walkForDressing(new THREE.Vector3(2.15, 0, avatar.root.position.z));
      await walkForDressing(new THREE.Vector3(2.15, 0, 1.85));
      avatar.root.rotation.y = 0;
    } else if (dressingStart) {
      await walkForDressing(new THREE.Vector3(2.15, 0, dressingStart.position.z));
      await walkForDressing(dressingStart.position);
      avatar.root.rotation.y = dressingStart.rotation;
      dressingStart = null;
    }
  }
  // Coalesce back/forward/close while a paper is animating. Only one panel can exist.
  async function reconcilePanels() {
    if (changingPanel || disposed) return;
    changingPanel = true; clearKeys();
    try {
      while (activePanel !== desiredPanel && !disposed) {
        phase = 'transition';
        if (activePanel) {
          const closing = activePanel; ui.closePanel();
          await liftPaper(closing, false);
          activePanel = null;
          if (closing === 'wardrobe') await Promise.all([wardrobeDoors(false), stageDressing(false), changeCamera()]);
        } else if (desiredPanel) {
          const opening = desiredPanel; activePanel = opening;
          if (opening === 'wardrobe') { await stageDressing(true); await Promise.all([wardrobeDoors(true), changeCamera()]); }
          else await liftPaper(opening, true);
          if (!disposed && desiredPanel === opening) ui.openPanel(opening, outfit);
        }
      }
      if (disposed) return;
      phase = activePanel ? 'panel' : 'explore'; clearKeys();
      if (!activePanel) ui.canvas.focus();
    } finally { changingPanel = false; }
  }
  function requestPanel(id: PanelId) {
    desiredPanel = id;
    const url = new URL(location.href); url.hash = `view=${id}`;
    history.pushState({ ...history.state, studySession: session, studyPanel: id }, '', url);
    void reconcilePanels();
  }
  function closePanel() {
    if (closingHistory || (!activePanel && !desiredPanel)) return;
    if (history.state?.studySession === session && history.state.studyPanel) { closingHistory = true; history.back(); }
    else { desiredPanel = null; void reconcilePanels(); }
  }
  window.addEventListener('popstate', event => {
    closingHistory = false;
    const requested = event.state?.studySession === session ? event.state.studyPanel : null;
    desiredPanel = area === 'room' && PANEL_IDS.includes(requested) ? requested : null;
    void reconcilePanels();
  }, listenerOptions);
  function interact(id: TargetId) {
    if (phase !== 'explore') return;
    if (!inReach(id, avatar.root.position, area)) { ui.notice('far'); return; }
    clearKeys();
    if (id === 'bell') classic();
    else if (id === 'door') void enter();
    else if (id === 'exit') void leave();
    else requestPanel(id);
  }
  ui.onTarget = interact; ui.onClose = closePanel;
  ui.onLanguage = () => {
    if (phase !== 'explore') return;
    lang = lang === 'zh' ? 'en' : 'zh'; ui.setLanguage(lang);
    try { localStorage.setItem('lang', lang); } catch { /* Optional storage. */ }
    const url = new URL(location.href); url.searchParams.set('lang', lang); history.replaceState(history.state, '', url);
  };
  ui.onOutfit = value => {
    outfit = value; avatar.dress(outfit); let saved = true;
    try { localStorage.setItem('study.outfit.v1', JSON.stringify(outfit)); } catch { saved = false; }
    ui.refreshOutfit(outfit, saved);
  };

  function pick(x: number, y: number): TargetId | null {
    const rect = ui.canvas.getBoundingClientRect();
    ndc.set((x - rect.left) / rect.width * 2 - 1, -((y - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const objects: THREE.Object3D[] = [];
    scene.traverseVisible(o => { if (o instanceof THREE.Mesh && !o.userData.skipPick) objects.push(o); });
    const hit = raycaster.intersectObjects(objects, false)[0];
    if (!hit) return null;
    let node: THREE.Object3D | null = hit.object;
    while (node) { if (node.userData.target) return node.userData.target as TargetId; node = node.parent; }
    return null; // The closest opaque surface occludes anything behind it.
  }
  function highlight(id: TargetId | null) {
    if (hovered === id) return;
    for (const [key, target] of world.targets) target.object.traverse(o => {
      if (o instanceof THREE.Mesh && o.material instanceof THREE.MeshStandardMaterial) {
        o.material.emissive.setHex(key === id ? 0x648a6d : 0x000000); o.material.emissiveIntensity = key === id ? 0.2 : 0;
      }
    });
    hovered = id;
  }
  ui.canvas.addEventListener('pointerdown', e => {
    if (e.button !== 0 || !e.isPrimary || phase !== 'explore') return;
    ui.canvas.focus(); e.preventDefault();
    press = { id: e.pointerId, startX: e.clientX, startY: e.clientY, x: e.clientX, y: e.clientY, dragged: false, time: performance.now() };
    ui.canvas.setPointerCapture(e.pointerId);
  }, listenerOptions);
  ui.canvas.addEventListener('pointermove', e => {
    pointer = { x: e.clientX, y: e.clientY };
    if (!press || press.id !== e.pointerId || phase !== 'explore') return;
    if (!(e.buttons & 1)) { cancelDrag(); return; }
    if (Math.hypot(e.clientX - press.startX, e.clientY - press.startY) > 6) press.dragged = true;
    if (press.dragged) rotateView((press.x - e.clientX) * 0.006, (e.clientY - press.y) * 0.004);
    press.x = e.clientX; press.y = e.clientY;
  }, listenerOptions);
  ui.canvas.addEventListener('pointerup', e => {
    if (!press || press.id !== e.pointerId || e.button !== 0) return;
    const click = !press.dragged && Math.hypot(e.clientX - press.startX, e.clientY - press.startY) <= 6 && performance.now() - press.time < 500;
    cancelDrag();
    if (!click || phase !== 'explore') return;
    // Handle the short press here; a drag's synthetic click must never open an object.
    const id = pick(e.clientX, e.clientY); if (id) interact(id);
  }, listenerOptions);
  ui.canvas.addEventListener('pointercancel', cancelDrag, listenerOptions);
  ui.canvas.addEventListener('lostpointercapture', cancelDrag, listenerOptions);
  ui.canvas.addEventListener('pointerleave', () => { if (!press) pointer = null; highlight(null); ui.hover(null, false); }, listenerOptions);
  ui.canvas.addEventListener('dragstart', e => e.preventDefault(), listenerOptions);
  function dispose() {
    if (disposed) return; disposed = true; clearKeys(); abort.abort(); renderer.setAnimationLoop(null);
    for (const task of tweens.splice(0)) task.resolve();
    disposeTree(scene); renderer.dispose(); ui.dispose();
  }
  ui.canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); dispose(); onFailure(); }, listenerOptions);
  window.addEventListener('pagehide', dispose, listenerOptions);
  // BFCache may restore a document whose WebGL resources were released on pagehide.
  window.addEventListener('pageshow', e => { if (e.persisted && disposed) location.reload(); });
  renderer.setAnimationLoop(() => {
    if (disposed) return;
    const now = performance.now(); const dt = Math.min((now - lastTime) / 1000, 0.05); lastTime = now;
    if (document.hidden) return;
    for (const task of [...tweens]) {
      const t = Math.min((now - task.start) / task.duration, 1); task.update(t);
      if (t === 1) { tweens.splice(tweens.indexOf(task), 1); task.resolve(); }
    }
    let walking = false;
    if (phase === 'explore' && document.activeElement === ui.canvas) {
      const turn = Number(keys.has('KeyE')) - Number(keys.has('KeyQ'));
      if (turn) rotateView(turn * dt * 1.15);
      const velocity = direction(keys, orbit[area].yaw); const before = avatar.root.position.clone();
      // Movement follows the screen axes as the visitor orbits around the room.
      const next = move(avatar.root.position, velocity, dt, area); avatar.root.position.x = next.x; avatar.root.position.z = next.z;
      walking = before.distanceToSquared(avatar.root.position) > 0.0000001;
      if (walking) {
        ui.markWalking();
        const targetAngle = Math.atan2(velocity.x, velocity.z);
        const delta = Math.atan2(Math.sin(targetAngle - avatar.root.rotation.y), Math.cos(targetAngle - avatar.root.rotation.y));
        avatar.root.rotation.y += delta * Math.min(1, dt * 14);
      }
    }
    avatar.animate(now / 1000, walking || dressingWalking, phase === 'transition' && (activePanel === 'cv-en' || activePanel === 'cv-zh'), reducedMotion.matches);
    world.updateCutaway(camera.position);
    scene.updateMatrixWorld(true); camera.updateMatrixWorld(true);
    if (pointer && phase === 'explore' && !press?.dragged) { const id = pick(pointer.x, pointer.y); highlight(id); ui.hover(id, !!id && inReach(id, avatar.root.position, area), pointer.x, pointer.y); }
    else { highlight(null); ui.hover(null, false); }
    if (press?.dragged) ui.canvas.style.cursor = 'grabbing';
    if (now - lastStats > 80) {
      root.dataset.area = area; root.dataset.phase = phase;
      root.dataset.avatarX = avatar.root.position.x.toFixed(3); root.dataset.avatarZ = avatar.root.position.z.toFixed(3);
      root.dataset.viewYaw = orbit[area].yaw.toFixed(4); root.dataset.viewTilt = orbit[area].tilt.toFixed(4);
      ui.updateReach(id => inReach(id, avatar.root.position, area));
      // Screen anchors support repeatable click testing without exposing movement shortcuts.
      for (const [id, target] of world.targets) {
        const button = root.querySelector<HTMLButtonElement>(`[data-target="${id}"]`); if (!button) continue;
        const p = target.anchor.clone().project(camera);
        const x = (p.x + 1) * innerWidth / 2; const y = (1 - p.y) * innerHeight / 2;
        button.dataset.screenX = String(x); button.dataset.screenY = String(y);
        button.style.left = `${x}px`; button.style.top = `${y}px`;
      }
      lastStats = now;
    }
    renderer.render(scene, camera);
  });
  root.dataset.ready = 'true';
  requestAnimationFrame(() => { if (!disposed) ui.canvas.focus({ preventScroll: true }); });
}
