import { formatYM } from '../data/experience.ts';
import { useData } from '../i18n/data.ts';
import { useLang, useT } from '../i18n/locale.tsx';
import { Reveal } from '../components/Reveal.tsx';
import { useDocumentTitle } from '../lib/hooks.ts';

export function Resume() {
  const t = useT();
  const { lang } = useLang();
  const { profile, education, roles, projects, skillGroups, levels, misc } = useData();
  useDocumentTitle(t.resume.docTitle);
  const work = roles.filter((r) => r.kind !== 'education');
  const ym = (v: string) => formatYM(v, 'short', lang);
  const names = (level: 'fluent' | 'basic') => profile.languages.filter((l) => l.level === level).map((l) => l.name).join(', ');
  const linkedinLabel = profile.linkedin.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');

  return (
    <div className="container">
      <section className="section resume">
        <Reveal>
          <div className="resume-head">
            <div>
              <span className="eyebrow">{t.resume.eyebrow}</span>
              <h1 className="section-title">{profile.name}</h1>
              <p className="lede" style={{ marginTop: 6 }}>{profile.role} · {profile.location} · {profile.rights}</p>
              <div className="tags" style={{ marginTop: 8 }}>
                <a className="tag" href={profile.linkedin} target="_blank" rel="noreferrer">{linkedinLabel}</a>
                <span className="tag">{profile.status}</span>
              </div>
            </div>
            <div className="hero-cta no-print">
              {profile.resumePdf ? (
                <a className="btn btn-primary" href={profile.resumePdf} download>{t.resume.download} <span className="arrow">↓</span></a>
              ) : (
                <button type="button" className="btn btn-primary" onClick={() => window.print()}>{t.resume.saveAsPdf} <span className="arrow">⎙</span></button>
              )}
            </div>
          </div>
        </Reveal>

        <Reveal className="resume-sec">
          <h2>{t.resume.experience}</h2>
          {work.map((r) => (
            <div className="resume-item" key={r.id}>
              <span className="when">{ym(r.start)} — {r.end ? ym(r.end) : t.common.present}</span>
              <div>
                <h3>{r.title}</h3>
                <div className="org">{r.org} · {r.place}</div>
                <ul>{r.bullets.map((b, i) => <li key={i}>{b}</li>)}</ul>
              </div>
            </div>
          ))}
        </Reveal>

        <Reveal className="resume-sec">
          <h2>{t.resume.education}</h2>
          {education.map((e) => (
            <div className="resume-item" key={e.id}>
              <span className="when">{ym(e.start)} — {e.expected ? `${t.common.expected} ` : ''}{ym(e.end)}</span>
              <div>
                <h3>{e.degree}</h3>
                <div className="org">{e.school} · {e.field} · {e.place}</div>
              </div>
            </div>
          ))}
        </Reveal>

        <Reveal className="resume-sec">
          <h2>{t.resume.projects}</h2>
          {projects.filter((p) => p.id !== 'hacktrace-ranges').map((p) => (
            <div className="resume-item" key={p.id}>
              <span className="when">{p.period}</span>
              <div>
                <h3>{p.title}</h3>
                <div className="org">{p.org} · {p.course}</div>
                <ul>{p.bullets.map((b, i) => <li key={i}>{b}</li>)}</ul>
              </div>
            </div>
          ))}
        </Reveal>

        <Reveal className="resume-sec">
          <h2>{t.resume.skills}</h2>
          {skillGroups.map((g) => (
            <div className="resume-skill" key={g.id}>
              <div><b>{g.name}</b><span className="lvl">{levels[g.level].label}</span></div>
              <div className="line">
                <div><span className="muted mono" style={{ fontSize: 11 }}>{t.resume.tools} · </span>{g.tools.join(', ')}</div>
                <div><span className="muted mono" style={{ fontSize: 11 }}>{t.resume.skillsLbl} · </span>{g.skills.join(', ')}</div>
              </div>
            </div>
          ))}
          <div className="resume-skill">
            <div><b>{t.resume.languages}</b></div>
            <div className="line">{t.resume.fluent}: {names('fluent')} · {t.resume.basic}: {names('basic')}</div>
          </div>
        </Reveal>

        <Reveal className="resume-sec">
          <h2>{t.resume.misc}</h2>
          <ul style={{ color: 'var(--text-2)', fontSize: 14, display: 'grid', gap: 6 }}>
            {misc.map((m, i) => <li key={i}>{m}</li>)}
          </ul>
        </Reveal>
      </section>
    </div>
  );
}
