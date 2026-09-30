import { useEffect, useState } from 'react';
import { Link } from '../lib/router.tsx';
import { useCtf, useFlag } from '../ctf/progress.tsx';
import { useT } from '../i18n/locale.tsx';

const AUTO_DISMISS_MS = 8000;

/**
 * The "VULNERABILITY FOUND" card. Mounted once in App; shows whenever the
 * progress store records a first-time capture. Auto-dismisses after a while.
 */
export function FlagCapture() {
  const { celebrating, dismissCelebration, count, total } = useCtf();
  const flag = useFlag(celebrating);
  const t = useT();
  const [copied, setCopied] = useState(false);

  // auto-dismiss, restarted for every new capture
  useEffect(() => {
    if (!celebrating) return;
    setCopied(false);
    const id = window.setTimeout(dismissCelebration, AUTO_DISMISS_MS);
    return () => window.clearTimeout(id);
  }, [celebrating, dismissCelebration]);

  // devs look in the console
  useEffect(() => {
    if (!celebrating || !flag) return;
    const v = t.ctf.vulns[celebrating];
    console.log(
      `%c⚑ ${t.ctf.capture.found} %c${v.name} — ${v.sub}\n%c${flag}%c   ${t.ctf.capture.progress} ${count}/${total} · /pwned`,
      'color:#7cf2c0;font-weight:700', 'color:#e9edf6', 'color:#7cf2c0;font-family:monospace', 'color:#7f8aa3',
    );
  }, [celebrating, flag, count, total, t]);

  useEffect(() => {
    if (!celebrating) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') dismissCelebration(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [celebrating, dismissCelebration]);

  if (!celebrating) return null;
  const v = t.ctf.vulns[celebrating];

  const copy = async () => {
    try { await navigator.clipboard.writeText(flag); setCopied(true); } catch { /* clipboard unavailable */ }
  };

  return (
    <div className="ctf-capture" role="status" aria-live="polite">
      <div className="ctf-capture-head">
        <span className="ctf-capture-title">⚑ {t.ctf.capture.found}</span>
        <button type="button" className="ctf-capture-close" onClick={dismissCelebration} aria-label={t.ctf.capture.dismiss}>×</button>
      </div>
      <div className="ctf-capture-name">{v.name} <span className="muted">— {v.sub}</span></div>
      <div className="ctf-capture-flag">
        <code>{flag || '…'}</code>
        <button type="button" className="tag" onClick={copy} disabled={!flag}>{copied ? t.ctf.capture.copied : t.ctf.capture.copy}</button>
      </div>
      <div className="ctf-capture-foot">
        <span className="muted">{t.ctf.capture.progress} <b>{count}/{total}</b></span>
        <Link to="/pwned" className="btn ctf-capture-btn" onClick={dismissCelebration}>{t.ctf.capture.viewBoard} <span className="arrow">→</span></Link>
      </div>
      <div className="ctf-capture-timer" aria-hidden="true" />
    </div>
  );
}
