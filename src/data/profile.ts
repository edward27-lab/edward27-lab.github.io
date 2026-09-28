import { l, type L } from '../i18n/l.ts';

export interface Profile {
  name: string;
  handle: string;
  linkedin: string;
  /** Set to a file under /public (for example '/resume/Edward-Resume.pdf') to link the PDF directly. */
  resumePdf: string;
  role: L;
  location: L;
  status: L;
  rights: L;
  tagline: L;
  typewriter: L[];
  intro: L[];
  currently: { label: L; value: L }[];
  recognition: { title: L; body: L }[];
  languages: { name: L; level: 'fluent' | 'basic' }[];
}

export interface Education {
  id: string;
  school: string;
  place: L;
  degree: L;
  field: L;
  start: string;   // YYYY-MM
  end: string;     // YYYY-MM
  expected: boolean;
}

export const profile: Profile = {
  name: 'Edward',
  handle: 'Edward',
  linkedin: 'https://www.linkedin.com/in/edward-9910b7215/',
  resumePdf: '',
  role: l('Penetration tester', 'Penetration tester'),
  location: l('Melbourne, AU', 'Melbourne, Australia'),
  status: l('Available — graduating Dec 2026', 'Tersedia — lulus Des 2026'),
  rights: l('Full working rights · AU', 'Hak kerja penuh · AU'),
  tagline: l(
    'I break into web and mobile apps the way a real attacker would, then write it up so the people who own them can fix it.',
    'Saya membobol aplikasi web dan mobile seperti penyerang sungguhan, lalu menuliskannya agar pemiliknya bisa memperbaikinya.',
  ),
  typewriter: [
    l('web application penetration testing', 'penetration testing aplikasi web'),
    l('network enumeration and privilege escalation', 'enumerasi jaringan dan eskalasi privilese'),
    l('android app reverse engineering', 'reverse engineering aplikasi android'),
    l('reports that non-technical owners can act on', 'laporan yang bisa ditindaklanjuti pemilik non-teknis'),
  ],
  intro: [
    l(
      'I am a final-year Bachelor of IT (Cybersecurity) student at Monash University, graduating in December 2026. Right now I work as a penetration testing intern at Hacktrace in Melbourne.',
      'Saya mahasiswa tingkat akhir Bachelor of IT (Cybersecurity) di Monash University, lulus Desember 2026. Saat ini saya bekerja sebagai penetration testing intern di Hacktrace, Melbourne.',
    ),
    l(
      'My job is simple to explain. I try to break into web and mobile apps the way a real attacker would, then I write up exactly how I did it. The report matters as much as the hack. A finding nobody understands is a finding nobody fixes, so I write in plain language that a product owner or a business owner can actually act on.',
      'Pekerjaan saya mudah dijelaskan. Saya mencoba membobol aplikasi web dan mobile seperti penyerang sungguhan, lalu menuliskan persis bagaimana saya melakukannya. Laporannya sama pentingnya dengan peretasannya. Temuan yang tidak dipahami siapa pun adalah temuan yang tidak diperbaiki siapa pun, jadi saya menulis dalam bahasa sederhana yang bisa langsung ditindaklanjuti oleh product owner atau pemilik bisnis.',
    ),
    l(
      'Most of my hands-on work is offensive security. I test web applications, map networks and escalate privileges across internal systems, and pull apart Android apps to see what they leak. When the standard approach does not fit a target, I write my own scripts to get there.',
      'Sebagian besar pekerjaan langsung saya adalah offensive security. Saya menguji aplikasi web, memetakan jaringan dan mengeskalasi privilese di sistem internal, serta membongkar aplikasi Android untuk melihat apa yang bocor. Kalau pendekatan standar tidak cocok dengan target, saya menulis skrip sendiri untuk sampai ke sana.',
    ),
    l(
      "I also spent nearly two years at McDonald's as a kitchen leader and crew coach. That is where I learned to run a shift, train new people and hold a standard when things get busy. It is not a security job, but it taught me more about working under pressure than any lab ever did.",
      "Saya juga hampir dua tahun bekerja di McDonald's sebagai kitchen leader dan crew coach. Di sanalah saya belajar menjalankan shift, melatih orang baru, dan menjaga standar saat keadaan sibuk. Itu bukan pekerjaan keamanan, tapi mengajarkan saya lebih banyak soal bekerja di bawah tekanan daripada lab mana pun.",
    ),
    l(
      'Before Monash I completed a full-time red team bootcamp at Hacktrace Cyberwolves Academy in Indonesia. I was one of only 4 out of 20 people to finish it. I also interned at PT Spentera in South Jakarta. I am currently studying for the CompTIA PenTest+ certification.',
      'Sebelum Monash, saya menyelesaikan bootcamp red team penuh waktu di Hacktrace Cyberwolves Academy, Indonesia. Saya salah satu dari hanya 4 dari 20 peserta yang menyelesaikannya. Saya juga magang di PT Spentera, Jakarta Selatan. Saat ini saya sedang mempersiapkan sertifikasi CompTIA PenTest+.',
    ),
    l(
      'I speak English and Indonesian, and I have full working rights in Australia.',
      'Saya berbahasa Inggris dan Indonesia, dan memiliki hak kerja penuh di Australia.',
    ),
  ],
  currently: [
    { label: l('Cert', 'Sertifikasi'), value: l('Studying for CompTIA PenTest+ (PT0-003)', 'Mempersiapkan CompTIA PenTest+ (PT0-003)') },
    { label: l('Labs', 'Lab'), value: l('Hacktrace ranges — rank 63', 'Hacktrace ranges — peringkat 63') },
    { label: l('Role', 'Peran'), value: l('Pentest intern at Hacktrace, remote', 'Pentest intern di Hacktrace, remote') },
  ],
  recognition: [
    {
      title: l('Peer Mentor, MCD4700', 'Peer Mentor, MCD4700'),
      body: l(
        'Selected as Peer Mentor for MCD4700 (Computer Systems, Networks and Security) on top-tier academic performance and lecturer recommendation.',
        'Dipilih sebagai Peer Mentor untuk MCD4700 (Computer Systems, Networks and Security) atas prestasi akademik tertinggi dan rekomendasi dosen.',
      ),
    },
    {
      title: l('4 of 20', '4 dari 20'),
      body: l(
        'One of 4 out of 20 participants to complete the Hacktrace Cyberwolves Academy red team bootcamp, a two-phase, full-time 9-to-5 program.',
        'Salah satu dari 4 dari 20 peserta yang menyelesaikan bootcamp red team Hacktrace Cyberwolves Academy, program penuh waktu dua fase, 9-to-5.',
      ),
    },
    {
      title: l('CEO recognition pin', 'Pin penghargaan CEO'),
      body: l(
        "Awarded a special recognition pin directly from McDonald's CEO for kitchen standards and food quality during a flagship store visit.",
        "Dianugerahi pin penghargaan khusus langsung dari CEO McDonald's atas standar dapur dan kualitas makanan saat kunjungan ke flagship store.",
      ),
    },
  ],
  languages: [
    { name: l('English', 'Inggris'), level: 'fluent' },
    { name: l('Indonesian', 'Indonesia'), level: 'fluent' },
    { name: l('Mandarin', 'Mandarin'), level: 'basic' },
    { name: l('Hokkien', 'Hokkien'), level: 'basic' },
  ],
};

export const education: Education[] = [
  {
    id: 'monash',
    school: 'Monash University',
    place: l('Victoria', 'Victoria'),
    degree: l('Bachelor of IT — Cybersecurity', 'Bachelor of IT — Cybersecurity'),
    field: l('Technology and Cybersecurity', 'Teknologi dan Keamanan Siber'),
    start: '2025-02', end: '2026-12', expected: true,
  },
  {
    id: 'monash-college',
    school: 'Monash College',
    place: l('Victoria', 'Victoria'),
    degree: l('Diploma of Information Technology', 'Diploma of Information Technology'),
    field: l('Technology', 'Teknologi'),
    start: '2024-02', end: '2024-11', expected: false,
  },
  {
    id: 'cyberwolves',
    school: 'Hacktrace Cyberwolves Academy',
    place: l('full-time, Indonesia', 'penuh waktu, Indonesia'),
    degree: l('Red Team Bootcamp', 'Bootcamp Red Team'),
    field: l('Offensive security', 'Offensive security'),
    start: '2025-01', end: '2025-03', expected: false,
  },
];
