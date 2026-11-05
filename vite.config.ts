import { rmSync } from 'node:fs';
import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

/* Folder Asset ikut tersalin ke dist, jadi foto asli dibuang setelah build
   supaya tidak ikut online. Website hanya memakai marwanto-cutout.webp. */
const buangFotoAsli = (): Plugin => ({
  name: 'buang-foto-asli',
  apply: 'build',
  closeBundle() {
    rmSync(resolve('dist', 'Latar_biru.jpeg'), { force: true });
  },
});

/* Folder Asset dipakai sebagai folder publik, jadi foto dan font tetap di tempatnya. */
export default defineConfig({
  plugins: [react(), buangFotoAsli()],
  publicDir: 'Asset',
  base: './',
  server: { port: 5173 },
});
