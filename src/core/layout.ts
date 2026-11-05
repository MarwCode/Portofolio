/* Komponen mendaftar ke sini supaya dibangun ulang saat ukuran layar berubah.
   Prioritas kecil jalan lebih dulu. `light` berarti ikut dijalankan juga saat
   hanya tinggi teks yang berubah (ganti bahasa, font selesai dimuat). */
type Fn = () => void;
const fns: { p: number; fn: Fn; light: boolean }[] = [];

export function onLayout(fn: Fn, p = 5, light = false): () => void {
  const item = { p, fn, light };
  fns.push(item);
  fns.sort((a, b) => a.p - b.p);
  return () => {
    fns.splice(fns.indexOf(item), 1);
  };
}

export function runLayout(lightOnly = false): void {
  fns.forEach((f) => {
    if (!lightOnly || f.light) f.fn();
  });
}
