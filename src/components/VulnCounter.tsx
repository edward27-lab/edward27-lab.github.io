import { useEffect, useRef, useState } from 'react';
import { Link } from '../lib/router.tsx';
import { useCtf } from '../ctf/progress.tsx';
import { useT } from '../i18n/locale.tsx';

/**
 * The player's HUD: `vulns: N/5`, visible on every page. Pulses when N goes
 * up, links to the scoreboard. The `legacy` variant is plain text for the
 * fake 2003 admin panel, which is "a different app".
 */
export function VulnCounter({ variant = 'nav' }: { variant?: 'nav' | 'menu' | 'legacy' }) {
  const { count, total } = useCtf();
  const t = useT();
  const [pulse, setPulse] = useState(false);
  const prev = useRef(count);

  useEffect(() => {
    if (count > prev.current) {
      setPulse(true);
      const id = window.setTimeout(() => setPulse(false), 650);
      prev.current = count;
      return () => window.clearTimeout(id);
    }
    prev.current = count;
  }, [count]);

  const state = count === 0 ? 'is-zero' : count >= total ? 'is-full' : 'is-some';
  const label = t.ctf.counter.aria(count, total);

  if (variant === 'legacy') {
    return (
      <Link to="/pwned" className="legacy-counter" aria-label={label} title={label}>
        {t.ctf.counter.label}: {count}/{total}
      </Link>
    );
  }
  return (
    <Link to="/pwned" className={`ctf-counter ctf-counter-${variant} ${state} ${pulse ? 'is-pulsing' : ''}`} aria-label={label} title={label}>
      <span className="ctf-counter-flag" aria-hidden="true">⚑</span>
      <span>{t.ctf.counter.label}: <b>{count}/{total}</b></span>
    </Link>
  );
}
