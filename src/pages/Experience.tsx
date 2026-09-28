import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TIMELINE_START, monthIndex, currentYM, formatYM, formatMonth, ymFromIndex } from '../data/experience.ts';
import { useData } from '../i18n/data.ts';
import { rich, useLang, useT } from '../i18n/locale.tsx';
import { moon } from '../lib/moon.ts';
import { useDocumentTitle, useElementProgress } from '../lib/hooks.ts';
import { Reveal } from '../components/Reveal.tsx';
import { SectionHead } from '../components/SectionHead.tsx';

/**
 * Month-by-month timeline. The page is tall; a sticky panel shows the current
 * month, the roles active in it and a gantt strip with a playhead. Scrolling
 * scrubs time, and so does dragging the moon (the moon is docked to the left
 * of the readout in this mode).
 */
export function Experience() {
  const t = useT();
  const { lang } = useLang();
  const { roles } = useData();
  useDocumentTitle(t.experience.docTitle);
  const trackRef = useRef<HTMLDivElement>(null);
  const now = currentYM();
  const total = monthIndex(now) + 1;               // months from TIMELINE_START to now, inclusive
  const [progress, setProgress] = useState(0);
  const [pinned, setPinned] = useState<string | null>(null);

  const onProgress = useCallback((p: number) => { setProgress(p); moon.setScrub(p); }, []);
  useElementProgress(trackRef, onProgress);

  // dragging the moon scrolls the timeline
  useEffect(() => {
    const off = moon.onDrag((dx) => {
      const el = trackRef.current;
      if (!el) return;
      const h = el.getBoundingClientRect().height - window.innerHeight;
      window.scrollBy({ top: (dx / window.innerWidth) * h * 1.6, behavior: 'auto' });
    });
    return () => { off(); moon.clearScrub(); };
  }, []);

  const monthIdx = Math.min(total - 1, Math.round(progress * (total - 1)));
  const ym = ymFromIndex(monthIdx);
  const active = useMemo(() => roles.filter((r) => monthIndex(r.start) <= monthIdx && monthIndex(r.end ?? now) >= monthIdx), [roles, monthIdx, now]);
  const focus = pinned ? roles.find((r) => r.id === pinned) ?? active[0] : active.find((r) => r.kind === 'security') ?? active[0];
  const span = (start: string, end: string | null) => `${formatYM(start, 'short', lang)} — ${end ? formatYM(end, 'short', lang) : t.common.present}`;

  const years = useMemo(() => {
    const out: { label: string; pos: number }[] = [];
    for (let i = 0; i < total; i++) {
      const y = ymFromIndex(i);
      if (y.endsWith('-01') || i === 0) out.push({ label: y.slice(0, 4), pos: (i / (total - 1)) * 100 });
    }
    return out;
  }, [total]);

  return (
    <>
      <div className="timeline-progress" style={{ ['--p' as string]: progress }} aria-hidden="true" />
      <div className="container" style={{ paddingTop: 30 }}>
        <Reveal>
          <span className="eyebrow">{t.experience.eyebrow}</span>
          <h1 className="section-title">{rich(t.experience.heroTitle(formatYM(TIMELINE_START, 'short', lang)))}</h1>
        </Reveal>
      </div>

      <div className="timeline-wrap container" ref={trackRef} style={{ ['--months' as string]: total }}>
        <div className="timeline-sticky">
          <div className="readout">
            <div>
              <span className="eyebrow">{t.experience.monthOf(monthIdx + 1, total)}</span>
              <div className="month" key={ym}>
                {formatMonth(ym, lang)}
                <small>{ym.slice(0, 4)}</small>
              </div>
            </div>
            <ul className="active-list">
              {active.length === 0 && <li className="muted">{t.experience.nothing}</li>}
              {active.map((r) => (
                <li key={r.id}><span className={`k ${r.kind}`} />{r.org} — {r.title}</li>
              ))}
            </ul>
          </div>
          <div>
            <div className="gantt">
              {roles.map((r) => {
                const s = monthIndex(r.start) / (total - 1);
                const e = monthIndex(r.end ?? now) / (total - 1);
                const isActive = active.some((a) => a.id === r.id);
                return (
                  <button
                    type="button"
                    key={r.id}
                    className={`gantt-row ${isActive ? 'is-active' : ''} ${pinned === r.id ? 'is-pinned' : ''}`}
                    onClick={() => setPinned((p) => (p === r.id ? null : r.id))}
                    aria-pressed={pinned === r.id}
                    data-no-drag
                  >
                    <div className="who"><b>{r.org}</b><span>{r.title}</span></div>
                    <div className="gantt-track">
                      <div className={`gantt-bar ${r.kind}`} style={{ left: `${s * 100}%`, width: `${Math.max(1.5, (e - s) * 100)}%` }} />
                      <div className="gantt-head" style={{ left: `${progress * 100}%` }} />
                    </div>
                  </button>
                );
              })}
              <div className="gantt-years">
                {years.map((y) => <span key={y.label + y.pos} style={{ left: `${y.pos}%` }}>{y.label}</span>)}
              </div>
            </div>
            <div className="gantt-detail" key={focus?.id ?? 'none'}>
              {focus ? (
                <>
                  <h3>{focus.title}</h3>
                  <div className="meta">{focus.org} · {focus.place} · {span(focus.start, focus.end)}{pinned === focus.id ? ` · ${t.experience.pinned}` : ''}</div>
                  <ul>{focus.bullets.map((b, i) => <li key={i}>{b}</li>)}</ul>
                </>
              ) : (
                <p className="muted">{t.experience.keepScrolling}</p>
              )}
            </div>
            <div className="timeline-hint">{t.experience.hint}</div>
          </div>
        </div>
        <div className="timeline-scroll-track" aria-hidden="true" />
      </div>

      <div className="container">
        <section className="section">
          <SectionHead eyebrow={t.experience.list.eyebrow} title={rich(t.experience.list.title)} />
          <div className="role-list">
            {roles.map((r, i) => (
              <Reveal key={r.id} delay={i * 60} as="article" className="role">
                <div className="top">
                  <h3>{r.title}</h3>
                  <span className="when">{span(r.start, r.end)}</span>
                </div>
                <div className="org">{r.org} · {r.place}</div>
                <ul>{r.bullets.map((b, j) => <li key={j}>{b}</li>)}</ul>
                <div className="tags" style={{ marginTop: 12 }}>{r.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div>
              </Reveal>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
