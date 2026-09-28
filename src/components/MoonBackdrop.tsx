import { useEffect, useRef, useState } from 'react';
import { MoonScene } from '../three/MoonScene.ts';
import { moon } from '../lib/moon.ts';
import { useReducedMotion } from '../lib/hooks.ts';
import { useT } from '../i18n/locale.tsx';

/**
 * The single persistent WebGL canvas behind every page. Mounted once in App.
 */
export function MoonBackdrop() {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();
  const t = useT();
  const [hint, setHint] = useState<{ x: number; y: number; on: boolean }>({ x: 0, y: 0, on: false });

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let scene: MoonScene | null = null;
    try {
      scene = new MoonScene(canvas, { reducedMotion: reduced });
    } catch (err) {
      console.warn('WebGL unavailable, moon disabled', err);
      canvas.style.display = 'none';
      return;
    }
    moon.register(scene);

    // "drag me" hint under the moon, shown for a few seconds in hero mode until the first drag
    let shown = false;
    let hideTimer = 0;
    const tick = () => {
      if (!scene) return;
      const p = scene.project();
      const onHero = scene.getMode() === 'hero';
      setHint({ x: p.x, y: p.y + p.r + 22, on: onHero && !shown && window.scrollY < 40 });
      if (scene.isDragging() && !shown) { shown = true; }
    };
    const iv = window.setInterval(tick, 250);
    hideTimer = window.setTimeout(() => { shown = true; }, 9000);

    return () => {
      window.clearInterval(iv);
      window.clearTimeout(hideTimer);
      moon.register(null);
      scene?.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <canvas ref={ref} className="moon-canvas" aria-hidden="true" />
      <div className={`moon-hint ${hint.on ? 'is-on' : ''}`} style={{ left: hint.x, top: hint.y }}>{t.common.dragScroll}</div>
    </>
  );
}
