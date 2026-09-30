import { useEffect, useState, type FormEvent } from 'react';
import { Link, useRouter } from '../lib/router.tsx';
import { LegacyShell } from '../components/legacy/LegacyShell.tsx';
import { hasAdminSession, setAdminSession, useCtf } from '../ctf/progress.tsx';
import { isSqli } from '../ctf/patterns.ts';

/**
 * Stage 1 and 2 of the mini-CTF: landing here is the recon find, and the
 * login form is "injectable". Fully client side; nothing is submitted.
 * The fake server errors are English on purpose (see fakefs.ts).
 */
export function AdminLogin() {
  const { capture } = useCtf();
  const { navigate } = useRouter();
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState<string | null>(null);
  const loggedIn = hasAdminSession();

  // finding the panel at all is the first vuln
  useEffect(() => { capture('recon'); }, [capture]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (isSqli(user) || isSqli(pass)) {
      setAdminSession(true);
      capture('sqli');
      navigate('/admin/panel');
      return;
    }
    const near = user || pass;
    setError(`You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near '${near}' at line 1`);
  };

  return (
    <LegacyShell title="Administrator Login">
      <p>Please enter your credentials to access the intranet control panel.</p>
      {loggedIn && (
        <p className="legacy-notice">You already have a session. <Link to="/admin/panel">Continue to the panel</Link>.</p>
      )}
      <form className="legacy-form" onSubmit={onSubmit} autoComplete="off" noValidate>
        <table className="legacy-table legacy-login" role="presentation">
          <tbody>
            <tr>
              <th scope="row"><label htmlFor="ctf-user">Username:</label></th>
              <td><input id="ctf-user" name="username" type="text" value={user} onChange={(e) => setUser(e.target.value)} spellCheck={false} autoCapitalize="off" /></td>
            </tr>
            <tr>
              <th scope="row"><label htmlFor="ctf-pass">Password:</label></th>
              <td><input id="ctf-pass" name="password" type="password" value={pass} onChange={(e) => setPass(e.target.value)} /></td>
            </tr>
            <tr>
              <td />
              <td><button type="submit" className="legacy-btn">Login</button> <button type="reset" className="legacy-btn" onClick={() => { setUser(''); setPass(''); setError(null); }}>Clear</button></td>
            </tr>
          </tbody>
        </table>
      </form>
      {error && (
        <pre className="legacy-error" role="alert">
          {`Warning: mysql_query(): ${error}\n\nWarning: mysql_fetch_array(): supplied argument is not a valid MySQL result resource in /var/www/admin/login.php on line 42`}
        </pre>
      )}
      <p className="legacy-small">Forgot your password? Contact the system administrator on ext. 204.</p>
    </LegacyShell>
  );
}
