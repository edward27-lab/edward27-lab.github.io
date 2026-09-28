import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from '../lib/router.tsx';
import { loadPostIndex, formatDate, pickMeta, type PostMeta } from '../lib/markdown.ts';
import { rich, useLang, useT } from '../i18n/locale.tsx';
import { Reveal } from '../components/Reveal.tsx';
import { SectionHead } from '../components/SectionHead.tsx';
import { useDocumentTitle } from '../lib/hooks.ts';

export function Blog() {
  const t = useT();
  const { lang } = useLang();
  useDocumentTitle(t.blog.docTitle);
  const [posts, setPosts] = useState<PostMeta[] | null>(null);
  const [q, setQ] = useState('');
  const [tag, setTag] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => { loadPostIndex().then(setPosts); }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== input.current && !(e.target as HTMLElement)?.closest('input, textarea')) { e.preventDefault(); input.current?.focus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const tags = useMemo(() => Array.from(new Set((posts ?? []).flatMap((p) => p.tags))).sort(), [posts]);
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (posts ?? [])
      .map((p) => ({ p, m: pickMeta(p, lang) }))
      .filter(({ p, m }) => (!tag || p.tags.includes(tag)) && (!s || `${m.title} ${m.summary} ${p.title} ${p.summary} ${p.tags.join(' ')}`.toLowerCase().includes(s)));
  }, [posts, q, tag, lang]);

  return (
    <div className="container">
      <section className="section">
        <SectionHead eyebrow={t.blog.eyebrow} title={rich(t.blog.title)} lede={t.blog.lede} />
        <Reveal>
          <div className="blog-tools" data-no-drag>
            <label className="search">
              <span className="muted">⌕</span>
              <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.blog.search} aria-label={t.blog.search} />
              <kbd>/</kbd>
            </label>
            <div className="tags">
              <button type="button" className={`tag ${tag === null ? 'is-on' : ''}`} onClick={() => setTag(null)}>{t.blog.all}</button>
              {tags.map((tg) => <button type="button" key={tg} className={`tag ${tag === tg ? 'is-on' : ''}`} onClick={() => setTag(tag === tg ? null : tg)}>{tg}</button>)}
            </div>
          </div>
        </Reveal>
        {posts === null && <div className="loading">{t.blog.loading}</div>}
        {posts !== null && list.length === 0 && (
          <div className="empty">{posts.length === 0 ? t.blog.none : t.blog.noMatch}</div>
        )}
        <div className="post-list">
          {list.map(({ p, m }, i) => (
            <Reveal key={p.slug} delay={i * 50}>
              <Link to={`/blog/${p.slug}`} className="post-row" data-no-drag>
                <span className="date">{formatDate(p.date, lang)}</span>
                <div>
                  <h3>
                    {m.title}
                    {p.sample && <span className="sample">{t.blog.sample}</span>}
                    {!m.translated && <span className="lang-badge">{t.blog.enOnly}</span>}
                  </h3>
                  <p>{m.summary}</p>
                  <div className="tags">{p.tags.map((tg) => <span className="tag" key={tg}>{tg}</span>)}</div>
                </div>
                <span className="read">{m.minutes ? t.blog.minutes(m.minutes) : ''}</span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}
