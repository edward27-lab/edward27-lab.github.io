import { Link } from '../lib/router.tsx';
import { Reveal } from '../components/Reveal.tsx';
import { useDocumentTitle } from '../lib/hooks.ts';
import { rich, useLang, useT } from '../i18n/locale.tsx';
import { useData } from '../i18n/data.ts';
import { useCtf, useFlag } from '../ctf/progress.tsx';
import { VULN_IDS, type VulnId } from '../ctf/flags.ts';

/** The scoreboard: progress, hints for what is left, and the payoff at 5/5. */
export function Pwned() {
  const t = useT();
  const { lang } = useLang();
  const { profile } = useData();
  const { count, total, reset } = useCtf();
  useDocumentTitle(t.ctf.pwned.docTitle);
  const done = count >= total;

  const onReset = () => { if (window.confirm(t.ctf.pwned.resetConfirm)) reset(); };

  return (
    <div className="container">
      <section className="section ctf-board">
        <Reveal as="header" style={{ marginBottom: 28 }}>
          <span className="eyebrow">{t.ctf.pwned.eyebrow}</span>
          <h1 className="section-title">{t.ctf.pwned.title}</h1>
          <p className="lede">{rich(t.ctf.pwned.subtitle(count, total))}</p>
          <p className="muted" style={{ fontSize: 14 }}>{t.ctf.pwned.howto}</p>
        </Reveal>

        <ol className="ctf-list">
          {VULN_IDS.map((id, i) => <Row key={id} id={id} index={i} lang={lang} />)}
        </ol>

        {done && (
          <Reveal className={`ctf-payoff ${done ? 'is-done' : ''}`}>
            <span className="ctf-spark" aria-hidden="true" /><span className="ctf-spark" aria-hidden="true" /><span className="ctf-spark" aria-hidden="true" /><span className="ctf-spark" aria-hidden="true" /><span className="ctf-spark" aria-hidden="true" /><span className="ctf-spark" aria-hidden="true" />
            <span className="eyebrow">{count}/{total}</span>
            <h2 className="section-title" style={{ fontSize: 'clamp(28px, 4vw, 44px)' }}>{t.ctf.pwned.payoff.title}</h2>
            <p className="lede">{t.ctf.pwned.payoff.body}</p>
            <div className="hero-cta">
              <Link to="/about" className="btn btn-primary">{t.ctf.pwned.payoff.about} <span className="arrow">→</span></Link>
              <a className="btn" href={profile.linkedin} target="_blank" rel="noreferrer">{t.ctf.pwned.payoff.contact} <span className="arrow">↗</span></a>
            </div>
          </Reveal>
        )}

        <div className="ctf-reset">
          <button type="button" className="btn" onClick={onReset} disabled={count === 0}>{t.ctf.pwned.reset}</button>
        </div>
      </section>
    </div>
  );
}

function Row({ id, index, lang }: { id: VulnId; index: number; lang: 'en' | 'id' }) {
  const t = useT();
  const { isFound, foundAt, hintsRevealed, revealHint } = useCtf();
  const found = isFound(id);
  const flag = useFlag(found ? id : null);
  const v = t.ctf.vulns[id];
  const hints = t.ctf.hints[id];
  const shown = Math.min(hintsRevealed(id), hints.length);
  const when = foundAt[id] ? new Date(foundAt[id]).toLocaleString(lang === 'id' ? 'id-ID' : 'en-AU', { dateStyle: 'medium', timeStyle: 'short' }) : '';

  return (
    <Reveal as="li" className={`ctf-row ${found ? 'is-found' : ''}`} delay={index * 60}>
      <span className="ctf-row-idx">{String(index + 1).padStart(2, '0')}</span>
      <div className="ctf-row-main">
        {found ? (
          <>
            <div className="ctf-row-name">{v.name} <span className="muted">— {v.sub}</span></div>
            <div className="ctf-row-flag"><code>{flag || '…'}</code></div>
            {when && <div className="ctf-row-when">{t.ctf.pwned.foundAt} {when}</div>}
          </>
        ) : (
          <>
            <div className="ctf-row-name muted">{t.ctf.pwned.undiscovered}</div>
            {shown > 0 && (
              <ul className="ctf-hints">
                {hints.slice(0, shown).map((h, i) => <li key={i}>{h}</li>)}
              </ul>
            )}
            <button type="button" className="tag" onClick={() => revealHint(id)} disabled={shown >= hints.length}>
              {shown >= hints.length ? t.ctf.pwned.noMoreHints : t.ctf.pwned.hint(shown + 1, hints.length)}
            </button>
          </>
        )}
      </div>
      <span className={`ctf-row-mark ${found ? 'is-on' : ''}`} aria-hidden="true">{found ? '⚑' : '·'}</span>
    </Reveal>
  );
}
