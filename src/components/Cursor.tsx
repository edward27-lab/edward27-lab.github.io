import { useEffect, useRef } from 'react';
import { moon } from '../lib/moon.ts';
import { useT } from '../i18n/locale.tsx';

/**
 * Custom cursor: a dot that follows exactly and a ring that lags behind.
 * The ring grows on links and turns into a dashed "drag" ring over the moon.
 * Disabled on touch devices via CSS.
 */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const t = useT();

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    document.body.classList.add('has-cursor');
    let x = window.innerWidth / 2, y = window.innerHeight / 2, rx = x, ry = y;
    let raf = 0;
    let visible = false;
    const onMove = (e: PointerEvent) => {
      x = e.clientX; y = e.clientY;
      if (!visible) { visible = true; rx = x; ry = y; }
      const t = e.target as HTMLElement | null;
      const link = !!t?.closest?.('a, button, [role="button"], input, textarea, select, label, .tilt');
      const overMoon = moon.isHovering();
      const dragging = moon.isDragging();
      const r = ring.current;
      if (r) {
        r.classList.toggle('is-link', link && !overMoon);
        r.classList.toggle('is-moon', overMoon || dragging);
        r.classList.toggle('is-drag', dragging);
      }
    };
    const loop = () => {
      rx += (x - rx) * 0.18; ry += (y - ry) * 0.18;
      if (dot.current) dot.current.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
      if (ring.current) ring.current.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      raf = requestAnimationFrame(loop);
    };
    const onLeave = () => { if (dot.current) dot.current.style.opacity = '0'; if (ring.current) ring.current.style.opacity = '0'; };
    const onEnter = () => { if (dot.current) dot.current.style.opacity = '1'; if (ring.current) ring.current.style.opacity = '1'; };
    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('mouseleave', onLeave);
    document.documentElement.addEventListener('mouseenter', onEnter);
    raf = requestAnimationFrame(loop);
    return () => {
      document.body.classList.remove('has-cursor');
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('mouseleave', onLeave);
      document.documentElement.removeEventListener('mouseenter', onEnter);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div ref={dot} className="cursor-dot" aria-hidden="true" />
      <div ref={ring} className="cursor-ring" aria-hidden="true"><span className="lbl">{t.common.drag}</span></div>
    </>
  );
}
