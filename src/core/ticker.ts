/* Satu rAF untuk seluruh website. Semua animasi mendaftar ke sini. */
export type Tick = (t: number, dt: number, raw: number) => void;

const subs = new Set<Tick>();
let last = 0;
let running = false;

function loop(ms: number) {
  const t = ms / 1000;
  const raw = last ? t - last : 0.016;
  const dt = Math.min(0.05, raw);
  last = t;
  subs.forEach((fn) => fn(t, dt, raw));
  requestAnimationFrame(loop);
}

export function onTick(fn: Tick): () => void {
  subs.add(fn);
  if (!running) {
    running = true;
    requestAnimationFrame(loop);
  }
  return () => {
    subs.delete(fn);
  };
}

/* Kondisi perangkat dipakai bersama semua komponen */
export const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const touch = matchMedia('(hover: none)').matches;
export const compact = (): boolean => innerWidth <= 760;
export const stacked = (): boolean => reduced || innerWidth <= 980;

/* Posisi kursor global dalam koordinat layar */
export const pointer = { x: null as number | null, y: null as number | null, vx: 0, vy: 0 };

addEventListener(
  'pointermove',
  (e) => {
    if (e.pointerType === 'touch') return;
    if (pointer.x != null && pointer.y != null) {
      pointer.vx = e.clientX - pointer.x;
      pointer.vy = e.clientY - pointer.y;
    }
    pointer.x = e.clientX;
    pointer.y = e.clientY;
  },
  { passive: true },
);

export const forestSeed = Math.floor(Math.random() * 1e6);
