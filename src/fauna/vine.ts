/* Akar gantung dengan fisika Verlet: bisa ditarik, diayun, dan ditumpangi satwa. */
import { clamp, ctx2d, heart, TAU } from '../flora/flora';
import { reduced, touch } from '../core/ticker';

interface Node { x: number; y: number; px: number; py: number }

const LEAF_PAL = {
  a: '#6fae55', b: '#2c7046', c: '#4a9050', d: '#1f5a3c', vein: '#a6d18c', rib: '#c2e39f', rim: '#dff2bd',
};

function leafSprite(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = 60;
  c.height = 70;
  const x = ctx2d(c);
  x.translate(30, 62);
  heart(x, 54, LEAF_PAL);
  return c;
}

export class Vine {
  pts: Node[] = [];
  seg: number;
  held: number | null = null;
  heldX = 0;
  heldY = 0;
  leaves: { i: number; side: number; size: number }[] = [];

  constructor(public ax: number, public ay: number, length: number, n: number, seed: number) {
    this.seg = length / n;
    for (let i = 0; i <= n; i++) {
      const y = ay + i * this.seg;
      this.pts.push({ x: ax, y, px: ax, py: y });
    }
    let k = seed;
    for (let i = 1; i <= n; i++) {
      k = (k * 9301 + 49297) % 233280;
      const f = k / 233280;
      this.leaves.push({ i, side: i % 2 ? 1 : -1, size: 0.34 + f * 0.36 });
    }
  }

  tip(): Node {
    return this.pts[this.pts.length - 1];
  }

  /** dorong ujung akar; dipakai saat satwa menempel atau siamang berteriak */
  kick(vx: number, vy = 0): void {
    const n = this.pts.length;
    this.pts.forEach((p, i) => {
      const k = i / (n - 1);
      p.px -= vx * k;
      p.py -= vy * k;
    });
  }

  step(dt: number): void {
    const n = this.pts.length;
    const G = 1300 * dt * dt;
    for (let i = 1; i < n; i++) {
      const p = this.pts[i];
      const vx = (p.x - p.px) * 0.992;
      const vy = (p.y - p.py) * 0.992;
      p.px = p.x;
      p.py = p.y;
      p.x += vx;
      p.y += vy + G;
    }
    if (this.held != null) {
      const h = this.pts[this.held];
      h.x = this.heldX;
      h.y = this.heldY;
    }
    for (let it = 0; it < 9; it++) {
      this.pts[0].x = this.ax;
      this.pts[0].y = this.ay;
      for (let i = 0; i < n - 1; i++) {
        const a = this.pts[i];
        const b = this.pts[i + 1];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.hypot(dx, dy) || 1;
        const e = (d - this.seg) / d / 2;
        const fixedA = i === 0 || this.held === i;
        const fixedB = this.held === i + 1;
        if (!fixedA) {
          a.x += dx * e;
          a.y += dy * e;
        }
        if (!fixedB) {
          b.x -= dx * e * (fixedA ? 2 : 1);
          b.y -= dy * e * (fixedA ? 2 : 1);
        }
      }
    }
  }

  nearest(x: number, y: number): { i: number; d: number } {
    let best = 0;
    let bd = Infinity;
    this.pts.forEach((p, i) => {
      if (i === 0) return;
      const d = Math.hypot(p.x - x, p.y - y);
      if (d < bd) {
        bd = d;
        best = i;
      }
    });
    return { i: best, d: bd };
  }
}

/** Sekumpulan akar di satu kanvas. Koordinatnya lokal terhadap host. */
export class VineSet {
  vines: Vine[] = [];
  ctx: CanvasRenderingContext2D;
  W = 0;
  H = 0;
  dpr = 1;
  leaf: HTMLCanvasElement;
  visible = true;
  grabbing: Vine | null = null;
  lastX: number | null = null;
  lastY: number | null = null;
  tint = 0;

  constructor(public canvas: HTMLCanvasElement, public host: HTMLElement) {
    this.ctx = ctx2d(canvas);
    this.leaf = leafSprite();
    this.fit();
    if (!touch) {
      addEventListener('pointerdown', this.down);
      addEventListener('pointermove', this.move, { passive: true });
      addEventListener('pointerup', this.up);
      addEventListener('pointercancel', this.up);
    }
  }

  fit(): void {
    this.dpr = Math.min(devicePixelRatio || 1, 1.5);
    this.W = this.canvas.clientWidth;
    this.H = this.canvas.clientHeight;
    this.canvas.width = Math.round(this.W * this.dpr);
    this.canvas.height = Math.round(this.H * this.dpr);
  }

  destroy(): void {
    removeEventListener('pointerdown', this.down);
    removeEventListener('pointermove', this.move);
    removeEventListener('pointerup', this.up);
    removeEventListener('pointercancel', this.up);
  }

  private local(e: PointerEvent): [number, number] {
    const r = this.canvas.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  }

  private inside(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x <= this.W && y <= this.H;
  }

  down = (e: PointerEvent): void => {
    if (!this.visible || e.button !== 0) return;
    const t = e.target as HTMLElement;
    if (t.closest('a,button,.fauna,.sun,[data-letter],dialog,.journal')) return;
    const [x, y] = this.local(e);
    if (!this.inside(x, y)) return;
    let found: { v: Vine; i: number; d: number } | null = null;
    for (const v of this.vines) {
      const n = v.nearest(x, y);
      if (n.d < 26 && (!found || n.d < found.d)) found = { v, ...n };
    }
    if (found) {
      found.v.held = found.i;
      found.v.heldX = x;
      found.v.heldY = y;
      this.grabbing = found.v;
      this.host.classList.add('is-grabbing');
      e.preventDefault();
    }
  };

  move = (e: PointerEvent): void => {
    if (!this.visible) return;
    const [x, y] = this.local(e);
    if (this.grabbing) {
      this.grabbing.heldX = x;
      this.grabbing.heldY = y;
    } else if (this.inside(x, y)) {
      /* kursor yang lewat ikut mendorong akar */
      if (this.lastX != null && this.lastY != null) {
        const vx = clamp(x - this.lastX, -40, 40);
        const vy = clamp(y - this.lastY, -40, 40);
        let near = false;
        for (const v of this.vines) {
          v.pts.forEach((p, i) => {
            if (i === 0) return;
            const d = Math.hypot(p.x - x, p.y - y);
            if (d < 26) near = true;
            if (d < 34) {
              const k = (1 - d / 34) * 0.5;
              p.x += vx * k;
              p.y += vy * k * 0.5;
            }
          });
        }
        this.host.classList.toggle('is-grab', near);
      }
    }
    this.lastX = x;
    this.lastY = y;
  };

  up = (): void => {
    if (this.grabbing) {
      this.grabbing.held = null;
      this.grabbing = null;
      this.host.classList.remove('is-grabbing');
    }
  };

  update(dt: number): void {
    if (!this.visible) return;
    if (!reduced) {
      const steps = 2;
      for (let s = 0; s < steps; s++) for (const v of this.vines) v.step(Math.min(dt, 0.033) / steps);
    }
    this.draw();
  }

  draw(): void {
    const { ctx: x, dpr, leaf } = this;
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.clearRect(0, 0, this.canvas.width, this.canvas.height);
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    x.lineCap = 'round';
    x.lineJoin = 'round';
    for (const v of this.vines) {
      const p = v.pts;
      x.strokeStyle = '#1f4a33';
      x.lineWidth = 3;
      x.beginPath();
      x.moveTo(p[0].x, p[0].y);
      for (let i = 1; i < p.length - 1; i++) {
        const mx = (p[i].x + p[i + 1].x) / 2;
        const my = (p[i].y + p[i + 1].y) / 2;
        x.quadraticCurveTo(p[i].x, p[i].y, mx, my);
      }
      x.lineTo(p[p.length - 1].x, p[p.length - 1].y);
      x.stroke();
      for (const l of v.leaves) {
        const a = p[l.i - 1];
        const b = p[l.i];
        const ang = Math.atan2(b.y - a.y, b.x - a.x) + Math.PI / 2 + l.side * 1.1;
        x.save();
        x.translate(b.x, b.y);
        x.rotate(ang);
        x.scale(l.size, l.size);
        x.drawImage(leaf, -30, -62);
        x.restore();
      }
    }
    if (this.tint > 0) {
      x.setTransform(1, 0, 0, 1, 0, 0);
      x.globalCompositeOperation = 'source-atop';
      x.fillStyle = `rgba(6,14,34,${(this.tint * 0.72).toFixed(3)})`;
      x.fillRect(0, 0, this.canvas.width, this.canvas.height);
      x.globalCompositeOperation = 'source-over';
    }
  }
}

export { TAU };
