import { useEffect, useState } from 'react';
import { useReducedMotion } from '../lib/hooks.ts';

/** Types, holds, deletes and cycles through phrases. */
export function Typewriter({ phrases, typeMs = 42, holdMs = 1800, deleteMs = 22, prefix = '' }: { phrases: string[]; typeMs?: number; holdMs?: number; deleteMs?: number; prefix?: string }) {
  const reduced = useReducedMotion();
  const [text, setText] = useState(reduced ? phrases[0] : '');

  useEffect(() => {
    if (reduced) { setText(phrases[0]); return; }
    let i = 0, pos = 0, deleting = false, timer = 0;
    const step = () => {
      const phrase = phrases[i % phrases.length];
      if (!deleting) {
        pos++;
        setText(phrase.slice(0, pos));
        if (pos >= phrase.length) { deleting = true; timer = window.setTimeout(step, holdMs); return; }
        timer = window.setTimeout(step, typeMs + Math.random() * 40);
      } else {
        pos--;
        setText(phrase.slice(0, pos));
        if (pos <= 0) { deleting = false; i++; timer = window.setTimeout(step, 350); return; }
        timer = window.setTimeout(step, deleteMs);
      }
    };
    timer = window.setTimeout(step, 500);
    return () => window.clearTimeout(timer);
  }, [phrases, typeMs, holdMs, deleteMs, reduced]);

  return (
    <span className="typewriter" aria-live="polite">
      {prefix}{text}<span className="type-caret" aria-hidden="true" />
    </span>
  );
}
