import { useEffect, useRef, useState, type RefObject } from 'react';

export function useMediaQuery(query: string) {
  const [match, setMatch] = useState(() => (typeof window !== 'undefined' ? window.matchMedia(query).matches : false));
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatch(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [query]);
  return match;
}

export function useReducedMotion() {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

/**
 * Adds `is-visible` to the element once it scrolls into view (once).
 * Robust by design: content is only hidden while JS is driving the reveal
 * (the root carries `.js-reveal`), an element already on screen at mount is
 * shown immediately, and if IntersectionObserver is missing the element is
 * shown outright. So content can never get stuck invisible.
 */
export function useReveal<T extends HTMLElement>(threshold = 0.12): RefObject<T | null> {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const show = () => el.classList.add('is-visible');
    if (!('IntersectionObserver' in window)) { show(); return; }
    // Already in (or near) the viewport when mounted? Reveal now.
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight * 0.95 && r.bottom > 0) { show(); return; }
    let done = false;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting && !done) { done = true; show(); io.disconnect(); } });
    }, { threshold, rootMargin: '0px 0px -6% 0px' });
    io.observe(el);
    // Safety net: if the observer never fires (fast programmatic scrolls, odd
    // browsers), reveal anything that has since entered the viewport.
    const fallback = window.setTimeout(() => {
      if (done) return;
      const rr = el.getBoundingClientRect();
      if (rr.top < window.innerHeight && rr.bottom > 0) { done = true; show(); io.disconnect(); }
    }, 1200);
    return () => { io.disconnect(); window.clearTimeout(fallback); };
  }, [threshold]);
  return ref;
}

/** Page scroll progress 0..1 (document), throttled to animation frames. */
export function useScrollProgress(onChange?: (p: number) => void) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    let raf = 0;
    const compute = () => {
      raf = 0;
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const p = Math.min(1, Math.max(0, window.scrollY / max));
      setProgress(p);
      onChange?.(p);
    };
    const on = () => { if (raf) cancelAnimationFrame(raf); raf = requestAnimationFrame(compute); };
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    compute();
    return () => { window.removeEventListener('scroll', on); window.removeEventListener('resize', on); if (raf) cancelAnimationFrame(raf); };
  }, [onChange]);
  return progress;
}

/** Scroll progress of a specific element through the viewport: 0 when its top hits the viewport top, 1 when its bottom leaves. */
export function useElementProgress<T extends HTMLElement>(ref: RefObject<T | null>, onChange?: (p: number) => void) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    let raf = 0;
    const compute = () => {
      raf = 0;
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const p = total <= 0 ? 0 : Math.min(1, Math.max(0, -rect.top / total));
      setProgress(p);
      onChange?.(p);
    };
    const on = () => { if (raf) cancelAnimationFrame(raf); raf = requestAnimationFrame(compute); };
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    compute();
    return () => { window.removeEventListener('scroll', on); window.removeEventListener('resize', on); if (raf) cancelAnimationFrame(raf); };
  }, [ref, onChange]);
  return progress;
}

export function useDocumentTitle(title: string) {
  useEffect(() => {
    const prev = document.title;
    document.title = title;
    return () => { document.title = prev; };
  }, [title]);
}

/** Counts up to a target number when the element becomes visible. */
export function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      const t0 = performance.now();
      const step = (t: number) => {
        const k = Math.min(1, (t - t0) / duration);
        const eased = 1 - Math.pow(1 - k, 3);
        setValue(Math.round(target * eased));
        if (k < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, { threshold: 0.5 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [target, duration]);
  return { value, ref };
}
