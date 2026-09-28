import type { MoonScene, MoonMode } from '../three/MoonScene.ts';

/**
 * A tiny singleton so pages can talk to the persistent moon without prop drilling.
 * The MoonBackdrop component registers the scene when it mounts.
 */
type Listener = (scene: MoonScene | null) => void;

let scene: MoonScene | null = null;
const listeners = new Set<Listener>();
let pendingMode: MoonMode = 'hero';

export const moon = {
  get(): MoonScene | null { return scene; },
  register(s: MoonScene | null) {
    scene = s;
    if (s) s.setMode(pendingMode);
    listeners.forEach((l) => l(s));
  },
  subscribe(l: Listener) { listeners.add(l); return () => { listeners.delete(l); }; },
  setMode(mode: MoonMode) { pendingMode = mode; scene?.setMode(mode); },
  setScroll(p: number) { scene?.setScroll(p); },
  setScrub(t: number) { scene?.setScrub(t); },
  clearScrub() { scene?.clearScrub(); },
  onDrag(fn: (dx: number, dy: number) => void) { return scene ? scene.onDrag(fn) : () => {}; },
  project() { return scene?.project() ?? null; },
  isHovering() { return !!scene?.isHovering(); },
  isDragging() { return !!scene?.isDragging(); },
};
