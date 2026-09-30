import * as THREE from 'three';
import { box, sphere, cylinder, tube, group, material, disposeTree, canvasTexture } from './modeling';
import type { Outfit } from './domain';

export function createAvatar(scene: THREE.Scene, outfit: Outfit) {
  const root = group(scene, 'AvatarRoot'); const body = group(root, 'BodyRig');
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.82), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, opacity: 0.23 }));
  shadow.material.map = canvasTexture(128, ctx => { const g = ctx.createRadialGradient(64, 64, 5, 64, 64, 62); g.addColorStop(0, '#403d31'); g.addColorStop(1, '#403d3100'); ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128); });
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.031; root.add(shadow);
  const skin = 0xf0c3a6; const hairColor = 0x443b35;
  const torso = box(body, [0.53, 0.51, 0.36], [0, 0.79, 0], 0xc9cbd1, 0.13); torso.name = 'TopBody';
  sphere(body, 0.10, [0, 1.06, 0], skin, [0.85, 1.1, 0.85]);
  const head = group(body, 'Head');
  sphere(head, 0.408, [0, 1.43, -0.095], hairColor, [1.02, 1.03, 0.88]).name = 'HairBase';
  // A complete crown is independent of the hats, so taking one off reveals hair.
  const crownHair = group(head, 'HairCrown');
  const crown = new THREE.Mesh(new THREE.SphereGeometry(0.417, 28, 16, 0, Math.PI * 2, 0, 1.32), material(hairColor));
  crown.position.set(0, 1.405, 0.01); crown.scale.set(1.02, 1.08, 0.96); crownHair.add(crown);
  sphere(head, 0.395, [0, 1.35, 0.055], skin, [1, 1.02, 0.91]).name = 'Face';
  for (const side of [-1, 1]) {
    sphere(head, 0.083, [side * 0.388, 1.34, 0.04], skin, [0.72, 1, 0.66]);
    sphere(head, 0.038, [side * 0.405, 1.34, 0.083], 0xdfab94, [0.45, 1, 0.5]);
  }
  const eyes: THREE.Group[] = [];
  for (const x of [-0.142, 0.142]) {
    const eye = group(head, x < 0 ? 'Eye_Left' : 'Eye_Right', [x, 1.385, 0.399]);
    sphere(eye, 0.069, [0, 0, 0], 0xfff9ea, [1, 0.95, 0.32]);
    sphere(eye, 0.049, [0.006, -0.004, 0.02], 0x42392f, [0.95, 1.05, 0.4]);
    sphere(eye, 0.017, [-0.008, 0.018, 0.04], 0xfffaf0, [0.8, 1, 0.4]); eyes.push(eye);
    tube(head, [[x - 0.073, 1.463, 0.35], [x, 1.486, 0.377], [x + 0.064, 1.464, 0.355]], 0.014, hairColor);
    sphere(head, 0.062, [x * 1.66, 1.269, 0.355], 0xeeb09c, [1, 0.45, 0.15]);
  }
  sphere(head, 0.031, [0, 1.275, 0.424], 0xe9b69a, [0.83, 0.7, 0.85]);
  tube(head, [[-0.075, 1.185, 0.358], [-0.036, 1.164, 0.383], [0.01, 1.16, 0.39], [0.061, 1.181, 0.366]], 0.01, 0x9e6551);
  const pony = sphere(head, 0.155, [0, 1.17, -0.41], hairColor, [0.95, 1.95, 0.92]); pony.rotation.x = -0.2;
  sphere(head, 0.09, [0, 0.94, -0.36], hairColor, [0.85, 1.35, 0.85]);
  sphere(head, 0.057, [0, 1.39, -0.433], 0xa8cbb6, [1.3, 0.6, 0.65]);
  // Soft, side-parted bangs follow the face's curve instead of floating like eyebrows.
  function fringe(name: string, shape: THREE.Shape) {
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.027, bevelEnabled: true, bevelSize: 0.009, bevelThickness: 0.008, bevelSegments: 2, curveSegments: 16 });
    const positions = geometry.getAttribute('position');
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i); const y = positions.getY(i);
      const faceDepth = Math.sqrt(Math.max(0.001, 0.395 ** 2 - x ** 2 - ((y - 1.35) / 1.02) ** 2));
      positions.setZ(i, positions.getZ(i) + 0.068 + faceDepth * 0.91);
    }
    geometry.computeVertexNormals();
    const part = new THREE.Mesh(geometry, material(hairColor)); part.name = name; head.add(part);
  }
  const leftFringe = new THREE.Shape(); leftFringe.moveTo(0.09, 1.737);
  leftFringe.bezierCurveTo(-0.04, 1.805, -0.25, 1.755, -0.34, 1.61);
  leftFringe.bezierCurveTo(-0.375, 1.545, -0.365, 1.49, -0.337, 1.465);
  leftFringe.bezierCurveTo(-0.265, 1.515, -0.18, 1.527, -0.09, 1.565);
  leftFringe.bezierCurveTo(0.005, 1.605, 0.06, 1.67, 0.09, 1.737); fringe('Hair_FringeLeft', leftFringe);
  const rightFringe = new THREE.Shape(); rightFringe.moveTo(0.09, 1.737);
  rightFringe.bezierCurveTo(0.24, 1.77, 0.35, 1.66, 0.37, 1.53);
  rightFringe.bezierCurveTo(0.37, 1.485, 0.354, 1.46, 0.339, 1.45);
  rightFringe.bezierCurveTo(0.275, 1.535, 0.15, 1.565, 0.09, 1.737); fringe('Hair_FringeRight', rightFringe);
  for (const side of [-1, 1]) {
    const temple = sphere(head, 0.13, [side * 0.35, 1.29, 0.18], hairColor, [0.38, 1.65, 0.65]); temple.rotation.z = -side * 0.13;
    tube(head, [[side * 0.32, 1.52, 0.22], [side * 0.365, 1.32, 0.265], [side * 0.345, 1.13, 0.215], [side * 0.30, 1.07, 0.145]], 0.023, hairColor);
  }
  const arms: THREE.Group[] = []; const sleeves: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>[] = [];
  const cuffs: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>[] = []; const legs: THREE.Group[] = [];
  for (const side of [-1, 1]) {
    const arm = group(body, side < 0 ? 'Arm_Left' : 'Arm_Right', [side * 0.32, 0.995, 0]); arm.rotation.z = side * 0.1;
    sleeves.push(box(arm, [0.205, 0.37, 0.235], [0, -0.17, 0], 0xc9cbd1, 0.095));
    cuffs.push(box(arm, [0.192, 0.073, 0.221], [0, -0.346, 0], 0xbfc1c9, 0.035));
    sphere(arm, 0.084, [0, -0.414, 0.005], skin, [0.88, 1.12, 0.87]);
    sphere(arm, 0.035, [-side * 0.055, -0.402, 0.052], skin); arms.push(arm);
    const leg = group(body, side < 0 ? 'Leg_Left' : 'Leg_Right', [side * 0.142, 0.55, 0]);
    box(leg, [0.245, 0.38, 0.28], [0, -0.155, 0], 0x737989, 0.065);
    box(leg, [0.25, 0.05, 0.29], [0, -0.324, 0], 0x7f8594, 0.02);
    box(leg, [0.267, 0.12, 0.37], [0, -0.453, 0.066], 0xe6ddc8, 0.055);
    box(leg, [0.255, 0.155, 0.34], [0, -0.408, 0.068], 0xfff4de, 0.075);
    box(leg, [0.257, 0.066, 0.14], [0, -0.413, -0.04], 0xa4c9b5, 0.025);
    for (let i = 0; i < 3; i++) box(leg, [0.14, 0.014, 0.018], [0, -0.327, 0.03 + i * 0.046], 0xf5eddc, 0.006);
    legs.push(leg);
  }
  let hat = group(head, 'HatAnchor'); let details = group(body, 'TopDetails');
  function dress(value: Outfit) {
    // Keep hair beneath every hat too; slightly compress its volume to avoid clipping.
    crown.scale.set(value.hat === 'none' ? 1.02 : 0.97, value.hat === 'bucket' ? 1.02 : 1.08, value.hat === 'none' ? 0.96 : 0.94);
    const color = { grey: 0xc9cbd1, pink: 0xeeb9c7, yellow: 0xf4d286 }[value.top];
    torso.material.color.setHex(color); sleeves.forEach(s => s.material.color.setHex(color)); cuffs.forEach(s => s.material.color.setHex(color).multiplyScalar(0.94));
    body.remove(details); disposeTree(details); details = group(body, 'TopDetails');
    if (value.top === 'grey') {
      box(details, [0.48, 0.09, 0.33], [0, 0.525, 0], 0xb5d1e6, 0.025);
      for (const side of [-1, 1]) { const collar = box(details, [0.115, 0.145, 0.045], [side * 0.087, 1.033, 0.13], 0xb7d5eb, 0.014); collar.rotation.z = side * 0.4; }
      box(details, [0.53, 0.072, 0.359], [0, 0.572, 0], 0xbfc1c9, 0.03);
    } else if (value.top === 'pink') {
      box(details, [0.15, 0.46, 0.03], [0, 0.80, 0.183], 0xffefd9, 0.012);
      for (const side of [-1, 1]) box(details, [0.048, 0.44, 0.028], [side * 0.09, 0.79, 0.205], 0xe5a9b7, 0.013);
      for (let i = 0; i < 3; i++) sphere(details, 0.016, [-0.09, 0.67 + i * 0.12, 0.229], 0xae8c90, [1, 1, 0.55]);
      for (const x of [-0.19, 0.19]) box(details, [0.105, 0.086, 0.021], [x, 0.645, 0.19], 0xe7aebd, 0.019);
    } else {
      sphere(details, 0.225, [0, 1.01, -0.19], 0xecc879, [1, 0.62, 0.65]);
      box(details, [0.29, 0.13, 0.024], [0, 0.657, 0.19], 0xedc97c, 0.035);
      for (const side of [-1, 1]) tube(details, [[side * 0.084, 1.03, 0.13], [side * 0.078, 0.876, 0.197]], 0.009, 0xfff0c9);
    }
    for (const side of [-1, 1]) tube(details, [[side * 0.135, 1.045, 0.164], [side * 0.1, 0.875, 0.204], [side * 0.024, 0.723, 0.211]], 0.022, 0xa5d0a1);
    box(details, [0.145, 0.184, 0.034], [0, 0.65, 0.222], 0xa5cda0, 0.018);
    box(details, [0.116, 0.15, 0.018], [0, 0.65, 0.244], 0xfff6df, 0.012);
    head.remove(hat); disposeTree(hat); hat = group(head, 'HatAnchor', [0, 1.61, 0]);
    if (value.hat === 'cap') {
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.441, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), material(0x3c4b69)); cap.scale.y = 0.8; hat.add(cap);
      const shape = new THREE.Shape(); shape.moveTo(-0.365, 0); shape.bezierCurveTo(-0.46, 0.23, -0.32, 0.39, 0, 0.41); shape.bezierCurveTo(0.32, 0.39, 0.46, 0.23, 0.365, 0); shape.closePath();
      const brim = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.023, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.008, bevelSegments: 2, curveSegments: 16 }), material(0x374663)); brim.rotation.x = Math.PI / 2; brim.position.set(0, 0, 0.2); hat.add(brim);
      const badge = new THREE.Shape(); badge.moveTo(-0.05, 0); badge.lineTo(0.05, 0); badge.lineTo(0, 0.074); badge.closePath();
      const icon = new THREE.Mesh(new THREE.ShapeGeometry(badge), material(0xb3d7b1)); icon.position.set(0, 0.13, 0.405); hat.add(icon);
      sphere(hat, 0.025, [0, 0.355, 0], 0x35445f, [1, 0.7, 1]);
    } else if (value.hat === 'beret') {
      const beret = sphere(hat, 0.46, [0.035, 0.10, -0.02], 0xbea6d9, [1, 0.45, 0.97]); beret.rotation.z = -0.09;
      sphere(hat, 0.036, [0.02, 0.31, 0], 0xbca0d5, [0.6, 1, 0.6]);
    } else if (value.hat === 'bucket') {
      cylinder(hat, 0.31, 0.4, 0.29, [0, 0.13, 0], 0xa8cfb5, 28);
      cylinder(hat, 0.405, 0.5, 0.087, [0, -0.025, 0], 0xa3c9af, 28);
      cylinder(hat, 0.369, 0.385, 0.03, [0, 0.037, 0], 0xc2ddc6, 28);
    }
    root.traverse(o => { o.userData.skipPick = true; if (o instanceof THREE.Mesh && o !== shadow) o.castShadow = true; });
  }
  dress(outfit);
  function animate(time: number, moving: boolean, reaching: boolean, reduced: boolean) {
    const swing = moving ? Math.sin(time * 10) * 0.4 : 0;
    body.position.y = !reduced ? (moving ? Math.abs(Math.sin(time * 10)) * 0.025 : Math.sin(time * 1.9) * 0.006) : 0;
    legs[0].rotation.x = swing; legs[1].rotation.x = -swing;
    arms[0].rotation.x = -swing; arms[1].rotation.x = reaching ? -1.05 : swing;
    const blink = time % 5.3; const openness = reduced || blink > 0.16 ? 1 : Math.max(0.08, Math.abs(blink - 0.08) / 0.08);
    eyes.forEach(eye => { eye.scale.y = openness; });
  }
  return { root, dress, animate };
}
