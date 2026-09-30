import { useEffect, useMemo, useRef, useState } from 'react';
import { RouterProvider, matchRoute, useRouter } from './lib/router.tsx';
import { LocaleProvider } from './i18n/locale.tsx';
import { moon } from './lib/moon.ts';
import { MoonBackdrop } from './components/MoonBackdrop.tsx';
import { Nav } from './components/Nav.tsx';
import { Footer } from './components/Footer.tsx';
import { Cursor } from './components/Cursor.tsx';
import { Terminal } from './components/Terminal.tsx';
import { Home } from './pages/Home.tsx';
import { About } from './pages/About.tsx';
import { Experience } from './pages/Experience.tsx';
import { Projects } from './pages/Projects.tsx';
import { Skills } from './pages/Skills.tsx';
import { Resume } from './pages/Resume.tsx';
import { Blog } from './pages/Blog.tsx';
import { BlogPost } from './pages/BlogPost.tsx';
import { NotFound } from './pages/NotFound.tsx';
import { CtfProgressProvider } from './ctf/progress.tsx';
import { FlagCapture } from './components/FlagCapture.tsx';
import { AdminLogin } from './pages/AdminLogin.tsx';
import { AdminPanel } from './pages/AdminPanel.tsx';
import { AdminFiles } from './pages/AdminFiles.tsx';
import { AdminUsers } from './pages/AdminUsers.tsx';
import { Guestbook } from './pages/Guestbook.tsx';
import { Pwned } from './pages/Pwned.tsx';
import type { MoonMode } from './three/MoonScene.ts';

interface RouteDef {
  pattern: string;
  mode: MoonMode;
  render: (params: Record<string, string>) => React.ReactNode;
}

const ROUTES: RouteDef[] = [
  { pattern: '/', mode: 'hero', render: () => <Home /> },
  { pattern: '/about', mode: 'ambient', render: () => <About /> },
  { pattern: '/experience', mode: 'dock', render: () => <Experience /> },
  { pattern: '/projects', mode: 'ambient', render: () => <Projects /> },
  { pattern: '/skills', mode: 'quiet', render: () => <Skills /> },
  { pattern: '/resume', mode: 'quiet', render: () => <Resume /> },
  { pattern: '/blog', mode: 'ambient', render: () => <Blog /> },
  { pattern: '/blog/:slug', mode: 'quiet', render: (p) => <BlogPost slug={p.slug} /> },
  // hidden mini-CTF (see src/ctf/): the "forgotten" legacy admin panel and its scoreboard
  { pattern: '/admin', mode: 'quiet', render: () => <AdminLogin /> },
  { pattern: '/admin/panel', mode: 'quiet', render: () => <AdminPanel /> },
  { pattern: '/admin/panel/files', mode: 'quiet', render: () => <AdminFiles /> },
  { pattern: '/admin/panel/users', mode: 'quiet', render: () => <AdminUsers /> },
  { pattern: '/admin/panel/guestbook', mode: 'quiet', render: () => <Guestbook /> },
  { pattern: '/pwned', mode: 'quiet', render: () => <Pwned /> },
];

function Shell() {
  const { path } = useRouter();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [transitionKey, setTransitionKey] = useState(0);
  const firstRender = useRef(true);

  const matched = useMemo(() => {
    for (const r of ROUTES) {
      const m = matchRoute(r.pattern, path);
      if (m) return { route: r, params: m.params };
    }
    return null;
  }, [path]);

  // moon mode follows the route; scroll resets on navigation (except hash links)
  useEffect(() => {
    moon.setMode(matched?.route.mode ?? 'quiet');
    moon.clearScrub();
    if (firstRender.current) { firstRender.current = false; return; }
    setTransitionKey((k) => k + 1);
    if (!window.location.hash) window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [path, matched]);

  // global page-scroll progress feeds the moon
  useEffect(() => {
    let raf = 0;
    const on = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        raf = 0;
        const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        moon.setScroll(Math.min(1, window.scrollY / Math.min(max, window.innerHeight * 1.6)));
      });
    };
    window.addEventListener('scroll', on, { passive: true });
    on();
    return () => window.removeEventListener('scroll', on);
  }, [path]);

  // keyboard: ⌘K / Ctrl+K opens the terminal
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPaletteOpen((o) => !o); }
      if (e.key === 'Escape') setPaletteOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <MoonBackdrop />
      <Nav onOpenPalette={() => setPaletteOpen(true)} />
      <main id="main">
        <div className="page" key={path}>
          {matched ? matched.route.render(matched.params) : <NotFound />}
        </div>
      </main>
      <Footer />
      <FlagCapture />
      <Cursor />
      <div className={`page-transition ${transitionKey ? 'is-active' : ''}`} key={`t${transitionKey}`} aria-hidden="true" />
      {paletteOpen && <Terminal onClose={() => setPaletteOpen(false)} />}
    </>
  );
}

export function App() {
  return (
    <RouterProvider>
      <LocaleProvider>
        <CtfProgressProvider>
          <Shell />
        </CtfProgressProvider>
      </LocaleProvider>
    </RouterProvider>
  );
}
