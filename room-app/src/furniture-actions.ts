import * as THREE from 'three';
export type FurnitureAction = 'sit' | 'water';
export type ActionContext = { objectId: string; action: FurnitureAction; anchors: Readonly<Record<string, THREE.Object3D>> };
export type ActionHandler = (context: ActionContext) => void | Promise<void>;
export type FurnitureSlot = {
  id: string; action: FurnitureAction; root: THREE.Group;
  anchors: Record<string, THREE.Object3D>; collision: { minX: number; maxX: number; minZ: number; maxZ: number } | null;
};
/** Future actions are opt-in: an unbound prop has no click prompt or interaction. */
export class FurnitureActions {
  readonly slots = new Map<string, FurnitureSlot>();
  private handlers = new Map<string, ActionHandler>();
  register(slot: FurnitureSlot) {
    if (this.slots.has(slot.id)) throw new Error(`Duplicate furniture id: ${slot.id}`);
    slot.root.userData.furnitureId = slot.id;
    slot.root.userData.futureAction = slot.action;
    slot.root.userData.actionAnchors = Object.fromEntries(Object.entries(slot.anchors).map(([key, object]) => [key, object.name]));
    this.slots.set(slot.id, slot);
  }
  bind(id: string, handler: ActionHandler) {
    if (!this.slots.has(id)) throw new Error(`Unknown furniture: ${id}`);
    this.handlers.set(id, handler);
    return () => { if (this.handlers.get(id) === handler) this.handlers.delete(id); };
  }
  isEnabled(id: string) { return this.handlers.has(id); }
  async activate(id: string) {
    const slot = this.slots.get(id); const handler = this.handlers.get(id);
    if (!slot || !handler) return false;
    await handler({ objectId: slot.id, action: slot.action, anchors: slot.anchors }); return true;
  }
}
