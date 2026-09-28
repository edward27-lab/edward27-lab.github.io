import { Link, useRouter } from '../lib/router.tsx';
import { useData } from '../i18n/data.ts';
import { useT } from '../i18n/locale.tsx';
import { Typewriter } from '../components/Typewriter.tsx';
import { TiltCard } from '../components/TiltCard.tsx';
import { Reveal } from '../components/Reveal.tsx';
import { useCountUp, useDocumentTitle } from '../lib/hooks.ts';

const CARDS = [
  { n: '01', code: 'EXP', to: '/experience' },
  { n: '02', code: 'PRJ', to: '/projects' },
  { n: '03', code: 'SKL', to: '/skills' },
  { n: '04', code: 'LOG', to: '/blog' },
];

function Stat({ value, suffix = '', label }: { value: number; suffix?: string; label: string }) {
  const { value: v, ref } = useCountUp(value);
  return (
    <div className="stat" ref={ref as never}>
      <div className="num">{v}{suffix}</div>
      <div className="lbl">{label}</div>
    </div>
  );
}

export function Home() {
  const t = useT();
  const { profile } = useData();
  useDocumentTitle(t.home.docTitle);
  const { navigate } = useRouter();

  return (
    <>
      <section className="hero container" style={{ position: 'relative' }}>
        <div className="hero-inner">
          <Reveal>
            <span className="pill"><span className="dot" />{profile.status}</span>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="hero-name">{profile.name}<span className="cursor-caret" aria-hidden="true" /></h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="hero-role">{profile.role} · {profile.location}. {profile.tagline}</p>
          </Reveal>
          <Reveal delay={240}>
            <div className="hero-type"><Typewriter phrases={profile.typewriter} prefix="› " /></div>
          </Reveal>
          <Reveal delay={320}>
            <div className="hero-cta">
              <Link to="/resume" className="btn btn-primary">{t.common.viewResume} <span className="arrow">→</span></Link>
              <a className="btn" href={profile.linkedin} target="_blank" rel="noreferrer">{t.common.linkedin} <span className="arrow">↗</span></a>
              <Link to="/blog" className="btn">{t.common.readBlog}</Link>
            </div>
          </Reveal>
          <Reveal delay={400}>
            <div className="hero-meta">
              <span className="pill">{profile.rights}</span>
              <span className="pill">{t.home.uniPill}</span>
            </div>
          </Reveal>
        </div>
        <div className="scroll-cue" aria-hidden="true">{t.common.scroll}</div>
      </section>

      <section className="section container">
        <div className="index-cards">
          {CARDS.map((c, i) => (
            <Reveal key={c.code} delay={i * 80}>
              <TiltCard as="a" href={c.to} onClick={(e) => { e.preventDefault(); navigate(c.to); }} data-no-drag>
                <div className="card-index"><span>{c.n} / {c.code}</span></div>
                <h3>{t.home.cards[i].title}</h3>
                <p>{t.home.cards[i].sub}</p>
                <span className="arrow">→</span>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section container">
        <Reveal>
          <div className="stat-row">
            <Stat value={4} suffix="/20" label={t.home.stats.bootcamp} />
            <Stat value={63} label={t.home.stats.rank} />
            <Stat value={3} label={t.home.stats.roles} />
            <Stat value={2} label={t.home.stats.languages} />
          </div>
        </Reveal>
      </section>

      <section className="section container">
        <Reveal>
          <span className="eyebrow">{t.home.currently}</span>
          <div className="ticker" style={{ marginTop: 14 }}>
            {profile.currently.map((c, i) => (
              <div className="item" key={i}><span className="k">{c.label}</span><span>{c.value}</span></div>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="section container">
        <Reveal>
          <div className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div className="card-index"><span>05 / IN</span></div>
              <h3 style={{ marginTop: 10 }}>{t.home.offer.title}</h3>
              <p>{t.home.offer.body}</p>
            </div>
            <a className="btn btn-primary" href={profile.linkedin} target="_blank" rel="noreferrer">{t.home.offer.cta} <span className="arrow">↗</span></a>
          </div>
        </Reveal>
      </section>
    </>
  );
}
