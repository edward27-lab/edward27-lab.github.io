# Edward — portfolio (v2)

A single-page portfolio built around one persistent, physically-lit 3D moon that
follows you across every page: a hero on the home page, the scrubber on the
experience timeline, and a quiet presence in the corner elsewhere. Plus a
markdown-driven blog.

Stack: Vite + React + TypeScript, three.js (hand-written moon shader, no extra
3D libraries), `marked` + `highlight.js` for the blog. No backend.

---

## Run it locally

You need Node 18+ (Node 22 recommended; see `.nvmrc`).

```bash
npm install
npm run dev
```

Then open the URL it prints (default http://localhost:5173).

To make a production build:

```bash
npm run build      # outputs to dist/
npm run preview    # serve the built dist/ locally
```

---

## Deploy

It is a static site, so any static host works.

It is live on **GitHub Pages** at https://edward27-lab.github.io. Every push to
`main` rebuilds and redeploys it via `.github/workflows/deploy.yml` (repo
Settings → Pages → Source must be "GitHub Actions"). The workflow copies
`index.html` to `404.html` so deep links like `/blog/<slug>` load the app. If the
address ever changes, update `og:url` and `og:image` in `index.html`.

On **Vercel**, import the repo and
keep the defaults (build command `npm run build`, output `dist`). `vercel.json`
is already set up to rewrite all routes to `index.html` (needed for the client
side router) and to cache the moon textures.

On Netlify/Cloudflare Pages, set the build command to `npm run build`, the
publish directory to `dist`, and add a catch-all rewrite `/* -> /index.html`.

---

## Writing blog posts

Posts are plain markdown files. To add one:

1. Create `public/blog/posts/<slug>.md` (the slug becomes the URL:
   `/blog/<slug>`). Use lowercase letters, numbers and hyphens.
2. Start the file with a front-matter block:

   ```markdown
   ---
   title: My post title
   date: 2026-09-01
   summary: One or two sentences shown in the list and previews.
   tags: [web, burp, writeup]
   draft: false     # optional — true hides it from the site
   sample: false    # optional — true shows a small "sample" badge
   ---

   Your post body in markdown. Headings become the table of contents,
   code blocks get syntax highlighting and a copy button.
   ```

3. Rebuild the index so the blog list picks it up:

   ```bash
   npm run blog:index
   ```

That regenerates `public/blog/posts.json`. Reading time is estimated
automatically from the word count. `npm run build` also runs it first, so a
deploy always picks up new posts even if you forget; you only need it by hand
to see a new post in `npm run dev`.

The four posts shipped in `public/blog/posts/` are marked `sample: true` — keep,
edit, or delete them, then re-run `npm run blog:index`.

### Indonesian versions

The site has an EN / ID switch in the nav. Page text and the data files are
bilingual; blog posts are English unless you add a translation:

1. Create `public/blog/posts/<slug>.id.md` next to `<slug>.md`, with its own
   `title` and `summary` in the front matter and the body in Indonesian. The
   `date`, `tags`, `draft` and `sample` fields are taken from the English file.
2. Run `npm run blog:index`. The translated title, summary and reading time are
   attached to the post's entry in `posts.json`.

In Indonesian mode, posts without a `.id.md` file show the English text with a
small `EN` badge.

Supported code languages for highlighting: bash, python, javascript, typescript,
http, json, yaml, sql, kotlin, powershell, html/xml. Others render as plain
monospace.

---

## The moon

The moon is drawn with a custom GLSL shader in `src/three/`. Its look is driven
by three equirectangular textures in `public/textures/moon/`:

- `albedo.webp` — surface colour
- `normal.webp` — tangent-space normal map (surface relief)
- `height.webp` — height map (used for the cast-shadow terminator and a little
  displacement)
- `meta.json` — the height range and texture size (read by the renderer)

### Regenerate or change the textures

They are generated procedurally by `tools/bake_moon.py` (needs Python with
`numpy`, `scipy` and `pillow`):

```bash
pip install numpy scipy pillow
python3 tools/bake_moon.py --width 4096 --seed 7 --out public/textures/moon
```

Change `--seed` for a different but equally plausible moon, or `--width` for a
different resolution (2048 is lighter, 4096 is the shipped default). After
baking, the script writes `.png` files — convert them to `.webp` (any tool;
e.g. `cwebp albedo.png -o albedo.webp`) since the site loads `.webp`.

### Use the real NASA moon instead

If you would rather use photographic maps, drop NASA LROC/CGI equirectangular
maps in as `albedo.webp`, `normal.webp` and `height.webp` (longitude 0 at the
left edge, north at the top) and set `meta.json`'s `heightRange` to match your
height map's vertical scale. No code changes needed.

### Moon behaviour per page

The moon's position, size, phase and lighting per route live in the `MODES`
table at the top of `src/three/MoonScene.ts` (`hero`, `dock`, `ambient`,
`quiet`), with narrow-screen overrides in `MOBILE_MODES` right below. Tweak
those numbers to reposition or resize it anywhere.

---

## Editing content

All the site's text lives in plain data files under `src/data/`:

- `profile.ts` — name, intro paragraphs, "currently", recognition, languages.
  Set `resumePdf` here to a file in `public/` (e.g. `/resume/Edward-CV.pdf`) to
  make the résumé page's button download a real PDF instead of using the
  browser's print-to-PDF.
- `experience.ts` — every role on the timeline (title, org, dates, bullets).
- `projects.ts` — the projects list.
- `skills.ts` — the skill constellations (name, level, tools, and each hub's
  position on the map).

Change those and the pages update automatically.

---

## Keyboard & accessibility

- **⌘K / Ctrl+K** opens a command palette to jump to any page, post or action.
- **/** focuses the search box on the blog.
- Respects `prefers-reduced-motion`: the moon stops auto-spinning and reveals
  become instant.
- Old `.html` URLs from the previous site (e.g. `/about.html`) redirect to the
  new routes.

---

## Project layout

```
public/
  textures/moon/     the moon's albedo, normal, height, meta
  blog/posts/*.md    blog posts (+ posts.json index)
  favicon.svg, og.png
src/
  three/             MoonScene + GLSL shaders
  components/        nav, cursor, command palette, tilt cards, reveals, …
  pages/             one file per route
  data/              all site content
  lib/               router, markdown, hooks, moon singleton
  styles/global.css  all styling (design tokens at the top)
tools/
  bake_moon.py       procedural moon texture generator
  blog-index.mjs     regenerates public/blog/posts.json
```
