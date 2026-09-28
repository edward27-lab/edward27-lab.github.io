import { useEffect, useRef, useState } from 'react';
import { Link } from '../lib/router.tsx';
import { loadPost, loadPostIndex, formatDate, pickMeta, type Post, type PostMeta } from '../lib/markdown.ts';
import { useLang, useT } from '../i18n/locale.tsx';
import { useDocumentTitle } from '../lib/hooks.ts';
import { NotFound } from './NotFound.tsx';

export function BlogPost({ slug }: { slug: string }) {
  const t = useT();
  const { lang } = useLang();
  const [post, setPost] = useState<Post | null | undefined>(undefined);
  const [index, setIndex] = useState<PostMeta[]>([]);
  const [progress, setProgress] = useState(0);
  const [activeId, setActiveId] = useState<string>('');
  const bodyRef = useRef<HTMLDivElement>(null);
  const shownSlug = useRef<string | null>(null);
  useDocumentTitle(post ? `${post.title}${t.post.titleSuffix}` : t.post.docTitle);

  useEffect(() => {
    let alive = true;
    // A language change keeps the current post on screen while the other version loads.
    if (shownSlug.current !== slug) { setPost(undefined); shownSlug.current = slug; }
    loadPost(slug, lang).then((p) => { if (alive) setPost(p); });
    loadPostIndex().then((i) => { if (alive) setIndex(i); });
    return () => { alive = false; };
  }, [slug, lang]);

  // reading progress + active heading
  useEffect(() => {
    if (!post) return;
    let raf = 0;
    const on = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const el = bodyRef.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const total = r.height - window.innerHeight * 0.6;
        setProgress(Math.min(1, Math.max(0, -r.top / Math.max(1, total))));
        const heads = Array.from(el.querySelectorAll('h2, h3')) as HTMLElement[];
        let current = '';
        for (const h of heads) { if (h.getBoundingClientRect().top < 140) current = h.id; else break; }
        setActiveId(current);
      });
    };
    window.addEventListener('scroll', on, { passive: true });
    on();
    return () => { window.removeEventListener('scroll', on); cancelAnimationFrame(raf); };
  }, [post]);

  // copy buttons on code blocks
  useEffect(() => {
    const el = bodyRef.current;
    if (!el || !post) return;
    const onClick = async (e: Event) => {
      const btn = (e.target as HTMLElement).closest('[data-copy]') as HTMLButtonElement | null;
      if (!btn) return;
      const code = btn.parentElement?.querySelector('code')?.textContent ?? '';
      try { await navigator.clipboard.writeText(code); btn.textContent = 'copied'; btn.classList.add('is-done'); setTimeout(() => { btn.textContent = 'copy'; btn.classList.remove('is-done'); }, 1400); } catch { btn.textContent = 'failed'; }
    };
    el.addEventListener('click', onClick);
    return () => el.removeEventListener('click', onClick);
  }, [post]);

  // scroll to hash after render
  useEffect(() => {
    if (!post || !window.location.hash) return;
    const id = window.location.hash.slice(1);
    const timer = setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
    return () => clearTimeout(timer);
  }, [post]);

  if (post === undefined) return <div className="container"><div className="loading">{t.post.loading}</div></div>;
  if (post === null) return <NotFound />;

  const i = index.findIndex((p) => p.slug === slug);
  const newer = i > 0 ? index[i - 1] : null;
  const older = i >= 0 && i < index.length - 1 ? index[i + 1] : null;
  const untranslated = lang !== 'en' && post.lang === 'en';

  return (
    <>
      <div className="reading-progress" style={{ ['--p' as string]: progress }} aria-hidden="true" />
      <div className="container">
        <section className="section">
          <div className="post-layout">
            <article>
              <header className="post-header">
                <Link to="/blog" className="eyebrow" style={{ marginBottom: 14 }}>{t.post.back}</Link>
                <h1>{post.title}{untranslated && <span className="lang-badge">{t.blog.enOnly}</span>}</h1>
                <div className="meta">
                  <span>{formatDate(post.date, lang)}</span>
                  <span>{t.post.minRead(post.minutes ?? 1, post.words)}</span>
                  <div className="tags">{post.tags.map((tg) => <span className="tag" key={tg}>{tg}</span>)}</div>
                </div>
              </header>
              {untranslated && <div className="notice">{t.post.enOnlyNotice}</div>}
              {post.sample && <div className="notice">{t.post.sampleNotice}</div>}
              <div className="post-body" ref={bodyRef} dangerouslySetInnerHTML={{ __html: post.html }} />
              <nav className="post-nav" aria-label={t.post.postNav}>
                {older ? <Link to={`/blog/${older.slug}`}><span className="lbl">{t.post.older}</span>{pickMeta(older, lang).title}</Link> : <span />}
                {newer ? <Link to={`/blog/${newer.slug}`} className="next"><span className="lbl">{t.post.newer}</span>{pickMeta(newer, lang).title}</Link> : <span />}
              </nav>
            </article>
            {post.toc.length > 0 && (
              <aside className="post-toc" aria-label={t.post.toc}>
                <h4>{t.post.onThisPage}</h4>
                <ol>
                  {post.toc.map((h) => (
                    <li key={h.id} className={h.level === 3 ? 'l3' : ''}>
                      <a href={`#${h.id}`} className={activeId === h.id ? 'is-active' : ''} onClick={(e) => { e.preventDefault(); document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); history.replaceState({}, '', `#${h.id}`); }}>{h.text}</a>
                    </li>
                  ))}
                </ol>
              </aside>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
