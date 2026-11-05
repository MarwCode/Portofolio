/* Partikel singkat di koordinat layar: air, debu, zzz, bintang kecil. */
import { ctx2d, TAU } from '../flora/flora';
import { onTick } from '../core/ticker';

interface P {
  x: number; y: number; vx: number; vy: number; g: number; life: number; max: number; size: number; color: string; text?: string;
}

const list: P[] = [];
let c: HTMLCanvasElement | null = null;
let x: CanvasRenderingContext2D | null = null;

export function mountFx(canvas: HTMLCanvasElement): () => void {
  c = canvas;
  x = ctx2d(canvas);
  const fit = () => {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
  };
  fit();
  addEventListener('resize', fit);
  const off = onTick((_t, dt) => {
    if (!x || !c) return;
    if (!list.length && !dirty) return;
    x.clearRect(0, 0, c.width, c.height);
    dirty = list.length > 0;
    for (let i = list.length - 1; i >= 0; i--) {
      const p = list[i];
      p.life -= dt;
      if (p.life <= 0) {
        list.splice(i, 1);
        continue;
      }
      p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const a = Math.min(1, p.life / (p.max * 0.5));
      x.globalAlpha = a;
      if (p.text) {
        x.fillStyle = p.color;
        x.font = `italic 300 ${p.size}px Fraunces, Georgia, serif`;
        x.fillText(p.text, p.x, p.y);
      } else {
        x.fillStyle = p.color;
        x.beginPath();
        x.arc(p.x, p.y, p.size, 0, TAU);
        x.fill();
      }
    }
    x.globalAlpha = 1;
  });
  return () => {
    off();
    removeEventListener('resize', fit);
  };
}

let dirty = false;

export function emit(p: Partial<P> & { x: number; y: number }): void {
  dirty = true;
  const life = p.life ?? 0.8;
  list.push({ vx: 0, vy: 0, g: 0, size: 3, color: '#fff', ...p, life, max: life });
}

export function dust(x: number, y: number, n = 10): void {
  for (let i = 0; i < n; i++) {
    emit({ x, y, vx: (Math.random() - 0.5) * 170, vy: -Math.random() * 70, g: 180, size: 1.5 + Math.random() * 3.2, color: 'rgba(168,136,96,.8)', life: 0.5 + Math.random() * 0.4 });
  }
}

export function sparkle(x: number, y: number, color = '#c9f25a', n = 12): void {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * TAU;
    const s = 50 + Math.random() * 130;
    emit({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, g: 60, size: 1.2 + Math.random() * 2, color, life: 0.5 + Math.random() * 0.5 });
  }
}
