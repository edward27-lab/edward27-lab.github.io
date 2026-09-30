import { useEffect, useRef, useState, type FormEvent } from 'react';
import { AdminPanel } from './AdminPanel.tsx';
import { useCtf, useFlag } from '../ctf/progress.tsx';
import { isXss } from '../ctf/patterns.ts';
import { SEED_GUESTBOOK, type GuestbookEntry } from '../ctf/fakefs.ts';

/**
 * Stage 5: a guestbook that "reflects input". SAFETY: nothing typed here is
 * ever rendered as HTML. Every string goes through React's text rendering.
 * An XSS-looking payload triggers a *fake* browser alert; that is all.
 */

const KEY = 'edward-site:ctf:guestbook';

function loadEntries(): GuestbookEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const v = JSON.parse(raw);
      if (Array.isArray(v)) return v.filter((e) => e && typeof e.name === 'string' && typeof e.message === 'string' && typeof e.at === 'string');
    }
  } catch { /* storage unavailable */ }
  return SEED_GUESTBOOK;
}

const stamp = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

export function Guestbook() {
  const { capture } = useCtf();
  const flag = useFlag('xss');
  const [entries, setEntries] = useState<GuestbookEntry[]>(loadEntries);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [reflected, setReflected] = useState<string | null>(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const okRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { if (alertOpen) okRef.current?.focus(); }, [alertOpen]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const text = message.trim();
    if (!text && !name.trim()) return;
    setReflected(text);
    if (isXss(name) || isXss(message)) {
      setAlertOpen(true);
      return;
    }
    const next = [...entries, { name: name.trim() || 'anonymous', message: text, at: stamp() }].slice(-50);
    setEntries(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* storage unavailable */ }
    setMessage('');
  };

  const closeAlert = () => {
    setAlertOpen(false);
    capture('xss');
    setMessage('');
  };

  return (
    <AdminPanel title="Guestbook">
      <p>Leave a message for the team. Comments are moderated.</p>
      <form className="legacy-form" onSubmit={onSubmit} autoComplete="off">
        <table className="legacy-table legacy-login" role="presentation">
          <tbody>
            <tr>
              <th scope="row"><label htmlFor="ctf-gb-name">Name:</label></th>
              <td><input id="ctf-gb-name" name="name" type="text" value={name} onChange={(e) => setName(e.target.value)} size={30} /></td>
            </tr>
            <tr>
              <th scope="row"><label htmlFor="ctf-gb-msg">Message:</label></th>
              <td><textarea id="ctf-gb-msg" name="message" rows={3} cols={40} value={message} onChange={(e) => setMessage(e.target.value)} /></td>
            </tr>
            <tr>
              <td />
              <td><button type="submit" className="legacy-btn">Sign guestbook</button></td>
            </tr>
          </tbody>
        </table>
      </form>

      {reflected !== null && !alertOpen && (
        <p className="legacy-notice" role="status">Comment moderated. You wrote: <q>{reflected}</q></p>
      )}

      <table className="legacy-table legacy-guestbook">
        <caption>{entries.length} entries</caption>
        <thead>
          <tr><th scope="col">Date</th><th scope="col">Name</th><th scope="col">Message</th></tr>
        </thead>
        <tbody>
          {entries.map((e, i) => (
            <tr key={i}><td>{e.at}</td><td>{e.name}</td><td>{e.message}</td></tr>
          ))}
        </tbody>
      </table>

      {alertOpen && (
        <div className="legacy-alert-backdrop">
          <div className="legacy-alert" role="alertdialog" aria-modal="true" aria-labelledby="ctf-alert-title" aria-describedby="ctf-alert-body">
            <div className="legacy-alert-title" id="ctf-alert-title">{window.location.hostname || 'localhost'} says</div>
            <p className="legacy-alert-body" id="ctf-alert-body">XSS executed: document.cookie = "{flag || '…'}"</p>
            <div className="legacy-alert-actions">
              <button ref={okRef} type="button" className="legacy-btn" onClick={closeAlert} disabled={!flag}>OK</button>
            </div>
          </div>
        </div>
      )}
    </AdminPanel>
  );
}
