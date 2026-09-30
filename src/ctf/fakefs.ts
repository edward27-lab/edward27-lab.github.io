/**
 * Fake file contents and records for the legacy admin panel. All of this is
 * fiction rendered as plain text. Server-flavoured text stays in English on
 * purpose: real servers do not localise their error messages.
 */

export const ROBOTS_TXT = [
  'User-agent: *',
  'Disallow: /admin',
  '# TODO(edward): decommission the old panel before launch',
].join('\n');

/** Files the File Manager admits to having. */
export const KNOWN_FILES: Record<string, string> = {
  'welcome.txt': [
    'Welcome to the intranet file share.',
    '',
    'Upload policy: no files larger than 2 MB (floppy compatible).',
    'Questions -> ext. 204.',
    '',
    'Last updated: 14/03/2004',
  ].join('\n'),
  'notes.txt': [
    '- rotate the admin password (still the default, oops)',
    '- move config out of the webroot. the file viewer takes any path,',
    '  including ../ ones, so maybe fix that first',
    '- ask dave why backup_2019.zip is in the share',
  ].join('\n'),
  'backup_2019.zip': [
    'PK\u0003\u0004\u0014\u0000\u0000\u0000\u0008\u0000 [binary data: 1,203,411 bytes]',
    '',
    '(preview unavailable: download disabled by policy)',
  ].join('\n'),
};

/** The fake /etc/passwd, with the flag as the last user. */
export const passwdFile = (flag: string) => [
  'root:x:0:0:root:/root:/bin/bash',
  'daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin',
  'bin:x:2:2:bin:/bin:/usr/sbin/nologin',
  'sys:x:3:3:sys:/dev:/usr/sbin/nologin',
  'www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin',
  'mysql:x:104:110:MySQL Server,,,:/nonexistent:/bin/false',
  'dave:x:1000:1000:Dave,,,:/home/dave:/bin/bash',
  '# users db lives at /admin/panel/users — ids start at 1',
  `flag:x:0:0:${flag}:/root:/bin/bash`,
].join('\n');

export interface UserRecord {
  id: number;
  username: string;
  role: string;
  email: string;
  lastLogin: string;
  note: string;
}

export const DECOY_USER_ID = 2;

export const userRecord = (id: number, flag: string): UserRecord | null => {
  if (id === 1 || id === 0) {
    return {
      id: 1,
      username: 'admin',
      role: 'administrator',
      email: 'admin@localhost',
      lastLogin: '2019-11-02 03:14:07',
      note: `api_key=${flag}\nnote to self: the guestbook still reflects input. fix later.`,
    };
  }
  if (id === DECOY_USER_ID) {
    return {
      id: 2,
      username: 'guest_analyst',
      role: 'viewer',
      email: 'guest@localhost',
      lastLogin: '2019-10-28 09:41:22',
      note: 'read-only account for the quarterly review.',
    };
  }
  return null;
};

export interface GuestbookEntry { name: string; message: string; at: string }

export const SEED_GUESTBOOK: GuestbookEntry[] = [
  { name: 'dave', message: 'first!!! great intranet', at: '2004-03-14 11:02' },
  { name: 'reception', message: 'the printer on level 2 is out of toner again', at: '2004-06-01 08:15' },
];
