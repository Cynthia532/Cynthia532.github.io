import * as THREE from 'three';
import { box, sphere, cylinder, group, arch, mesh, label, colors, canvasTexture, batchStatic } from './modeling';
import { plant, lamp, picture, sofa, readingTable, deskChair } from './furnishings';
import { FurnitureActions } from './furniture-actions';
import type { TargetId, Area } from './domain';
export { box, sphere, material, disposeTree } from './modeling';
export type Target = { id: TargetId; object: THREE.Group; anchor: THREE.Vector3 };

export function createWorld(scene: THREE.Scene) {
  const root = group(scene, 'StudyHouse');
  const interior = group(root, 'InteriorContents'); // Always present, including from the porch.
  const front = group(root, 'Wall_Entrance');
  const backWall = group(root, 'Wall_Window'); const leftWall = group(root, 'Wall_Lounge'); const rightWall = group(root, 'Wall_Wardrobe');
  const roof = group(root, 'RoofAndCeiling'); const garden = group(root, 'Garden');
  const actions = new FurnitureActions(); const targets = new Map<TargetId, Target>(); const papers = new Map<string, THREE.Group>();
  function target(id: TargetId, parent: THREE.Object3D, at: number[], anchor: number[]) {
    const object = group(parent, `Interact_${id}`, at); object.userData.target = id;
    targets.set(id, { id, object, anchor: new THREE.Vector3(...anchor as [number, number, number]) }); return object;
  }
  const landscape = cylinder(garden, 13, 13.15, 0.25, [0, -0.36, 0], 0xcbd8b5, 64);
  landscape.receiveShadow = true;
  box(root, [8.12, 0.28, 6.66], [0, -0.14, -0.2], 0xe4d6bb, 0.08);
  box(garden, [5.25, 0.19, 3.25], [0, -0.13, 4.75], 0xe3d7ba, 0.1);
  const stone = [0xf4e5cb, 0xf6e9d1, 0xeee0c8];
  for (let row = 0; row < 3; row++) for (let col = 0; col < 5; col++) box(garden, [1.01, 0.035, 1.02], [-2.04 + col * 1.02, -0.014, 3.7 + row * 1.04], stone[(row + col) % 3], 0.016);
  for (let row = 0; row < 3; row++) box(garden, [1.45, 0.025, 0.9], [0.15 * Math.sin(row), -0.218, 7 + row * 1.1], stone[row], 0.12);
  // Wood boards, with staggered joints and restrained colour variation.
  const floor = group(interior, 'OakFloor'); const wood = [0xe9c49b, 0xe6bf94, 0xedcca8, 0xe9c5a1];
  for (let row = 0; row < 13; row++) for (let col = 0; col < 4; col++) {
    const start = -3.82 + row * 0.59;
    box(floor, [0.58, 0.025, 1.56], [start + 0.29, 0.008, -2.57 + col * 1.59], wood[(row * 3 + col) % wood.length], 0);
  }
  const height = 3.35;
  box(front, [2.93, height, 0.24], [-2.585, height / 2, 3.13], colors.wall, 0.025);
  box(front, [2.93, height, 0.24], [2.585, height / 2, 3.13], colors.wall, 0.025);
  // The two curved lintel infills close the shell above the arched doorway.
  for (const side of [-1, 1]) {
    const shape = new THREE.Shape(); const radius = 1.12; const shoulder = 1.92;
    shape.moveTo(0, height); shape.lineTo(side * radius, height); shape.lineTo(side * radius, shoulder);
    for (let i = 0; i <= 24; i++) { const a = side === 1 ? i / 24 * Math.PI / 2 : Math.PI - i / 24 * Math.PI / 2; shape.lineTo(Math.cos(a) * radius, shoulder + Math.sin(a) * radius); }
    shape.closePath(); const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.24, bevelEnabled: false, curveSegments: 24 });
    mesh(front, geo, colors.wall, [0, 0, 3.01]);
  }
  box(backWall, [8.1, height, 0.24], [0, height / 2, -3.43], colors.wall, 0.025);
  box(leftWall, [0.24, height, 6.6], [-3.98, height / 2, -0.15], colors.wall, 0.025);
  box(rightWall, [0.24, height, 6.6], [3.98, height / 2, -0.15], colors.wall, 0.025);
  for (const [wall, x, z, alongX, width] of [[front, 0, 3.13, true, 8], [backWall, 0, -3.43, true, 8], [leftWall, -3.98, -0.15, false, 6.6], [rightWall, 3.98, -0.15, false, 6.6]] as const) {
    box(wall, alongX ? [width, 0.13, 0.3] : [0.3, 0.13, width], [x, 3.29, z], colors.trim, 0.025);
    if (wall !== front) {
      box(wall, alongX ? [width, 0.16, 0.32] : [0.32, 0.16, width], [x, 0.12, z], colors.trim, 0.02);
      box(wall, alongX ? [width, 0.045, 0.29] : [0.29, 0.045, width], [x, 0.94, z], 0xd3debc, 0.01);
    }
  }
  for (const x of [-2.6, 2.6]) box(front, [2.85, 0.16, 0.32], [x, 0.12, 3.13], colors.trim, 0.02);
  arch(front, 2.22, 3.04, 0.34, [0, 0, 3.13], 0xf9e6c6, 0.15);
  box(root, [2.08, 0.11, 0.56], [0, -0.02, 3.14], colors.wood, 0.04);
  // A real roof and ceiling occlude the contents from outside; only cut away indoors.
  box(roof, [8.15, 0.13, 6.8], [0, 3.35, -0.15], 0xf8e9d4, 0.03);
  const gableShape = new THREE.Shape(); gableShape.moveTo(-3.99, 3.35); gableShape.lineTo(3.99, 3.35); gableShape.lineTo(0, 4.54); gableShape.closePath();
  for (const z of [-3.43, 3.13]) mesh(roof, new THREE.ExtrudeGeometry(gableShape, { depth: 0.18, bevelEnabled: false }), colors.wall, [0, 0, z - 0.09]);
  const roofShape = new THREE.Shape(); roofShape.moveTo(-4.25, 3.35); roofShape.lineTo(0, 4.61); roofShape.lineTo(4.25, 3.35); roofShape.lineTo(4.25, 3.5); roofShape.lineTo(0, 4.79); roofShape.lineTo(-4.25, 3.5); roofShape.closePath();
  mesh(roof, new THREE.ExtrudeGeometry(roofShape, { depth: 6.95, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.035, bevelSegments: 2 }), 0xa9c4b5, [0, 0, -3.65]);
  for (let i = 0; i < 15; i++) for (const side of [-1, 1]) {
    const beam = box(roof, [4.45, 0.065, 0.055], [side * 2.12, 4.12, -3.6 + i * 0.5], 0xbdd2c0, 0.025); beam.rotation.z = -side * 0.296;
  }
  const door = target('door', front, [-0.96, 0, 3.15], [0, 1.38, 3.3]);
  arch(door, 1.93, 2.86, 0.15, [0.96, 0, 0], 0x99c8aa);
  for (const side of [-1, 1]) {
    arch(door, 1.32, 1.48, 0.035, [0.96, 1.04, side * 0.098], 0xd0e2ce);
    arch(door, 1.44, 1.59, 0.045, [0.96, 0.99, side * 0.12], 0xbad9bc, 0.075);
    box(door, [0.047, 1.31, 0.04], [0.96, 1.67, side * 0.149], 0xe2e8ca, 0.008);
    box(door, [1.25, 0.05, 0.04], [0.96, 1.65, side * 0.15], 0xe2e8ca, 0.008);
    box(door, [1.45, 0.51, 0.035], [0.96, 0.5, side * 0.091], 0xaed2b3, 0.065);
    cylinder(door, 0.11, 0.11, 0.07, [1.63, 1.07, side * 0.13], colors.gold).rotation.x = Math.PI / 2;
    sphere(door, 0.089, [1.63, 1.07, side * 0.2], 0xe1b95e);
  }
  for (const y of [0.48, 1.57, 2.43]) cylinder(door, 0.042, 0.042, 0.24, [0.035, y, 0.12], colors.gold);
  const bell = target('bell', front, [1.43, 1.33, 3.34], [1.43, 1.4, 3.49]);
  box(bell, [0.34, 0.53, 0.13], [0, 0, 0], colors.pink, 0.095);
  sphere(bell, 0.09, [0, -0.03, 0.11], 0xffefd1, [1, 1, 0.55]); sphere(bell, 0.03, [0, 0.15, 0.084], 0xffedc7);
  label(front, 'CLASSIC', [1.43, 1.83, 3.3], 0.66);
  const plaque = box(front, [1.85, 0.21, 0.07], [0, 3.16, 3.3], 0xf9e8c8, 0.06);
  plaque.userData.skipPick = true; label(front, 'ZHIXIN’S STUDY', [0, 3.16, 3.345], 1.65);
  const porchLamp = group(front, 'PorchLantern', [-1.48, 2.13, 3.4]);
  box(porchLamp, [0.1, 0.31, 0.09], [0, 0.14, 0], colors.gold);
  const shade = cylinder(porchLamp, 0.08, 0.24, 0.22, [0, 0.06, 0.18], 0xf0d077);
  const bulb = sphere(porchLamp, 0.1, [0, -0.07, 0.18], 0xfff3af); bulb.material.emissive.setHex(0xe7b54e); bulb.material.emissiveIntensity = 0.65;
  void shade;
  picture(front, [2.47, 1.93, 2.98], 0.69, Math.PI);
  box(front, [0.98, 0.12, 0.28], [-2.3, 1.38, 2.87], colors.wood, 0.035);
  plant(front, [-2.55, 1.45, 2.82], 0.35, 'entrance-shelf');
  for (const x of [-2.33, -2.15, -1.97]) box(front, [0.12, 0.3, 0.18], [x, 1.6, 2.84], x < -2.2 ? colors.pink : colors.blue, 0.02);
  const doorMat = box(garden, [1.85, 0.025, 0.77], [0, 0.023, 4.5], 0xceba91, 0.04); doorMat.userData.skipPick = true;
  for (const z of [4.2, 4.28, 4.72, 4.8]) box(garden, [1.68, 0.007, 0.035], [0, 0.039, z], 0xb4c2a2, 0);
  plant(garden, [-2.85, 0, 3.93], 1.3, 'porch-left', undefined, true);
  plant(garden, [2.8, 0, 4.2], 1.1, 'porch-right', undefined, true);
  for (const side of [-1, 1]) for (let i = 0; i < 5; i++) {
    const bush = group(garden, `GardenShrub_${side}_${i}`, [side * (4.45 + (i % 2) * 0.4), -0.2, -3 + i * 1.85]);
    for (let j = 0; j < 4; j++) sphere(bush, 0.55, [Math.sin(j * 2) * 0.35, 0.38 + (j % 2) * 0.18, Math.cos(j * 2) * 0.29], j % 2 ? 0xabc48d : 0x91b47e, [1, 0.82, 1]);
  }
  // Arched window, sill and curtains. The opaque glazing remains a wall surface outdoors.
  arch(backWall, 1.42, 2.05, 0.12, [-0.75, 0.94, -3.2], 0xa9ccb6);
  arch(backWall, 1.17, 1.8, 0.08, [-0.75, 1.05, -3.11], 0xd6e8e3);
  box(backWall, [0.065, 1.65, 0.05], [-0.75, 1.92, -3.045], 0xf6eed5, 0.015);
  box(backWall, [1.15, 0.06, 0.05], [-0.75, 1.93, -3.04], 0xf6eed5, 0.015);
  box(backWall, [1.65, 0.11, 0.35], [-0.75, 0.92, -3.03], colors.trim, 0.04);
  for (const x of [-1.59, 0.1]) for (let i = 0; i < 3; i++) box(backWall, [0.095, 1.45, 0.1], [x + i * 0.054, 1.95, -3.06], 0xf4db96, 0.046);
  plant(backWall, [-1.22, 0.99, -2.99], 0.33, 'plant-window', actions);
  const rug = mesh(interior, new THREE.PlaneGeometry(4.3, 3.25), 0xffffff, [0, 0.028, 0.17]); rug.rotation.x = -Math.PI / 2; rug.userData.skipPick = true;
  rug.material.map = canvasTexture(512, ctx => {
    ctx.clearRect(0, 0, 512, 512); ctx.fillStyle = '#eee8d4'; ctx.beginPath(); ctx.roundRect(0, 0, 512, 512, 85); ctx.fill(); ctx.save(); ctx.clip();
    for (const [x, y, r, fill] of [[45, 180, 180, '#d8e2c9'], [430, 80, 125, '#c9dccc'], [270, 525, 170, '#c5d8e4'], [80, 470, 130, '#eed0c8']] as const) { ctx.fillStyle = fill; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }); rug.material.transparent = true; rug.material.alphaTest = 0.4;
  const exit = target('exit', interior, [0, 0, 2.65], [0, 0.06, 2.65]);
  box(exit, [1.9, 0.035, 0.65], [0, 0.025, 0], colors.mint, 0.025);
  for (const side of [-1, 1]) { const stroke = box(exit, [0.065, 0.008, 0.25], [side * 0.075, 0.05, 0.05], 0xffefd4, 0.004); stroke.rotation.y = side * Math.PI / 4; }
  const desk = group(interior, 'WritingDesk');
  box(desk, [2.7, 0.14, 1.35], [0, 1.03, -0.225], colors.wood, 0.065);
  box(desk, [2.45, 0.25, 0.1], [0, 0.82, -0.72], 0xd9af84, 0.03);
  for (const x of [-1.17, 1.17]) for (const z of [-0.72, 0.28]) box(desk, [0.15, 0.97, 0.15], [x, 0.48, z], 0xd9b087, 0.035);
  for (const [lang, x, tint] of [['zh', -0.65, colors.pink], ['en', 0.65, colors.blue]] as const) {
    const paper = target(`cv-${lang}`, interior, [x, 1.13, -0.1], [x, 1.15, -0.1]);
    box(paper, [0.87, 0.025, 1.05], [0, 0, 0], tint, 0.025);
    box(paper, [0.81, 0.014, 0.96], [0, 0.022, 0.012], 0xfff8e9, 0.008);
    box(paper, [0.24, 0.045, 0.1], [0, 0.045, -0.44], tint, 0.02);
    const title = label(paper, lang === 'zh' ? '中文' : 'English', [0, 0.034, -0.14], 0.73, lang === 'zh' ? '#ac788a' : '#7198b5'); title.rotation.x = -Math.PI / 2;
    for (let i = 0; i < 3; i++) box(paper, [0.57 - i * 0.06, 0.003, 0.012], [0, 0.032, 0.11 + i * 0.095], 0xdacfb7, 0);
    papers.set(lang, paper);
  }
  const mug = cylinder(desk, 0.09, 0.078, 0.19, [0.99, 1.21, -0.72], 0xf4efe0); mug.name = 'PencilCup';
  for (let i = 0; i < 3; i++) { const pencil = cylinder(desk, 0.012, 0.012, 0.28, [0.95 + i * 0.035, 1.38, -0.72], i === 0 ? colors.blue : colors.pink, 6); pencil.rotation.z = (i - 1) * 0.15; }
  plant(desk, [-1.02, 1.1, -0.73], 0.23, 'desk-flower', undefined, true);
  function shelf(id: 'blog' | 'papers', x: number, width: number) {
    const object = target(id, interior, [x, 0, -2.81], [x, 1.7, -2.39]);
    box(object, [width, 1.84, 0.1], [0, 1.02, -0.29], 0xe4c29a, 0.025);
    for (const side of [-1, 1]) { box(object, [0.11, 1.95, 0.7], [side * (width / 2 - 0.055), 1.04, 0], colors.wood, 0.035); box(object, [0.16, 0.19, 0.5], [side * (width / 2 - 0.17), 0.1, 0], 0xc99f76, 0.025); }
    for (const y of [0.19, 0.78, 1.39, 2.01]) box(object, [width + 0.04, 0.1, 0.73], [0, y, 0], colors.wood, 0.04);
    const palette = [colors.mint, colors.pink, colors.blue, colors.purple, 0xf0d898];
    for (let row = 0; row < 3; row++) for (let i = 0; i < 6; i++) {
      const book = group(object, `Book_${row}_${i}`, [-width / 2 + 0.28 + i * 0.265, 0.44 + row * 0.61, 0.04]);
      const h = 0.38 + (i % 3) * 0.03;
      box(book, [0.2, h, 0.4], [0, 0, 0], palette[(row + i) % palette.length], 0.018);
      box(book, [0.17, h - 0.045, 0.016], [0, 0, 0.209], 0xf5e9cf, 0);
      for (const y of [-h * 0.32, h * 0.32]) box(book, [0.014, 0.02, 0.34], [-0.105, y, 0], 0xe5ddbb, 0);
      if (i === 5) book.rotation.z = -0.12;
    }
    const tag = box(object, [1.3, 0.19, 0.025], [0, 1.98, 0.39], 0xffefd4, 0.025); tag.userData.skipPick = true;
    label(object, id === 'blog' ? 'NOTES / BLOG' : 'PUBLICATIONS', [0, 1.98, 0.41], 1.15);
    return object;
  }
  const blog = shelf('blog', -2.575, 2.15); const publications = shelf('papers', 1.05, 2);
  plant(blog, [-0.72, 2.07, 0.04], 0.5, 'plant-bookshelf', actions);
  picture(blog, [0.1, 2.42, -0.06], 0.5); lamp(blog, [0.75, 2.07, 0.08], 0.65);
  picture(publications, [-0.2, 2.42, -0.05], 0.55); plant(publications, [0.7, 2.07, 0.02], 0.42, 'plant-papers', actions);
  const globe = group(publications, 'DeskGlobe', [-0.75, 2.08, 0.01]); cylinder(globe, 0.11, 0.13, 0.05, [0, 0.025, 0], 0x716f65); cylinder(globe, 0.02, 0.03, 0.16, [0, 0.12, 0], colors.gold);
  sphere(globe, 0.17, [0, 0.29, 0], colors.blue); sphere(globe, 0.115, [0.09, 0.31, 0.1], 0x98bb78, [0.6, 0.9, 0.4]);
  const wardrobe = target('wardrobe', interior, [3.2, 0, 0.125], [2.7, 1.7, 0.125]); wardrobe.rotation.y = -Math.PI / 2;
  box(wardrobe, [2.14, 2.37, 0.12], [0, 1.25, -0.39], 0xbca6d2, 0.055);
  for (const side of [-1, 1]) { box(wardrobe, [0.13, 2.43, 0.95], [side * 1.02, 1.28, 0], colors.purple, 0.06); box(wardrobe, [0.18, 0.2, 0.68], [side * 0.83, 0.1, 0], 0xb29dc8, 0.055); }
  for (const y of [0.23, 1.7, 2.48]) box(wardrobe, [2.17, 0.12, 0.96], [0, y, 0], colors.purple, 0.055);
  for (const x of [-0.47, 0.45]) {
    sphere(wardrobe, 0.29, [x, 1.91, 0.03], x < 0 ? 0xb89ed4 : colors.mint, [1, 0.5, 0.95]);
    box(wardrobe, [0.4, 0.65, 0.22], [x, 1.14, 0.02], x < 0 ? colors.pink : 0xf4d483, 0.085);
    for (const side of [-1, 1]) { const sleeve = box(wardrobe, [0.18, 0.45, 0.2], [x + side * 0.27, 1.21, 0.02], x < 0 ? colors.pink : 0xf4d483, 0.08); sleeve.rotation.z = side * 0.3; }
  }
  const wardrobeDoors: THREE.Group[] = [];
  for (const side of [-1, 1]) {
    const hinge = group(wardrobe, side < 0 ? 'WardrobeDoor_Left' : 'WardrobeDoor_Right', [side * 1.04, 0, 0.49]);
    box(hinge, [1.02, 2.25, 0.085], [-side * 0.51, 1.35, 0], 0xd3c1e5, 0.04);
    box(hinge, [0.88, 2.05, 0.025], [-side * 0.51, 1.35, 0.055], colors.purple, 0.012);
    sphere(hinge, 0.055, [-side * 0.9, 1.22, 0.09], colors.gold);
    if (side === 1) sphere(hinge, 0.32, [-0.51, 1.43, 0.089], 0xe2e9dc, [0.65, 2.15, 0.06]);
    wardrobeDoors.push(hinge);
  }
  sofa(interior, actions); readingTable(interior); deskChair(interior);
  plant(interior, [3.25, 0, 2.15], 1.18, 'plant-floor', actions);
  // Each object remains in this shared world; only shell surfaces are cut away for the indoor camera.
  function updateCutaway(cameraPosition: THREE.Vector3, area: Area) {
    const indoors = area === 'room'; roof.visible = !indoors;
    front.visible = !indoors || cameraPosition.z < 2.92;
    backWall.visible = !indoors || cameraPosition.z > -3.2;
    leftWall.visible = !indoors || cameraPosition.x > -3.7;
    rightWall.visible = !indoors || cameraPosition.x < 3.7;
  }
  batchStatic(root);
  root.updateMatrixWorld(true);
  for (const [id, point] of [['plant-window', [-0.75, 0, -2.1]], ['plant-bookshelf', [-2.55, 0, -2]], ['plant-papers', [1.05, 0, -2]]] as const) {
    const slot = actions.slots.get(id)!;
    slot.anchors.approach.position.copy(slot.root.worldToLocal(new THREE.Vector3(...point)));
  }
  return { root, interior, front, roof, door, wardrobeDoors, targets, papers, actions, updateCutaway };
}
