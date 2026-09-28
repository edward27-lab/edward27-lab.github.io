import type { ReactNode } from 'react';
import { Reveal } from './Reveal.tsx';

export function SectionHead({ eyebrow, title, lede }: { eyebrow: string; title: ReactNode; lede?: ReactNode }) {
  return (
    <Reveal as="header" style={{ marginBottom: 32 }}>
      <span className="eyebrow">{eyebrow}</span>
      <h2 className="section-title">{title}</h2>
      {lede && <p className="lede">{lede}</p>}
    </Reveal>
  );
}
