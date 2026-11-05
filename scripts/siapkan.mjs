/* Dijalankan otomatis sebelum `npm start`.
   Kalau node_modules belum ada, instal dulu supaya `npm start` langsung jalan. */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const [major] = process.versions.node.split('.').map(Number);
if (major < 18) {
  console.error(`\nNode.js ${process.versions.node} terlalu lama. Pasang Node.js 18 atau lebih baru dari https://nodejs.org lalu coba lagi.\n`);
  process.exit(1);
}

if (!existsSync('node_modules/.bin') || !existsSync('node_modules/vite')) {
  console.log('\nPertama kali dijalankan: memasang paket, tunggu sebentar...\n');
  const r = spawnSync('npm', ['install'], { stdio: 'inherit', shell: true });
  if (r.status !== 0) process.exit(r.status ?? 1);
}
