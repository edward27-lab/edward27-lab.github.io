import { Fragment, useState } from 'react';
import { Link } from '../lib/router.tsx';
import { formatYM } from '../data/experience.ts';
import { useData } from '../i18n/data.ts';
import { rich, useLang, useT } from '../i18n/locale.tsx';
import { Reveal } from '../components/Reveal.tsx';
import { SectionHead } from '../components/SectionHead.tsx';
import { useDocumentTitle } from '../lib/hooks.ts';

function FlipCard({ title, body, index, label, hint }: { title: string; body: string; index: number; label: string; hint: string }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <Reveal delay={index * 90}>
      <div className={`flip ${flipped ? 'is-flipped' : ''}`} tabIndex={0} role="button" aria-pressed={flipped} onClick={() => setFlipped((f) => !f)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFlipped((f) => !f); } }} data-no-drag>
        <div className="flip-inner">
          <div className="flip-face front">
            <span className="hint">0{index + 1} / {label}</span>
            <h3>{title}</h3>
            <span className="hint">{hint}</span>
          </div>
          <div className="flip-face back">
            <p>{body}</p>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

export function About() {
  const t = useT();
  const { lang } = useLang();
  const { profile, education } = useData();
  useDocumentTitle(t.about.docTitle);
  const names = (level: 'fluent' | 'basic') => profile.languages.filter((l) => l.level === level).map((l) => l.name).join(', ');

  return (
    <div className="container">
      <section className="section">
        <SectionHead eyebrow={t.about.eyebrow} title={rich(t.about.title)} />
        <div className="about-grid">
          <Reveal className="prose">
            {profile.intro.map((p, i) => <p key={i}>{p}</p>)}
            <div className="hero-cta" style={{ marginTop: 26 }}>
              <Link to="/resume" className="btn btn-primary">{t.common.viewResume} <span className="arrow">→</span></Link>
              <a className="btn" href={profile.linkedin} target="_blank" rel="noreferrer">{t.common.linkedin} <span className="arrow">↗</span></a>
              <Link to="/experience" className="btn">{t.common.experience} <span className="arrow">→</span></Link>
            </div>
          </Reveal>
          <div>
            <Reveal delay={100}>
              <div className="aside-block">
                <h4>{t.about.status}</h4>
                <span className="pill"><span className="dot" />{profile.status}</span>
                <div style={{ height: 8 }} />
                <span className="pill">{profile.rights}</span>
              </div>
            </Reveal>
            <Reveal delay={180}>
              <div className="aside-block">
                <h4>{t.about.currently}</h4>
                <div className="kv">
                  {profile.currently.map((c, i) => (<Fragment key={i}><span className="k">{c.label}</span><span>{c.value}</span></Fragment>))}
                </div>
              </div>
            </Reveal>
            <Reveal delay={260}>
              <div className="aside-block">
                <h4>{t.about.languages}</h4>
                <div className="kv">
                  <span className="k">{t.common.fluent}</span><span>{names('fluent')}</span>
                  <span className="k">{t.common.basic}</span><span>{names('basic')}</span>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section">
        <SectionHead eyebrow={t.about.edu.eyebrow} title={rich(t.about.edu.title)} />
        <Reveal>
          <ul className="edu-list">
            {education.map((e) => (
              <li className="edu-item" key={e.id}>
                <span className="when">{formatYM(e.start, 'short', lang)} — {e.expected ? `${t.common.expected} ` : ''}{formatYM(e.end, 'short', lang)}</span>
                <div>
                  <div className="what">{e.degree}</div>
                  <div className="where">{e.school} · {e.field} · {e.place}</div>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>
      </section>

      <section className="section">
        <SectionHead eyebrow={t.about.recognition.eyebrow} title={rich(t.about.recognition.title)} />
        <div className="flip-grid">
          {profile.recognition.map((r, i) => <FlipCard key={i} title={r.title} body={r.body} index={i} label={t.about.recognition.label} hint={t.about.recognition.hint} />)}
        </div>
      </section>
    </div>
  );
}
