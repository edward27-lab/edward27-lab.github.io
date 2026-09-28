import { Link } from '../lib/router.tsx';
import { useT } from '../i18n/locale.tsx';
import { useDocumentTitle } from '../lib/hooks.ts';

export function NotFound() {
  const t = useT();
  useDocumentTitle(t.notFound.docTitle);
  return (
    <div className="container notfound">
      <div>
        <span className="eyebrow">{t.notFound.eyebrow}</span>
        <h1>{t.notFound.title}</h1>
        <p className="muted">{t.notFound.body}</p>
        <Link to="/" className="btn btn-primary" style={{ marginTop: 12 }}>{t.notFound.back} <span className="arrow">→</span></Link>
      </div>
    </div>
  );
}
