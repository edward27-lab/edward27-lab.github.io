/**
 * Detection patterns for the mini-CTF. These reward the *class* of input
 * (a real injection attempt) rather than one exact string. Nothing here is
 * ever executed or rendered as markup; a match only triggers a simulated
 * outcome in the UI.
 */

/** URL-decode (up to twice, for double encoding), collapse whitespace, lower-case. */
export function normalize(input: string): string {
  let s = input;
  for (let i = 0; i < 2; i++) {
    try {
      const d = decodeURIComponent(s.replace(/\+/g, ' '));
      if (d === s) break;
      s = d;
    } catch {
      break;
    }
  }
  return s.replace(/\s+/g, ' ').trim().toLowerCase();
}

const SQLI: RegExp[] = [
  /['")]\s*(or|\|\|)\s*\(?\s*['"]?\s*\w+\s*['"]?\s*=\s*\(?\s*['"]?\s*\w+/, // ' or 1=1 · ' or '1'='1 · ') or ('1'='1
  /['")]\s*or\s+(true|\d)/,                                                 // ' or true · ' or 1
  /\w*['"]\s*(--|#|\/\*)/,                                                  // admin'-- · admin'#
  /\bunion\s+(all\s+)?select\b/,
  /['"]\s*;\s*(drop|select|insert|update|delete|shutdown)\b/,
  /\b(sleep|benchmark|pg_sleep|waitfor)\s*(\(|\s+delay)/,
  /\b1\s*=\s*1\s*(--|#|\/\*)/,
];

const XSS: RegExp[] = [
  /<\s*\/?\s*(script|img|svg|iframe|body|object|embed|video|audio|details|marquee|math)\b/,
  /\bon(error|load|click|mouseover|mouseenter|focus|input|toggle|start|pointerover)\s*=/,
  /javascript\s*:/,
  /<\s*[a-z][^>]*\son[a-z]+\s*=/,
  /\balert\s*\(/,
  /document\s*\.\s*cookie/,
  /<\s*a\b[^>]*href/,
];

const TRAVERSAL: RegExp[] = [
  /\.\.[\\/]/,                        // ../ or ..\
  /\.\.%2f/,                          // still encoded after two decodes
  /%2e%2e/,
  /\.{4}[\\/]{2}/,                    // ....//
  /^\/?etc\/(passwd|shadow|hosts)\b/, // absolute path straight to the file
  /\/etc\/(passwd|shadow)\b/,
];

const any = (set: RegExp[], s: string) => set.some((re) => re.test(s));

export const isSqli = (input: string) => any(SQLI, normalize(input));
export const isXss = (input: string) => any(XSS, normalize(input));
export const isTraversal = (input: string) => any(TRAVERSAL, normalize(input));

/** True when a (decoded) traversal payload points at the passwd file. */
export const targetsPasswd = (input: string) => /passwd/.test(normalize(input));
