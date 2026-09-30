import { createContext, useContext, useEffect, useMemo, useState, type MouseEvent, type ReactNode } from 'react';

/**
 * A very small history-based router. Routes are matched in order; ":param"
 * segments are captured. Old ".html" URLs from the previous site are
 * normalised so existing links keep working.
 */

export interface RouteMatch {
  path: string;
  params: Record<string, string>;
}

const RouterContext = createContext<{ path: string; search: string; navigate: (to: string, opts?: { replace?: boolean }) => void }>({
  path: '/',
  search: '',
  navigate: () => {},
});

const LEGACY: Record<string, string> = {
  '/index.html': '/',
  '/about.html': '/about',
  '/experience.html': '/experience',
  '/projects.html': '/projects',
  '/skills.html': '/skills',
  '/resume.html': '/resume',
};

export function normalisePath(p: string) {
  if (LEGACY[p]) return LEGACY[p];
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
  return p || '/';
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [loc, setLoc] = useState(() => ({ path: normalisePath(window.location.pathname), search: window.location.search }));

  useEffect(() => {
    const onPop = () => setLoc({ path: normalisePath(window.location.pathname), search: window.location.search });
    window.addEventListener('popstate', onPop);
    const norm = normalisePath(window.location.pathname);
    if (norm !== window.location.pathname) window.history.replaceState({}, '', norm + window.location.search + window.location.hash);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = (to: string, opts: { replace?: boolean } = {}) => {
    const [beforeHash, hash] = to.split('#');
    const q = beforeHash.indexOf('?');
    const pathname = q >= 0 ? beforeHash.slice(0, q) : beforeHash;
    const search = q >= 0 ? beforeHash.slice(q) : '';
    const norm = normalisePath(pathname || '/');
    if (norm === loc.path && search === loc.search && !hash) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    const url = norm + search + (hash ? '#' + hash : '');
    if (opts.replace) window.history.replaceState({}, '', url);
    else window.history.pushState({}, '', url);
    setLoc({ path: norm, search });
  };

  return <RouterContext.Provider value={{ path: loc.path, search: loc.search, navigate }}>{children}</RouterContext.Provider>;
}

export function useRouter() {
  return useContext(RouterContext);
}

/** The current query string, parsed. Only the mini-CTF pages use query parameters. */
export function useQuery(): URLSearchParams {
  const { search } = useRouter();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export function matchRoute(pattern: string, path: string): RouteMatch | null {
  const a = pattern.split('/').filter(Boolean);
  const b = path.split('/').filter(Boolean);
  if (a.length !== b.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < a.length; i++) {
    if (a[i].startsWith(':')) params[a[i].slice(1)] = decodeURIComponent(b[i]);
    else if (a[i] !== b[i]) return null;
  }
  return { path, params };
}

export function Link({ to, children, className, onClick, ...rest }: { to: string; children: ReactNode; className?: string; onClick?: (e: MouseEvent<HTMLAnchorElement>) => void } & Record<string, unknown>) {
  const { navigate, path } = useRouter();
  const external = /^https?:\/\//.test(to) || to.startsWith('mailto:');
  const active = !external && (to === path || (to !== '/' && path.startsWith(to)));
  return (
    <a
      href={to}
      className={[className, active ? 'is-active' : ''].filter(Boolean).join(' ') || undefined}
      aria-current={active ? 'page' : undefined}
      target={external ? '_blank' : undefined}
      rel={external ? 'noreferrer' : undefined}
      onClick={(e) => {
        onClick?.(e);
        if (external || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        navigate(to);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
