import { useEffect, type ReactNode } from 'react';
import { Link, useRouter } from '../lib/router.tsx';
import { LegacyShell } from '../components/legacy/LegacyShell.tsx';
import { hasAdminSession, setAdminSession } from '../ctf/progress.tsx';
import { DECOY_USER_ID } from '../ctf/fakefs.ts';

/**
 * Layout for every /admin/panel* page: the legacy chrome plus the panel's
 * own navigation. Redirects to the login when the fake session is missing.
 * (Client-side gate: theatre, not security. That is the point.)
 */
export function AdminPanel({ title = 'Dashboard', children }: { title?: string; children?: ReactNode }) {
  const { navigate } = useRouter();
  const ok = hasAdminSession();

  useEffect(() => { if (!ok) navigate('/admin', { replace: true }); }, [ok, navigate]);
  if (!ok) return null;

  const logout = () => { setAdminSession(false); navigate('/admin'); };

  return (
    <LegacyShell title={title}>
      <nav className="legacy-nav" aria-label="Panel">
        <Link to="/admin/panel">Dashboard</Link>
        <span aria-hidden="true">|</span>
        <Link to="/admin/panel/files?file=welcome.txt">File Manager</Link>
        <span aria-hidden="true">|</span>
        <Link to={`/admin/panel/users?id=${DECOY_USER_ID}`}>Users</Link>
        <span aria-hidden="true">|</span>
        <Link to="/admin/panel/guestbook">Guestbook</Link>
        <span aria-hidden="true">|</span>
        <button type="button" className="legacy-linkbtn" onClick={logout}>Logout</button>
      </nav>
      {children ?? <Dashboard />}
    </LegacyShell>
  );
}

function Dashboard() {
  return (
    <>
      <p className="legacy-notice">Login successful. Session: <b>guest_analyst</b> (uid={DECOY_USER_ID}) · privilege: viewer</p>
      <table className="legacy-table">
        <caption>Server status</caption>
        <tbody>
          <tr><th scope="row">Hostname</th><td>intranet01</td></tr>
          <tr><th scope="row">Uptime</th><td>2,431 days, 6:12</td></tr>
          <tr><th scope="row">PHP</th><td>4.3.11 (register_globals = On)</td></tr>
          <tr><th scope="row">MySQL</th><td>3.23.58</td></tr>
          <tr><th scope="row">Disk</th><td>C: 1.9 GB free of 4.0 GB</td></tr>
          <tr><th scope="row">Last backup</th><td>2019-03-02 (backup_2019.zip)</td></tr>
        </tbody>
      </table>
      <table className="legacy-table">
        <caption>Recent activity</caption>
        <tbody>
          <tr><td>2019-11-02</td><td>admin</td><td>edited users table</td></tr>
          <tr><td>2019-10-28</td><td>guest_analyst</td><td>viewed File Manager</td></tr>
          <tr><td>2004-06-01</td><td>reception</td><td>signed the guestbook</td></tr>
        </tbody>
      </table>
      <p className="legacy-small">Tip: the File Manager can open any text file on the share.</p>
    </>
  );
}
