import { useMemo, useState } from 'react';
import { useData } from '../i18n/data.ts';
import { rich, useT } from '../i18n/locale.tsx';
import { Reveal } from '../components/Reveal.tsx';
import { TiltCard } from '../components/TiltCard.tsx';
import { SectionHead } from '../components/SectionHead.tsx';
import { useDocumentTitle } from '../lib/hooks.ts';

export function Projects() {
  const t = useT();
  const { projects } = useData();
  useDocumentTitle(t.projects.docTitle);
  const [tag, setTag] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(projects[0]?.id ?? null);
  const tags = useMemo(() => Array.from(new Set(projects.flatMap((p) => p.tags))).sort(), [projects]);
  const list = tag ? projects.filter((p) => p.tags.includes(tag)) : projects;

  return (
    <div className="container">
      <section className="section">
        <SectionHead eyebrow={t.projects.eyebrow} title={rich(t.projects.title)} lede={t.projects.lede} />
        <Reveal>
          <div className="filter-bar" data-no-drag>
            <span className="lbl">{t.projects.filter}</span>
            <button type="button" className={`tag ${tag === null ? 'is-on' : ''}`} onClick={() => setTag(null)}>{t.projects.all}</button>
            {tags.map((tg) => (
              <button type="button" key={tg} className={`tag ${tag === tg ? 'is-on' : ''}`} onClick={() => setTag(tag === tg ? null : tg)}>{tg}</button>
            ))}
          </div>
        </Reveal>
        <div className="grid" style={{ gap: 16 }}>
          {list.map((p, i) => {
            const isOpen = open === p.id;
            return (
              <Reveal key={p.id} delay={i * 70}>
                <TiltCard as="article" max={3} className={`project ${isOpen ? 'is-open' : ''}`} data-no-drag>
                  <div className="idx">{p.index}</div>
                  <div>
                    <h3>{p.title}</h3>
                    <div className="sub">{p.org} · {p.course} · {p.period}</div>
                    <p className="summary">{p.summary}</p>
                    <button type="button" className="expand" onClick={() => setOpen(isOpen ? null : p.id)} aria-expanded={isOpen}>
                      {isOpen ? t.projects.hide : t.projects.show}
                      <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
                    </button>
                    <div className="details">
                      <div>
                        <ul>{p.bullets.map((b, j) => <li key={j}>{b}</li>)}</ul>
                      </div>
                    </div>
                    <div className="tags" style={{ marginTop: 14 }}>
                      {p.tags.map((tg) => <button type="button" key={tg} className={`tag ${tag === tg ? 'is-on' : ''}`} onClick={() => setTag(tag === tg ? null : tg)}>{tg}</button>)}
                    </div>
                  </div>
                  <div>
                    {p.status && <div className="status" style={{ marginBottom: 8, textAlign: 'right' }}>● {p.status}</div>}
                    <div className="tools">{p.tools.map((tool) => <span className="pill" key={tool}>{tool}</span>)}</div>
                  </div>
                </TiltCard>
              </Reveal>
            );
          })}
          {list.length === 0 && <div className="empty">{t.projects.empty}</div>}
        </div>
      </section>
    </div>
  );
}
