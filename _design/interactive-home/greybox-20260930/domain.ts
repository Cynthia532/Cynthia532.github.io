export type Lang = 'zh' | 'en';
export type Area = 'porch' | 'room';
export type Point = { x: number; z: number };
export type Obstacle = { minX: number; maxX: number; minZ: number; maxZ: number };
export type TargetId = 'door' | 'bell' | 'exit' | 'cv-zh' | 'cv-en' | 'blog' | 'papers' | 'wardrobe';
export const RADIUS = 0.23;
export const SPEED = 2.1;
export const ROOM_BOUNDS: Obstacle = { minX: -3.8, maxX: 3.8, minZ: -3.3, maxZ: 2.8 };
export const PORCH_BOUNDS: Obstacle = { minX: -2.5, maxX: 2.5, minZ: 3.3, maxZ: 6.1 };
export const OBSTACLES: Obstacle[] = [
  { minX: -1.35, maxX: 1.35, minZ: -0.9, maxZ: 0.45 },
  { minX: -3.65, maxX: -1.5, minZ: -3.18, maxZ: -2.45 },
  { minX: 0.05, maxX: 2.05, minZ: -3.18, maxZ: -2.45 },
  { minX: 2.75, maxX: 3.65, minZ: -0.95, maxZ: 1.2 }
];
export const INTERACTION_POINTS: Record<TargetId, Point> = {
  door: { x: 0, z: 3.5 }, bell: { x: 1.4, z: 3.65 },
  exit: { x: 0, z: 2.65 },
  'cv-zh': { x: -0.65, z: 0.85 }, 'cv-en': { x: 0.65, z: 0.85 },
  blog: { x: -2.55, z: -2 }, papers: { x: 1, z: -2 }, wardrobe: { x: 2.3, z: 0.15 }
};
export const HATS = ['cap', 'beret', 'bucket', 'none'] as const;
export const TOPS = ['grey', 'pink', 'yellow'] as const;
export type Outfit = { version: 1; hat: typeof HATS[number]; top: typeof TOPS[number] };
export const DEFAULT_OUTFIT: Outfit = { version: 1, hat: 'cap', top: 'grey' };
export function parseOutfit(value: string | null): Outfit {
  try {
    const p = JSON.parse(value || 'null');
    if (p?.version === 1 && HATS.includes(p.hat) && TOPS.includes(p.top)) return { version: 1, hat: p.hat, top: p.top };
  } catch { /* Invalid / outdated preferences restore the default. */ }
  return { ...DEFAULT_OUTFIT };
}
export function direction(keys: Set<string>, cameraYaw = 0): Point {
  let x = Number(keys.has('KeyD') || keys.has('ArrowRight')) - Number(keys.has('KeyA') || keys.has('ArrowLeft'));
  let z = Number(keys.has('KeyS') || keys.has('ArrowDown')) - Number(keys.has('KeyW') || keys.has('ArrowUp'));
  const length = Math.hypot(x, z);
  if (length) { x /= length; z /= length; }
  const cosine = Math.cos(cameraYaw); const sine = Math.sin(cameraYaw);
  return { x: x * cosine + z * sine, z: -x * sine + z * cosine };
}
export function isWalkable(p: Point, bounds: Obstacle, obstacles: Obstacle[], radius = RADIUS): boolean {
  if (p.x - radius < bounds.minX || p.x + radius > bounds.maxX || p.z - radius < bounds.minZ || p.z + radius > bounds.maxZ) return false;
  return !obstacles.some(b => {
    const x = Math.max(b.minX, Math.min(p.x, b.maxX));
    const z = Math.max(b.minZ, Math.min(p.z, b.maxZ));
    return Math.hypot(p.x - x, p.z - z) < radius;
  });
}
export function move(p: Point, velocity: Point, dt: number, area: Area): Point {
  const bounds = area === 'room' ? ROOM_BOUNDS : PORCH_BOUNDS;
  const obstacles = area === 'room' ? OBSTACLES : [];
  const travel = Math.min(Math.max(dt, 0), 0.05) * SPEED;
  const steps = Math.max(1, Math.ceil(travel / (RADIUS / 2)));
  const result = { ...p };
  for (let i = 0; i < steps; i++) {
    const x = { x: result.x + velocity.x * travel / steps, z: result.z };
    if (isWalkable(x, bounds, obstacles)) result.x = x.x;
    const z = { x: result.x, z: result.z + velocity.z * travel / steps };
    if (isWalkable(z, bounds, obstacles)) result.z = z.z;
  }
  return result;
}
export function inReach(id: TargetId, position: Point, area: Area): boolean {
  if (id === 'exit') return area === 'room';
  if ((id === 'door' || id === 'bell') !== (area === 'porch')) return false;
  const target = INTERACTION_POINTS[id];
  return Math.hypot(position.x - target.x, position.z - target.z) <= 1.25;
}
