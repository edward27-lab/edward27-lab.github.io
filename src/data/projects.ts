import { l, type L } from '../i18n/l.ts';

export interface Project {
  id: string;
  index: string;
  title: L;
  org: string;
  course: L;
  period: L;
  summary: L;
  bullets: L[];
  tags: string[];
  tools: string[];
  status?: L;
}

export const projects: Project[] = [
  {
    id: 'wellness-web-pentest',
    index: '01',
    title: l('Security Testing — Wellness Coaching Web App', 'Pengujian Keamanan — Aplikasi Web Wellness Coaching'),
    org: 'Monash University',
    course: l('FIT3047 Industry Experience Project', 'FIT3047 Industry Experience Project'),
    period: l('04/2026 — 05/2026', '04/2026 — 05/2026'),
    summary: l(
      'Led the cybersecurity team across two iterations for a real client-facing application: organised testing, delegated tasks and compiled the reports.',
      'Memimpin tim keamanan siber selama dua iterasi untuk aplikasi nyata yang dipakai klien: mengatur pengujian, mendelegasikan tugas, dan menyusun laporannya.',
    ),
    bullets: [
      l(
        'Led the cybersecurity team across two project iterations — organising security testing, delegating tasks and compiling security testing reports for a real client-facing web application.',
        'Memimpin tim keamanan siber selama dua iterasi proyek — mengatur pengujian keamanan, mendelegasikan tugas, dan menyusun laporan pengujian keamanan untuk aplikasi web nyata yang dipakai klien.',
      ),
      l(
        'Conducted penetration testing using tools such as Nmap and dirb, testing for SQL injection, XSS and directory exposure across login, contact, registration and booking pages.',
        'Melakukan penetration testing dengan tool seperti Nmap dan dirb, menguji SQL injection, XSS, dan directory exposure di halaman login, kontak, registrasi, dan booking.',
      ),
      l(
        'Discovered critical access control vulnerabilities, including admin and customer booking pages accessible without authentication, and session management flaws allowing access after logout.',
        'Menemukan kerentanan access control kritis, termasuk halaman booking admin dan pelanggan yang bisa diakses tanpa autentikasi, serta cacat session management yang memungkinkan akses setelah logout.',
      ),
      l(
        'Assessed the application against the Australian Privacy Principles (APP 1.1, APP 5, APP 6, APP 8), reviewing data collection practices and third-party service usage.',
        'Menilai aplikasi terhadap Australian Privacy Principles (APP 1.1, APP 5, APP 6, APP 8), meninjau praktik pengumpulan data dan penggunaan layanan pihak ketiga.',
      ),
      l(
        'Communicated technical findings and remediation recommendations to the product owner and development team, translating security risks into non-technical language.',
        'Mengomunikasikan temuan teknis dan rekomendasi remediasi kepada product owner dan tim pengembang, menerjemahkan risiko keamanan ke bahasa non-teknis.',
      ),
    ],
    tags: ['web', 'access-control', 'reporting', 'team-lead', 'privacy'],
    tools: ['Nmap', 'dirb', 'Burp Suite'],
  },
  {
    id: 'wellness-android',
    index: '02',
    title: l('Wellness Mobile Application', 'Aplikasi Mobile Wellness'),
    org: 'Monash University',
    course: l('FIT2081 Mobile Application Development', 'FIT2081 Mobile Application Development'),
    period: l('03/2025 — 06/2025', '03/2025 — 06/2025'),
    summary: l(
      'Solo Android build in Kotlin: calorie tracking, daily wellness insights, persistent health metrics, authentication and AI-generated coaching.',
      'Aplikasi Android yang dibangun sendiri dengan Kotlin: pelacakan kalori, insight wellness harian, metrik kesehatan persisten, autentikasi, dan coaching hasil AI.',
    ),
    bullets: [
      l(
        'Independently designed and developed a full Android mobile application from scratch using Android Studio and Kotlin as sole developer.',
        'Merancang dan mengembangkan sendiri aplikasi mobile Android lengkap dari nol dengan Android Studio dan Kotlin sebagai satu-satunya developer.',
      ),
      l(
        'Built core features including calorie tracking, daily wellness insights, persistent data storage for user health metrics and user authentication.',
        'Membangun fitur inti termasuk pelacakan kalori, insight wellness harian, penyimpanan data persisten untuk metrik kesehatan pengguna, dan autentikasi pengguna.',
      ),
      l(
        'Integrated an AI API to deliver personalised daily encouragement and coaching recommendations based on user data.',
        'Mengintegrasikan API AI untuk memberikan dorongan harian dan rekomendasi coaching yang dipersonalisasi berdasarkan data pengguna.',
      ),
    ],
    tags: ['android', 'kotlin', 'solo'],
    tools: ['Android Studio', 'Kotlin'],
  },
  {
    id: 'hacktrace-ranges',
    index: '03',
    title: l('Offensive Security Labs — Hacktrace Ranges', 'Lab Offensive Security — Hacktrace Ranges'),
    org: 'Hacktrace',
    course: l('Ongoing lab work', 'Latihan lab berkelanjutan'),
    period: l('2025 — present', '2025 — sekarang'),
    summary: l(
      'Continuous hands-on exploitation practice across web, network and Active Directory ranges. Currently rank 63.',
      'Latihan eksploitasi praktis berkelanjutan di range web, jaringan, dan Active Directory. Saat ini peringkat 63.',
    ),
    bullets: [
      l('Rank 63 on the Hacktrace-Ranges offensive security labs.', 'Peringkat 63 di lab offensive security Hacktrace-Ranges.'),
      l('Web application exploitation, internal network enumeration, Active Directory privilege escalation and reporting practice.', 'Latihan eksploitasi aplikasi web, enumerasi jaringan internal, eskalasi privilese Active Directory, dan pelaporan.'),
      l('Writeups for selected labs are published on the blog as they are cleared.', 'Writeup untuk lab pilihan dipublikasikan di blog begitu selesai.'),
    ],
    tags: ['labs', 'network', 'active-directory', 'web'],
    tools: ['Nmap', 'Metasploit', 'Burp Suite', 'Wireshark'],
    status: l('rank 63', 'peringkat 63'),
  },
];
