import { l, type L, type Lang } from '../i18n/l.ts';
import { DICT } from '../i18n/strings.ts';

export interface Role {
  id: string;
  org: string;
  title: L;
  place: L;
  kind: 'security' | 'education' | 'work';
  start: string;        // YYYY-MM
  end: string | null;   // YYYY-MM, null = present
  bullets: L[];
  tags: string[];
}

export const roles: Role[] = [
  {
    id: 'hacktrace',
    org: 'Hacktrace',
    title: l('Penetration Tester (Internship)', 'Penetration Tester (Magang)'),
    place: l('Remote', 'Remote'),
    kind: 'security',
    start: '2026-06',
    end: null,
    bullets: [
      l('Writing detailed walkthroughs and technical documentation for penetration testing lab exercises.', 'Menulis walkthrough terperinci dan dokumentasi teknis untuk latihan lab penetration testing.'),
      l('Learning lab creation and infrastructure setup for cybersecurity training environments.', 'Mempelajari pembuatan lab dan penyiapan infrastruktur untuk lingkungan pelatihan keamanan siber.'),
      l('Presenting monthly technical material assigned by mentor to the internship cohort.', 'Mempresentasikan materi teknis bulanan yang ditugaskan mentor kepada angkatan magang.'),
      l('Completing mandatory technical assessments at the conclusion of the internship program.', 'Menyelesaikan asesmen teknis wajib di akhir program magang.'),
      l('Writing penetration testing reports documenting methodology, findings and remediation steps for lab environments.', 'Menulis laporan penetration testing yang mendokumentasikan metodologi, temuan, dan langkah remediasi untuk lingkungan lab.'),
    ],
    tags: ['pentest', 'reporting', 'labs'],
  },
  {
    id: 'monash',
    org: 'Monash University',
    title: l('Bachelor of IT — Cybersecurity', 'Bachelor of IT — Cybersecurity'),
    place: l('Victoria', 'Victoria'),
    kind: 'education',
    start: '2025-02',
    end: '2026-12',
    bullets: [
      l('Selected as Peer Mentor for MCD4700 (Computer Systems, Networks and Security) on top-tier academic performance and lecturer recommendation.', 'Dipilih sebagai Peer Mentor untuk MCD4700 (Computer Systems, Networks and Security) atas prestasi akademik tertinggi dan rekomendasi dosen.'),
      l('FIT3047 industry project: led the cybersecurity team testing a real client-facing web application.', 'Proyek industri FIT3047: memimpin tim keamanan siber yang menguji aplikasi web nyata untuk klien.'),
    ],
    tags: ['degree', 'mentor'],
  },
  {
    id: 'mcdonalds',
    org: "McDonald's",
    title: l('Kitchen Leader, Crew Coach (Part-time)', 'Kitchen Leader, Crew Coach (Paruh waktu)'),
    place: l('Australia', 'Australia'),
    kind: 'work',
    start: '2024-10',
    end: '2026-06',
    bullets: [
      l('Leads in food preparation and kitchen cleanliness.', 'Memimpin persiapan makanan dan kebersihan dapur.'),
      l('Maintains hygiene and food safety standards.', 'Menjaga standar higiene dan keamanan pangan.'),
      l('Trains new crew members.', 'Melatih anggota kru baru.'),
      l("Awarded a special recognition pin directly from McDonald's CEO during a flagship store visit.", "Dianugerahi pin penghargaan khusus langsung dari CEO McDonald's saat kunjungan ke flagship store."),
    ],
    tags: ['leadership', 'training'],
  },
  {
    id: 'cyberwolves',
    org: 'Hacktrace Cyberwolves Academy',
    title: l('Cybersecurity Red Team Bootcamp', 'Bootcamp Red Team Keamanan Siber'),
    place: l('Online, Indonesia', 'Daring, Indonesia'),
    kind: 'security',
    start: '2025-01',
    end: '2025-03',
    bullets: [
      l('Completed an intensive two-phase, full-time (9AM–5PM) cybersecurity bootcamp with hands-on training.', 'Menyelesaikan bootcamp keamanan siber intensif dua fase, penuh waktu (09.00–17.00) dengan pelatihan praktik langsung.'),
      l('One of 4 out of 20 participants to successfully complete the program.', 'Salah satu dari 4 dari 20 peserta yang berhasil menyelesaikan program.'),
      l('Learned the tools and skills required to test the security of a web server and an Android mobile app.', 'Mempelajari tool dan keterampilan untuk menguji keamanan web server dan aplikasi mobile Android.'),
      l('Conducted penetration testing on web and mobile applications within two days.', 'Melakukan penetration testing pada aplikasi web dan mobile dalam dua hari.'),
      l('Prepared a detailed report and presentation on findings and recommendations within one day.', 'Menyusun laporan dan presentasi terperinci tentang temuan dan rekomendasi dalam satu hari.'),
      l('Developed skills in vulnerability assessment, exploit development, reporting and cybersecurity presentations.', 'Mengembangkan keterampilan vulnerability assessment, exploit development, pelaporan, dan presentasi keamanan siber.'),
    ],
    tags: ['red team', 'web', 'android'],
  },
  {
    id: 'monash-college',
    org: 'Monash College',
    title: l('Diploma of Information Technology', 'Diploma of Information Technology'),
    place: l('Victoria', 'Victoria'),
    kind: 'education',
    start: '2024-02',
    end: '2024-11',
    bullets: [l('Diploma of Information Technology · Technology.', 'Diploma of Information Technology · Teknologi.')],
    tags: ['diploma'],
  },
  {
    id: 'spentera',
    org: 'PT Spentera',
    title: l('Penetration Tester Intern', 'Penetration Tester Magang'),
    place: l('South Jakarta, Indonesia', 'Jakarta Selatan, Indonesia'),
    kind: 'security',
    start: '2023-10',
    end: '2023-12',
    bullets: [
      l('Hands-on experience in cybersecurity labs and case studies relevant to real-world consulting scenarios.', 'Pengalaman langsung di lab keamanan siber dan studi kasus yang relevan dengan skenario konsultasi nyata.'),
      l('Participated in weekly meetings, observing project updates, security assessments and client report discussions.', 'Mengikuti rapat mingguan, mengamati pembaruan proyek, asesmen keamanan, dan diskusi laporan klien.'),
      l('Developed a deeper understanding of cybersecurity consulting processes, risk analysis and security solutions.', 'Memperdalam pemahaman tentang proses konsultasi keamanan siber, analisis risiko, dan solusi keamanan.'),
      l('Enhanced skills in threat analysis, security research and report evaluation.', 'Meningkatkan keterampilan analisis ancaman, riset keamanan, dan evaluasi laporan.'),
    ],
    tags: ['consulting', 'research'],
  },
];

/** First month on the timeline (YYYY-MM). */
export const TIMELINE_START = '2023-10';

export function monthIndex(ym: string, start = TIMELINE_START) {
  const [y0, m0] = start.split('-').map(Number);
  const [y, m] = ym.split('-').map(Number);
  return (y - y0) * 12 + (m - m0);
}

export function currentYM() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** "Jan 2026" / "January 2026" in the given language. */
export function formatYM(ym: string, style: 'short' | 'long' = 'short', lang: Lang = 'en') {
  const [y, m] = ym.split('-').map(Number);
  return `${DICT[lang].common.months[style][m - 1]} ${y}`;
}

/** Just the long month name, e.g. "January" / "Januari". */
export function formatMonth(ym: string, lang: Lang = 'en') {
  return DICT[lang].common.months.long[Number(ym.slice(5, 7)) - 1];
}

export function ymFromIndex(i: number, start = TIMELINE_START) {
  const [y0, m0] = start.split('-').map(Number);
  const total = (m0 - 1) + i;
  const y = y0 + Math.floor(total / 12);
  const m = (total % 12) + 1;
  return `${y}-${String(m).padStart(2, '0')}`;
}
