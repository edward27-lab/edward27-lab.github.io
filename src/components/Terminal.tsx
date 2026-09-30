import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { useRouter } from '../lib/router.tsx';
import { loadPostIndex, type PostMeta } from '../lib/markdown.ts';
import { getData } from '../i18n/data.ts';
import { NAV_LINKS } from './Nav.tsx';
import { useCtf } from '../ctf/progress.tsx';
import { ROBOTS_TXT } from '../ctf/fakefs.ts';

/**
 * A Kali-style terminal that doubles as the site's navigator. Pages are
 * directories under ~, blog posts are .md files inside ~/blog. `cd` moves
 * between pages, `ls` looks around, `cat` opens a post.
 */

/** The terminal always speaks English, whatever the site language. */
const profile = getData('en').profile;

const USER = 'edward';
const HOST = 'kali';

interface Entry { name: string; kind: 'dir' | 'file'; to: string }
interface Line { id: number; node: ReactNode }
interface Suggestion { label: string; value: string; run: boolean }

const COMMANDS = ['help', 'ls', 'cd', 'cat', 'pwd', 'clear', 'exit', 'whoami', 'neofetch', 'history', 'echo', 'linkedin', 'nmap', 'gobuster', 'flags'];

const HOST_NAME = 'edward27-lab.github.io';
/** Tools that get a playful refusal: the game is meant to be played by hand. */
const NICE_TRY = ['sqlmap', 'hydra', 'msfconsole', 'metasploit', 'nikto', 'burpsuite', 'wpscan', 'john', 'hashcat'];

/** Lower-case and strip accents so `cd résumé` and `cd resume` both work. */
const plain = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Resolve a user-typed path against the current directory. ~ and / both mean home. */
function resolve(cwd: string, arg: string): string {
  const base = !arg ? cwd : arg === '~' ? '/' : arg.startsWith('~/') ? arg.slice(1) : arg.startsWith('/') ? arg : `${cwd}/${arg}`;
  const segs: string[] = [];
  for (const s of base.split('/')) {
    if (!s || s === '.') continue;
    if (s === '..') segs.pop();
    else segs.push(plain(s).replace(/\.md$/, ''));
  }
  return '/' + segs.join('/');
}

const display = (p: string) => (p === '/' ? '~' : `~${p}`);

const HELP = [
  'ls [dir]        list pages (directories) or blog posts',
  'cd <dir>        open a page      e.g. cd projects, cd blog, cd .., cd ~',
  'cat <file>      read a file      e.g. cat README.md, cat blog/<post>.md',
  'pwd             show where you are',
  'neofetch        who is this guy',
  'linkedin        open LinkedIn in a new tab',
  'nmap · gobuster recon, if you are into that',
  'flags           mini-ctf progress',
  'clear · history · whoami · echo · exit',
  'tab completes · up/down scrolls history or picks from the dropdown',
].join('\n');

const ART = [
  '    .-.     ',
  '   (o o)    ',
  '   | O \\   ',
  '    \\   \\ ',
  '     `~~~   ',
].join('\n');

export function Terminal({ onClose }: { onClose: () => void }) {
  const { path, navigate } = useRouter();
  const { count, total } = useCtf();
  const [posts, setPosts] = useState<PostMeta[]>([]);
  const [input, setInput] = useState('');
  const [lines, setLines] = useState<Line[]>(() => [
    { id: -2, node: <span className="muted">Kali GNU/Linux Rolling · edward-site · type <b>help</b> for commands</span> },
    { id: -1, node: <span className="muted">pages are directories: <b>ls</b> to look around, <b>cd &lt;page&gt;</b> to move, <b>exit</b> to close</span> },
  ]);
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const [sel, setSel] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(0);

  const cwd = path.startsWith('/blog/') || path === '/' || NAV_LINKS.some((l) => l.to === path) ? path : '/';

  const push = (node: ReactNode) => setLines((ls) => [...ls, { id: nextId.current++, node }]);

  useEffect(() => {
    inputRef.current?.focus();
    loadPostIndex().then(setPosts);
  }, []);

  useEffect(() => { bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight }); }, [lines, sel]);

  /** Directory listing for a path, or null when the path is a file / missing. */
  const entriesOf = (p: string): Entry[] | null => {
    if (p === '/') {
      return [
        ...NAV_LINKS.map((l) => ({ name: l.to.slice(1), kind: 'dir' as const, to: l.to })),
        { name: 'README.md', kind: 'file', to: '/' },
      ];
    }
    if (p === '/blog') return posts.map((po) => ({ name: `${po.slug}.md`, kind: 'file' as const, to: `/blog/${po.slug}` }));
    if (NAV_LINKS.some((l) => l.to === p)) return [];
    return null;
  };
  const isPost = (p: string) => p.startsWith('/blog/') && posts.some((po) => `/blog/${po.slug}` === p);

  const prompt = (dir: string) => (
    <span className="term-prompt">
      <span className="box">┌──(</span><span className="u">{USER}㉿{HOST}</span><span className="box">)-[</span><span className="p">{display(dir)}</span><span className="box">]</span>
      {'\n'}<span className="box">└─$</span>{' '}
    </span>
  );

  const run = (raw: string) => {
    const text = raw.trim();
    push(<>{prompt(cwd)}{text}</>);
    if (text) setHistory((h) => [...h, text]);
    setHistIdx(-1);
    setInput('');
    setSel(-1);
    if (!text) return;
    const [cmd, ...args] = text.split(/\s+/);
    const arg = args.filter((a) => !a.startsWith('-')).join(' ');

    switch (cmd) {
      case 'help':
        push(<span className="out">{HELP}</span>);
        break;
      case 'ls': {
        const p = resolve(cwd, arg);
        const es = entriesOf(p);
        if (es === null) {
          if (isPost(p)) push(<span className="out">{p.slice('/blog/'.length)}.md</span>);
          else push(<span className="err">ls: cannot access '{arg}': No such file or directory</span>);
        } else if (es.length === 0) push(<span className="muted">.  ..</span>);
        else push(<span className="term-ls">{es.map((e) => <span key={e.name} className={e.kind === 'dir' ? 'd' : 'f'}>{e.kind === 'dir' ? `${e.name}/` : e.name}</span>)}</span>);
        break;
      }
      case 'cd': {
        const p = resolve(cwd, arg || '~');
        if (entriesOf(p) !== null) navigate(p);
        else if (isPost(p)) { push(<span className="muted">bash: cd: {arg}: Not a directory, opening it anyway</span>); navigate(p); }
        else push(<span className="err">bash: cd: {arg}: No such file or directory</span>);
        break;
      }
      case 'cat': {
        if (!arg) { push(<span className="err">cat: missing file operand</span>); break; }
        if (/^(~\/|\/)?robots\.txt$/i.test(arg)) { push(<span className="out">{ROBOTS_TXT}</span>); break; }
        const p = resolve(cwd, arg);
        if (p === '/readme') {
          push(<span className="out">{`# ${profile.name}\n${profile.role} · ${profile.location}\n${profile.tagline}\n${profile.status}`}</span>);
        } else if (isPost(p)) { push(<span className="muted">opening {display(p)}.md</span>); navigate(p); }
        else if (entriesOf(p) !== null) push(<span className="err">cat: {arg}: Is a directory</span>);
        else push(<span className="err">cat: {arg}: No such file or directory</span>);
        break;
      }
      case 'pwd': push(<span className="out">/home/{USER}{cwd === '/' ? '' : cwd}</span>); break;
      case 'whoami': push(<span className="out">{USER}</span>); break;
      case 'echo': push(<span className="out">{arg}</span>); break;
      case 'history': push(<span className="out">{history.map((h, i) => `${String(i + 1).padStart(4)}  ${h}`).join('\n') || '(empty)'}</span>); break;
      case 'clear': setLines([]); break;
      case 'exit': case 'quit': case 'logout': onClose(); break;
      case 'linkedin': window.open(profile.linkedin, '_blank', 'noreferrer'); push(<span className="muted">opening LinkedIn</span>); break;
      case 'neofetch':
        push(<span className="term-fetch">
          <span className="art">{ART}</span>
          <span className="out">{[
            `${USER}@${HOST}`,
            '-----------',
            `Name:      ${profile.name}`,
            `Role:      ${profile.role}`,
            `Location:  ${profile.location}`,
            'Uni:       Monash BIT (Cybersecurity) · Dec 2026',
            `Langs:     ${profile.languages.map((l) => l.name).join(', ')}`,
            `Status:    ${profile.status}`,
            ...(count >= total ? [`Pwned:     ${count}/${total}`] : []),
          ].join('\n')}</span>
        </span>);
        break;
      case 'nmap':
        push(<span className="out">{[
          'Starting Nmap 7.94 ( https://nmap.org )',
          `Nmap scan report for ${arg || HOST_NAME}`,
          'Host is up (0.0042s latency).',
          '',
          'PORT      STATE     SERVICE',
          '443/tcp   open      https',
          '31337/tcp filtered  elite       # robots know the way',
          '',
          'Nmap done: 1 IP address (1 host up) scanned in 1.33 seconds',
        ].join('\n')}</span>);
        break;
      case 'gobuster': case 'dirb': case 'dirbuster': case 'ffuf': {
        const words = ['/images', '/css', '/js', '/api', '/login', '/backup', '/uploads', '/robots.txt', '/admin'];
        push(<span className="muted">{`${cmd}: scanning https://${HOST_NAME} with common.txt (${words.length} words)`}</span>);
        words.forEach((w, i) => {
          const hit = w === '/admin' || w === '/robots.txt';
          window.setTimeout(() => push(<span className={hit ? 'out' : 'muted'}>{`${w.padEnd(14)} (Status: ${hit ? 200 : 404})`}</span>), 110 * (i + 1));
        });
        break;
      }
      case 'flags':
        push(<span className="out">{`${count}/${total} — details at /pwned`}</span>);
        break;
      default:
        if (NICE_TRY.includes(cmd)) { push(<span className="err">nice try. the old-fashioned way: /robots.txt</span>); break; }
        push(<span className="err">bash: {cmd}: command not found</span>);
    }
  };

  /** Dropdown suggestions for the word being typed. */
  const suggestions = useMemo<Suggestion[]>(() => {
    const m = input.match(/^(\S+)\s+(\S*)$/);
    if (!m) {
      const w = input.trim();
      if (!w || input.includes(' ')) return [];
      return COMMANDS.filter((c) => c.startsWith(w)).map((c) => ({ label: c, value: `${c} `, run: c !== 'cd' && c !== 'cat' && c !== 'echo' }));
    }
    const [, cmd, partial] = m;
    if (!['cd', 'ls', 'cat'].includes(cmd)) return [];
    const slash = partial.lastIndexOf('/');
    const dirPart = slash >= 0 ? partial.slice(0, slash + 1) : '';
    const word = plain(partial.slice(slash + 1));
    const es = entriesOf(resolve(cwd, dirPart)) ?? [];
    const extra: Entry[] = cwd !== '/' && !dirPart && cmd !== 'cat' ? [{ name: '..', kind: 'dir', to: '' }, { name: '~', kind: 'dir', to: '/' }] : [];
    return [...extra, ...es]
      .filter((e) => (cmd === 'cd' ? e.kind === 'dir' || e.name.endsWith('.md') : true))
      .filter((e) => plain(e.name).startsWith(word))
      .map((e) => ({ label: e.kind === 'dir' && e.name !== '..' && e.name !== '~' ? `${e.name}/` : e.name, value: `${cmd} ${dirPart}${e.name}`, run: true }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, cwd, posts]);

  useEffect(() => { setSel(-1); }, [input]);

  const apply = (i: number, andRun: boolean) => {
    const s = suggestions[i];
    if (!s) return;
    if (andRun && s.run) run(s.value.trim());
    else { setInput(s.value); setSel(-1); }
    inputRef.current?.focus();
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab') { e.preventDefault(); apply(sel >= 0 ? sel : 0, false); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); if (suggestions.length) setSel((s) => Math.min(suggestions.length - 1, s + 1)); }
    else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (sel >= 0) setSel((s) => s - 1);
      else if (history.length) { const i = histIdx < 0 ? history.length - 1 : Math.max(0, histIdx - 1); setHistIdx(i); setInput(history[i]); }
    }
    else if (e.key === 'Enter') { e.preventDefault(); if (sel >= 0) apply(sel, true); else run(input); }
    else if (e.key === 'l' && e.ctrlKey) { e.preventDefault(); setLines([]); }
    else if (e.key === 'c' && e.ctrlKey && !window.getSelection()?.toString()) { e.preventDefault(); push(<>{prompt(cwd)}{input}^C</>); setInput(''); }
  };

  return (
    <>
      <div className="term-backdrop" onClick={onClose} />
      <div className="term" role="dialog" aria-modal="true" aria-label="Terminal">
        <div className="term-bar">
          <span className="dots" aria-hidden="true"><i /><i /><i /></span>
          <span className="title">{USER}@{HOST}: {display(cwd)}</span>
          <kbd onClick={onClose}>esc</kbd>
        </div>
        <div className="term-body" ref={bodyRef} onClick={() => inputRef.current?.focus()}>
          {lines.map((l) => <pre className="term-line" key={l.id}>{l.node}</pre>)}
          <pre className="term-line">
            {prompt(cwd)}
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="off"
              aria-label="Command"
            />
          </pre>
        </div>
        {suggestions.length > 0 && (
          <ul className="term-sugg" role="listbox">
            <li className="hint">{input.includes(' ') ? 'tab to complete · enter to run' : 'commands'}</li>
            {suggestions.map((s, i) => (
              <li key={s.value} role="option" aria-selected={i === sel} className={i === sel ? 'is-active' : ''} onMouseEnter={() => setSel(i)} onMouseDown={(e) => { e.preventDefault(); apply(i, true); }}>
                {s.label}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
