/**
 * The five fake vulnerabilities of the hidden mini-CTF.
 *
 * Flag secrecy, honestly stated: everything ships in the client bundle, so
 * the flags cannot be truly secret. We store sha256 hashes and assemble each
 * flag at runtime from word parts ('flag{' + parts.join('_') + '}'), then
 * verify the assembled string against its hash before showing it. That
 * defeats a 30-second grep of the source for the flag prefix, not a
 * determined reverser.
 * That tradeoff is intentional: the game is meant to be played, not guarded.
 */

export type VulnId = 'recon' | 'sqli' | 'traversal' | 'idor' | 'xss';

/** Kill-chain order. The counter, scoreboard and hints all follow this. */
export const VULN_IDS: readonly VulnId[] = ['recon', 'sqli', 'traversal', 'idor', 'xss'];

export const TOTAL_VULNS = VULN_IDS.length;

export const isVulnId = (v: unknown): v is VulnId => typeof v === 'string' && (VULN_IDS as readonly string[]).includes(v);

interface FlagDef {
  /** Words of the flag body, joined with '_' at runtime. */
  parts: readonly string[];
  /** sha256 of the full `flag{...}` string, hex. */
  sha256: string;
}

const FLAGS: Record<VulnId, FlagDef> = {
  recon: {
    parts: ['recon', 'is', 'a', 'vuln', 'too'],
    sha256: '27b97bca8ec3ae672f2f4814eafcfb9e0c61739ccbb1a43d89a2924fc025864a',
  },
  sqli: {
    parts: ['or', 'one', 'equals', 'one'],
    sha256: 'fdeaa197c5704b66a336fa3ef1ff1dd30e0a1442fd5e61428b6d5cace6a41837',
  },
  traversal: {
    parts: ['traversal', 'to', 'the', 'root'],
    sha256: 'a4c23232a0e76a467032c81ef459cbd2a09c702871e1811487d29248abb2211b',
  },
  idor: {
    parts: ['just', 'increment', 'the', 'id'],
    sha256: 'bdafef1c89b5c91fad562b3df34ed96418ecb5479c8c4dafaeb0da5f968d4ae9',
  },
  xss: {
    parts: ['reflected', 'but', 'never', 'real'],
    sha256: 'f71b433202ec5d42ff9d4a084a905f4e19fc050ce9d53fe1b078fb2d2a36e3b5',
  },
};

// Built this way (not as a plain literal) so the minifier cannot constant-fold
// the prefix back into a grep-able "flag{" in the production bundle.
const PREFIX = ['f', 'l', 'a', 'g'].join('') + String.fromCharCode(123);
const SUFFIX = String.fromCharCode(125);
const assemble = (id: VulnId) => PREFIX + FLAGS[id].parts.join('_') + SUFFIX;

async function sha256Hex(text: string): Promise<string | null> {
  try {
    if (!globalThis.crypto?.subtle) return null; // plain http on a LAN address: no SubtleCrypto
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return null;
  }
}

const cache = new Map<VulnId, Promise<string>>();

/**
 * Assembles the flag for a vuln and checks it against the stored hash.
 * Resolves to the flag string, or to a visible integrity error if the parts
 * and hash ever drift apart. When SubtleCrypto is unavailable the check is
 * skipped rather than blocking the game.
 */
export function revealFlag(id: VulnId): Promise<string> {
  let p = cache.get(id);
  if (!p) {
    p = (async () => {
      const flag = assemble(id);
      const hash = await sha256Hex(flag);
      if (hash !== null && hash !== FLAGS[id].sha256) return PREFIX + 'integrity_check_failed' + SUFFIX;
      return flag;
    })();
    cache.set(id, p);
  }
  return p;
}
