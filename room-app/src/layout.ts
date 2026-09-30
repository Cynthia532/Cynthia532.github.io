// Shared by the meshes, collision system and future action registry.
export const PROP_BOUNDS = {
  sofa: { minX: -3.7, maxX: -2.55, minZ: -0.8, maxZ: 1.7 },
  'reading-table': { minX: -3.65, maxX: -2.75, minZ: -1.85, maxZ: -1 },
  pouf: { minX: -3, maxX: -2.3, minZ: 1.8, maxZ: 2.5 },
  chair: { minX: -0.42, maxX: 0.42, minZ: -1.96, maxZ: -1.12 },
  'plant-floor': { minX: 2.94, maxX: 3.56, minZ: 1.84, maxZ: 2.46 }
};
export const FURNITURE_OBSTACLES = Object.values(PROP_BOUNDS);
