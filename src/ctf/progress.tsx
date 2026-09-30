import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { TOTAL_VULNS, VULN_IDS, isVulnId, revealFlag, type VulnId } from './flags.ts';

/**
 * Mini-CTF progress. Stored in the browser under the same namespace as the
 * language preference; follows the LocaleProvider pattern. Purely client
 * side: nothing is ever sent anywhere.
 */

const KEY = 'edward-site:ctf';
/** The "logged in to the old panel" session. Theatre, not security. */
const SESSION_KEY = 'ctf:adminSession';

export interface CtfState {
  found: VulnId[];
  foundAt: Record<string, string>; // vuln id -> ISO timestamp
  hints: Record<string, number>;   // vuln id -> hints revealed so far
}

const EMPTY: CtfState = { found: [], foundAt: {}, hints: {} };

function load(): CtfState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const v = JSON.parse(raw) as Partial<CtfState>;
    const found = Array.isArray(v.found) ? v.found.filter(isVulnId) : [];
    return {
      found: VULN_IDS.filter((id) => found.includes(id)),
      foundAt: v.foundAt && typeof v.foundAt === 'object' ? v.foundAt : {},
      hints: v.hints && typeof v.hints === 'object' ? v.hints : {},
    };
  } catch {
    return EMPTY;
  }
}

function save(s: CtfState) {
  const empty = s.found.length === 0 && Object.keys(s.hints).length === 0;
  try { empty ? localStorage.removeItem(KEY) : localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* storage unavailable */ }
}

export function hasAdminSession(): boolean {
  try { return sessionStorage.getItem(SESSION_KEY) === 'true'; } catch { return false; }
}
export function setAdminSession(on: boolean) {
  try { on ? sessionStorage.setItem(SESSION_KEY, 'true') : sessionStorage.removeItem(SESSION_KEY); } catch { /* storage unavailable */ }
}

interface Ctf {
  found: VulnId[];
  foundAt: Record<string, string>;
  count: number;
  total: number;
  isFound: (id: VulnId) => boolean;
  /** Records a find. Returns true only the first time; callers show the modal only then. */
  capture: (id: VulnId) => boolean;
  /** How many hints have been revealed for a vuln, and reveal one more. */
  hintsRevealed: (id: VulnId) => number;
  revealHint: (id: VulnId) => void;
  reset: () => void;
  /** The vuln whose capture modal is currently showing, if any. */
  celebrating: VulnId | null;
  dismissCelebration: () => void;
}

const CtfContext = createContext<Ctf>({
  found: [], foundAt: {}, count: 0, total: TOTAL_VULNS,
  isFound: () => false, capture: () => false, hintsRevealed: () => 0, revealHint: () => {}, reset: () => {},
  celebrating: null, dismissCelebration: () => {},
});

export function CtfProgressProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CtfState>(load);
  const [celebrating, setCelebrating] = useState<VulnId | null>(null);
  // Mirror of `found` so two captures in one tick (StrictMode double effects) cannot both return true.
  const foundRef = useRef<VulnId[]>(state.found);

  useEffect(() => { save(state); }, [state]);

  const capture = useCallback((id: VulnId) => {
    if (foundRef.current.includes(id)) return false;
    foundRef.current = [...foundRef.current, id];
    setState((s) => ({
      ...s,
      found: VULN_IDS.filter((v) => s.found.includes(v) || v === id),
      foundAt: { ...s.foundAt, [id]: new Date().toISOString() },
    }));
    setCelebrating(id);
    return true;
  }, []);

  const revealHint = useCallback((id: VulnId) => {
    setState((s) => ({ ...s, hints: { ...s.hints, [id]: (s.hints[id] ?? 0) + 1 } }));
  }, []);

  const reset = useCallback(() => {
    foundRef.current = [];
    setState(EMPTY);
    setCelebrating(null);
    setAdminSession(false);
    try { localStorage.removeItem(KEY); } catch { /* storage unavailable */ }
  }, []);

  const value = useMemo<Ctf>(() => ({
    found: state.found,
    foundAt: state.foundAt,
    count: state.found.length,
    total: TOTAL_VULNS,
    isFound: (id) => state.found.includes(id),
    capture,
    hintsRevealed: (id) => state.hints[id] ?? 0,
    revealHint,
    reset,
    celebrating,
    dismissCelebration: () => setCelebrating(null),
  }), [state, capture, revealHint, reset, celebrating]);

  return <CtfContext.Provider value={value}>{children}</CtfContext.Provider>;
}

export function useCtf() {
  return useContext(CtfContext);
}

/** Resolves a vuln's flag (hash-verified) for display. Empty string until ready. */
export function useFlag(id: VulnId | null): string {
  const [flag, setFlag] = useState('');
  useEffect(() => {
    let live = true;
    setFlag('');
    if (id) revealFlag(id).then((f) => { if (live) setFlag(f); });
    return () => { live = false; };
  }, [id]);
  return flag;
}
