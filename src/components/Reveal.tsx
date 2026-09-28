import type { CSSProperties, ReactNode } from 'react';
import { useReveal } from '../lib/hooks.ts';

/** Fades and lifts its children in when scrolled into view. */
export function Reveal({ children, delay = 0, className = '', as: Tag = 'div', style }: { children: ReactNode; delay?: number; className?: string; as?: 'div' | 'section' | 'li' | 'article' | 'header'; style?: CSSProperties }) {
  const ref = useReveal<HTMLDivElement>();
  const T = Tag as unknown as 'div';
  return (
    <T ref={ref} className={`reveal ${className}`} style={{ ...(style || {}), ['--delay' as string]: `${delay}ms` }}>
      {children}
    </T>
  );
}
