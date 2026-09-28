#!/usr/bin/env node
/**
 * Scans public/blog/posts/*.md, reads each file's front matter, and writes
 * public/blog/posts.json (the index the site loads). Run it after adding,
 * editing or removing a post:
 *
 *   npm run blog:index
 *
 * Front matter block at the top of every post:
 *   ---
 *   title: My post title
 *   date: 2026-09-01
 *   summary: One or two sentences shown in the list.
 *   tags: [web, burp, writeup]
 *   draft: false        # optional, hides the post when true
 *   sample: false       # optional, shows a "sample" badge
 *   ---
 *
 * Translations: an optional `<slug>.id.md` next to `<slug>.md` is the
 * Indonesian version of that post. Its title and summary (and its own
 * reading time) are attached to the base entry under `i18n.id`; its date,
 * tags, draft and sample flags are ignored, those come from the base file.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const postsDir = join(__dirname, '..', 'public', 'blog', 'posts');
const outFile = join(__dirname, '..', 'public', 'blog', 'posts.json');
const LANGS = ['id'];

function parseFrontMatter(src) {
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  const data = {};
  if (!m) return { data, body: src };
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
    if (!kv) continue;
    let v = kv[2].trim();
    if (v.startsWith('[') && v.endsWith(']')) v = v.slice(1, -1).split(',').map((s) => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
    else if (/^(true|false)$/i.test(v)) v = v.toLowerCase() === 'true';
    else v = v.replace(/^["']|["']$/g, '');
    data[kv[1]] = v;
  }
  return { data, body: src.slice(m[0].length) };
}

const readingMinutes = (body) => Math.max(1, Math.round(body.split(/\s+/).filter(Boolean).length / 220));
const isTranslation = (f) => LANGS.some((lang) => f.endsWith(`.${lang}.md`));

let files = [];
try {
  files = readdirSync(postsDir).filter((f) => f.endsWith('.md'));
} catch {
  console.error('No posts directory at', postsDir);
  process.exit(0);
}

const bases = files.filter((f) => !isTranslation(f));

const posts = bases.map((file) => {
  const slug = file.replace(/\.md$/, '');
  const { data, body } = parseFrontMatter(readFileSync(join(postsDir, file), 'utf8'));
  const entry = {
    slug,
    title: data.title || slug,
    date: data.date || '1970-01-01',
    summary: data.summary || '',
    tags: Array.isArray(data.tags) ? data.tags : (data.tags ? [data.tags] : []),
    minutes: readingMinutes(body),
    draft: data.draft === true,
    sample: data.sample === true,
  };
  for (const lang of LANGS) {
    const tf = join(postsDir, `${slug}.${lang}.md`);
    if (!existsSync(tf)) continue;
    const tr = parseFrontMatter(readFileSync(tf, 'utf8'));
    entry.i18n = { ...(entry.i18n || {}), [lang]: { title: tr.data.title || entry.title, summary: tr.data.summary || entry.summary, minutes: readingMinutes(tr.body) } };
  }
  return entry;
}).sort((a, b) => (a.date < b.date ? 1 : -1));

for (const f of files.filter(isTranslation)) {
  const base = f.replace(/\.[a-z]{2}\.md$/, '.md');
  if (!bases.includes(base)) console.warn(`  warning: ${f} has no base file ${base}, skipped`);
}

writeFileSync(outFile, JSON.stringify(posts, null, 2) + '\n');
console.log(`Wrote ${posts.length} post(s) to public/blog/posts.json`);
for (const p of posts) console.log(`  ${p.draft ? '[draft] ' : ''}${p.date}  ${p.slug}${p.i18n ? `  [${Object.keys(p.i18n).join(', ')}]` : ''}`);
