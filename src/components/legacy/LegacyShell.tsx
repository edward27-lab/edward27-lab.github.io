import type { ReactNode } from 'react';
import { Link } from '../../lib/router.tsx';
import { VulnCounter } from '../VulnCounter.tsx';
import { useDocumentTitle } from '../../lib/hooks.ts';

/**
 * The "old app": a 2003-era intranet wrapper for every /admin page. It is
 * meant to clash with the rest of the site. Its chrome stays in English on
 * purpose (it is a different, unlocalised application). Everything inside
 * is scoped under `.legacy` so none of it leaks into the main design.
 */
export function LegacyShell({ title, children }: { title: string; children: ReactNode }) {
  useDocumentTitle(`${title} - phpAdmin 2.3`);
  return (
    <div className="legacy">
      <div className="legacy-banner" role="note">*** INTERNAL USE ONLY *** unauthorised access is logged and reported ***</div>
      <table className="legacy-frame" role="presentation">
        <tbody>
          <tr>
            <td className="legacy-head" colSpan={2}>
              <span className="legacy-logo">phpAdmin</span> <span className="legacy-ver">v2.3 intranet</span>
              <span className="legacy-head-right">
                <VulnCounter variant="legacy" /> · <Link to="/">back to the real site</Link>
              </span>
            </td>
          </tr>
          <tr>
            <td className="legacy-body" colSpan={2}>
              <h1 className="legacy-title">{title}</h1>
              {children}
            </td>
          </tr>
          <tr>
            <td className="legacy-foot" colSpan={2}>
              Powered by phpAdmin 2.3 · PHP/4.3.11 · MySQL 3.23 · best viewed in Internet Explorer 6 at 800x600
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
