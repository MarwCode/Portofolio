/* ==========================================================================
   flora.ts — semua tanaman di website ini digambar oleh kode ini.
   Tidak ada file gambar daun: tiap kali dibuka, hutannya sedikit berbeda.

   1. Sprite daun berwarna (hutan di hero dan di sekitar foto)
   2. Foliage: lapisan daun yang bergoyang dan menyingkir dari kursor
   3. Specimen: tanaman "cyanotype" yang tumbuh bertahap
   ========================================================================== */
export const TAU = Math.PI * 2;
export const clamp = (v: number, a = 0, b = 1): number => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
export const ease = (t: number): number => 1 - Math.pow(1 - clamp(t), 3);

export interface Rng {
  (): number;
  range(a: number, b: number): number;
  pick<T>(arr: readonly T[]): T;
}

export function rng(seed: number): Rng {
  let s = seed >>> 0;
  const r = (() => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }) as Rng;
  r.range = (a, b) => a + (b - a) * r();
  r.pick = (arr) => arr[Math.floor(r() * arr.length)];
  return r;
}

const mk = (w: number, h: number): HTMLCanvasElement => {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w));
  c.height = Math.max(1, Math.ceil(h));
  return c;
};

type Ctx = CanvasRenderingContext2D;
export const ctx2d = (c: HTMLCanvasElement): Ctx => c.getContext('2d') as Ctx;
type Pt = [number, number];
interface Palette { a: string; b: string; c: string; d: string; vein: string; rib: string; rim: string }
export type PalName = 'haze' | 'lit' | 'mid' | 'deep' | 'ink';
export type LeafKind = 'pisang' | 'jendela' | 'keladi' | 'sagu' | 'pakis' | 'jahe';
export type SpriteKind = LeafKind | 'liana';
export interface Sprite { canvas: HTMLCanvasElement; px: number; py: number; L: number; kind: SpriteKind }
interface BladeOptions { veins?: number; sweep?: number; veinAlpha?: number; veinWidth?: number }

/* ---------- 1. PALET ---------- */
const PAL: Record<PalName, Palette> = {
  haze: { a: '#5f9384', b: '#467868', c: '#527f73', d: '#3c6a5e', vein: '#8fbcae', rib: '#a3cabb', rim: '#bfe0d2' },
  lit: { a: '#c6da55', b: '#74a63f', c: '#9cc04a', d: '#54893a', vein: '#e9f3a6', rib: '#f0f7b5', rim: '#fbfdd8' },
  mid: { a: '#5a9a52', b: '#27663f', c: '#3f8449', d: '#1b5238', vein: '#8cc47a', rib: '#a9d68c', rim: '#c8ea9f' },
  deep: { a: '#1a5742', b: '#0c3428', c: '#124334', d: '#092a21', vein: '#2f7a5e', rib: '#4a9675', rim: '#6fbf97' },
  ink: { a: '#0b2d23', b: '#061b15', c: '#09251d', d: '#051612', vein: '#144236', rib: '#1a5240', rim: '#25664f' },
};

/* ---------- 2. HELPER DAUN ---------- */
function gradientAlong(ctx: Ctx, L: number, c0: string, c1: string): CanvasGradient {
  const g = ctx.createLinearGradient(0, 0, 0, -L);
  g.addColorStop(0, c0);
  g.addColorStop(1, c1);
  return g;
}

/* daun panjang: base di (0,0), ujung ke atas; wf(s) = setengah lebar */
function blade(ctx: Ctx, L: number, wf: (s: number) => number, bend: number, pal: Palette, o: BladeOptions = {}) {
  const N = 64;
  const mx = (s: number) => bend * L * s * s;
  const my = (s: number) => -L * s;
  const edge = (s: number, side: number): Pt => {
    const w = wf(s) * L;
    const dx = 2 * bend * L * s;
    const nrm = Math.hypot(dx, L) || 1;
    return [mx(s) + (side * w * L) / nrm, my(s) + (side * w * dx) / nrm];
  };
  const half = (side: number) => {
    const p = new Path2D();
    p.moveTo(0, 0);
    for (let i = 0; i <= N; i++) {
      const q = edge(i / N, side);
      p.lineTo(q[0], q[1]);
    }
    for (let i = N; i >= 0; i--) p.lineTo(mx(i / N), my(i / N));
    p.closePath();
    return p;
  };
  const left = half(-1);
  const right = half(1);
  ctx.fillStyle = gradientAlong(ctx, L, pal.b, pal.a);
  ctx.fill(left);
  ctx.fillStyle = gradientAlong(ctx, L, pal.d, pal.c);
  ctx.fill(right);

  const veins = o.veins || 22;
  const clip = new Path2D();
  clip.addPath(left);
  clip.addPath(right);
  ctx.save();
  ctx.clip(clip);
  ctx.strokeStyle = pal.vein;
  for (let side = -1; side <= 1; side += 2) {
    for (let i = 1; i < veins; i++) {
      const s = i / veins;
      const e = edge(clamp(s + (o.sweep ?? 0.09)), side);
      ctx.globalAlpha = o.veinAlpha ?? 0.2;
      ctx.lineWidth = o.veinWidth ?? Math.max(0.6, L * 0.0028);
      ctx.beginPath();
      ctx.moveTo(mx(s), my(s));
      ctx.quadraticCurveTo(lerp(mx(s), e[0], 0.5), lerp(my(s), e[1], 0.25), e[0], e[1]);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
  /* bayangan di pangkal supaya daun terasa melengkung */
  const sh = ctx.createLinearGradient(0, 0, 0, -L * 0.55);
  sh.addColorStop(0, 'rgba(4,16,12,.5)');
  sh.addColorStop(1, 'rgba(4,16,12,0)');
  ctx.fillStyle = sh;
  ctx.fillRect(-L, -L * 1.1, L * 2, L * 1.3);
  ctx.restore();

  /* tulang daun */
  ctx.strokeStyle = pal.rib;
  ctx.lineCap = 'round';
  for (let i = 0; i < 24; i++) {
    const s0 = i / 24;
    const s1 = (i + 1) / 24;
    ctx.globalAlpha = 0.75;
    ctx.lineWidth = lerp(L * 0.012, L * 0.0015, s0);
    ctx.beginPath();
    ctx.moveTo(mx(s0), my(s0));
    ctx.lineTo(mx(s1), my(s1));
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  return { edge, mx, my };
}

function wedge(ctx: Ctx, ex: number, ey: number, ix: number, iy: number, w: number) {
  const dx = ix - ex;
  const dy = iy - ey;
  const l = Math.hypot(dx, dy) || 1;
  const nx = -dy / l;
  const ny = dx / l;
  const ox = ex - (dx / l) * 24;
  const oy = ey - (dy / l) * 24;
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.moveTo(ox + nx * w, oy + ny * w);
  ctx.quadraticCurveTo(ex + nx * w * 0.7, ey + ny * w * 0.7, ix, iy);
  ctx.quadraticCurveTo(ex - nx * w * 0.7, ey - ny * w * 0.7, ox - nx * w, oy - ny * w);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/* ---------- 3. JENIS DAUN (semua digambar menghadap atas) ---------- */
const LEAVES: Record<LeafKind, (ctx: Ctx, L: number, pal: Palette, r: Rng) => void> = {
  pisang(ctx, L, pal, r) {
    const bend = r.range(-0.1, 0.1);
    const W = r.range(0.15, 0.19);
    const wf = (s: number) => W * Math.pow(Math.sin(Math.PI * Math.pow(s, 0.74)), 0.6);
    const b = blade(ctx, L, wf, bend, pal, { veins: 46, sweep: 0.05, veinAlpha: 0.16 });
    const n = Math.floor(r.range(4, 9));
    for (let i = 0; i < n; i++) {
      const s = r.range(0.2, 0.92);
      const side = r() < 0.5 ? -1 : 1;
      const e = b.edge(clamp(s + 0.05), side);
      const k = r.range(0.2, 0.92);
      wedge(ctx, e[0], e[1], lerp(e[0], b.mx(s), k), lerp(e[1], b.my(s), k), L * r.range(0.004, 0.011));
    }
  },
  jendela(ctx, L, pal, r) {
    /* daun berlubang: siluet hati dengan belahan dalam */
    const outline = (side: number) => {
      const p = new Path2D();
      p.moveTo(0, 0);
      p.bezierCurveTo(side * 0.08 * L, 0.13 * L, side * 0.4 * L, 0.24 * L, side * 0.45 * L, -0.12 * L);
      p.bezierCurveTo(side * 0.49 * L, -0.5 * L, side * 0.26 * L, -0.86 * L, 0, -L);
      p.closePath();
      return p;
    };
    const le = outline(-1);
    const ri = outline(1);
    ctx.fillStyle = gradientAlong(ctx, L, pal.b, pal.a);
    ctx.fill(le);
    ctx.fillStyle = gradientAlong(ctx, L, pal.d, pal.c);
    ctx.fill(ri);
    const body = new Path2D();
    body.addPath(le);
    body.addPath(ri);
    const n = 6;
    for (let side = -1; side <= 1; side += 2) {
      for (let i = 0; i < n; i++) {
        const s = (i + 0.6) / n;
        const y0 = lerp(0.05, -0.92, s) * L;
        const ang = lerp(0.05, 0.85, s);
        const reach = Math.sin(Math.PI * clamp(s * 0.86 + 0.14)) * 0.46 * L + 0.04 * L;
        const ex = side * reach;
        const ey = y0 - Math.sin(ang) * reach * 0.55;
        ctx.save();
        ctx.clip(body);
        ctx.strokeStyle = pal.vein;
        ctx.globalAlpha = 0.5;
        ctx.lineWidth = L * 0.006;
        ctx.beginPath();
        ctx.moveTo(0, y0);
        ctx.lineTo(ex, ey);
        ctx.stroke();
        ctx.restore();
        if (i < n - 1) {
          const s2 = (i + 1.1) / n;
          const y2 = lerp(0.05, -0.92, s2) * L;
          const rc = Math.sin(Math.PI * clamp(s2 * 0.86 + 0.14)) * 0.52 * L + 0.04 * L;
          const k = r.range(0.6, 0.84);
          wedge(ctx, side * rc, y2 - rc * 0.32, side * rc * (1 - k), y2 - rc * (1 - k) * 0.32, L * r.range(0.03, 0.045));
        }
      }
    }
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 6; i++) {
      const side = i % 2 ? 1 : -1;
      ctx.beginPath();
      ctx.ellipse(side * L * r.range(0.07, 0.11), -L * lerp(0.1, 0.72, i / 6), L * 0.03, L * 0.012, side * 0.5, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
    ctx.strokeStyle = pal.rib;
    ctx.lineCap = 'round';
    ctx.globalAlpha = 0.8;
    ctx.lineWidth = L * 0.012;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -L * 0.97);
    ctx.stroke();
    ctx.globalAlpha = 1;
  },
  keladi(ctx, L, pal) {
    /* keladi hias: mata panah gelap dengan urat pucat tebal */
    const outline = (side: number) => {
      const p = new Path2D();
      p.moveTo(0, 0);
      p.bezierCurveTo(side * 0.03 * L, 0.14 * L, side * 0.16 * L, 0.32 * L, side * 0.27 * L, 0.28 * L);
      p.bezierCurveTo(side * 0.45 * L, 0.2 * L, side * 0.47 * L, -0.2 * L, side * 0.36 * L, -0.5 * L);
      p.bezierCurveTo(side * 0.28 * L, -0.72 * L, side * 0.05 * L, -0.8 * L, 0, -L);
      p.closePath();
      return p;
    };
    const le = outline(-1);
    const ri = outline(1);
    ctx.fillStyle = gradientAlong(ctx, L, pal.b, pal.a);
    ctx.fill(le);
    ctx.fillStyle = gradientAlong(ctx, L, pal.d, pal.c);
    ctx.fill(ri);
    ctx.save();
    const clip = new Path2D();
    clip.addPath(le);
    clip.addPath(ri);
    ctx.clip(clip);
    ctx.lineCap = 'round';
    ctx.strokeStyle = pal.rib;
    for (let side = -1; side <= 1; side += 2) {
      for (let i = 0; i < 6; i++) {
        const y0 = lerp(-0.04, -0.72, i / 5) * L;
        ctx.globalAlpha = 0.75;
        ctx.lineWidth = L * lerp(0.012, 0.006, i / 5);
        ctx.beginPath();
        ctx.moveTo(0, y0);
        ctx.quadraticCurveTo(side * L * 0.2, y0 + L * lerp(0.03, -0.06, i / 5), side * L * 0.5, y0 - L * lerp(-0.2, 0.28, i / 5));
        ctx.stroke();
      }
    }
    ctx.restore();
    ctx.globalAlpha = 0.95;
    ctx.strokeStyle = pal.rib;
    ctx.lineWidth = L * 0.016;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -L * 0.98);
    ctx.stroke();
    ctx.globalAlpha = 1;
  },
  sagu(ctx, L, pal, r) {
    /* pelepah palem: tangkai panjang dengan puluhan anak daun */
    const bend = r.range(-0.3, 0.3);
    const mx = (s: number) => bend * L * s * s;
    const my = (s: number) => -L * s;
    const N = 42;
    for (let side = -1; side <= 1; side += 2) {
      for (let i = 3; i < N; i++) {
        const s = i / N;
        const len = L * 0.34 * Math.pow(Math.sin(Math.PI * Math.pow(s, 0.62)), 0.7);
        const ang = lerp(1.25, 0.32, s) + r.range(-0.06, 0.06);
        const dirx = 2 * bend * s;
        const base = Math.atan2(-1, dirx);
        const a = base + side * ang;
        const x0 = mx(s);
        const y0 = my(s);
        const x1 = x0 + Math.cos(a) * len;
        const y1 = y0 + Math.sin(a) * len + len * 0.1;
        const nx = -Math.sin(a) * L * 0.009;
        const ny = Math.cos(a) * L * 0.009;
        ctx.fillStyle = side < 0 ? pal.a : pal.c;
        if (i % 3 === 0) ctx.fillStyle = side < 0 ? pal.b : pal.d;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.quadraticCurveTo((x0 + x1) / 2 + nx, (y0 + y1) / 2 + ny, x1, y1);
        ctx.quadraticCurveTo((x0 + x1) / 2 - nx, (y0 + y1) / 2 - ny, x0, y0);
        ctx.fill();
      }
    }
    ctx.strokeStyle = pal.rib;
    ctx.lineWidth = L * 0.005;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    for (let i = 1; i <= 20; i++) ctx.lineTo(mx(i / 20), my(i / 20));
    ctx.stroke();
  },
  pakis(ctx, L, pal, r) {
    /* pakis: tiap anak daun bergerigi halus */
    const bend = r.range(-0.26, 0.26);
    const mx = (s: number) => bend * L * s * s;
    const my = (s: number) => -L * s;
    const N = 34;
    for (let side = -1; side <= 1; side += 2) {
      for (let i = 2; i < N; i++) {
        const s = i / N;
        const pin = L * 0.3 * Math.pow(Math.sin(Math.PI * Math.pow(s, 0.58)), 0.85);
        const a = -Math.PI / 2 + side * lerp(1.3, 0.5, s) + 2 * bend * s;
        const x0 = mx(s);
        const y0 = my(s);
        const ca = Math.cos(a);
        const sa = Math.sin(a);
        const w = L * 0.021 * (1 - s * 0.55);
        const teeth = Math.max(5, Math.floor(pin / (L * 0.016)));
        ctx.fillStyle = i % 2 ? (side < 0 ? pal.a : pal.c) : side < 0 ? pal.b : pal.d;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        for (let k = 0; k <= teeth; k++) {
          const u = k / teeth;
          const ww = w * Math.pow(1 - u, 0.7) * (k % 2 ? 1 : 0.82);
          ctx.lineTo(x0 + ca * pin * u - sa * ww, y0 + sa * pin * u + ca * ww);
        }
        for (let k = teeth; k >= 0; k--) {
          const u = k / teeth;
          const ww = w * Math.pow(1 - u, 0.7) * (k % 2 ? 1 : 0.82);
          ctx.lineTo(x0 + ca * pin * u + sa * ww, y0 + sa * pin * u - ca * ww);
        }
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.strokeStyle = pal.rib;
    ctx.lineWidth = L * 0.0055;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    for (let i = 1; i <= 20; i++) ctx.lineTo(mx(i / 20), my(i / 20));
    ctx.stroke();
  },
  jahe(ctx, L, pal, r) {
    /* daun lonjong bergaris */
    const W = r.range(0.17, 0.22);
    const wf = (s: number) => W * Math.pow(Math.sin(Math.PI * Math.pow(s, 0.8)), 0.72);
    blade(ctx, L, wf, r.range(-0.14, 0.14), pal, { veins: 14, sweep: 0.14, veinAlpha: 0.34, veinWidth: L * 0.012 });
  },
};

/* akar gantung: pivot di atas, menjuntai ke bawah */
function drawLiana(ctx: Ctx, H: number, pal: Palette, r: Rng) {
  const pts: Pt[] = [];
  const sway = r.range(10, 34);
  const f = r.range(1.2, 2.6);
  for (let i = 0; i <= 44; i++) {
    const s = i / 44;
    pts.push([Math.sin(s * TAU * f) * sway * s, s * H]);
  }
  ctx.strokeStyle = pal.d;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
  ctx.stroke();
  let y = 26;
  let side = 1;
  while (y < H - 8) {
    const s = y / H;
    const x = Math.sin(s * TAU * f) * sway * s;
    const size = r.range(16, 40) * (1 - s * 0.45);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.PI + side * r.range(0.5, 1.15));
    heart(ctx, size, pal);
    ctx.restore();
    y += r.range(30, 66);
    side *= -1;
  }
}

export function heart(ctx: Ctx, L: number, pal: Palette) {
  const p = new Path2D();
  p.moveTo(0, 0);
  p.bezierCurveTo(L * 0.05, L * 0.16, L * 0.5, L * 0.18, L * 0.44, -L * 0.24);
  p.bezierCurveTo(L * 0.4, -L * 0.62, L * 0.14, -L * 0.86, 0, -L);
  p.bezierCurveTo(-L * 0.14, -L * 0.86, -L * 0.4, -L * 0.62, -L * 0.44, -L * 0.24);
  p.bezierCurveTo(-L * 0.5, L * 0.18, -L * 0.05, L * 0.16, 0, 0);
  ctx.fillStyle = gradientAlong(ctx, L, pal.b, pal.a);
  ctx.fill(p);
  ctx.strokeStyle = pal.rib;
  ctx.globalAlpha = 0.6;
  ctx.lineWidth = Math.max(0.8, L * 0.025);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -L * 0.9);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

/* ---------- 4. PEMBUATAN SPRITE ---------- */
const blurOK = (() => {
  const c = ctx2d(mk(1, 1));
  return typeof c.filter === 'string';
})();

/* bercak halus supaya daun tidak terlihat seperti vektor polos */
let noiseTile: HTMLCanvasElement | null = null;
function noise() {
  if (noiseTile) return noiseTile;
  const s = 128;
  const c = mk(s, s);
  const x = ctx2d(c);
  const img = x.createImageData(s, s);
  const r = rng(77);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = r() < 0.5 ? 0 : 255;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = r() * 120;
  }
  x.putImageData(img, 0, 0);
  noiseTile = c;
  return c;
}

function finish(c: HTMLCanvasElement, ctx: Ctx, L: number, pal: Palette, px: number, py: number) {
  const w = c.width;
  const h = c.height;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'source-atop';
  /* mottling dua skala */
  ctx.globalAlpha = 0.07;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(noise(), 0, 0, w, h);
  ctx.globalAlpha = 0.05;
  const pat = ctx.createPattern(noise(), 'repeat');
  if (pat) ctx.fillStyle = pat;
  ctx.fillRect(0, 0, w, h);
  ctx.globalAlpha = 1;
  /* cahaya datang dari kiri atas */
  const g = ctx.createLinearGradient(px - L * 0.6, py - L, px + L * 0.6, py + L * 0.2);
  g.addColorStop(0, 'rgba(255,250,214,.2)');
  g.addColorStop(0.45, 'rgba(255,250,214,0)');
  g.addColorStop(1, 'rgba(0,12,9,.42)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
  /* rim light: sabit tipis di sisi yang kena cahaya */
  const rim = mk(w, h);
  const q = ctx2d(rim);
  q.drawImage(c, 0, 0);
  q.globalCompositeOperation = 'source-in';
  q.fillStyle = pal.rim;
  q.fillRect(0, 0, w, h);
  q.globalCompositeOperation = 'destination-out';
  const o = Math.max(1.2, L * 0.0045);
  q.drawImage(c, o, o);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'source-atop';
  ctx.globalAlpha = 0.7;
  ctx.drawImage(rim, 0, 0);
  ctx.restore();
}

function bake(kind: SpriteKind, palName: PalName, L: number, seed: number, blur: number): Sprite {
  const r = rng(seed);
  const pal = PAL[palName];
  let w: number, h: number, px: number, py: number;
  if (kind === 'liana') {
    w = 300;
    h = L;
    px = w / 2;
    py = 0;
  } else {
    w = L * 1.36;
    h = L * 1.56;
    px = w / 2;
    py = L * 1.14;
  }
  const pad = blur * 3;
  const c = mk(w + pad * 2, h + pad * 2);
  const x = ctx2d(c);
  x.translate(px + pad, py + pad);
  if (kind === 'liana') drawLiana(x, L, pal, r);
  else LEAVES[kind](x, L, pal, r);
  if (kind !== 'liana') finish(c, x, L, pal, px + pad, py + pad);
  let out = c;
  if (blur > 0) {
    if (blurOK) {
      out = mk(c.width, c.height);
      const y = ctx2d(out);
      y.filter = `blur(${blur}px)`;
      y.drawImage(c, 0, 0);
    } else {
      /* Safari lama: blur lewat kecil-besar */
      const f = Math.max(2, Math.round(blur));
      const t = mk(c.width / f, c.height / f);
      ctx2d(t).drawImage(c, 0, 0, t.width, t.height);
      out = mk(c.width, c.height);
      const y = ctx2d(out);
      y.imageSmoothingQuality = 'high';
      y.drawImage(t, 0, 0, out.width, out.height);
    }
  }
  return { canvas: out, px: px + pad, py: py + pad, L, kind };
}

const cache = new Map<string, Sprite>();
export function sprite(kind: SpriteKind, pal: PalName, L: number, variant: number, blur: number): Sprite {
  const key = `${kind}|${pal}|${L}|${variant}|${blur}`;
  if (!cache.has(key)) cache.set(key, bake(kind, pal, L, variant * 7919 + L, blur));
  return cache.get(key) as Sprite;
}

/* ---------- 5. FOLIAGE ---------- */
export interface LeafItem {
  sprite: Sprite; x: number; y: number; rot: number; scale: number; depth: number;
  amp: number; freq: number; phase: number; bend: number; alpha: number; flip: number; shiftX: number; shiftY: number;
}
interface Flat { canvas: HTMLCanvasElement; mx: number; my: number; depth: number; ph: number; onTop: boolean }
export interface FoliageState { t: number; mx: number | null; my: number | null; open: number; push: number; cx?: number; cy?: number; pushRadius?: number; tint?: string | null }

export class Foliage {
  canvas: HTMLCanvasElement;
  ctx: Ctx;
  items: LeafItem[];
  flats: Flat[];
  maxDpr: number;
  W: number;
  H: number;
  dpr = 1;
  constructor(canvas: HTMLCanvasElement, { maxDpr = 1.5 } = {}) {
    this.canvas = canvas;
    this.ctx = ctx2d(canvas);
    this.items = [];
    this.flats = [];
    this.maxDpr = maxDpr;
    this.W = 0;
    this.H = 0;
    this.resize();
  }
  resize() {
    /* clientWidth tidak ikut membesar saat kanvas di-scale lewat CSS */
    this.dpr = Math.min(window.devicePixelRatio || 1, this.maxDpr);
    this.W = this.canvas.clientWidth;
    this.H = this.canvas.clientHeight;
    this.canvas.width = Math.round(this.W * this.dpr);
    this.canvas.height = Math.round(this.H * this.dpr);
  }
  /* Satukan daun yang jarang bergerak jadi satu gambar di luar layar.
     margin memberi ruang saat lapisan membesar/mengecil. */
  flatten(test: (it: LeafItem) => boolean, depth: number, onTop = false) {
    const m = 0.3;
    const W = this.W;
    const H = this.H;
    const c = mk(W * (1 + m * 2), H * (1 + m * 2));
    const x = ctx2d(c);
    const keep: LeafItem[] = [];
    for (const it of this.items) {
      if (!test(it)) {
        keep.push(it);
        continue;
      }
      const sp = it.sprite;
      const co = Math.cos(it.rot) * it.scale;
      const si = Math.sin(it.rot) * it.scale;
      x.globalAlpha = it.alpha;
      x.setTransform(co * it.flip, si * it.flip, -si, co, it.x + W * m, it.y + H * m);
      x.drawImage(sp.canvas, -sp.px, -sp.py);
    }
    this.items = keep;
    this.flats.push({ canvas: c, mx: W * m, my: H * m, depth, ph: this.flats.length * 2.1, onTop });
  }
  add(it: Pick<LeafItem, 'sprite' | 'x' | 'y' | 'rot' | 'scale'> & Partial<LeafItem>) {
    this.items.push(
      Object.assign(
        { amp: 0.02, freq: 0.5, phase: 0, bend: 0, depth: 0.5, alpha: 1, flip: 1, shiftX: 0, shiftY: 0 },
        it
      )
    );
  }
  /* state: { t, mx, my, open, cx, cy, push } */
  draw(state: FoliageState) {
    const { ctx, dpr, W, H } = this;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const cx = state.cx ?? W / 2;
    const cy = state.cy ?? H / 2;
    const open = state.open || 0;
    const R = state.pushRadius || Math.min(W, H) * 0.34;
    const drawFlat = (f: Flat) => {
      const k = 1 + open * f.depth * 1.15;
      const dx = Math.sin(state.t * 0.21 + f.ph) * 7;
      const dy = Math.cos(state.t * 0.17 + f.ph) * 5;
      ctx.setTransform(k * dpr, 0, 0, k * dpr, (cx + (dx - cx - f.mx) * k) * dpr, (cy + (dy - cy - f.my) * k) * dpr);
      ctx.drawImage(f.canvas, 0, 0);
    };
    for (const f of this.flats) if (!f.onTop) drawFlat(f);
    for (const it of this.items) {
      const sp = it.sprite;
      const reach = sp.L * it.scale * 0.62;
      const lift = open * it.depth;
      const ax = it.x + (it.x - cx) * lift * 1.15;
      const ay = it.y + (it.y - cy) * lift * 1.15;
      const dirA = it.rot - Math.PI / 2;
      const hx = ax + Math.cos(dirA) * reach;
      const hy = ay + Math.sin(dirA) * reach;
      let target = 0;
      let pushX = 0;
      let pushY = 0;
      if (state.mx != null && state.my != null && state.push !== 0) {
        const dx = hx - state.mx;
        const dy = hy - state.my;
        const d = Math.hypot(dx, dy) || 1;
        const f = Math.max(0, 1 - d / R);
        if (f > 0) {
          const cross = Math.cos(dirA) * dy - Math.sin(dirA) * dx;
          const sign = cross >= 0 ? 1 : -1;
          target = sign * f * f * 0.62 * (0.5 + it.depth);
          pushX = (dx / d) * f * f * 34 * it.depth;
          pushY = (dy / d) * f * f * 34 * it.depth;
        }
      }
      it.bend += (target - it.bend) * 0.1;
      it.shiftX += (pushX - it.shiftX) * 0.1;
      it.shiftY += (pushY - it.shiftY) * 0.1;
      const a = it.rot + it.bend + Math.sin(state.t * it.freq + it.phase) * it.amp + Math.sin(state.t * it.freq * 0.37 + it.phase * 2) * it.amp * 0.6;
      const s = it.scale * (1 + Math.abs(lift) * 0.42);
      const co = Math.cos(a) * s * dpr;
      const si = Math.sin(a) * s * dpr;
      ctx.globalAlpha = it.alpha;
      ctx.setTransform(co * it.flip, si * it.flip, -si, co, (ax + it.shiftX) * dpr, (ay + it.shiftY) * dpr);
      ctx.drawImage(sp.canvas, -sp.px, -sp.py);
    }
    ctx.globalAlpha = 1;
    for (const f of this.flats) if (f.onTop) drawFlat(f);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (state.tint) {
      /* warna senja atau malam hanya menempel pada daun, langit diurus CSS */
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = state.tint;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.globalCompositeOperation = 'source-over';
    }
  }
}

/* ---------- 6. RAKIT HUTAN ---------- */
/* Tiap "ring" menaruh daun melingkari tengah layar dengan ujung mengarah ke dalam.
   tipX/tipY = sejauh mana ujung daun boleh mendekati tengah (0 = tengah, 1 = tepi). */
interface RingCfg {
  count: number; tip: [number, number]; len: [number, number]; sizes: number[]; kinds: LeafKind[];
  pal: PalName | ((t: number, r: Rng) => PalName); blur?: number; depth: number; spread: number;
  alpha?: number; sway?: number; variants?: number; cx?: number; cy?: number;
}
function ring(fol: Foliage, r: Rng, cfg: RingCfg) {
  const { W, H } = fol;
  const cx = cfg.cx ?? W / 2;
  const cy = cfg.cy ?? H / 2;
  for (let i = 0; i < cfg.count; i++) {
    const u = (i + r.range(-0.42, 0.42)) / cfg.count;
    const phi = u * TAU;
    const ca = Math.cos(phi);
    const sa = Math.sin(phi);
    const tipRad = r.range(cfg.tip[0], cfg.tip[1]);
    const tipX = cx + ca * (W / 2) * tipRad;
    const tipY = cy + sa * (H / 2) * tipRad;
    const L = r.pick(cfg.sizes);
    const px = r.range(cfg.len[0], cfg.len[1]);
    const scale = px / L;
    const spread = r.range(-cfg.spread, cfg.spread);
    const dirA = Math.atan2(tipY - cy, tipX - cx) + spread;
    const x = tipX + Math.cos(dirA) * px;
    const y = tipY + Math.sin(dirA) * px;
    const rot = dirA - Math.PI / 2;
    const kind = r.pick(cfg.kinds);
    const palName = typeof cfg.pal === 'function' ? cfg.pal(tipRad, r) : cfg.pal;
    fol.add({
      sprite: sprite(kind, palName, L, Math.floor(r() * (cfg.variants || 3)), cfg.blur || 0),
      x,
      y,
      rot,
      scale,
      depth: cfg.depth,
      amp: r.range(0.012, 0.03) * (cfg.sway || 1),
      freq: r.range(0.35, 0.9),
      phase: r() * TAU,
      alpha: cfg.alpha ?? 1,
      flip: r() < 0.5 ? -1 : 1,
    });
  }
}

interface HangCfg { count: number; sizes: number[]; scale: [number, number]; pal: PalName; blur?: number; depth: number; xs: (u: number, r: Rng) => number }
function hanging(fol: Foliage, r: Rng, cfg: HangCfg) {
  for (let i = 0; i < cfg.count; i++) {
    const L = r.pick(cfg.sizes);
    const x = fol.W * cfg.xs(i / Math.max(1, cfg.count - 1), r);
    fol.add({
      sprite: sprite('liana', cfg.pal, L, Math.floor(r() * 3), cfg.blur || 0),
      x,
      y: -10,
      rot: r.range(-0.03, 0.03),
      scale: r.range(cfg.scale[0], cfg.scale[1]),
      depth: cfg.depth,
      amp: r.range(0.006, 0.014),
      freq: r.range(0.3, 0.7),
      phase: r() * TAU,
      flip: r() < 0.5 ? -1 : 1,
    });
  }
}

/* Hutan hero: back di belakang nama, front di depan nama */
export function buildHero(back: Foliage, front: Foliage, seed: number, compact: boolean) {
  back.items = [];
  front.items = [];
  back.flats = [];
  front.flats = [];
  const r = rng(seed);
  const k = Math.max(back.W, back.H * 1.3) / 1440;
  const q = compact ? 0.56 : 1;
  const size = (n: number) => n * k;
  const portrait = back.H > back.W;

  /* lapisan jauh: buram dan pucat, jadi kabut */
  ring(back, r, { count: Math.round(46 * q), tip: [0.5, 0.95], len: [size(240), size(460)], sizes: [240], kinds: ['pisang', 'sagu', 'pakis', 'pisang', 'jendela'], pal: 'haze', blur: 4, depth: 0.14, spread: 0.7, alpha: 0.5, sway: 0.6, variants: 2 });
  ring(back, r, { count: Math.round(40 * q), tip: [0.6, 1], len: [size(260), size(520)], sizes: [260], kinds: ['pisang', 'sagu', 'pakis', 'keladi', 'jendela'], pal: 'deep', blur: 2.4, depth: 0.26, spread: 0.6, sway: 0.7, variants: 2 });
  back.flatten((it) => it.depth < 0.2, 0.14);
  back.flatten((it) => it.depth < 0.3, 0.26);
  hanging(back, r, { count: Math.round(9 * q), sizes: [900], scale: [0.5, 1], pal: 'deep', blur: 1, depth: 0.3, xs: (u, rr) => (u < 0.5 ? rr.range(0.04, 0.28) : rr.range(0.72, 0.97)) });
  /* lapisan tajam: fokus kamera ada di sini */
  ring(back, r, { count: Math.round(30 * q), tip: [0.66, 0.98], len: [size(220), size(430)], sizes: [560], kinds: ['pisang', 'jendela', 'sagu', 'keladi', 'pakis', 'jahe'], pal: (t, rr) => (t < 0.8 || rr() < 0.3 ? 'lit' : 'mid'), depth: 0.46, spread: 0.5, variants: 2 });

  ring(front, r, { count: Math.round(26 * q), tip: portrait ? [0.9, 1.14] : [0.82, 1.08], len: [size(300), size(620)], sizes: [560], kinds: ['pisang', 'jendela', 'keladi', 'pakis', 'sagu'], pal: (_t, rr) => (rr() < 0.3 ? 'mid' : 'deep'), depth: 0.72, spread: 0.42, variants: 2 });
  ring(front, r, { count: Math.round(14 * q), tip: portrait ? [1, 1.26] : [0.88, 1.16], len: [size(520), size(900)], sizes: [260], kinds: ['pisang', 'jendela', 'keladi'], pal: 'ink', blur: 6, depth: 1.12, spread: 0.3, sway: 0.7, variants: 2 });
  hanging(front, r, { count: Math.round(3 * q), sizes: [760], scale: [0.7, 1], pal: 'ink', depth: 0.8, xs: (u, rr) => (u < 0.5 ? rr.range(0.02, 0.14) : rr.range(0.88, 0.99)) });

  /* urutkan: yang paling jauh digambar dulu */
  back.items.sort((a, b) => a.depth - b.depth);
  front.items.sort((a, b) => a.depth - b.depth);
}

/* Bingkai foto: dedaunan di belakang dan di depan badan */
export function buildPortrait(back: Foliage, front: Foliage, seed: number) {
  back.items = [];
  front.items = [];
  back.flats = [];
  front.flats = [];
  const r = rng(seed);
  const k = back.W / 460;
  ring(back, r, { count: 22, tip: [0.28, 0.82], len: [150 * k, 300 * k], sizes: [380], kinds: ['pisang', 'jendela', 'sagu', 'keladi'], pal: 'mid', blur: 4, depth: 0.3, spread: 0.6, cy: back.H * 0.42 });
  ring(back, r, { count: 16, tip: [0.5, 0.92], len: [110 * k, 220 * k], sizes: [380], kinds: ['jendela', 'jahe', 'sagu'], pal: 'lit', blur: 1.5, depth: 0.4, spread: 0.5, cy: back.H * 0.42 });
  const bottom = 16;
  for (let i = 0; i < bottom; i++) {
    const u = i / (bottom - 1);
    const L = 420;
    const px = r.range(120, 250) * k;
    front.add({
      sprite: sprite(r.pick(['keladi', 'jendela', 'pakis', 'jahe', 'sagu']), r() < 0.45 ? 'deep' : 'mid', L, Math.floor(r() * 3), 0),
      x: u * front.W,
      y: front.H + 26,
      rot: lerp(-0.72, 0.72, u) + r.range(-0.28, 0.28),
      scale: px / L,
      depth: 0.5,
      amp: r.range(0.012, 0.028),
      freq: r.range(0.4, 0.9),
      phase: r() * TAU,
      flip: r() < 0.5 ? -1 : 1,
    });
  }
}

/* ---------- 7. SPECIMEN: tanaman yang tumbuh bertahap ----------
   Satu tanaman = daftar langkah gambar, tiap langkah punya jendela waktu
   [t0, t1]. render(t) menggambar semua langkah sampai waktu t. */
export interface Ink { line: string; fill: string; soft: string; glow: string }
type DrawOp = (c: Ctx, k: number) => void;
export interface SpecimenKit { add: (t0: number, t1: number, fn: DrawOp) => void; W: number; H: number; r: Rng; ink: Ink }
export type SpeciesFn = (kit: SpecimenKit) => void;
const INK: Ink = { line: '#eaf0d8', fill: 'rgba(234,240,216,.13)', soft: 'rgba(234,240,216,.5)', glow: '#c9f25a' };

interface SpecimenOpts { seed?: number; ink?: Partial<Ink>; maxDpr?: number; size?: { width: number; height: number } }
export class Specimen {
  canvas: HTMLCanvasElement;
  ctx: Ctx;
  build: SpeciesFn;
  seed: number;
  ink: Ink;
  maxDpr: number;
  fixed: { width: number; height: number } | null;
  t = -1;
  W = 0;
  H = 0;
  dpr = 1;
  ops: { t0: number; t1: number; fn: DrawOp }[] = [];
  constructor(canvas: HTMLCanvasElement, build: SpeciesFn, opts: SpecimenOpts = {}) {
    this.canvas = canvas;
    this.ctx = ctx2d(canvas);
    this.build = build;
    this.seed = opts.seed ?? 1;
    this.ink = Object.assign({}, INK, opts.ink);
    this.maxDpr = opts.maxDpr || 2;
    this.fixed = opts.size || null;
    this.t = -1;
    this.resize();
  }
  resize() {
    const rect = this.fixed || this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, this.maxDpr);
    this.W = rect.width;
    this.H = rect.height;
    this.dpr = dpr;
    this.canvas.width = Math.round(this.W * dpr);
    this.canvas.height = Math.round(this.H * dpr);
    this.ops = [];
    const add = (t0: number, t1: number, fn: DrawOp) => {
      this.ops.push({ t0, t1, fn });
    };
    this.build({ add, W: this.W, H: this.H, r: rng(this.seed), ink: this.ink });
    const prev = this.t;
    this.t = -1;
    if (prev >= 0) this.render(prev);
  }
  render(t: number) {
    if (Math.abs(t - this.t) < 0.001) return;
    this.t = t;
    const c = this.ctx;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    c.clearRect(0, 0, this.W, this.H);
    c.lineCap = 'round';
    c.lineJoin = 'round';
    for (const op of this.ops) {
      if (t <= op.t0) continue;
      c.save();
      op.fn(c, ease((t - op.t0) / (op.t1 - op.t0)));
      c.restore();
    }
  }
}

/* kuas dasar untuk Specimen */
function polyStem(pts: Pt[], w0: number, w1: number, ink: Ink, color?: string): DrawOp {
  return (c, k) => {
    const n = pts.length - 1;
    const end = n * k;
    c.strokeStyle = color || ink.line;
    for (let i = 0; i < n && i < end; i++) {
      const f = Math.min(1, end - i);
      c.lineWidth = lerp(w0, w1, i / n);
      c.beginPath();
      c.moveTo(pts[i][0], pts[i][1]);
      c.lineTo(lerp(pts[i][0], pts[i + 1][0], f), lerp(pts[i][1], pts[i + 1][1], f));
      c.stroke();
    }
  };
}

function lance(x: number, y: number, ang: number, len: number, wid: number, ink: Ink, veins = 6): DrawOp {
  return (c, k) => {
    c.translate(x, y);
    c.rotate(ang);
    c.scale(k, k);
    c.beginPath();
    c.moveTo(0, 0);
    c.quadraticCurveTo(len * 0.35, -wid, len, 0);
    c.quadraticCurveTo(len * 0.35, wid, 0, 0);
    c.fillStyle = ink.fill;
    c.fill();
    c.strokeStyle = ink.line;
    c.lineWidth = 0.9;
    c.stroke();
    c.lineWidth = 0.5;
    c.globalAlpha = 0.65;
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(len * 0.96, 0);
    for (let i = 1; i < veins; i++) {
      const s = i / veins;
      const px = len * s;
      const w = wid * 0.92 * Math.sin(Math.PI * Math.pow(s, 0.7));
      c.moveTo(px, 0);
      c.lineTo(px + len * 0.07, -w * 0.72);
      c.moveTo(px, 0);
      c.lineTo(px + len * 0.07, w * 0.72);
    }
    c.stroke();
  };
}

function heartLeaf(x: number, y: number, ang: number, size: number, ink: Ink): DrawOp {
  return (c, k) => {
    c.translate(x, y);
    c.rotate(ang);
    c.scale(k, k);
    const L = size;
    c.beginPath();
    c.moveTo(0, 0);
    c.bezierCurveTo(L * 0.16, -L * 0.2, L * 0.74, -L * 0.14, L * 0.8, L * 0.24);
    c.bezierCurveTo(L * 0.86, L * 0.56, L * 0.52, L * 0.86, 0, L * 1.12);
    c.bezierCurveTo(-L * 0.52, L * 0.86, -L * 0.86, L * 0.56, -L * 0.8, L * 0.24);
    c.bezierCurveTo(-L * 0.74, -L * 0.14, -L * 0.16, -L * 0.2, 0, 0);
    c.fillStyle = ink.fill;
    c.fill();
    c.strokeStyle = ink.line;
    c.lineWidth = 1;
    c.stroke();
    c.lineWidth = 0.55;
    c.globalAlpha = 0.65;
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(0, L * 1.02);
    for (let i = 0; i < 4; i++) {
      const y0 = L * (0.08 + i * 0.2);
      const w = L * (0.56 - i * 0.1);
      c.moveTo(0, y0);
      c.quadraticCurveTo(w * 0.5, y0 + L * 0.03, w, y0 + L * 0.2);
      c.moveTo(0, y0);
      c.quadraticCurveTo(-w * 0.5, y0 + L * 0.03, -w, y0 + L * 0.2);
    }
    c.stroke();
  };
}

function curve(x0: number, y0: number, x1: number, y1: number, cx: number, cy: number, n = 22): Pt[] {
  const p: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const s = i / n;
    p.push([
      (1 - s) * (1 - s) * x0 + 2 * (1 - s) * s * cx + s * s * x1,
      (1 - s) * (1 - s) * y0 + 2 * (1 - s) * s * cy + s * s * y1,
    ]);
  }
  return p;
}

export type SpeciesName = 'sirih' | 'kantong' | 'sagu' | 'bambu' | 'paku' | 'tunas' | 'jamur' | 'pakisKecil';
export const SPECIES: Record<SpeciesName, SpeciesFn> = {
  /* Sirih gading: merambat naik pada tiang */
  sirih({ add, W, H, r, ink }) {
    const u = Math.min(W, H);
    const x0 = W * 0.5;
    const top = H * 0.07;
    const bot = H * 0.97;
    add(0, 0.22, polyStem([[x0, bot], [x0, top + H * 0.05]], u * 0.012, u * 0.006, ink, 'rgba(234,240,216,.3)'));
    const pts: Pt[] = [];
    const N = 90;
    for (let i = 0; i <= N; i++) {
      const s = i / N;
      pts.push([x0 + Math.sin(s * TAU * 2.7) * u * 0.05, lerp(bot, top, s)]);
    }
    add(0.06, 0.82, polyStem(pts, u * 0.009, u * 0.003, ink));
    const leaves = 13;
    for (let i = 0; i < leaves; i++) {
      const s = lerp(0.06, 0.98, i / (leaves - 1));
      const p = pts[Math.floor(s * N)];
      const side = i % 2 ? 1 : -1;
      const size = u * lerp(0.15, 0.08, s) * r.range(0.86, 1.1);
      const reach = u * r.range(0.07, 0.14);
      const lx = p[0] + side * reach;
      const ly = p[1] - u * 0.03;
      const t0 = 0.1 + s * 0.62;
      add(t0, t0 + 0.1, polyStem(curve(p[0], p[1], lx, ly, lerp(p[0], lx, 0.5), ly - u * 0.05, 8), 1.6, 1, ink));
      add(t0 + 0.05, t0 + 0.22, heartLeaf(lx, ly, -side * r.range(0.35, 0.8), size, ink));
    }
  },

  /* Kantong semar: daun yang ujungnya berubah jadi kantong */
  kantong({ add, W, H, ink }) {
    const u = Math.min(W, H);
    const pts: Pt[] = [];
    const N = 60;
    for (let i = 0; i <= N; i++) {
      const s = i / N;
      pts.push([W * 0.42 + Math.sin(s * 3.4 + 0.6) * u * 0.08, lerp(H * 0.98, H * 0.08, s)]);
    }
    add(0, 0.5, polyStem(pts, u * 0.011, u * 0.004, ink));
    const specs = [
      { s: 0.16, side: -1, len: 0.3, size: 0.17 },
      { s: 0.31, side: 1, len: 0.34, size: 0.24 },
      { s: 0.46, side: -1, len: 0.3, size: 0.2 },
      { s: 0.62, side: 1, len: 0.27, size: 0.15 },
      { s: 0.78, side: -1, len: 0.22, size: 0.11 },
    ];
    specs.forEach((sp, i) => {
      const p = pts[Math.floor(sp.s * N)];
      const a = sp.side > 0 ? -0.26 : Math.PI + 0.26;
      const len = u * sp.len;
      const t0 = 0.12 + i * 0.13;
      add(t0, t0 + 0.2, lance(p[0], p[1], a, len, u * 0.038, ink, 8));
      const tipX = p[0] + Math.cos(a) * len;
      const tipY = p[1] + Math.sin(a) * len;
      const dropX = tipX + sp.side * u * 0.05;
      const dropY = tipY + u * (0.1 + sp.size * 0.42);
      add(t0 + 0.14, t0 + 0.28, polyStem(curve(tipX, tipY, dropX, dropY, tipX + sp.side * u * 0.1, tipY - u * 0.02, 14), 1.5, 1.2, ink));
      add(t0 + 0.24, t0 + 0.46, pitcher(dropX, dropY, u * sp.size, sp.side, ink));
    });
  },

  /* Sagu: batang bercincin dan mahkota pelepah; garis peta di belakangnya */
  sagu({ add, W, H, r, ink }) {
    const u = Math.min(W, H);
    add(0, 0.2, (c, k) => {
      c.strokeStyle = ink.line;
      c.globalAlpha = 0.14 * k;
      c.lineWidth = 0.7;
      c.setLineDash([2, 6]);
      c.beginPath();
      for (let i = 1; i < 6; i++) {
        c.moveTo((W * i) / 6, 0);
        c.lineTo((W * i) / 6, H);
        c.moveTo(0, (H * i) / 6);
        c.lineTo(W, (H * i) / 6);
      }
      c.stroke();
    });
    const cx = W * 0.52;
    const crownY = H * 0.46;
    const pts: Pt[] = [];
    for (let i = 0; i <= 30; i++) {
      const s = i / 30;
      pts.push([cx + Math.sin(s * 2.2) * u * 0.035, lerp(H * 0.99, crownY, s)]);
    }
    add(0.02, 0.34, polyStem(pts, u * 0.058, u * 0.038, ink, 'rgba(234,240,216,.2)'));
    add(0.04, 0.36, (c, k) => {
      c.strokeStyle = ink.line;
      c.lineWidth = 0.8;
      const n = Math.floor(28 * k);
      for (let i = 0; i < n; i++) {
        const p = pts[Math.floor((i / 28) * 30)];
        const w = u * lerp(0.03, 0.021, i / 28);
        c.globalAlpha = 0.72;
        c.beginPath();
        c.moveTo(p[0] - w, p[1]);
        c.quadraticCurveTo(p[0], p[1] + u * 0.008, p[0] + w, p[1]);
        c.stroke();
      }
    });
    const top = pts[30];
    const L = Math.min(W * 0.5, H * 0.46);
    /* tiga tingkat: tegak di tengah, melebar, lalu menjuntai di luar */
    const angles = [-1.72, -1.28, -0.86, -0.5, -0.17, 0.2, 0.54, 0.9, 1.3, 1.76];
    angles.forEach((a0) => {
      const a = a0 + r.range(-0.05, 0.05);
      const abs = Math.abs(a);
      const len = L * r.range(0.9, 1.04) * (abs > 1.2 ? 0.86 : 1);
      const ex = top[0] + Math.sin(a) * len;
      const ey = top[1] - Math.cos(a) * len + len * 0.3 * Math.pow(Math.sin(a), 2);
      const qx = top[0] + Math.sin(a) * len * 0.56;
      const qy = top[1] - Math.cos(a * 0.72) * len * 0.8;
      const c0 = curve(top[0], top[1], ex, ey, qx, qy, 40);
      const t0 = 0.3 + (1 - abs / 1.8) * 0.2;
      add(t0, t0 + 0.3, polyStem(c0, 2.4, 0.7, ink));
      add(t0 + 0.06, t0 + 0.42, (c, k) => {
        c.strokeStyle = ink.line;
        c.lineWidth = 0.75;
        c.globalAlpha = 0.86;
        const n = Math.floor(c0.length * k);
        c.beginPath();
        for (let j = 3; j < n; j++) {
          const p = c0[j];
          const q = c0[j - 1];
          const dir = Math.atan2(p[1] - q[1], p[0] - q[0]);
          const s = j / c0.length;
          const l = u * 0.095 * Math.pow(Math.sin(Math.PI * Math.pow(s, 0.62)), 0.75);
          for (let side = -1; side <= 1; side += 2) {
            const aa = dir + side * lerp(0.95, 0.42, s);
            c.moveTo(p[0], p[1]);
            c.quadraticCurveTo(p[0] + Math.cos(aa) * l * 0.55, p[1] + Math.sin(aa) * l * 0.55, p[0] + Math.cos(aa) * l, p[1] + Math.sin(aa) * l + l * 0.22);
          }
        }
        c.stroke();
      });
    });
  },

  /* Bambu: rumpun batang beruas */
  bambu({ add, W, H, r, ink }) {
    const u = Math.min(W, H);
    const culms = [
      { x: 0.3, top: 0.2, lean: -0.06, w: 0.036 },
      { x: 0.42, top: 0.06, lean: 0.03, w: 0.044 },
      { x: 0.53, top: 0.14, lean: -0.01, w: 0.04 },
      { x: 0.63, top: 0.03, lean: 0.09, w: 0.046 },
      { x: 0.74, top: 0.28, lean: 0.11, w: 0.03 },
    ];
    culms.forEach((cu, i) => {
      const pts = curve(W * cu.x, H * 0.99, W * (cu.x + cu.lean), H * cu.top, W * cu.x, H * 0.5, 28);
      const t0 = 0.03 + i * 0.05;
      add(t0, t0 + 0.42, polyStem(pts, u * cu.w, u * cu.w * 0.5, ink, 'rgba(234,240,216,.22)'));
      add(t0, t0 + 0.42, (c, k) => {
        const n = Math.floor(pts.length * k);
        for (let j = 2; j < n; j += 3) {
          const p = pts[j];
          const w = u * lerp(cu.w, cu.w * 0.5, j / pts.length) * 0.62;
          c.strokeStyle = ink.line;
          c.lineWidth = 1.2;
          c.beginPath();
          c.moveTo(p[0] - w, p[1]);
          c.quadraticCurveTo(p[0], p[1] - 3, p[0] + w, p[1]);
          c.stroke();
        }
      });
      for (let j = 8; j < pts.length; j += 3) {
        const s = j / pts.length;
        const p = pts[j];
        const side = (j + i) % 2 ? 1 : -1;
        const t1 = t0 + 0.26 + s * 0.3;
        const bx = p[0] + side * u * r.range(0.08, 0.16);
        const by = p[1] - u * r.range(0.02, 0.07);
        add(t1, t1 + 0.14, polyStem(curve(p[0], p[1], bx, by, lerp(p[0], bx, 0.6), p[1] - u * 0.02, 8), 1.2, 0.8, ink));
        const count = 3 + Math.floor(r() * 2);
        for (let q = 0; q < count; q++) {
          const ang = (side > 0 ? 0.2 : Math.PI - 0.2) + r.range(-0.9, 0.9);
          add(t1 + 0.08 + q * 0.015, t1 + 0.24, lance(bx, by, ang, u * r.range(0.09, 0.14), u * 0.012, ink, 4));
        }
      }
    });
  },

  /* Paku: fern Barnsley, tiap titik hasil rumus acak */
  paku({ add, W, H, ink, r }) {
    const N = 40000;
    const ptsX = new Float32Array(N);
    const ptsY = new Float32Array(N);
    let x = 0;
    let y = 0;
    for (let i = 0; i < N; i++) {
      const p = r();
      let nx;
      let ny;
      if (p < 0.01) {
        nx = 0;
        ny = 0.16 * y;
      } else if (p < 0.86) {
        nx = 0.85 * x + 0.04 * y;
        ny = -0.04 * x + 0.85 * y + 1.6;
      } else if (p < 0.93) {
        nx = 0.2 * x - 0.26 * y;
        ny = 0.23 * x + 0.22 * y + 1.6;
      } else {
        nx = -0.15 * x + 0.28 * y;
        ny = 0.26 * x + 0.24 * y + 0.44;
      }
      x = nx;
      y = ny;
      ptsX[i] = x;
      ptsY[i] = y;
    }
    const sc = H / 10.6;
    const cx = W * 0.5;
    const cos = Math.cos(-0.12);
    const sin = Math.sin(-0.12);
    /* titik ditumpuk di kanvas cadangan, jadi tiap frame cukup menambah titik baru */
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const off = mk(W * dpr, H * dpr);
    const ox = ctx2d(off);
    ox.scale(dpr, dpr);
    ox.fillStyle = ink.line;
    const dot = Math.max(0.7, H / 900);
    let done = 20;
    add(0.02, 0.96, (c, k) => {
      const n = Math.floor(N * k);
      if (n < done) {
        ox.clearRect(0, 0, W, H);
        done = 20;
      }
      ox.globalAlpha = 0.72;
      ox.beginPath();
      for (let i = done; i < n; i++) {
        const px = ptsX[i] * sc;
        const py = ptsY[i] * sc;
        ox.rect(cx + px * cos - py * sin, H * 0.985 - (px * sin + py * cos), dot, dot);
      }
      ox.fill();
      done = Math.max(done, n);
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.drawImage(off, 0, 0);
    });
  },

  /* Tanaman kecil untuk persemaian dan klik tanam */
  tunas({ add, W, H, r, ink }) {
    const base = H - 2;
    const height = H * r.range(0.5, 0.92);
    const lean = r.range(-0.18, 0.18) * H;
    const pts = curve(W / 2, base, W / 2 + lean, base - height, W / 2 - lean * 0.2, base - height * 0.55, 16);
    add(0, 0.5, polyStem(pts, Math.max(1.4, H * 0.016), 1, ink));
    const n = 3 + Math.floor(r() * 5);
    for (let i = 0; i < n; i++) {
      const s = lerp(0.35, 1, i / Math.max(1, n - 1));
      const p = pts[Math.floor(s * 16)];
      const side = i % 2 ? 1 : -1;
      const t0 = 0.16 + s * 0.42;
      add(t0, t0 + 0.34, lance(p[0], p[1], -Math.PI / 2 + side * r.range(0.5, 1.1), H * r.range(0.16, 0.3) * (1.2 - s * 0.5), H * 0.05, ink, 4));
    }
  },
  jamur({ add, W, H, r, ink }) {
    const base = H - 2;
    const n = 1 + Math.floor(r() * 3);
    for (let i = 0; i < n; i++) {
      const x = W / 2 + (i - (n - 1) / 2) * H * 0.26;
      const h = H * r.range(0.22, 0.42);
      const cap = H * r.range(0.12, 0.2);
      const t0 = i * 0.1;
      add(t0, t0 + 0.45, polyStem([[x, base], [x, base - h]], Math.max(2.2, H * 0.03), Math.max(1.4, H * 0.02), ink));
      add(t0 + 0.34, t0 + 0.8, (c, k) => {
        c.translate(x, base - h);
        c.scale(k, k);
        c.beginPath();
        c.moveTo(-cap, 0);
        c.quadraticCurveTo(0, -cap * 1.5, cap, 0);
        c.quadraticCurveTo(0, cap * 0.3, -cap, 0);
        c.fillStyle = ink.fill;
        c.fill();
        c.strokeStyle = ink.line;
        c.lineWidth = 1;
        c.stroke();
        c.fillStyle = ink.glow;
        for (let d = 0; d < 4; d++) {
          c.beginPath();
          c.arc(-cap * 0.54 + d * cap * 0.36, -cap * (0.16 + (d % 2) * 0.26), 1.3, 0, TAU);
          c.fill();
        }
      });
    }
  },
  pakisKecil({ add, W, H, r, ink }) {
    const base = H - 2;
    const n = 4 + Math.floor(r() * 3);
    for (let i = 0; i < n; i++) {
      const a = lerp(-1.05, 1.05, i / (n - 1)) + r.range(-0.1, 0.1);
      const len = H * r.range(0.6, 0.94) * (1 - Math.abs(a) * 0.2);
      const ex = W / 2 + Math.sin(a) * len;
      const ey = base - Math.cos(a) * len * 0.92;
      const pts = curve(W / 2, base, ex, ey, W / 2 + Math.sin(a) * len * 0.34, base - len * 0.86, 22);
      const t0 = i * 0.05;
      add(t0, t0 + 0.55, polyStem(pts, 1.5, 0.7, ink));
      add(t0 + 0.08, t0 + 0.84, (c, k) => {
        c.strokeStyle = ink.line;
        c.lineWidth = 0.8;
        const nn = Math.floor(pts.length * k);
        c.beginPath();
        for (let j = 2; j < nn; j++) {
          const s = j / pts.length;
          const p = pts[j];
          const q = pts[j - 1];
          const dir = Math.atan2(p[1] - q[1], p[0] - q[0]);
          const l = H * 0.12 * Math.sin(Math.PI * Math.pow(s, 0.65));
          c.moveTo(p[0], p[1]);
          c.lineTo(p[0] + Math.cos(dir + 1) * l, p[1] + Math.sin(dir + 1) * l);
          c.moveTo(p[0], p[1]);
          c.lineTo(p[0] + Math.cos(dir - 1) * l, p[1] + Math.sin(dir - 1) * l);
        }
        c.stroke();
      });
    }
  },
};

function pitcher(x: number, y: number, h: number, side: number, ink: Ink): DrawOp {
  return (c, k) => {
    c.translate(x, y);
    c.scale(k, k);
    const w = h * 0.3;
    /* badan kantong */
    const body = new Path2D();
    body.moveTo(-w * 0.34, 0);
    body.bezierCurveTo(-w * 0.9, h * 0.2, -w * 1.18, h * 0.8, -w * 0.5, h);
    body.quadraticCurveTo(0, h * 1.1, w * 0.5, h);
    body.bezierCurveTo(w * 1.18, h * 0.8, w * 0.9, h * 0.2, w * 0.34, 0);
    c.fillStyle = ink.fill;
    c.fill(body);
    c.strokeStyle = ink.line;
    c.lineWidth = 1;
    c.stroke(body);
    /* urat kantong */
    c.lineWidth = 0.55;
    c.globalAlpha = 0.6;
    c.beginPath();
    for (let i = 1; i < 6; i++) {
      const u = i / 6 - 0.5;
      c.moveTo(u * w * 0.8, h * 0.04);
      c.bezierCurveTo(u * w * 2, h * 0.3, u * w * 2.3, h * 0.8, u * w * 1.1, h * 1.02);
    }
    c.stroke();
    c.globalAlpha = 1;
    /* bibir kantong menyala, inilah "mulut" yang mendengar */
    c.strokeStyle = ink.glow;
    c.lineWidth = 2.2;
    c.beginPath();
    c.ellipse(0, 0, w * 0.5, h * 0.05, 0, 0, TAU);
    c.stroke();
    /* tutup */
    c.strokeStyle = ink.line;
    c.lineWidth = 1;
    c.fillStyle = ink.fill;
    c.beginPath();
    c.moveTo(-side * w * 0.45, -h * 0.02);
    c.quadraticCurveTo(-side * w * 0.1, -h * 0.26, side * w * 0.72, -h * 0.17);
    c.quadraticCurveTo(side * w * 0.4, -h * 0.03, -side * w * 0.45, -h * 0.02);
    c.fill();
    c.stroke();
  };
}

