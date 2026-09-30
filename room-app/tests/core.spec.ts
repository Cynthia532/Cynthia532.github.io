import { test, expect } from '@playwright/test';
import { direction, move, isWalkable, ROOM_BOUNDS, OBSTACLES, parseOutfit, DEFAULT_OUTFIT, inReach } from '../src/domain';
import { FurnitureActions } from '../src/furniture-actions';
import { Group } from 'three';
test('diagonal motion has the same speed and opposing keys cancel', () => {
  const diagonal = direction(new Set(['KeyW', 'KeyD']));
  expect(Math.hypot(diagonal.x, diagonal.z)).toBeCloseTo(1);
  expect(direction(new Set(['KeyW', 'ArrowDown', 'KeyA', 'KeyD']))).toEqual({ x: 0, z: 0 });
});
test('travel is consistent across frame rates', () => {
  const walk = (fps: number) => {
    let p = { x: 0, z: 2.1 };
    for (let i = 0; i < fps; i++) p = move(p, { x: 1, z: 0 }, 1 / fps, 'room');
    return p.x;
  };
  expect(walk(30)).toBeCloseTo(walk(120));
});
test('movement stays relative to the rotated camera and keeps its speed', () => {
  const forward = direction(new Set(['KeyW']), Math.PI / 2);
  expect(forward.x).toBeCloseTo(-1); expect(forward.z).toBeCloseTo(0);
  const right = direction(new Set(['ArrowRight']), -Math.PI / 2);
  expect(right.x).toBeCloseTo(0); expect(right.z).toBeCloseTo(1);
  expect(Math.hypot(...Object.values(direction(new Set(['KeyW', 'KeyD']), 2.2)))).toBeCloseTo(1);
  expect(direction(new Set(['KeyQ', 'KeyE']), 0.4)).toEqual({ x: 0, z: 0 });
});
test('desk and walls block motion and a stalled frame cannot tunnel', () => {
  let p = { x: 0, z: 2.1 };
  for (let i = 0; i < 300; i++) p = move(p, { x: 0, z: -1 }, 1 / 60, 'room');
  expect(p.z).toBeGreaterThanOrEqual(0.45 + 0.23);
  p = move(p, { x: 0, z: -1 }, 50, 'room');
  expect(isWalkable(p, ROOM_BOUNDS, OBSTACLES)).toBe(true);
  for (let i = 0; i < 600; i++) p = move(p, { x: -1, z: 0 }, 1 / 60, 'room');
  expect(p.x).toBeGreaterThanOrEqual(-3.8 + 0.23);
});
test('interaction requires the correct area and distance', () => {
  expect(inReach('cv-en', { x: 0, z: 2.1 }, 'room')).toBe(false);
  expect(inReach('cv-en', { x: 0, z: 1 }, 'room')).toBe(true);
  expect(inReach('cv-en', { x: 0.65, z: 0.85 }, 'porch')).toBe(false);
  expect(inReach('door', { x: 0, z: 4.55 }, 'porch')).toBe(true);
  expect(inReach('exit', { x: -2, z: -1 }, 'room')).toBe(true);
  expect(inReach('exit', { x: 0, z: 2.65 }, 'porch')).toBe(false);
});
test('invalid or old outfit data restores a complete default', () => {
  for (const value of [null, '{', 'null', '{"version":2}', '{"version":1,"hat":"alien","top":"pink"}']) expect(parseOutfit(value)).toEqual(DEFAULT_OUTFIT);
  expect(parseOutfit('{"version":1,"hat":"beret","top":"pink"}')).toEqual({ version: 1, hat: 'beret', top: 'pink' });
});
test('furniture collisions preserve the door and dressing aisles', () => {
  expect(isWalkable({ x: -3.1, z: 0.4 }, ROOM_BOUNDS, OBSTACLES)).toBe(false);
  expect(isWalkable({ x: 3.25, z: 2.15 }, ROOM_BOUNDS, OBSTACLES)).toBe(false);
  for (const p of [{ x: 0, z: 2.4 }, { x: 2.15, z: 1.85 }, { x: 2.25, z: 0.3 }, { x: -2.05, z: 0.4 }]) expect(isWalkable(p, ROOM_BOUNDS, OBSTACLES)).toBe(true);
});
test('future furniture actions remain inactive until bound and can be detached', async () => {
  const actions = new FurnitureActions(); const root = new Group(); const seat = new Group(); root.add(seat);
  actions.register({ id: 'sofa', action: 'sit', root, anchors: { seat }, collision: null });
  expect(await actions.activate('sofa')).toBe(false);
  let calls = 0;
  const unbind = actions.bind('sofa', context => { expect(context.anchors.seat).toBe(seat); calls++; });
  expect(await actions.activate('sofa')).toBe(true); expect(calls).toBe(1);
  unbind(); expect(actions.isEnabled('sofa')).toBe(false); expect(await actions.activate('sofa')).toBe(false);
});
