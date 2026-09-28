import { useEffect, useState } from 'react';
import { moon } from '../lib/moon.ts';

/**
 * The ◐ in the brand, drawn as an SVG that mirrors the live phase of the big moon.
 */
export function PhaseIcon({ size = 18 }: { size?: number }) {
  const [k, setK] = useState(0.6); // 0 = new, 1 = full (lit fraction)
  const [side, setSide] = useState(-1);
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const s = moon.get();
      if (s) {
        const az = s.getSunAzimuth();
        setK(0.5 + 0.5 * Math.cos(az));
        setSide(Math.sin(az) < 0 ? -1 : 1);
      }
      raf = window.setTimeout(loop, 400) as unknown as number;
    };
    loop();
    return () => window.clearTimeout(raf);
  }, []);
  const r = 8;
  // terminator as an ellipse with x-radius depending on the lit fraction
  const ex = Math.abs(2 * k - 1) * r;
  const litIsRight = side > 0;
  const bigArc = k > 0.5 ? 1 : 0;
  // path: half disc on the lit side + ellipse half for the terminator
  const d = litIsRight
    ? `M 10 ${10 - r} A ${r} ${r} 0 0 1 10 ${10 + r} A ${ex} ${r} 0 0 ${bigArc ? 1 : 0} 10 ${10 - r} Z`
    : `M 10 ${10 - r} A ${r} ${r} 0 0 0 10 ${10 + r} A ${ex} ${r} 0 0 ${bigArc ? 0 : 1} 10 ${10 - r} Z`;
  return (
    <svg className="phase" width={size} height={size} viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="10" r={r} fill="none" stroke="currentColor" strokeWidth="1" opacity="0.6" />
      <path d={d} fill="currentColor" />
    </svg>
  );
}
