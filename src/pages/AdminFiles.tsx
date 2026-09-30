import { useEffect, useState, type FormEvent } from 'react';
import { Link, useQuery, useRouter } from '../lib/router.tsx';
import { AdminPanel } from './AdminPanel.tsx';
import { useCtf, useFlag } from '../ctf/progress.tsx';
import { isTraversal, normalize, targetsPasswd } from '../ctf/patterns.ts';
import { KNOWN_FILES, passwdFile } from '../ctf/fakefs.ts';

/** Stage 3: a "File Manager" that takes any path. Everything renders as text. */
export function AdminFiles() {
  const q = useQuery();
  const file = q.get('file') ?? '';
  const { navigate } = useRouter();
  const { capture } = useCtf();
  const flag = useFlag('traversal');
  const [input, setInput] = useState(file);

  useEffect(() => { setInput(file); }, [file]);

  const traversal = file !== '' && isTraversal(file);
  const hit = traversal && targetsPasswd(file);

  useEffect(() => { if (hit) capture('traversal'); }, [hit, capture]);

  const open = (e: FormEvent) => {
    e.preventDefault();
    navigate(`/admin/panel/files?file=${encodeURIComponent(input)}`);
  };

  let body: React.ReactNode;
  if (!file) {
    body = <p className="legacy-small">Select a file from the list.</p>;
  } else if (hit) {
    body = <pre className="legacy-pre">{flag ? passwdFile(flag) : 'reading…'}</pre>;
  } else if (traversal) {
    body = (
      <pre className="legacy-error" role="alert">
        {`Warning: include(${normalize(file)}): failed to open stream: No such file or directory in /var/www/admin/files.php on line 17`}
      </pre>
    );
  } else if (Object.prototype.hasOwnProperty.call(KNOWN_FILES, file)) {
    body = <pre className="legacy-pre">{KNOWN_FILES[file]}</pre>;
  } else {
    body = (
      <pre className="legacy-error" role="alert">
        {`Warning: include(): Failed opening '${file}' for inclusion (include_path='.:/usr/share/php') in /var/www/admin/files.php on line 17`}
      </pre>
    );
  }

  return (
    <AdminPanel title="File Manager">
      <table className="legacy-table legacy-files">
        <caption>Share: /var/www/admin/share/</caption>
        <thead>
          <tr><th scope="col">Name</th><th scope="col">Size</th><th scope="col">Modified</th></tr>
        </thead>
        <tbody>
          <tr><td><Link to="/admin/panel/files?file=welcome.txt">welcome.txt</Link></td><td>184 B</td><td>2004-03-14</td></tr>
          <tr><td><Link to="/admin/panel/files?file=notes.txt">notes.txt</Link></td><td>231 B</td><td>2019-11-02</td></tr>
          <tr><td><Link to="/admin/panel/files?file=backup_2019.zip">backup_2019.zip</Link></td><td>1.1 MB</td><td>2019-03-02</td></tr>
        </tbody>
      </table>
      <form className="legacy-form" onSubmit={open}>
        <label htmlFor="ctf-file">Open file:</label>{' '}
        <input id="ctf-file" name="file" type="text" value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false} autoCapitalize="off" size={40} />{' '}
        <button type="submit" className="legacy-btn">Open</button>
      </form>
      <h2 className="legacy-h2">{file ? `Viewing: ${file}` : 'Viewer'}</h2>
      {body}
    </AdminPanel>
  );
}
