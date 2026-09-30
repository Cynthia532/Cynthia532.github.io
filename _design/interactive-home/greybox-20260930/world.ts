import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { TargetId } from './domain';

export const colors = { wall: 0xe7e5de, floor: 0xd6d1c5, trim: 0xb9c6bf, ink: 0x394756, mint: 0xb8d7c5, pink: 0xe6bdc8, blue: 0xb7cedf, purple: 0xc7bfdb };
export function material(color: number) { return new THREE.MeshStandardMaterial({ color, roughness: 0.92 }); }
export function box(parent: THREE.Object3D, size: number[], at: number[], color: number, round = 0.035) {
  const geometry = round ? new RoundedBoxGeometry(size[0], size[1], size[2], 2, Math.min(round, ...size.map(v => v / 3))) : new THREE.BoxGeometry(...size as [number, number, number]);
  const mesh = new THREE.Mesh(geometry, material(color));
  mesh.position.set(...at as [number, number, number]);
  mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh);
  return mesh;
}
export function sphere(parent: THREE.Object3D, radius: number, at: number[], color: number) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 16, 12), material(color));
  mesh.position.set(...at as [number, number, number]); mesh.castShadow = true; parent.add(mesh);
  return mesh;
}
function label(parent: THREE.Object3D, text: string, at: number[], width = 1.4) {
  const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#394756'; ctx.font = '600 44px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 64);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, width / 4), new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
  mesh.position.set(...at as [number, number, number]); mesh.userData.skipPick = true; parent.add(mesh);
  return mesh;
}
export type Target = { id: TargetId; object: THREE.Group; anchor: THREE.Vector3 };
export function createWorld(scene: THREE.Scene) {
  const root = new THREE.Group(); scene.add(root);
  const interior = new THREE.Group(); root.add(interior); interior.visible = false;
  const front = new THREE.Group(); root.add(front);
  const backWall = new THREE.Group(); const leftWall = new THREE.Group(); const rightWall = new THREE.Group();
  interior.add(backWall, leftWall, rightWall);
  const targets = new Map<TargetId, Target>();
  const papers = new Map<string, THREE.Group>();
  function target(id: TargetId, parent: THREE.Object3D, at: number[], anchor: number[]) {
    const group = new THREE.Group(); group.position.set(...at as [number, number, number]); group.userData.target = id; parent.add(group);
    targets.set(id, { id, object: group, anchor: new THREE.Vector3(...anchor as [number, number, number]) });
    return group;
  }
  // One room and a bounded porch; the near wall is cut away after entering.
  box(interior, [8, 0.22, 6.4], [0, -0.12, -0.25], colors.floor);
  box(root, [5.2, 0.22, 3], [0, -0.12, 4.7], colors.floor);
  box(root, [2, 0.16, 0.5], [0, -0.08, 3.09], colors.trim);
  box(front, [3.04, 3, 0.2], [-2.51, 1.5, 3.13], colors.wall);
  box(front, [3.04, 3, 0.2], [2.51, 1.5, 3.13], colors.wall);
  box(front, [2, 0.35, 0.2], [0, 2.83, 3.13], colors.wall);
  box(backWall, [8, 2.9, 0.18], [0, 1.45, -3.43], colors.wall);
  box(leftWall, [0.18, 2.9, 6.5], [-3.92, 1.45, -0.25], colors.wall);
  box(rightWall, [0.18, 0.48, 6.5], [3.92, 0.24, -0.25], colors.trim);
  box(backWall, [7.8, 0.1, 0.12], [0, 0.07, -3.29], colors.trim);
  const mat = box(root, [1.8, 0.025, 0.75], [0, 0.015, 4.55], colors.mint);
  mat.userData.skipPick = true;
  label(front, 'ZHIXIN’S STUDY', [0, 2.85, 3.26], 1.75);
  const door = target('door', front, [-0.96, 0, 3.15], [0, 1.35, 3.3]);
  box(door, [1.92, 2.62, 0.14], [0.96, 1.31, 0], colors.mint, 0.08);
  box(door, [1.43, 1.13, 0.04], [0.96, 1.82, 0.09], 0xdde4df, 0.09);
  sphere(door, 0.075, [1.63, 1.08, 0.16], 0xb1a17b);
  label(door, 'ENTER', [0.96, 0.64, 0.084], 0.8);
  const bell = target('bell', front, [1.43, 1.33, 3.3], [1.43, 1.5, 3.5]);
  box(bell, [0.34, 0.52, 0.12], [0, 0, 0], colors.pink, 0.07);
  sphere(bell, 0.093, [0, -0.03, 0.1], 0xfff5de);
  label(front, 'CLASSIC', [1.43, 1.83, 3.29], 0.88);
  const rug = box(interior, [4.2, 0.025, 3], [0, 0.012, 0.1], 0xc7c9c4, 0.1); rug.userData.skipPick = true;
  const exit = target('exit', interior, [0, 0, 2.65], [0, 0.06, 2.65]);
  box(exit, [1.9, 0.035, 0.65], [0, 0.022, 0], colors.mint, 0.025);
  // A small in-world chevron makes the cutaway doorway discoverable without a HUD button.
  for (const side of [-1, 1]) {
    const stroke = box(exit, [0.065, 0.008, 0.25], [side * 0.075, 0.046, 0.05], 0xf3efda, 0.004);
    stroke.rotation.y = side * Math.PI / 4;
  }
  // Desk silhouette matches its collision rectangle in domain.ts.
  box(interior, [2.7, 0.14, 1.35], [0, 1.03, -0.225], 0xc3bdae, 0.06);
  for (const x of [-1.17, 1.17]) for (const z of [-0.72, 0.28]) box(interior, [0.13, 0.95, 0.13], [x, 0.475, z], 0xb2ada2);
  for (const [lang, x, tint] of [['zh', -0.65, colors.pink], ['en', 0.65, colors.blue]] as const) {
    const paper = target(`cv-${lang}`, interior, [x, 1.13, -0.1], [x, 1.15, -0.1]);
    box(paper, [0.85, 0.025, 1.03], [0, 0, 0], 0xfff7e8, 0.01);
    box(paper, [0.25, 0.045, 0.09], [0, 0.03, -0.43], tint, 0.01);
    const title = label(paper, lang === 'zh' ? '中文' : 'English', [0, 0.02, -0.08], 0.71);
    title.rotation.x = -Math.PI / 2;
    for (let i = 0; i < 3; i++) box(paper, [0.55 - i * 0.06, 0.004, 0.016], [0, 0.017, 0.1 + i * 0.09], 0xc9c9c3, 0);
    papers.set(lang, paper);
  }
  function shelf(id: 'blog' | 'papers', x: number, width: number) {
    const group = target(id, interior, [x, 0, -2.81], [x, 1.7, -2.39]);
    box(group, [width, 1.9, 0.1], [0, 0.95, -0.29], 0xc6c2b8);
    for (const side of [-1, 1]) box(group, [0.11, 2, 0.7], [side * (width / 2 - 0.055), 1, 0], 0xb7b6ac);
    for (const y of [0.08, 0.69, 1.32, 1.97]) box(group, [width, 0.1, 0.7], [0, y, 0], 0xb7b6ac);
    const palette = [colors.mint, colors.pink, colors.blue, colors.purple, 0xd8cfb0];
    for (let row = 0; row < 3; row++) for (let i = 0; i < 6; i++) {
      const book = box(group, [0.19, 0.37 + (i % 3) * 0.04, 0.39], [-width / 2 + 0.28 + i * 0.265, 0.33 + row * 0.625, 0.04], palette[(i + row) % palette.length], 0.008);
      book.rotation.z = i === 5 ? -0.12 : 0;
    }
    label(group, id === 'blog' ? 'NOTES / BLOG' : 'PUBLICATIONS', [0, 2.2, 0.2], 1.7);
  }
  shelf('blog', -2.575, 2.15); shelf('papers', 1.05, 2);
  // Window and frame; no external images or textures are needed by the greybox.
  box(backWall, [1.25, 1.55, 0.08], [-0.75, 1.95, -3.28], colors.trim, 0.1);
  const pane = box(backWall, [1.03, 1.33, 0.07], [-0.75, 1.95, -3.21], 0xd7e5e7, 0.04);
  pane.material.emissive.setHex(0x6d8b8c); pane.material.emissiveIntensity = 0.25;
  box(backWall, [0.045, 1.33, 0.04], [-0.75, 1.95, -3.15], colors.wall);
  box(backWall, [1.03, 0.045, 0.04], [-0.75, 1.95, -3.15], colors.wall);
  const wardrobe = target('wardrobe', interior, [3.2, 0, 0.125], [2.7, 1.7, 0.125]);
  wardrobe.rotation.y = -Math.PI / 2;
  box(wardrobe, [2.15, 2.35, 0.9], [0, 1.175, 0], colors.purple, 0.09);
  const wardrobeDoors: THREE.Group[] = [];
  for (const side of [-1, 1]) {
    const hinge = new THREE.Group(); hinge.position.set(side * 1.04, 0, 0.47); wardrobe.add(hinge);
    box(hinge, [1.02, 2.16, 0.075], [-side * 0.51, 1.22, 0], 0xd3cddd, 0.05);
    sphere(hinge, 0.05, [-side * 0.9, 1.15, 0.08], 0x998a6e);
    wardrobeDoors.push(hinge);
  }
  label(wardrobe, 'WARDROBE', [0, 2.61, 0.4], 1.65);
  for (const [id, targetSpec] of targets) {
    targetSpec.object.name = id;
  }
  function updateCutaway(cameraPosition: THREE.Vector3) {
    backWall.visible = cameraPosition.z > -3.2;
    leftWall.visible = cameraPosition.x > -3.7;
    rightWall.visible = cameraPosition.x < 3.7;
  }
  return { root, interior, front, door, wardrobeDoors, targets, papers, updateCutaway };
}

export function disposeTree(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  root.traverse(o => {
    if (!(o instanceof THREE.Mesh)) return;
    geometries.add(o.geometry);
    for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
      materials.add(m);
      for (const value of Object.values(m)) if (value instanceof THREE.Texture) textures.add(value);
    }
  });
  geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); textures.forEach(t => t.dispose());
}
