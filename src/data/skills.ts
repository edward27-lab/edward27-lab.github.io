import { l, type L } from '../i18n/l.ts';

export type Level = 'expert' | 'proficient' | 'intermediate' | 'basic';

export interface SkillGroup {
  id: string;
  name: L;
  /** Shorter name for the constellation label when the full one does not fit. */
  short?: L;
  level: Level;
  tools: string[];
  skills: L[];
  /** normalised layout position of the constellation hub (0..1) */
  x: number;
  y: number;
}

export const LEVELS: Record<Level, { label: L; weight: number }> = {
  expert: { label: l('Expert', 'Ahli'), weight: 1 },
  proficient: { label: l('Proficient', 'Mahir'), weight: 0.75 },
  intermediate: { label: l('Intermediate', 'Menengah'), weight: 0.5 },
  basic: { label: l('Basic', 'Dasar'), weight: 0.3 },
};

export const skillGroups: SkillGroup[] = [
  {
    id: 'web',
    name: l('Web Application Security Testing', 'Pengujian Keamanan Aplikasi Web'),
    short: l('Web Security Testing', 'Keamanan Aplikasi Web'),
    level: 'expert',
    tools: ['Burp Suite', 'Dirsearch', 'dirb', 'OWASP ZAP'],
    skills: [
      l('SQL injection', 'SQL injection'),
      l('XSS', 'XSS'),
      l('Access control testing', 'Pengujian access control'),
      l('Session management analysis', 'Analisis session management'),
      l('MITRE ATT&CK', 'MITRE ATT&CK'),
      l('OWASP-based exploitation', 'Eksploitasi berbasis OWASP'),
    ],
    x: 0.30, y: 0.30,
  },
  {
    id: 'network',
    name: l('Network Penetration Testing', 'Penetration Testing Jaringan'),
    short: l('Network Testing', 'Pentest Jaringan'),
    level: 'expert',
    tools: ['Nmap', 'Wireshark', 'Metasploit'],
    skills: [
      l('Network enumeration', 'Enumerasi jaringan'),
      l('Active Directory privilege escalation', 'Eskalasi privilese Active Directory'),
      l('Internal network and domain exploitation', 'Eksploitasi jaringan internal dan domain'),
      l('Reconnaissance', 'Reconnaissance'),
    ],
    x: 0.66, y: 0.24,
  },
  {
    id: 'bash',
    name: l('Bash Scripting', 'Bash Scripting'),
    level: 'expert',
    tools: ['Kali Linux', 'Windows'],
    skills: [
      l('Automation', 'Otomatisasi'),
      l('Custom tooling for targets the standard approach does not fit', 'Tooling kustom untuk target yang tidak cocok dengan pendekatan standar'),
    ],
    x: 0.14, y: 0.62,
  },
  {
    id: 'reporting',
    name: l('Presentation and Reporting', 'Presentasi dan Pelaporan'),
    level: 'expert',
    tools: ['PowerPoint', 'Excel'],
    skills: [
      l('Presenting fluency', 'Kelancaran presentasi'),
      l('Report formatting', 'Penyusunan format laporan'),
      l('MITRE ATT&CK-based findings mapping', 'Pemetaan temuan berbasis MITRE ATT&CK'),
      l('Plain-language risk translation', 'Penerjemahan risiko ke bahasa awam'),
    ],
    x: 0.50, y: 0.56,
  },
  {
    id: 'infra',
    name: l('Networking and Infrastructure', 'Jaringan dan Infrastruktur'),
    level: 'proficient',
    tools: ['GNS3', 'MikroTik', 'Docker', 'Cisco Packet Tracer'],
    skills: [
      l('VLAN configuration', 'Konfigurasi VLAN'),
      l('BGP routing', 'Routing BGP'),
      l('IPsec VPN', 'IPsec VPN'),
      l('Network design', 'Desain jaringan'),
      l('Virtualised lab environments', 'Lingkungan lab tervirtualisasi'),
    ],
    x: 0.84, y: 0.58,
  },
  {
    id: 'mobile',
    name: l('Mobile Security Analysis', 'Analisis Keamanan Mobile'),
    level: 'proficient',
    tools: ['JADX-GUI', 'MobSF', 'Burp Suite', 'ADB', 'Frida'],
    skills: [
      l('APK reverse engineering', 'Reverse engineering APK'),
      l('Static and dynamic analysis', 'Analisis statis dan dinamis'),
      l('Traffic interception', 'Intersepsi trafik'),
      l('Insecure storage and weak auth assessment', 'Asesmen penyimpanan tidak aman dan autentikasi lemah'),
    ],
    x: 0.30, y: 0.84,
  },
  {
    id: 'programming',
    name: l('Programming Languages', 'Bahasa Pemrograman'),
    level: 'intermediate',
    tools: ['Python', 'C++', 'HTML', 'MARIE', 'Kotlin'],
    skills: [
      l('Kotlin for mobile apps', 'Kotlin untuk aplikasi mobile'),
      l('Scripting and tooling', 'Scripting dan tooling'),
    ],
    x: 0.68, y: 0.84,
  },
];

export const misc: L[] = [
  l('Rank 63 in Hacktrace-Ranges offensive security labs.', 'Peringkat 63 di lab offensive security Hacktrace-Ranges.'),
  l('Preparing for CompTIA PenTest+ (PT0-003).', 'Mempersiapkan CompTIA PenTest+ (PT0-003).'),
  l(
    'Peer Mentor for MCD4700 (Computer Systems, Networks, and Security) — lecturer recommendation, top-tier results.',
    'Peer Mentor untuk MCD4700 (Computer Systems, Networks, and Security) — rekomendasi dosen, hasil akademik tertinggi.',
  ),
  l(
    "Special recognition pin from McDonald's CEO for kitchen standards during a flagship-store visit.",
    "Pin penghargaan khusus dari CEO McDonald's atas standar dapur saat kunjungan ke flagship store.",
  ),
];
