import { useEffect } from 'react';
import { Link, useQuery } from '../lib/router.tsx';
import { AdminPanel } from './AdminPanel.tsx';
import { useCtf, useFlag } from '../ctf/progress.tsx';
import { DECOY_USER_ID, userRecord } from '../ctf/fakefs.ts';

/** Stage 4: the users page only ever links to id=2. Try 1. */
export function AdminUsers() {
  const q = useQuery();
  const raw = q.get('id');
  const id = raw === null ? DECOY_USER_ID : Number(raw.trim());
  const { capture } = useCtf();
  const flag = useFlag('idor');
  const rec = Number.isInteger(id) ? userRecord(id, flag || '…') : null;
  const escalated = rec?.username === 'admin';

  useEffect(() => { if (escalated) capture('idor'); }, [escalated, capture]);

  return (
    <AdminPanel title="Users">
      <p>
        <Link to={`/admin/panel/users?id=${DECOY_USER_ID}`}>My profile</Link>
        {' · '}
        <span className="legacy-small">only your own record is visible at your privilege level</span>
      </p>
      {rec ? (
        <table className="legacy-table legacy-record">
          <caption>User record #{rec.id}</caption>
          <tbody>
            <tr><th scope="row">id</th><td>{rec.id}</td></tr>
            <tr><th scope="row">username</th><td>{rec.username}</td></tr>
            <tr><th scope="row">role</th><td>{rec.role}</td></tr>
            <tr><th scope="row">email</th><td>{rec.email}</td></tr>
            <tr><th scope="row">last_login</th><td>{rec.lastLogin}</td></tr>
            <tr><th scope="row">note</th><td><pre className="legacy-pre legacy-pre-inline">{rec.note}</pre></td></tr>
          </tbody>
        </table>
      ) : (
        <pre className="legacy-error" role="alert">
          {`Error: user not found (id=${raw ?? ''}). You are user #${DECOY_USER_ID}.`}
        </pre>
      )}
    </AdminPanel>
  );
}
