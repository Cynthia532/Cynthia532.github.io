import * as THREE from 'three';
import { box, sphere, cylinder, group, tube, colors, mesh, canvasTexture } from './modeling';
import { FurnitureActions } from './furniture-actions';
import { PROP_BOUNDS } from './layout';

export function plant(parent: THREE.Object3D, at: number[], scale: number, id: string, actions?: FurnitureActions, flower = false) {
  const root = group(parent, `Plant_${id}`, at); const model = group(root, 'PlantModel'); model.scale.setScalar(scale);
  cylinder(model, 0.25, 0.19, 0.38, [0, 0.19, 0], id.includes('porch') ? 0xd8a48f : 0xf2dfc7);
  cylinder(model, 0.267, 0.26, 0.065, [0, 0.37, 0], id.includes('porch') ? 0xe2b19a : 0xffefd8);
  const soil = cylinder(model, 0.234, 0.234, 0.025, [0, 0.4, 0], 0x77634f); soil.name = `${id}_WetSoil`; soil.userData.dynamic = true;
  const growth = group(model, `${id}_GrowthRoot`);
  const leafColors = [0x84ad70, 0x6e9b65, 0xa3c889];
  for (let i = 0; i < 8; i++) {
    const a = i * 2.399; const height = 0.76 + (i % 3) * 0.17;
    const x = Math.cos(a) * (0.17 + (i % 2) * 0.12); const z = Math.sin(a) * 0.29;
    tube(growth, [[0, 0.39, 0], [x * 0.4, height - 0.18, z * 0.4], [x, height, z]], 0.017, 0x71985b);
    const leaf = sphere(growth, 0.2, [x * 1.3, height, z * 1.3], leafColors[i % 3], [0.58, 0.22, 1.5]);
    leaf.rotation.set(0.35, -a + Math.PI / 2, i % 2 ? 0.15 : -0.15);
    if (flower && i % 2 === 0) {
      for (let petal = 0; petal < 5; petal++) {
        const angle = petal * Math.PI * 2 / 5;
        sphere(growth, 0.075, [x + Math.cos(angle) * 0.085, height + 0.12 + Math.sin(angle) * 0.085, z], 0xfff8e4, [0.8, 1, 0.42]);
      }
      sphere(growth, 0.055, [x, height + 0.12, z + 0.04], 0xf3cc67);
    }
  }
  if (actions) {
    const approach = group(root, `${id}_Approach`, [-0.65, 0, 0.25]);
    const water = group(root, `${id}_WaterTarget`, [0, 0.46 * scale, 0]);
    const spout = group(root, `${id}_WateringCanAnchor`, [-0.23, 0.95 * scale, 0.05]);
    actions.register({ id, action: 'water', root, anchors: { approach, water, spout, growth, soil }, collision: id === 'plant-floor' ? PROP_BOUNDS['plant-floor'] : null });
  }
  return root;
}
export function lamp(parent: THREE.Object3D, at: number[], scale = 1) {
  const root = group(parent, 'MushroomLamp', at); root.scale.setScalar(scale);
  cylinder(root, 0.15, 0.2, 0.06, [0, 0.03, 0], colors.wood);
  cylinder(root, 0.045, 0.05, 0.35, [0, 0.23, 0], colors.gold);
  const shade = sphere(root, 0.27, [0, 0.43, 0], 0xf7db8a, [1, 0.95, 1]);
  shade.material.emissive.setHex(0xb98728); shade.material.emissiveIntensity = 0.25;
}
export function picture(parent: THREE.Object3D, at: number[], width: number, turn = 0) {
  const root = group(parent, 'FramedLandscape', at); root.rotation.y = turn;
  box(root, [width, width * 1.2, 0.075], [0, 0, 0], colors.wood, 0.04);
  const art = mesh(root, new THREE.PlaneGeometry(width * 0.82, width * 1.02), 0xffffff, [0, 0, 0.045]);
  art.material.map = canvasTexture(256, ctx => {
    ctx.fillStyle = '#d8e8ed'; ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = '#fff4cf'; ctx.beginPath(); ctx.arc(188, 65, 27, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#adca91'; ctx.beginPath(); ctx.ellipse(62, 230, 180, 111, -0.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#86aa7e'; ctx.beginPath(); ctx.ellipse(216, 261, 185, 117, 0.25, 0, Math.PI * 2); ctx.fill();
  });
  return root;
}
export function sofa(parent: THREE.Object3D, actions: FurnitureActions) {
  const root = group(parent, 'SofaRoot', [-3.13, 0, 0.43]); root.rotation.y = Math.PI / 2;
  for (const x of [-0.77, 0.77]) for (const z of [-0.32, 0.32]) cylinder(root, 0.05, 0.04, 0.22, [x, 0.11, z], colors.wood);
  box(root, [2.03, 0.35, 0.93], [0, 0.35, 0], 0xe8ddc8, 0.14);
  box(root, [1.94, 0.88, 0.28], [0, 0.86, -0.34], 0xf8ecd8, 0.13);
  for (const x of [-0.43, 0.43]) {
    box(root, [0.83, 0.22, 0.77], [x, 0.58, 0.08], 0xfff2df, 0.105);
    box(root, [0.81, 0.62, 0.15], [x, 0.96, -0.15], 0xfbf0df, 0.075);
  }
  for (const x of [-0.95, 0.95]) box(root, [0.22, 0.57, 0.94], [x, 0.62, 0], 0xf6e7d4, 0.105);
  const pillow = box(root, [0.5, 0.48, 0.18], [-0.53, 0.88, 0.12], colors.pink, 0.13); pillow.rotation.z = -0.15;
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3;
    sphere(root, 0.13, [0.4 + Math.cos(a) * 0.15, 0.88 + Math.sin(a) * 0.15, 0.13], 0xf4d57b, [1, 1, 0.55]);
  }
  sphere(root, 0.12, [0.4, 0.88, 0.2], 0xffedaf, [1, 1, 0.5]);
  const seatLeft = group(root, 'Sofa_SeatLeft', [-0.43, 0.7, 0.1]);
  const seatRight = group(root, 'Sofa_SeatRight', [0.43, 0.7, 0.1]);
  const approach = group(root, 'Sofa_Approach', [0, 0, 1.1]);
  const stand = group(root, 'Sofa_StandUp', [0.45, 0, 1.1]);
  actions.register({ id: 'sofa', action: 'sit', root, anchors: { seatLeft, seatRight, approach, stand }, collision: PROP_BOUNDS.sofa });
  const pouf = group(parent, 'StrawberryPouf', [-2.65, 0, 2.15]);
  cylinder(pouf, 0.36, 0.33, 0.36, [0, 0.24, 0], colors.pink, 32);
  sphere(pouf, 0.36, [0, 0.42, 0], 0xf1c1cf, [1, 0.33, 1]);
  return root;
}
export function readingTable(parent: THREE.Object3D) {
  const root = group(parent, 'ReadingSideTable', [-3.2, 0, -1.43]);
  cylinder(root, 0.43, 0.43, 0.09, [0, 0.69, 0], colors.wood, 32);
  for (let i = 0; i < 3; i++) { const a = i * Math.PI * 2 / 3; cylinder(root, 0.055, 0.04, 0.65, [Math.sin(a) * 0.24, 0.34, Math.cos(a) * 0.24], colors.wood); }
  lamp(root, [0.04, 0.74, -0.04], 0.75);
  box(root, [0.22, 0.035, 0.28], [-0.2, 0.765, 0.18], colors.mint, 0.01);
}
export function deskChair(parent: THREE.Object3D) {
  // The desk is in front (+Z); the backrest stays toward the window (-Z).
  const root = group(parent, 'DeskChair', [0, 0, -1.56]);
  cylinder(root, 0.05, 0.065, 0.48, [0, 0.33, 0], 0xa5a5a0);
  for (let i = 0; i < 5; i++) {
    const a = i * Math.PI * 2 / 5;
    tube(root, [[0, 0.16, 0], [Math.cos(a) * 0.31, 0.1, Math.sin(a) * 0.31]], 0.027, 0xa5a5a0);
    sphere(root, 0.06, [Math.cos(a) * 0.32, 0.07, Math.sin(a) * 0.32], 0x737871);
  }
  box(root, [0.65, 0.16, 0.67], [0, 0.59, 0], colors.mint, 0.075);
  box(root, [0.7, 0.66, 0.18], [0, 0.91, -0.28], 0xf4ead7, 0.09);
}
