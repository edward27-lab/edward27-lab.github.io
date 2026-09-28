import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Lang } from './l.ts';
import { DICT, type Strings } from './strings.ts';

/**
 * Language preference. Stored in the browser, URLs do not change.
 * Defaults to Indonesian for Indonesian-language browsers, English otherwise.
 */

const KEY = 'edward-site:lang';
const isLang = (v: unknown): v is Lang => v === 'en' || v === 'id';

export function detectLang(): Lang {
  try {
    const stored = localStorage.getItem(KEY);
    if (isLang(stored)) return stored;
  } catch { /* storage unavailable */ }
  return (navigator.language || '').toLowerCase().startsWith('id') ? 'id' : 'en';
}

const LocaleContext = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({ lang: 'en', setLang: () => {} });

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [lang, set] = useState<Lang>(detectLang);
  const setLang = useCallback((l: Lang) => {
    set(l);
    try { localStorage.setItem(KEY, l); } catch { /* storage unavailable */ }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.querySelector('meta[name="description"]')?.setAttribute('content', DICT[lang].meta.description);
    const skip = document.querySelector('.skip-link');
    if (skip) skip.textContent = DICT[lang].meta.skip;
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang }), [lang, setLang]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLang() {
  return useContext(LocaleContext);
}

export function useT(): Strings {
  return DICT[useLang().lang];
}

/** Turns "*text*" spans into <em>text</em>. */
export function rich(s: string): ReactNode {
  return s.split(/\*([^*]+)\*/g).map((part, i) => (i % 2 ? <em key={i}>{part}</em> : part));
}
