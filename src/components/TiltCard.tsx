import { useEffect, useRef, type ReactNode, type MouseEvent } from 'react';
import { moon } from '../lib/moon.ts';
import { useReducedMotion } from '../lib/hooks.ts';

/**
 * A card that tilts toward the pointer and carries a faint highlight on the
 * edge facing the moon, so the cards visibly "catch the moonlight".
 */
export function TiltCard({ children, className = '', max = 7, onClick, as: Tag = 'div', href, ...rest }: { children: ReactNode; className?: string; max?: number; onClick?: (e: MouseEvent) => void; as?: 'div' | 'a' | 'article'; href?: string } & Record<string, unknown>) {
  const ref = useRef<HTMLElement | null>(null);
  const reduced = useReducedMotion();

  // moonlight direction: computed from the moon's projected position relative to the card
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const p = moon.project();
      if (!p) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const dx = p.x - cx, dy = p.y - cy;
      const len = Math.hypot(dx, dy) || 1;
      // point on the card edge facing the moon, expressed in %
      const lx = 50 + (dx / len) * 60, ly = 50 + (dy / len) * 60;
      el.style.setProperty('--lx', `${lx}%`);
      el.style.setProperty('--ly', `${ly}%`);
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(update); };
    on();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    const iv = window.setInterval(on, 800);
    return () => { window.removeEventListener('scroll', on); window.removeEventListener('resize', on); window.clearInterval(iv); cancelAnimationFrame(raf); };
  }, []);

  const onMove = (e: MouseEvent) => {
    const el = ref.current;
    if (!el || reduced) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    el.style.setProperty('--ry', `${(px - 0.5) * 2 * max}deg`);
    el.style.setProperty('--rx', `${(0.5 - py) * 2 * max}deg`);
    el.style.setProperty('--mx', `${px * 100}%`);
    el.style.setProperty('--my', `${py * 100}%`);
    el.classList.add('is-tracking');
  };
  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.classList.remove('is-tracking');
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  };

  // Typed as 'a' so href is accepted; at runtime it is whichever tag was requested.
  const T = Tag as unknown as 'a';
  return (
    <T ref={ref as never} className={`card tilt ${className}`} onMouseMove={onMove} onMouseLeave={onLeave} onClick={onClick} href={href} {...rest}>
      {children}
    </T>
  );
}
