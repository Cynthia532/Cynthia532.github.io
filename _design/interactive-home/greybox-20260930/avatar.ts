import * as THREE from 'three';
import { box, sphere, material, disposeTree } from './world';
import type { Outfit } from './domain';

export function createAvatar(scene: THREE.Scene, outfit: Outfit) {
  const root = new THREE.Group(); scene.add(root);
  const body = new THREE.Group(); root.add(body);
  const shirt = box(body, [0.46, 0.47, 0.32], [0, 0.69, 0], 0xbcc1c5, 0.07);
  box(body, [0.23, 0.07, 0.14], [0, 0.92, 0.08], 0xb5cddd, 0.02);
  const head = sphere(body, 0.33, [0, 1.23, 0.015], 0xe8cbb1); head.scale.set(1, 1.06, 0.94);
  const hair = sphere(body, 0.336, [0, 1.28, -0.075], 0x454647); hair.scale.z = 0.84;
  // Face projects in front of the hair mass. Details stay intentionally geometric.
  for (const x of [-0.12, 0.12]) {
    const eye = sphere(body, 0.027, [x, 1.27, 0.302], 0x343b45); eye.scale.y = 1.15;
  }
  box(body, [0.075, 0.017, 0.016], [0, 1.13, 0.31], 0xa27770, 0.005);
  const pony = sphere(body, 0.12, [0, 1.12, -0.33], 0x454647); pony.scale.y = 1.5;
  for (const x of [-0.075, 0.075]) box(body, [0.025, 0.28, 0.02], [x, 0.76, 0.177], 0xabcdb6, 0.004);
  box(body, [0.12, 0.15, 0.035], [0, 0.59, 0.19], 0xf3efdf, 0.02);
  const arms: THREE.Group[] = []; const sleeves: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>[] = [];
  const legs: THREE.Group[] = [];
  for (const side of [-1, 1]) {
    const arm = new THREE.Group(); arm.position.set(side * 0.3, 0.88, 0); body.add(arm);
    sleeves.push(box(arm, [0.16, 0.34, 0.2], [0, -0.15, 0], 0xbcc1c5, 0.05));
    sphere(arm, 0.078, [0, -0.35, 0], 0xe8cbb1); arms.push(arm);
    const leg = new THREE.Group(); leg.position.set(side * 0.125, 0.46, 0); body.add(leg);
    box(leg, [0.19, 0.36, 0.21], [0, -0.16, 0], 0x7f8994, 0.04);
    box(leg, [0.22, 0.13, 0.32], [0, -0.38, 0.045], 0xeeeade, 0.04); legs.push(leg);
  }
  let hat = new THREE.Group(); body.add(hat);
  function dress(value: Outfit) {
    const color = { grey: 0xbcc1c5, pink: 0xe6bdc8, yellow: 0xe5d7a5 }[value.top];
    shirt.material.color.setHex(color); sleeves.forEach(s => s.material.color.setHex(color));
    body.remove(hat); disposeTree(hat); hat = new THREE.Group(); body.add(hat); hat.position.y = 1.38;
    if (value.hat === 'cap') {
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.37, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), material(0x47546b));
      hat.add(cap); box(hat, [0.53, 0.05, 0.3], [0, 0.01, 0.27], 0x47546b, 0.05);
    } else if (value.hat === 'beret') {
      const beret = sphere(hat, 0.4, [0.035, 0.07, 0], 0xb8a8d1); beret.scale.y = 0.45;
      sphere(hat, 0.04, [0.04, 0.24, 0], 0xb8a8d1);
    } else if (value.hat === 'bucket') {
      const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.35, 0.26, 16), material(0xabcdb6)); bucket.position.y = 0.09; hat.add(bucket);
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.46, 0.09, 16), material(0xabcdb6)); brim.position.y = -0.06; hat.add(brim);
    }
    root.traverse(o => { o.userData.skipPick = true; if (o instanceof THREE.Mesh) o.castShadow = true; });
  }
  dress(outfit);
  function animate(time: number, moving: boolean, reaching: boolean, reduced: boolean) {
    const swing = moving ? Math.sin(time * 10) * 0.45 : 0;
    body.position.y = moving && !reduced ? Math.abs(Math.sin(time * 10)) * 0.025 : 0;
    legs[0].rotation.x = swing; legs[1].rotation.x = -swing;
    arms[0].rotation.x = -swing; arms[1].rotation.x = reaching ? -1.05 : swing;
  }
  return { root, dress, animate };
}
