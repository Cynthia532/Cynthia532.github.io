import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

export const colors = { wall: 0xfff0da, floor: 0xeac49b, trim: 0xa6cbb5, ink: 0x554f49, mint: 0xa9d4b8, pink: 0xefb9c8, blue: 0xb3d4e5, purple: 0xc9b4e3, wood: 0xdfb68b, gold: 0xd9ae61 };
export function material(color: number) { return new THREE.MeshStandardMaterial({ color, roughness: 0.84 }); }
export function mesh(parent: THREE.Object3D, geometry: THREE.BufferGeometry, color: number, at = [0, 0, 0]) {
  const result = new THREE.Mesh(geometry, material(color)); result.position.set(at[0], at[1], at[2]);
  result.castShadow = true; result.receiveShadow = true; parent.add(result); return result;
}
export function box(parent: THREE.Object3D, size: number[], at: number[], color: number, round = 0.035) {
  return mesh(parent, round ? new RoundedBoxGeometry(size[0], size[1], size[2], Math.max(...size) > 0.8 ? 2 : 1, Math.min(round, ...size.map(v => v / 2))) : new THREE.BoxGeometry(size[0], size[1], size[2]), color, at);
}
export function sphere(parent: THREE.Object3D, radius: number, at: number[], color: number, scale = [1, 1, 1]) {
  const result = mesh(parent, new THREE.SphereGeometry(radius, 16, 10), color, at); result.scale.set(...scale as [number, number, number]); return result;
}
export function cylinder(parent: THREE.Object3D, top: number, bottom: number, height: number, at: number[], color: number, segments = 20) {
  return mesh(parent, new THREE.CylinderGeometry(top, bottom, height, segments), color, at);
}
export function group(parent: THREE.Object3D, name: string, at = [0, 0, 0]) {
  const result = new THREE.Group(); result.name = name; result.position.set(...at as [number, number, number]); parent.add(result); return result;
}
export function tube(parent: THREE.Object3D, points: number[][], radius: number, color: number) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p as [number, number, number])));
  return mesh(parent, new THREE.TubeGeometry(curve, Math.max(8, points.length * 5), radius, 6, false), color);
}
export function archShape(width: number, height: number) {
  const r = width / 2; const shoulder = height - r; const shape = new THREE.Shape();
  shape.moveTo(-r, 0); shape.lineTo(r, 0); shape.lineTo(r, shoulder);
  shape.absarc(0, shoulder, r, 0, Math.PI, false); shape.lineTo(-r, 0); return shape;
}
export function arch(parent: THREE.Object3D, width: number, height: number, depth: number, at: number[], color: number, border = 0) {
  const shape = archShape(width, height);
  if (border) {
    const hole = archShape(width - border * 2, height - border * 2);
    const points = hole.getPoints(24).reverse(); const path = new THREE.Path();
    path.setFromPoints(points.map(p => new THREE.Vector2(p.x, p.y + border))); shape.holes.push(path);
  }
  const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.018, bevelThickness: 0.018, curveSegments: 24 });
  geometry.translate(0, 0, -depth / 2); return mesh(parent, geometry, color, at);
}
export function label(parent: THREE.Object3D, text: string, at: number[], width = 1.4, color = '#625743') {
  const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 128;
  const ctx = canvas.getContext('2d')!; ctx.fillStyle = color;
  ctx.font = '600 45px "Trebuchet MS", "Microsoft YaHei", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 256, 64);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  const result = new THREE.Mesh(new THREE.PlaneGeometry(width, width / 4), new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
  result.position.set(...at as [number, number, number]); result.userData.skipPick = true; parent.add(result); return result;
}
export function canvasTexture(size: number, paint: (ctx: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = size; paint(canvas.getContext('2d')!);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; return texture;
}
// Merge only static sibling meshes. Named pivots and action anchors remain intact.
export function batchStatic(root: THREE.Object3D) {
  for (const child of [...root.children]) if (child instanceof THREE.Group) batchStatic(child);
  // Books/shrubs are visual repeats, not articulated objects or action anchors.
  for (const child of [...root.children]) if (child instanceof THREE.Group && /^(Book_|GardenShrub_)/.test(child.name)) {
    child.updateMatrix();
    for (const part of [...child.children]) { part.applyMatrix4(child.matrix); root.add(part); }
    root.remove(child);
  }
  const batches = new Map<string, THREE.Mesh[]>();
  for (const child of root.children) {
    if (!(child instanceof THREE.Mesh) || !(child.material instanceof THREE.MeshStandardMaterial) || child.userData.dynamic || child.material.map) continue;
    const key = `${child.material.color.getHex()}:${child.material.roughness}:${child.material.emissive.getHex()}:${!!child.userData.skipPick}`;
    const list = batches.get(key) || []; list.push(child); batches.set(key, list);
  }
  for (const list of batches.values()) {
    if (list.length < 2) continue;
    const geometries = list.map(child => {
      child.updateMatrix(); const g = child.geometry.clone().applyMatrix4(child.matrix);
      if (!g.index) return g;
      const flat = g.toNonIndexed(); g.dispose(); return flat;
    });
    const combined = mergeGeometries(geometries); geometries.forEach(g => g.dispose()); if (!combined) continue;
    const geometry = mergeVertices(combined); combined.dispose();
    const result = new THREE.Mesh(geometry, (list[0].material as THREE.MeshStandardMaterial).clone()); result.castShadow = true; result.receiveShadow = true; result.userData.skipPick = list[0].userData.skipPick;
    result.name = `${root.name || 'Static'}_Surface`; root.add(result);
    for (const child of list) { root.remove(child); child.geometry.dispose(); (child.material as THREE.Material).dispose(); }
  }
}
export function disposeTree(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>(); const materials = new Set<THREE.Material>(); const textures = new Set<THREE.Texture>();
  root.traverse(o => {
    if (!(o instanceof THREE.Mesh)) return; geometries.add(o.geometry);
    for (const m of Array.isArray(o.material) ? o.material : [o.material]) { materials.add(m); for (const value of Object.values(m)) if (value instanceof THREE.Texture) textures.add(value); }
  });
  geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); textures.forEach(t => t.dispose());
}
