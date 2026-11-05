/* ==========================================================================
   portfolio.ts — SEMUA ISI WEBSITE ADA DI SINI. Mau ganti teks? Edit file ini.

   Yang paling perlu lu isi: bagian `links`.
   Link yang kosong otomatis tidak ditampilkan di halaman.
   ========================================================================== */
import type { Lang } from '../core/world';
import type { SpeciesName } from '../flora/flora';

export type LayerId = 'mencuat' | 'kanopi' | 'tajuk' | 'lantai' | 'akar' | 'gambut';
type T = Record<Lang, string>;

export interface Project {
  title: string;
  repo: string;
  species: SpeciesName;
  seed: number;
  latin: string;
  common: T;
  stack: string[];
  desc: T;
  points: Record<Lang, string[]>;
  why: T;
  /** dipakai di Catatan Lapangan */
  notes: { label: T; value: T }[];
}

export const site = {
  name: 'Marwanto Asnan',
  nameLines: ['Marwanto', 'Asnan'],
  initials: 'MA',
  links: {
    github: 'https://github.com/MarwCode',
    email: '', // contoh: 'nama@gmail.com'
    linkedin: '', // contoh: 'https://www.linkedin.com/in/nama'
    instagram: '', // contoh: 'https://instagram.com/nama'
    cv: '', // contoh: 'CV-Marwanto.pdf' (taruh file-nya di folder Asset)
  },
};

export const layers: { id: LayerId; alt: number; light: number; name: T }[] = [
  { id: 'mencuat', alt: 45, light: 100, name: { id: 'Pohon Mencuat', en: 'Emergent Layer' } },
  { id: 'kanopi', alt: 30, light: 35, name: { id: 'Kanopi', en: 'Canopy' } },
  { id: 'tajuk', alt: 12, light: 8, name: { id: 'Bawah Tajuk', en: 'Understory' } },
  { id: 'lantai', alt: 2, light: 2, name: { id: 'Lantai Hutan', en: 'Forest Floor' } },
  { id: 'akar', alt: 0, light: 0, name: { id: 'Zona Akar', en: 'Root Zone' } },
  { id: 'gambut', alt: -6, light: 0, name: { id: 'Gambut', en: 'Peat' } },
];

export const ui = {
  id: {
    skip: 'Lompat ke isi',
    loading: 'menumbuhkan hutan',
    light: 'cahaya',
    langLabel: 'Ganti bahasa ke English',
    navLabel: 'Lapisan hutan',
    soundOn: 'Suara hutan menyala',
    soundOff: 'Suara hutan mati',

    heroEyebrow: 'Mahasiswa Teknik Informatika · Politeknik Caltex Riau',
    heroLine: 'Saya menanam kode, lalu merawatnya sampai bisa dipakai orang.',
    heroScroll: 'Scroll untuk turun ke hutan',
    heroHint: 'Seret satwanya, ayun akarnya, geser mataharinya',
    heroHintTouch: 'Seret satwanya, geser mataharinya',
    sunLabel: 'Geser untuk mengubah waktu',

    aboutTitle: 'Yang merawat hutan ini.',
    aboutP1: 'Saya Marwanto, mahasiswa Teknik Informatika di Politeknik Caltex Riau, kelas 3 TI C. Saya paling senang dengan proyek yang hasilnya bisa dipakai: aplikasi Android untuk mencatat tanaman, peta banjir Riau, sampai teman AI yang bisa diajak mengobrol.',
    aboutP2: 'Setiap proyek di sini berawal dari tugas kuliah atau rasa penasaran. Sebagian sudah selesai, sebagian masih tumbuh.',
    labelHead: 'Herbarium · Spesimen No. 001',
    labelName: 'Nama',
    labelFamily: 'Famili',
    labelFamilyV: 'Teknik Informatika',
    labelHabitat: 'Habitat',
    labelHabitatV: 'Politeknik Caltex Riau, Riau',
    labelClass: 'Kelas',
    labelStatus: 'Status',
    labelStatusV: 'Sedang tumbuh',
    labelDrag: 'Label ini bisa diseret',

    workTitle: 'Lima spesimen.',
    workP: 'Setiap proyek saya pasangkan dengan tanaman yang sifatnya mirip. Terus scroll, tanamannya tumbuh sendiri. Seret tanamannya untuk memutar waktu.',
    workRepo: 'Lihat repo',
    workNotes: 'Catatan lapangan',
    workPlate: 'Plat',
    notesTitle: 'Catatan lapangan',
    notesClose: 'Tutup',
    notesPrev: 'Spesimen sebelumnya',
    notesNext: 'Spesimen berikutnya',
    notesWhy: 'Kenapa tanaman ini',
    notesStack: 'Akar teknologi',
    notesFeatures: 'Yang bisa dilakukan',

    floorTitle: 'Yang sedang tumbuh.',
    floorFact: 'Hanya sekitar 2% cahaya matahari yang sampai ke lantai hutan. Di sini semuanya mulai dari kecil.',
    floorP: 'Teman AI saya kembangkan bertahap. Yang sudah berdaun sudah jalan, yang masih benih adalah rencana berikutnya.',
    floorStage: 'Tahap',
    floorDone: 'Sudah jalan',
    floorNext: 'Masih benih',
    floorSeed: 'Belum waktunya tumbuh',
    plotTitle: 'Giliran kamu menanam.',
    plotHint: 'Klik di mana saja di area ini, lalu klik gajahnya untuk menyiram.',
    plotHintTouch: 'Ketuk di mana saja di area ini, lalu ketuk gajahnya untuk menyiram.',
    plotCount: 'tanaman kamu',
    plotBloom: 'mekar',

    rootsTitle: 'Yang menghidupi semuanya.',
    rootsP: 'Proyek ada di atas, teknologinya di bawah tanah. Arahkan kursor untuk melihat akarnya, atau tarik label teknologinya.',
    rootsPTouch: 'Proyek ada di atas, teknologinya di bawah tanah. Ketuk salah satunya untuk melihat akarnya.',

    peatTitle: 'Sudah sampai dasar.',
    peatP: 'Kalau kamu sampai sini, berarti hutannya cukup menarik. Mau ngobrol soal proyek atau kerja bareng? Saya ada di sini.',
    peatUp: 'Naik lagi ke kanopi',
    peatFoot: 'Semua tanaman dan satwa di halaman ini digambar oleh kode.',

    journal: 'Buku Fauna',
    journalIntro: 'Sentuh satwa di setiap lapisan untuk mencatatnya.',
    journalUnknown: 'Belum ditemukan',
    journalGo: 'Pergi ke lapisan ini',
    journalDone: 'Semua satwa tercatat. Ada bunga langka yang mekar di lapisan paling bawah.',
    journalClose: 'Tutup buku fauna',
    guardian: 'Kamu resmi jadi penjaga hutan ini.',
    rafflesia: 'Rafflesia, bunga langka Sumatera. Mekar karena kamu mengenal semua penghuni hutan.',
  },
  en: {
    skip: 'Skip to content',
    loading: 'growing the forest',
    light: 'light',
    langLabel: 'Switch language to Indonesian',
    navLabel: 'Forest layers',
    soundOn: 'Forest sound on',
    soundOff: 'Forest sound off',

    heroEyebrow: 'Informatics Engineering Student · Politeknik Caltex Riau',
    heroLine: 'I plant code and tend it until people can use it.',
    heroScroll: 'Scroll to descend into the forest',
    heroHint: 'Drag the animals, swing the vines, slide the sun',
    heroHintTouch: 'Drag the animals, slide the sun',
    sunLabel: 'Slide to change the time of day',

    aboutTitle: 'The one tending this forest.',
    aboutP1: "I'm Marwanto, an Informatics Engineering student at Politeknik Caltex Riau, class 3 TI C. I'm happiest on projects people can actually use: an Android app for logging plants, a flood map of Riau, even an AI companion you can talk to.",
    aboutP2: 'Every project here started as coursework or curiosity. Some are finished, some are still growing.',
    labelHead: 'Herbarium · Specimen No. 001',
    labelName: 'Name',
    labelFamily: 'Family',
    labelFamilyV: 'Informatics Engineering',
    labelHabitat: 'Habitat',
    labelHabitatV: 'Politeknik Caltex Riau, Riau',
    labelClass: 'Class',
    labelStatus: 'Status',
    labelStatusV: 'Still growing',
    labelDrag: 'You can drag this label',

    workTitle: 'Five specimens.',
    workP: 'Each project is paired with a plant that behaves like it. Keep scrolling and the plants grow on their own. Drag a plant to rewind time.',
    workRepo: 'View repo',
    workNotes: 'Field notes',
    workPlate: 'Plate',
    notesTitle: 'Field notes',
    notesClose: 'Close',
    notesPrev: 'Previous specimen',
    notesNext: 'Next specimen',
    notesWhy: 'Why this plant',
    notesStack: 'Technology roots',
    notesFeatures: 'What it does',

    floorTitle: 'Still growing.',
    floorFact: 'Only about 2% of sunlight reaches the forest floor. Everything down here starts small.',
    floorP: 'Teman AI is being built in stages. The ones with leaves already work, the seeds are what comes next.',
    floorStage: 'Stage',
    floorDone: 'Working',
    floorNext: 'Still a seed',
    floorSeed: 'Not time to sprout yet',
    plotTitle: 'Your turn to plant.',
    plotHint: 'Click anywhere in this area, then click the elephant to water.',
    plotHintTouch: 'Tap anywhere in this area, then tap the elephant to water.',
    plotCount: 'of your plants',
    plotBloom: 'in bloom',

    rootsTitle: 'What keeps it all alive.',
    rootsP: 'Projects stand above, their technology runs underground. Hover to trace the roots, or pull a technology label.',
    rootsPTouch: 'Projects stand above, their technology runs underground. Tap either one to trace its roots.',

    peatTitle: "You've reached the bottom.",
    peatP: "If you made it this far, the forest was worth exploring. Want to talk about a project or work together? I'm right here.",
    peatUp: 'Climb back to the canopy',
    peatFoot: 'Every plant and animal on this page was drawn by code.',

    journal: 'Field Guide',
    journalIntro: 'Touch the animals in each layer to record them.',
    journalUnknown: 'Not found yet',
    journalGo: 'Go to this layer',
    journalDone: 'Every animal is recorded. A rare flower has bloomed in the deepest layer.',
    journalClose: 'Close field guide',
    guardian: 'You are officially a guardian of this forest.',
    rafflesia: 'Rafflesia, a rare flower of Sumatra. It bloomed because you met everyone in the forest.',
  },
};

export type UiKey = keyof typeof ui.id;

export const projects: Project[] = [
  {
    title: 'Teman AI',
    repo: 'https://github.com/MarwCode/Teman_AI',
    species: 'kantong',
    seed: 11,
    latin: 'Nepenthes sp.',
    common: { id: 'Kantong semar', en: 'Pitcher plant' },
    stack: ['Python', 'Flask', 'Gemini API', 'JavaScript', 'WebGL2', 'Web Audio', 'HTML & CSS'],
    desc: {
      id: 'Teman AI lokal bernama Liliana. Karakter 2D yang bergerak seperti VTuber, mengerti bahasa gaul Indonesia, dan menjawab dengan suara.',
      en: 'A local AI companion named Liliana. A 2D character that moves like a VTuber, understands Indonesian slang, and talks back out loud.',
    },
    points: {
      id: ['8 ekspresi yang dipilih AI', 'Kepala dan mata mengikuti kursor', 'Rambut WebGL2 dengan fisika pegas', 'Gerak bibir mengikuti suara'],
      en: ['8 expressions chosen by the AI', 'Head and eyes follow the cursor', 'WebGL2 hair with spring physics', 'Lip sync driven by audio volume'],
    },
    why: {
      id: 'Kantong semar diam menunggu dengan mulut terbuka. Liliana juga begitu, sampai kamu mengajaknya bicara.',
      en: 'A pitcher plant waits quietly with its mouth open. So does Liliana, until you start talking.',
    },
    notes: [
      { label: { id: 'Berjalan di', en: 'Runs on' }, value: { id: 'Komputer sendiri, lewat server Flask lokal', en: 'Your own computer, on a local Flask server' } },
      { label: { id: 'Otak', en: 'Brain' }, value: { id: 'Google Gemini API', en: 'Google Gemini API' } },
      { label: { id: 'Suara', en: 'Voice' }, value: { id: 'Gemini TTS, cadangan edge-tts dan suara browser', en: 'Gemini TTS, with edge-tts and browser voice as fallbacks' } },
      { label: { id: 'Status', en: 'Status' }, value: { id: 'Tahap 2 selesai, mikrofon menyusul', en: 'Stage 2 done, microphone comes next' } },
    ],
  },
  {
    title: 'Project Mobile',
    repo: 'https://github.com/MarwCode/Project_Mobile',
    species: 'sirih',
    seed: 5,
    latin: 'Epipremnum aureum',
    common: { id: 'Sirih gading', en: 'Golden pothos' },
    stack: ['Kotlin', 'Android', 'Gradle'],
    desc: {
      id: 'Aplikasi mobile untuk mencatat tanaman. Proyek semester lima yang terbuka untuk dipakai siapa saja.',
      en: 'A mobile app for logging plants. A fifth-semester project, open for anyone to use.',
    },
    points: { id: [], en: [] },
    why: {
      id: 'Aplikasi pencatat tanaman, jadi pasangannya salah satu tanaman rumah paling umum.',
      en: 'An app for logging plants deserves one of the most common houseplants.',
    },
    notes: [
      { label: { id: 'Platform', en: 'Platform' }, value: { id: 'Android', en: 'Android' } },
      { label: { id: 'Dibuat saat', en: 'Built during' }, value: { id: 'Semester lima', en: 'Fifth semester' } },
    ],
  },
  {
    title: 'Sig-OpenLayers',
    repo: 'https://github.com/MarwCode/Sig-OpenLayers',
    species: 'sagu',
    seed: 21,
    latin: 'Metroxylon sagu',
    common: { id: 'Sagu', en: 'Sago palm' },
    stack: ['JavaScript', 'OpenLayers', 'Vite', 'HTML & CSS'],
    desc: {
      id: 'Peta web Riau: batas kabupaten, titik banjir beserta jumlah korban, dan titik survei lapangan lengkap dengan foto.',
      en: 'A web map of Riau: district boundaries, flood points with victim counts, and field survey points with photos.',
    },
    points: {
      id: ['Popup detail saat fitur diklik', 'Tiap layer bisa dinyalakan dan dimatikan', 'Wilayah tersorot saat di-hover'],
      en: ['Detail popup on click', 'Each layer can be toggled', 'Regions highlight on hover'],
    },
    why: {
      id: 'Sagu tumbuh di lahan basah, pas untuk peta banjir Riau.',
      en: 'Sago thrives in wetlands, a fitting partner for a flood map of Riau.',
    },
    notes: [
      { label: { id: 'Wilayah', en: 'Area' }, value: { id: 'Riau, sekitar 0,51° LU 101,44° BT', en: 'Riau, around 0.51° N 101.44° E' } },
      { label: { id: 'Peta dasar', en: 'Base map' }, value: { id: 'OpenStreetMap', en: 'OpenStreetMap' } },
      { label: { id: 'Layer', en: 'Layers' }, value: { id: 'Kabupaten, banjir, survei lapangan', en: 'Districts, floods, field surveys' } },
    ],
  },
  {
    title: 'Disposisi',
    repo: 'https://github.com/MarwCode/Disposisi',
    species: 'bambu',
    seed: 9,
    latin: 'Bambusa vulgaris',
    common: { id: 'Bambu', en: 'Bamboo' },
    stack: ['PHP', 'Laravel', 'MySQL', 'Vite'],
    desc: {
      id: 'Kerja kelompok bersama Kelompok 2. Aplikasi web berbasis Laravel dengan database MySQL 8.',
      en: 'Group work with Group 2. A Laravel web application on a MySQL 8 database.',
    },
    points: { id: [], en: [] },
    why: {
      id: 'Bambu tumbuh berumpun, tidak pernah sendirian. Persis seperti kerja kelompok.',
      en: 'Bamboo grows in clumps, never alone. Just like group work.',
    },
    notes: [
      { label: { id: 'Tim', en: 'Team' }, value: { id: 'Kelompok 2', en: 'Group 2' } },
      { label: { id: 'Jenis', en: 'Type' }, value: { id: 'Aplikasi web', en: 'Web application' } },
    ],
  },
  {
    title: 'Visualisasi Data',
    repo: 'https://github.com/MarwCode/VisualisasiData-StatistikaDeskriptif',
    species: 'paku',
    seed: 3,
    latin: 'Asplenium adiantum-nigrum',
    common: { id: 'Paku', en: 'Black spleenwort' },
    stack: ['Python', 'Jupyter'],
    desc: {
      id: 'Tugas Probabilitas dan Statistika: visualisasi data dan statistika deskriptif dengan Python di Jupyter Notebook.',
      en: 'A Probability and Statistics assignment: data visualization and descriptive statistics with Python in Jupyter Notebook.',
    },
    points: { id: [], en: [] },
    why: {
      id: 'Daun paku ini tersusun dari 40.000 titik hasil rumus fern Barnsley: data yang berbentuk daun.',
      en: 'This fern is made of 40,000 points from the Barnsley fern formula: data shaped like a leaf.',
    },
    notes: [
      { label: { id: 'Mata kuliah', en: 'Course' }, value: { id: 'Probabilitas dan Statistika', en: 'Probability and Statistics' } },
      { label: { id: 'Format', en: 'Format' }, value: { id: 'Jupyter Notebook', en: 'Jupyter Notebook' } },
    ],
  },
];

/* Urutan di sini = urutan label di bawah tanah. Git tersambung ke semua proyek. */
export const tech = ['Flask', 'Gemini API', 'WebGL2', 'Web Audio', 'Kotlin', 'Android', 'Gradle', 'HTML & CSS', 'JavaScript', 'OpenLayers', 'Git', 'Vite', 'Laravel', 'PHP', 'MySQL', 'Python', 'Jupyter'];
export const taproot = 'Git';

/* Tahap pengembangan Teman AI, sesuai README repo-nya */
export const nursery: { done: boolean; species?: SpeciesName; seed?: number; stage: string; label: T }[] = [
  { done: true, species: 'pakisKecil', seed: 2, stage: '0B', label: { id: 'Karakter VTuber', en: 'VTuber character' } },
  { done: true, species: 'tunas', seed: 8, stage: '1', label: { id: 'Chat', en: 'Chat' } },
  { done: true, species: 'pakisKecil', seed: 14, stage: '2', label: { id: 'Suara', en: 'Voice' } },
  { done: false, stage: '3', label: { id: 'Input mikrofon', en: 'Microphone input' } },
  { done: false, stage: '4', label: { id: 'Baca file, cari web, jalankan kode', en: 'Read files, search the web, run code' } },
  { done: false, stage: '5', label: { id: 'Aplikasi desktop Electron', en: 'Electron desktop app' } },
];
