/* ==========================================================================
   creatures.ts — sifat tiap satwa.
   Tiap kelas hanya mengatur "maunya apa"; fisika dasar ada di engine.ts.
   ========================================================================== */
import { Creature, fauna, GRAVITY, type FaunaEngine, type Habitat } from './engine';
import { dust, emit, sparkle } from './fx';
import type { Vine } from './vine';
import { sfx } from '../core/sound';
import { compact, pointer } from '../core/ticker';
import { world } from '../core/world';
import { clamp, lerp } from '../flora/flora';

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const settle = (c: Creature) => {
  c.sx += (1 - c.sx) * 0.16;
  c.sy += (1 - c.sy) * 0.16;
};

/* ---------- Serindit: terbang, hinggap, tidur terbalik saat malam ---------- */
export class Serindit extends Creature {
  mode: 'perch' | 'fly' | 'ground' = 'perch';
  vine: Vine | null = null;
  node = 0;
  tx = 0;
  ty = 0;
  wait = rand(2, 5);
  phase = Math.random() * 6;
  asleep = false;

  constructor(e: FaunaEngine, h: Habitat) {
    super(e, 'serindit', 86, 86, h, h.width() * 0.3, 120);
    this.perchOn(0);
  }

  sound() {
    sfx.chirp();
  }

  private perchOn(i: number) {
    const vines = this.habitat.vines?.() ?? [];
    if (!vines.length) {
      this.mode = 'fly';
      this.tx = this.x;
      this.ty = this.habitat.ground(this.x);
      return;
    }
    this.vine = vines[i % vines.length];
    this.node = Math.max(3, this.vine.pts.length - 4);
    this.mode = 'perch';
    this.state('is-fly', false);
    this.vine.kick(this.vx * 0.006, 0.8);
  }

  private fly(tx: number, ty: number) {
    this.vine = null;
    this.mode = 'fly';
    this.tx = tx;
    this.ty = ty;
    this.state('is-fly', true);
    this.state('is-sleep', false);
    this.asleep = false;
    this.rot = 0;
  }

  private hop() {
    const vines = this.habitat.vines?.() ?? [];
    const W = this.habitat.width();
    if (vines.length && Math.random() < 0.75) {
      const v = vines[Math.floor(Math.random() * vines.length)];
      const n = v.pts[Math.max(3, v.pts.length - 4)];
      this.fly(n.x, n.y);
    } else {
      const H = this.habitat.ground(this.x);
      this.fly(rand(W * 0.1, W * 0.9), rand(H * 0.15, H * 0.8));
    }
  }

  think(t: number, dt: number) {
    settle(this);
    const night = world.get().night > 0.6;
    if (this.mode === 'perch' && this.vine) {
      const n = this.vine.pts[this.node];
      this.x = n.x;
      this.y = n.y + 4;
      n.y += 0.5;
      if (night !== this.asleep) {
        this.asleep = night;
        this.state('is-sleep', night);
      }
      this.rot += ((night ? Math.PI : 0) - this.rot) * 0.1;
      if (night) {
        if (Math.random() < dt * 0.7) {
          const [sx, sy] = this.screen();
          emit({ x: sx + 16, y: sy - 74, vy: -18, vx: 10, text: 'z', size: 15, color: '#dfe7ff', life: 1.5 });
        }
        return;
      }
      if (pointer.x != null && pointer.y != null) {
        const [sx, sy] = this.screen();
        if (Math.hypot(pointer.x - sx, pointer.y - sy + 40) < 90 && !this.engine.dragging) this.hop();
      }
      this.facing = pointer.x != null && pointer.x < this.screen()[0] ? -1 : 1;
      this.wait -= dt;
      if (this.wait < 0) {
        this.wait = rand(4, 9);
        this.hop();
      }
      return;
    }
    if (this.mode === 'fly') {
      const dx = this.tx - this.x;
      const dy = this.ty - this.y;
      const d = Math.hypot(dx, dy) || 1;
      const sp = 340;
      this.vx += ((dx / d) * sp - this.vx) * 0.06;
      this.vy += ((dy / d) * sp - this.vy) * 0.06;
      this.x += this.vx * dt;
      this.y += this.vy * dt + Math.sin(t * 13 + this.phase) * 1.1;
      if (Math.abs(this.vx) > 12) this.facing = this.vx > 0 ? 1 : -1;
      this.rot = clamp(this.vx * 0.0006, -0.3, 0.3) * this.facing;
      if (d < 22) {
        const vines = this.habitat.vines?.() ?? [];
        const near = vines.findIndex((v) => Math.hypot(v.pts[v.pts.length - 4].x - this.x, v.pts[v.pts.length - 4].y - this.y) < 80);
        if (near >= 0) this.perchOn(near);
        else if (vines.length) this.hop();
        else if (this.y >= this.habitat.ground(this.x) - 26) {
          this.mode = 'ground';
          this.state('is-fly', false);
          this.y = this.habitat.ground(this.x);
          this.wait = rand(2, 4);
        } else this.fly(this.x + rand(-300, 300), this.habitat.ground(this.x));
      }
      return;
    }
    /* di tanah habitat lain */
    this.rot *= 0.8;
    this.wait -= dt;
    if (this.wait < 0) {
      this.wait = rand(3, 6);
      const W = this.habitat.width();
      this.fly(clamp(this.x + rand(-420, 420), 60, W - 60), this.habitat.ground(this.x) - rand(60, 240));
    }
  }

  poke() {
    this.sound();
    if (this.asleep) {
      this.line('night');
      return;
    }
    this.line('poke');
    this.hop();
  }

  grabbed() {
    this.vine = null;
    this.mode = 'fly';
    this.state('is-sleep', false);
    this.state('is-fly', true);
    this.asleep = false;
  }

  released() {
    this.rot = 0;
    this.hop();
  }

  placeHome() {
    this.state('is-fly', false);
    this.perchOn(0);
  }
}

/* ---------- Kupu-kupu: terbang acak dan menghindari kursor ---------- */
export class Kupu extends Creature {
  tx: number;
  ty: number;
  retarget = 0;
  caught = 0;

  constructor(e: FaunaEngine, h: Habitat, seed: number) {
    const W = h.width();
    const H = h.ground(0);
    super(e, 'kupu', compact() ? 34 : 44, compact() ? 34 : 44, h, W * (0.25 + seed * 0.25), H * (0.3 + seed * 0.12));
    this.tx = this.x;
    this.ty = this.y;
    this.el.style.setProperty('--flap', `${(0.16 + seed * 0.03).toFixed(2)}s`);
    this.state('is-fly', true);
  }

  think(t: number, dt: number) {
    settle(this);
    this.retarget -= dt;
    const W = this.habitat.width();
    const H = this.habitat.ground(0);
    if (this.retarget < 0 || Math.hypot(this.tx - this.x, this.ty - this.y) < 16) {
      this.retarget = rand(1.2, 3);
      this.tx = rand(W * 0.14, W * 0.86);
      this.ty = rand(H * 0.12, H * 0.72);
    }
    let ax = (this.tx - this.x) * 1.2;
    let ay = (this.ty - this.y) * 1.2;
    if (pointer.x != null && pointer.y != null) {
      const [sx, sy] = this.screen();
      const dx = sx - pointer.x;
      const dy = sy - this.h / 2 - pointer.y;
      const d = Math.hypot(dx, dy) || 1;
      if (d < 130) {
        const f = (1 - d / 130) * 1700;
        ax += (dx / d) * f;
        ay += (dy / d) * f;
      }
    }
    this.vx += ax * dt;
    this.vy += ay * dt;
    this.vx *= 0.965;
    this.vy *= 0.965;
    this.x += this.vx * dt;
    this.y += this.vy * dt + Math.sin(t * 7 + this.tx) * 0.9;
    this.x = clamp(this.x, 20, W - 20);
    this.y = clamp(this.y, 40, H);
    this.rot = clamp(this.vx * 0.003, -0.6, 0.6);
  }

  poke() {
    this.line('poke', 1500);
    sparkle(...this.screen(), '#52e38a', 8);
    this.retarget = 0;
    this.vy = -260;
  }

  released() {
    this.retarget = 0;
  }

  placeHome() {
    this.x = this.habitat.width() / 2;
    this.y = this.habitat.ground(0) * 0.4;
  }
}

/* ---------- Siamang: bergelantungan, dilempar, menangkap akar ---------- */
export class Siamang extends Creature {
  mode: 'hang' | 'air' | 'ground' = 'hang';
  vine: Vine | null = null;
  wait = rand(4, 7);
  grip = 0;
  call = 0;

  constructor(e: FaunaEngine, h: Habitat) {
    const size = compact() ? 104 : 136;
    super(e, 'siamang', size, size * 1.08, h, h.width() * 0.5, 200);
    this.placeHome();
  }

  sound() {
    sfx.wuup();
  }

  private catchVine(v: Vine) {
    this.vine = v;
    this.mode = 'hang';
    this.state('is-air', false);
    v.kick(this.vx * 0.014, this.vy * 0.004);
    this.grip = 0.3;
  }

  /** lompat ke ujung akar lain dengan lintasan parabola */
  private leapTo(v: Vine) {
    const tip = v.tip();
    const T = 0.62;
    this.vine = null;
    this.mode = 'air';
    this.state('is-air', true);
    this.grip = 0.2;
    this.vx = (tip.x - this.x) / T;
    this.vy = (tip.y + this.h * 0.86 - this.y - 0.5 * GRAVITY * T * T) / T;
    this.facing = this.vx >= 0 ? 1 : -1;
  }

  think(_t: number, dt: number) {
    settle(this);
    const vines = this.habitat.vines?.() ?? [];
    this.grip -= dt;
    if (this.mode === 'hang' && this.vine) {
      const v = this.vine;
      const tip = v.tip();
      /* berat badan ikut menarik ujung akar */
      tip.y += 1.4;
      const a = v.pts[v.pts.length - 3];
      this.x = tip.x + this.h * 0.2 * this.facing * 0;
      this.y = tip.y + this.h * 0.86;
      const lean = Math.atan2(tip.x - a.x, tip.y - a.y);
      this.rot += (clamp(lean, -1, 1) - this.rot) * 0.2;
      this.wait -= dt;
      if (this.wait < 0) {
        this.wait = rand(5, 10);
        if (vines.length > 1) {
          const others = vines.filter((o) => o !== v);
          this.leapTo(others[Math.floor(Math.random() * others.length)]);
        } else {
          v.kick(rand(-6, 6));
        }
      }
      return;
    }
    if (this.mode === 'air') {
      this.rot *= 0.94;
      const landed = this.fall(dt);
      if (this.grip < 0) {
        for (const v of vines) {
          const tip = v.tip();
          if (Math.hypot(tip.x - this.x, tip.y - (this.y - this.h * 0.86)) < 84) {
            this.catchVine(v);
            return;
          }
        }
      }
      if (landed) {
        this.mode = 'ground';
        this.state('is-air', false);
        this.vx = 0;
        this.vy = 0;
        this.wait = rand(1.2, 2.4);
        this.engine.impact(this, true);
      }
      return;
    }
    /* duduk di tanah */
    this.rot *= 0.8;
    this.y = this.habitat.ground(this.x);
    this.wait -= dt;
    if (this.wait < 0) {
      this.wait = rand(3, 6);
      if (vines.length) {
        let best = vines[0];
        for (const v of vines) if (Math.abs(v.tip().x - this.x) < Math.abs(best.tip().x - this.x)) best = v;
        this.leapTo(best);
      } else this.shout();
    }
  }

  private shout() {
    this.state('is-call', true);
    clearTimeout(this.call);
    this.call = window.setTimeout(() => this.state('is-call', false), 1100);
    this.line('poke', 1800);
    sfx.wuup();
    (this.habitat.vines?.() ?? []).forEach((v) => v.kick(rand(-5, 5)));
  }

  poke() {
    this.shout();
  }

  grabbed() {
    this.vine = null;
    this.mode = 'air';
    this.state('is-air', true);
  }

  released() {
    this.mode = 'air';
    this.state('is-air', true);
    this.grip = 0.08;
    this.vx *= 0.9;
    this.vy *= 0.9;
  }

  placeHome() {
    const vines = this.habitat.vines?.() ?? [];
    this.vine = vines[Math.min(1, vines.length - 1)] ?? null;
    this.mode = this.vine ? 'hang' : 'ground';
    this.state('is-air', false);
    if (this.vine) {
      this.x = this.vine.tip().x;
      this.y = this.vine.tip().y + this.h * 0.86;
    } else {
      this.x = this.habitat.width() / 2;
      this.y = this.habitat.ground(this.x);
    }
  }
}

/* ---------- Kukang: lambat, bicaranya pun lambat, tapi gesit saat malam ---------- */
export class Kukang extends Creature {
  dir = 1;
  rest = 0;
  pendingSay = 0;

  constructor(e: FaunaEngine, h: Habitat) {
    super(e, 'kukang', compact() ? 92 : 112, compact() ? 76 : 93, h, compact() ? h.width() - 70 : 640, 0);
    this.y = h.ground(this.x);
    this.state('is-walk', true);
  }

  think(_t: number, dt: number) {
    settle(this);
    const awake = world.get().night > 0.55;
    this.state('is-fast', awake);
    if (!this.grounded && this.y < this.habitat.ground(this.x) - 1) {
      /* jatuh pun pelan */
      if (this.fall(dt, 300)) this.engine.impact(this);
      return;
    }
    this.vy = 0;
    this.y = this.habitat.ground(this.x);
    this.grounded = true;
    this.rest -= dt;
    if (this.rest > 0) {
      this.state('is-walk', false);
      return;
    }
    this.state('is-walk', true);
    const speed = awake ? 70 : 9;
    this.x += this.dir * speed * dt;
    this.facing = this.dir;
    const W = this.habitat.width();
    if (this.x > W - 80 || this.x < 80) this.dir *= -1;
    if (Math.random() < dt * 0.05) this.rest = rand(3, 7);
  }

  poke() {
    this.rest = 4;
    clearTimeout(this.pendingSay);
    if (world.get().night > 0.55) {
      this.line('night');
      return;
    }
    /* kukang menjawab terlambat */
    this.pendingSay = window.setTimeout(() => this.line('poke', 3600), 1100);
  }

  released() {
    this.grounded = false;
    this.vx *= 0.25;
    this.vy = Math.min(this.vy * 0.2, 120);
  }

  placeHome() {
    this.x = compact() ? this.habitat.width() - 70 : 640;
    this.y = this.habitat.ground(this.x);
  }
}

/* ---------- Anak gajah: menyiram tanaman dengan belalai ---------- */
export class Gajah extends Creature {
  dir = -1;
  wait = rand(1, 3);
  walking = false;
  spraying = 0;
  onSpray: ((screenX: number) => void) | null = null;

  constructor(e: FaunaEngine, h: Habitat) {
    const w = compact() ? 136 : 190;
    super(e, 'gajah', w, w * 0.76, h, h.width() * 0.68, 0);
    this.y = h.ground(this.x);
  }

  sound() {
    sfx.trumpet();
  }

  think(t: number, dt: number) {
    settle(this);
    if (!this.grounded) {
      this.rot *= 0.9;
      if (this.fall(dt)) {
        this.engine.impact(this, true);
        this.vx = 0;
        this.vy = 0;
      }
      return;
    }
    this.y = this.habitat.ground(this.x);
    if (this.spraying > 0) {
      this.spraying -= dt;
      const [sx, sy] = this.screen();
      const nx = sx + this.facing * this.w * 0.46;
      const ny = sy - this.h * 0.72;
      for (let i = 0; i < 2; i++) {
        emit({ x: nx, y: ny, vx: this.facing * rand(170, 340), vy: rand(-340, -180), g: 760, size: rand(1.4, 3.2), color: 'rgba(150,214,240,.9)', life: 0.9 });
      }
      if (this.spraying <= 0) {
        this.state('is-spray', false);
        this.onSpray?.(sx + this.facing * this.w * 0.95);
      }
      return;
    }
    this.wait -= dt;
    if (this.wait < 0) {
      this.walking = !this.walking;
      this.wait = this.walking ? rand(3, 6) : rand(2, 4);
      if (this.walking && Math.random() < 0.4) this.dir *= -1;
      this.state('is-walk', this.walking);
    }
    if (this.walking) {
      this.x += this.dir * 42 * dt;
      this.facing = this.dir;
      const W = this.habitat.width();
      if (this.x < 110) this.dir = 1;
      if (this.x > W - 110) this.dir = -1;
    }
    this.rot = Math.sin(t * 5) * (this.walking ? 0.012 : 0);
  }

  poke() {
    this.line('poke');
    sfx.trumpet();
    this.spraying = 1.3;
    this.state('is-walk', false);
    this.walking = false;
    this.state('is-spray', true);
  }

  grabbed() {
    this.state('is-walk', false);
    this.state('is-spray', false);
    this.spraying = 0;
    this.grounded = false;
  }

  released() {
    this.grounded = false;
  }

  placeHome() {
    this.x = this.habitat.width() * 0.68;
    this.y = this.habitat.ground(this.x);
    this.grounded = true;
  }
}

/* ---------- Katak: melompat ---------- */
export class Katak extends Creature {
  wait = rand(1, 4);
  air = false;
  throat = 0;

  constructor(e: FaunaEngine, h: Habitat) {
    const s = compact() ? 58 : 74;
    super(e, 'katak', s, s * 0.9, h, h.width() * 0.26, 0);
    this.y = h.ground(this.x);
    this.grounded = true;
  }

  sound() {
    sfx.croak();
  }

  private jump(power = 1) {
    const W = this.habitat.width();
    let d = rand(0, 1) < 0.5 ? -1 : 1;
    if (this.x < 120) d = 1;
    if (this.x > W - 120) d = -1;
    this.facing = d;
    this.vx = d * rand(150, 260) * power;
    this.vy = -rand(420, 560) * power;
    this.grounded = false;
    this.air = true;
    this.sx = 0.82;
    this.sy = 1.22;
    this.state('is-air', true);
  }

  think(t: number, dt: number) {
    settle(this);
    const night = world.get().night > 0.55;
    if (this.air || !this.grounded) {
      this.rot = clamp(this.vy * 0.0008, -0.5, 0.5) * this.facing;
      if (this.fall(dt)) {
        this.air = false;
        this.vx = 0;
        this.vy = 0;
        this.rot = 0;
        this.sx = 1.26;
        this.sy = 0.72;
        this.state('is-air', false);
        const [sx, sy] = this.screen();
        dust(sx, sy, 4);
      }
      return;
    }
    this.y = this.habitat.ground(this.x);
    this.wait -= dt;
    if (this.wait < 0) {
      this.wait = rand(2.5, 6);
      if (night && Math.random() < 0.6) {
        this.line('night', 1400);
        sfx.croak();
      } else this.jump();
    }
    /* mengindari kursor yang terlalu dekat */
    if (pointer.x != null && pointer.y != null) {
      const [sx, sy] = this.screen();
      if (Math.hypot(pointer.x - sx, pointer.y - sy + 24) < 70 && !this.engine.dragging && this.wait < 2) {
        this.wait = 3;
        this.jump(0.9);
      }
    }
    void t;
  }

  poke() {
    this.line('poke', 1300);
    sfx.croak();
    this.jump(1.35);
  }

  grabbed() {
    this.air = true;
  }

  released() {
    this.air = true;
    this.grounded = false;
    this.state('is-air', true);
  }

  placeHome() {
    this.x = this.habitat.width() * 0.26;
    this.y = this.habitat.ground(this.x);
    this.air = false;
    this.grounded = true;
    this.state('is-air', false);
  }
}

/* ---------- Trenggiling: berjalan, menggulung, memantul ---------- */
export class Trenggiling extends Creature {
  ball = false;
  spin = 0;
  dir = 1;
  rest = 0;
  radius: number;

  constructor(e: FaunaEngine, h: Habitat) {
    const w = compact() ? 104 : 132;
    super(e, 'trenggiling', w, w * 0.8, h, h.width() * 0.34, 0);
    this.y = h.ground(this.x);
    this.grounded = true;
    this.radius = w * 0.25;
    this.state('is-walk', true);
  }

  private curl(on: boolean) {
    this.ball = on;
    this.state('is-ball', on);
    this.state('is-walk', !on);
    if (!on) this.spin = 0;
  }

  think(_t: number, dt: number) {
    settle(this);
    if (this.ball) {
      const g = this.habitat.ground(this.x);
      const slope = (this.habitat.ground(this.x + 6) - this.habitat.ground(this.x - 6)) / 12;
      if (this.y >= g - 1.5 && this.vy >= 0) {
        /* menggelinding mengikuti kemiringan */
        this.y = g;
        if (this.vy > 180) {
          this.engine.impact(this, this.vy > 500);
          this.vy = -this.vy * 0.46;
          this.y = g - 2;
        } else {
          this.vy = 0;
          this.vx += slope * GRAVITY * 0.6 * dt;
          this.vx *= 1 - 0.55 * dt;
          this.x += this.vx * dt;
        }
      } else {
        this.vy += GRAVITY * dt;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
      }
      const W = this.habitat.width();
      if (this.x < 50) {
        this.x = 50;
        this.vx = Math.abs(this.vx) * 0.7;
      }
      if (this.x > W - 50) {
        this.x = W - 50;
        this.vx = -Math.abs(this.vx) * 0.7;
      }
      if (this.y > this.habitat.ground(this.x)) this.y = this.habitat.ground(this.x);
      this.spin += (this.vx * dt) / this.radius;
      this.rot = this.spin;
      this.rest -= dt;
      if (this.rest < 0 && Math.abs(this.vx) < 26 && Math.abs(this.vy) < 40) {
        this.curl(false);
        this.rot = 0;
        this.vx = 0;
      }
      return;
    }
    if (!this.grounded) {
      if (this.fall(dt)) {
        this.engine.impact(this);
        this.vx = 0;
      }
      return;
    }
    const y0 = this.habitat.ground(this.x);
    this.y = y0;
    this.rot = lerp(this.rot, Math.atan2(this.habitat.ground(this.x + 20) - this.habitat.ground(this.x - 20), 40) * this.facing, 0.1);
    this.x += this.dir * 34 * dt;
    this.facing = this.dir;
    const W = this.habitat.width();
    if (this.x > W - 120) this.dir = -1;
    if (this.x < 120) this.dir = 1;
    if (Math.random() < dt * 0.14) this.dir *= -1;
  }

  poke() {
    this.line('poke', 1500);
    this.curl(true);
    this.rest = 2.2;
    this.vx = this.dir * rand(240, 460);
    this.vy = -240;
    this.y -= 4;
    sfx.pop();
  }

  grabbed() {
    this.curl(true);
    this.rest = 2.2;
  }

  released() {
    this.rest = 2.4;
    this.grounded = false;
  }

  placeHome() {
    this.curl(false);
    this.x = this.habitat.width() * 0.34;
    this.y = this.habitat.ground(this.x);
    this.grounded = true;
    this.rot = 0;
  }
}

export { fauna };
