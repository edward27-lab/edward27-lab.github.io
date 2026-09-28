import { Link } from '../lib/router.tsx';
import { useData } from '../i18n/data.ts';
import { useT } from '../i18n/locale.tsx';

export function Footer() {
  const { profile } = useData();
  const t = useT();
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="container">
        <div>◐ {profile.name} · {profile.location} · {year}</div>
        <div className="links">
          <a href={profile.linkedin} target="_blank" rel="noreferrer">{t.footer.linkedin} ↗</a>
          <Link to="/resume">{t.footer.resume}</Link>
          <Link to="/blog">{t.footer.blog}</Link>
        </div>
      </div>
    </footer>
  );
}
