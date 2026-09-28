import { useMemo, useState } from 'react';
import { useData, type Data } from '../i18n/data.ts';
import { rich, useT } from '../i18n/locale.tsx';
import { Reveal } from '../components/Reveal.tsx';
import { SectionHead } from '../components/SectionHead.tsx';
import { useDocumentTitle } from '../lib/hooks.ts';

const W = 1000, H = 640;

type Group = Data['skillGroups'][number];

function seeded(seed: number) {
  let a = seed >>> 0;
  return () => { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296; };
}

/** Lays out each group as a small constellation: a hub star with tool stars around it. */
function useLayout(skillGroups: Group[]) {
  return useMemo(() => {
    const rnd = seeded(42);
    const groups = skillGroups.map((g) => {
      const hx = g.x * W, hy = g.y * H;
      const n = g.tools.length;
      const radius = 62 + n * 9;
      const stars = g.tools.map((t, i) => {
        const a = (i / n) * Math.PI * 2 + rnd() * 0.6 - 0.3 + g.x * 3;
        const r = radius * (0.6 + rnd() * 0.5);
        return { name: t, x: hx + Math.cos(a) * r, y: hy + Math.sin(a) * r * 0.75, size: 1.6 + rnd() * 1.8 };
      });
      return { g, hx, hy, stars };
    });
    const bg = Array.from({ length: 140 }, () => ({ x: rnd() * W, y: rnd() * H, r: rnd() * 1.1 + 0.3, o: 0.25 + rnd() * 0.6 }));
    // faint links between neighbouring hubs
    const links: [number, number][] = [];
    for (let i = 0; i < groups.length; i++) {
      for (let j = i + 1; j < groups.length; j++) {
        const d = Math.hypot(groups[i].hx - groups[j].hx, groups[i].hy - groups[j].hy);
        if (d < 420) links.push([i, j]);
      }
    }
    return { groups, bg, links };
  }, [skillGroups]);
}

export function Skills() {
  const t = useT();
  const { skillGroups, levels, misc, profile } = useData();
  useDocumentTitle(t.skills.docTitle);
  const { groups, bg, links } = useLayout(skillGroups);
  const [active, setActive] = useState<string>(skillGroups[0].id);
  const [hover, setHover] = useState<string | null>(null);
  const focus: Group = skillGroups.find((g) => g.id === (hover ?? active)) ?? skillGroups[0];

  return (
    <div className="container">
      <section className="section">
        <SectionHead eyebrow={t.skills.eyebrow} title={rich(t.skills.title)} lede={t.skills.lede} />
        <div className="skills-layout">
          <Reveal>
            <div className="sky" data-no-drag>
              <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t.skills.mapLabel}>
                <defs>
                  <radialGradient id="hubGlow"><stop offset="0%" stopColor="#fff" stopOpacity="0.9" /><stop offset="100%" stopColor="#c3cfff" stopOpacity="0" /></radialGradient>
                </defs>
                {bg.map((s, i) => <circle key={i} className="bg-star" cx={s.x} cy={s.y} r={s.r} opacity={s.o * 0.5} />)}
                {links.map(([a, b]) => <line key={`${a}-${b}`} className="link" x1={groups[a].hx} y1={groups[a].hy} x2={groups[b].hx} y2={groups[b].hy} />)}
                {groups.map(({ g, hx, hy, stars }) => {
                  const w = levels[g.level].weight;
                  const isActive = (hover ?? active) === g.id;
                  const dim = hover !== null && hover !== g.id;
                  return (
                    <g
                      key={g.id}
                      className={`hub ${isActive ? 'is-active' : ''} ${dim ? 'is-dim' : ''}`}
                      onMouseEnter={() => setHover(g.id)}
                      onMouseLeave={() => setHover(null)}
                      onClick={() => setActive(g.id)}
                      tabIndex={0}
                      role="button"
                      aria-label={`${g.name}, ${levels[g.level].label}`}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActive(g.id); } }}
                    >
                      {stars.map((s) => <line key={`l-${s.name}`} className="line" x1={hx} y1={hy} x2={s.x} y2={s.y} />)}
                      <circle className="halo" cx={hx} cy={hy} r={isActive ? 26 : 18} fill="url(#hubGlow)" opacity={0.5 + w * 0.5} />
                      <circle className="core" cx={hx} cy={hy} r={3 + w * 4} style={{ filter: `drop-shadow(0 0 ${4 + w * 8}px rgba(255,255,255,${0.5 + w * 0.5}))` }} />
                      {stars.map((s) => (
                        <g key={s.name}>
                          <circle className="star" cx={s.x} cy={s.y} r={s.size} opacity={0.6 + w * 0.4} />
                          <text className="star-label" x={s.x + 6} y={s.y + 3}>{s.name}</text>
                        </g>
                      ))}
                      <text x={hx} y={hy + 30} textAnchor="middle">{g.short ?? g.name}</text>
                    </g>
                  );
                })}
              </svg>
            </div>
            <div className="sky-legend">
              <span><i style={{ width: 11, height: 11 }} /> {t.skills.legend.expert}</span>
              <span><i style={{ width: 9, height: 9, opacity: 0.85 }} /> {t.skills.legend.proficient}</span>
              <span><i style={{ width: 7, height: 7, opacity: 0.7 }} /> {t.skills.legend.intermediate}</span>
              <span style={{ marginLeft: 'auto' }}>{t.skills.legend.hint}</span>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="skill-detail" key={focus.id}>
              <h3>{focus.name} <span className="level">{levels[focus.level].label}</span></h3>
              <div className="meter"><i style={{ ['--w' as string]: levels[focus.level].weight }} /></div>
              <h4>{t.skills.tools}</h4>
              <div className="tags">{focus.tools.map((tool) => <span className="tag" key={tool}>{tool}</span>)}</div>
              <h4>{t.skills.looksLike}</h4>
              <ul>{focus.skills.map((s, i) => <li key={i}>{s}</li>)}</ul>
            </div>
            <div className="aside-block" style={{ marginTop: 16 }}>
              <h4>{t.skills.all}</h4>
              <div className="kv">
                {skillGroups.map((g) => (
                  <button type="button" key={g.id} onClick={() => setActive(g.id)} style={{ display: 'contents', textAlign: 'left' }}>
                    <span className="k" style={{ color: active === g.id ? 'var(--accent)' : undefined }}>{levels[g.level].label.toLowerCase()}</span>
                    <span style={{ color: active === g.id ? 'var(--text)' : 'var(--text-2)' }}>{g.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section">
        <div className="two-col">
          <Reveal>
            <div className="aside-block">
              <h4>{t.skills.languages}</h4>
              <div className="kv">
                {profile.languages.map((lg, i) => (
                  <span key={i} style={{ display: 'contents' }}>
                    <span className="k">{t.common[lg.level]}</span>
                    <span>{lg.name}</span>
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div className="aside-block">
              <h4>{t.skills.misc}</h4>
              <ul style={{ color: 'var(--text-2)', fontSize: 14, display: 'grid', gap: 6 }}>
                {misc.map((m, i) => <li key={i}>{m}</li>)}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
