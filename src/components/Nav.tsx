import { useEffect, useState } from 'react';
import { Link, useRouter } from '../lib/router.tsx';
import { PhaseIcon } from './PhaseIcon.tsx';
import { VulnCounter } from './VulnCounter.tsx';
import { useData } from '../i18n/data.ts';
import { useLang, useT } from '../i18n/locale.tsx';
import { LANGS } from '../i18n/l.ts';
import type { Strings } from '../i18n/strings.ts';

type NavKey = keyof Strings['nav']['links'];

/** Page routes. `to` doubles as the terminal directory name; labels come from the dictionary. */
export const NAV_LINKS: { to: string; key: NavKey }[] = [
  { to: '/about', key: 'about' },
  { to: '/experience', key: 'experience' },
  { to: '/projects', key: 'projects' },
  { to: '/skills', key: 'skills' },
  { to: '/blog', key: 'blog' },
  { to: '/resume', key: 'resume' },
];

function LangToggle({ className = '' }: { className?: string }) {
  const { lang, setLang } = useLang();
  const t = useT();
  return (
    <div className={`nav-lang ${className}`} role="group" aria-label={t.nav.language}>
      {LANGS.map((code) => (
        <button key={code} type="button" aria-pressed={lang === code} onClick={() => setLang(code)}>{code.toUpperCase()}</button>
      ))}
    </div>
  );
}

export function Nav({ onOpenPalette }: { onOpenPalette: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { path } = useRouter();
  const { profile } = useData();
  const t = useT();

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  useEffect(() => { setOpen(false); }, [path]);

  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

  return (
    <>
      <header className={`nav ${scrolled ? 'is-scrolled' : ''}`}>
        <div className="container">
          <Link to="/" className="brand" aria-label={t.nav.home}>
            <PhaseIcon />
            <span>{profile.name}</span>
            <span className="handle">/ {profile.handle}</span>
          </Link>
          <nav aria-label="Primary">
            <ul className="nav-links">
              {NAV_LINKS.map((l) => (
                <li key={l.to}><Link to={l.to}>{t.nav.links[l.key]}</Link></li>
              ))}
            </ul>
          </nav>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <VulnCounter />
            <LangToggle />
            <button className="nav-kbd" type="button" onClick={onOpenPalette} aria-label={t.nav.openTerminal}>
              <span className="sigil">$_</span><span>{t.nav.terminal}</span>
              <kbd>{isMac ? '⌘' : 'ctrl'}</kbd><kbd>K</kbd>
            </button>
            <button className={`nav-burger ${open ? 'is-open' : ''}`} type="button" aria-expanded={open} aria-label={t.nav.menu} onClick={() => setOpen((o) => !o)}>
              <span /><span /><span />
            </button>
          </div>
        </div>
      </header>
      <div className={`nav-menu ${open ? 'is-open' : ''}`} aria-hidden={!open}>
        {NAV_LINKS.map((l) => (
          <Link key={l.to} to={l.to}>{t.nav.links[l.key]}</Link>
        ))}
        <a href={profile.linkedin} target="_blank" rel="noreferrer">{t.nav.linkedin} ↗</a>
        <button type="button" className="nav-menu-term" onClick={() => { setOpen(false); onOpenPalette(); }}>$_ {t.nav.terminal}</button>
        <VulnCounter variant="menu" />
        <LangToggle />
      </div>
    </>
  );
}
