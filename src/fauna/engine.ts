/* ==========================================================================
   engine.ts — dunia satwa: habitat, fisika dasar, drag & lempar, bicara.
   Satwa adalah elemen DOM biasa yang ditempel ke habitatnya, jadi ikut
   bergerak bersama halaman. Saat diseret, ia pindah ke lapisan fixed supaya
   bisa dibawa melintasi section.
   ========================================================================== */
import { ART } from './art';
import { dust } from './fx';
import type { Vine } from './vine';
import { ENCOUNTERS, speciesById } from '../data/fauna';
import { sfx } from '../core/sound';
import { pointer, reduced } from '../core/ticker';
import { world, type FaunaId } from '../core/world';
import type { LayerId } from '../data/portfolio';
import { clamp } from '../flora/flora';

export interface Habitat {
  id: LayerId;
  el: HTMLElement;
  ground: (x: number) => number;
  width: () => number;
  vines?: () => Vine[];
  rect: DOMRect;
}

export const GRAVITY = 1500;

export abstract class Creature {
  el: HTMLDivElement;
  body: HTMLDivElement;
  bubble: HTMLDivElement;
  pupils: SVGElement[];
  habitat: Habitat;
  x: number;
  y: number;
  vx = 0;
  vy = 0;
  rot = 0;
  sx = 1;
  sy = 1;
  facing = 1;
  held = false;
  /** waktu di luar habitat asal saat tidak terlihat */
  away = 0;
  sayUntil = 0;
  visible = false;
  grounded = false;
  /** dengan reduced motion, satwa hanya bergerak sebentar setelah disentuh */
  wakeUntil = 0;

  constructor(
    public engine: FaunaEngine,
    public id: Exclude<FaunaId, 'kunang'>,
    public w: number,
    public h: number,
    public home: Habitat,
    x: number,
    y: number,
  ) {
    this.habitat = home;
    this.x = x;
    this.y = y;
    this.el = document.createElement('div');
    this.el.className = `fauna fauna--${id}`;
    this.el.style.width = `${w}px`;
    this.el.style.height = `${h}px`;
    this.el.tabIndex = 0;
    this.el.setAttribute('role', 'button');
    this.body = document.createElement('div');
    this.body.className = 'fauna__body';
    this.body.innerHTML = ART[id];
    this.bubble = document.createElement('div');
    this.bubble.className = 'fauna__say';
    this.el.append(this.body, this.bubble);
    this.pupils = Array.from(this.body.querySelectorAll<SVGElement>('.f-pupil'));
    home.el.appendChild(this.el);
    this.el.addEventListener('pointerdown', (e) => engine.grab(this, e));
    this.el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.touched();
        this.poke();
      }
    });
    this.label();
    if (!world.get().found.includes(id)) this.state('is-new', true);
    this.el.style.setProperty('--blink', `${(3 + Math.random() * 4).toFixed(2)}s`);
  }

  label(): void {
    this.el.setAttribute('aria-label', speciesById[this.id].name[world.get().lang]);
  }

  /** dipanggil tiap frame saat terlihat dan tidak sedang dipegang */
  abstract think(t: number, dt: number): void;
  /** diklik atau ditekan Enter */
  abstract poke(): void;
  /** dilepas setelah diseret */
  abstract released(thrown: boolean): void;
  /** mulai dipegang */
  grabbed(): void {
    /* sebagian satwa tidak perlu reaksi khusus */
  }

  sound(): void {
    sfx.pop();
  }

  touched(): void {
    this.engine.discover(this.id);
    this.state('is-new', false);
    this.wakeUntil = performance.now() + 3500;
  }

  say(text: string, ms = 2600): void {
    if (!text) return;
    this.bubble.textContent = text;
    this.bubble.classList.add('is-on');
    this.sayUntil = performance.now() + ms;
    /* gelembung jangan keluar layar */
    requestAnimationFrame(() => {
      const r = this.bubble.getBoundingClientRect();
      const over = Math.max(0, r.right - innerWidth + 12) - Math.max(0, 12 - r.left);
      this.bubble.style.setProperty('--shift', `${-over}px`);
    });
  }

  line(kind: 'poke' | 'held' | 'lost' | 'night', ms?: number): void {
    const lang = world.get().lang;
    const set = speciesById[this.id].lines[kind];
    if (!set) return;
    const arr = set[lang];
    this.say(arr[Math.floor(Math.random() * arr.length)], ms);
  }

  state(cls: string, on: boolean): void {
    this.el.classList.toggle(cls, on);
  }

  /** gravitasi + tanah + dinding. Mengembalikan true saat baru mendarat */
  fall(dt: number, g = GRAVITY): boolean {
    const was = this.grounded;
    this.vy += g * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    const W = this.habitat.width();
    const pad = this.w * 0.4;
    if (this.x < pad) {
      this.x = pad;
      this.vx = Math.abs(this.vx) * 0.5;
    }
    if (this.x > W - pad) {
      this.x = W - pad;
      this.vx = -Math.abs(this.vx) * 0.5;
    }
    const gy = this.habitat.ground(this.x);
    if (this.y >= gy) {
      this.y = gy;
      this.grounded = true;
      return !was;
    }
    this.grounded = false;
    return false;
  }

  /** posisi di layar */
  screen(): [number, number] {
    if (this.held) return [this.x, this.y];
    const r = this.habitat.rect;
    return [r.left + this.x, r.top + this.y];
  }

  render(): void {
    this.el.style.transform = `translate3d(${(this.x - this.w / 2).toFixed(1)}px,${(this.y - this.h).toFixed(1)}px,0)`;
    this.body.style.transform = `rotate(${this.rot.toFixed(3)}rad) scale(${(this.facing * this.sx).toFixed(3)},${this.sy.toFixed(3)})`;
  }

  /** bola mata mengikuti kursor */
  look(): void {
    if (pointer.x == null || pointer.y == null || !this.pupils.length) return;
    const [sx, sy] = this.screen();
    const dx = pointer.x - sx;
    const dy = pointer.y - (sy - this.h * 0.6);
    const d = Math.hypot(dx, dy) || 1;
    const k = Math.min(1, d / 200) * 3.4;
    const px = ((dx / d) * k * this.facing).toFixed(2);
    const py = ((dy / d) * k).toFixed(2);
    for (const p of this.pupils) p.style.transform = `translate(${px}px,${py}px)`;
  }

  frame(t: number, dt: number): void {
    if (this.sayUntil && performance.now() > this.sayUntil) {
      this.bubble.classList.remove('is-on');
      this.sayUntil = 0;
    }
    if (this.held) {
      this.rot += (clamp(this.vx * 0.0011, -0.7, 0.7) - this.rot) * 0.16;
      this.render();
      this.look();
      return;
    }
    const r = this.habitat.rect;
    this.visible = r.bottom > -160 && r.top < innerHeight + 160;
    if (!this.visible) {
      /* tersesat di habitat lain? diam-diam pulang saat tidak terlihat */
      if (this.habitat !== this.home) {
        this.away += dt;
        if (this.away > 2.5) this.goHome();
      }
      return;
    }
    this.away = 0;
    this.think(t, reduced && performance.now() > this.wakeUntil ? 0 : dt);
    this.render();
    this.look();
  }

  goHome(): void {
    this.habitat = this.home;
    this.home.el.appendChild(this.el);
    this.away = 0;
    this.placeHome();
  }

  abstract placeHome(): void;
}

export class FaunaEngine {
  habitats = new Map<LayerId, Habitat>();
  creatures: Creature[] = [];
  dragLayer: HTMLElement | null = null;
  dragging: Creature | null = null;
  grabX = 0;
  grabY = 0;
  grabT = 0;
  moved = 0;
  lastPX = 0;
  lastPY = 0;
  lastPT = 0;
  encounterCooldown = new Map<string, number>();
  /** scroll otomatis saat satwa dibawa ke tepi layar */
  edgeScroll: ((dy: number) => void) | null = null;

  addHabitat(h: Omit<Habitat, 'rect'>): Habitat {
    const full: Habitat = { ...h, rect: h.el.getBoundingClientRect() };
    this.habitats.set(h.id, full);
    return full;
  }

  habitat(id: LayerId): Habitat {
    return this.habitats.get(id) as Habitat;
  }

  add<T extends Creature>(c: T): T {
    this.creatures.push(c);
    c.render();
    return c;
  }

  discover(id: FaunaId): void {
    if (world.discover(id)) {
      const { lang, found } = world.get();
      const n = speciesById[id].name[lang];
      const total = Object.keys(speciesById).length;
      world.toast(lang === 'id' ? `Tercatat di buku fauna: ${n} (${found.length}/${total})` : `Added to the field guide: ${n} (${found.length}/${total})`);
      sfx.sparkle();
    }
  }

  habitatAt(sx: number, sy: number): Habitat {
    let best: Habitat | null = null;
    let bd = Infinity;
    for (const h of this.habitats.values()) {
      const r = h.el.getBoundingClientRect();
      h.rect = r;
      const d = sy < r.top ? r.top - sy : sy > r.bottom ? sy - r.bottom : 0;
      if (d === 0 && sx >= r.left && sx <= r.right) return h;
      if (d < bd) {
        bd = d;
        best = h;
      }
    }
    return best as Habitat;
  }

  grab(c: Creature, e: PointerEvent): void {
    if (e.button !== 0 || this.dragging) return;
    e.preventDefault();
    e.stopPropagation();
    this.dragging = c;
    this.grabX = e.clientX;
    this.grabY = e.clientY;
    this.lastPX = e.clientX;
    this.lastPY = e.clientY;
    this.lastPT = performance.now();
    this.grabT = this.lastPT;
    this.moved = 0;
    addEventListener('pointermove', this.drag);
    addEventListener('pointerup', this.drop);
    addEventListener('pointercancel', this.drop);
  }

  private lift(c: Creature, e: PointerEvent): void {
    const [sx, sy] = c.screen();
    c.held = true;
    c.x = sx + (e.clientX - this.grabX);
    c.y = sy + (e.clientY - this.grabY);
    c.vx = 0;
    c.vy = 0;
    c.grounded = false;
    (this.dragLayer as HTMLElement).appendChild(c.el);
    c.state('is-held', true);
    document.documentElement.classList.add('is-carrying');
    c.grabbed();
    c.touched();
    c.line('held', 1800);
    c.sound();
  }

  drag = (e: PointerEvent): void => {
    const c = this.dragging;
    if (!c) return;
    const dx = e.clientX - this.lastPX;
    const dy = e.clientY - this.lastPY;
    this.moved += Math.hypot(dx, dy);
    if (!c.held && this.moved > 6) this.lift(c, e);
    const now = performance.now();
    const dt = Math.max(1, now - this.lastPT) / 1000;
    this.lastPX = e.clientX;
    this.lastPY = e.clientY;
    this.lastPT = now;
    if (!c.held) return;
    c.x += dx;
    c.y += dy;
    c.vx += (dx / dt - c.vx) * 0.35;
    c.vy += (dy / dt - c.vy) * 0.35;
    if (this.edgeScroll) {
      const edge = 70;
      if (e.clientY < edge) this.edgeScroll(-(edge - e.clientY) * 0.5);
      else if (e.clientY > innerHeight - edge) this.edgeScroll((e.clientY - innerHeight + edge) * 0.5);
    }
  };

  drop = (): void => {
    const c = this.dragging;
    removeEventListener('pointermove', this.drag);
    removeEventListener('pointerup', this.drop);
    removeEventListener('pointercancel', this.drop);
    this.dragging = null;
    if (!c) return;
    if (!c.held) {
      c.touched();
      c.poke();
      return;
    }
    const idle = performance.now() - this.lastPT > 90;
    const sx = clamp(c.x, 12, innerWidth - 12);
    const sy = clamp(c.y, 12, innerHeight - 12);
    const h = this.habitatAt(sx, sy);
    c.habitat = h;
    h.el.appendChild(c.el);
    c.x = clamp(sx - h.rect.left, 30, h.width() - 30);
    c.y = sy - h.rect.top;
    c.held = false;
    c.state('is-held', false);
    c.rot = 0;
    document.documentElement.classList.remove('is-carrying');
    if (idle) {
      c.vx = 0;
      c.vy = 0;
    }
    c.vx = clamp(c.vx, -1500, 1500);
    c.vy = clamp(c.vy, -1500, 1500);
    c.released(Math.hypot(c.vx, c.vy) > 120);
    if (h !== c.home) c.line('lost', 2400);
    this.greet(c);
  };

  /** dua satwa berdekatan saling bicara */
  greet(c: Creature): void {
    for (const o of this.creatures) {
      if (o === c || o.id === c.id || o.habitat !== c.habitat || o.id === 'kupu' || c.id === 'kupu') continue;
      if (Math.hypot(o.x - c.x, o.y - c.y) > 260) continue;
      this.talk(c, o);
      return;
    }
  }

  private talk(a: Creature, b: Creature): void {
    const key = [a.id, b.id].sort().join('|');
    const set = ENCOUNTERS[key];
    if (!set) return;
    const now = performance.now();
    if ((this.encounterCooldown.get(key) ?? 0) > now) return;
    this.encounterCooldown.set(key, now + 9000);
    const [first, second] = a.id < b.id ? [a, b] : [b, a];
    const lang = world.get().lang;
    const pick = set[Math.floor(Math.random() * set.length)];
    setTimeout(() => first.say(pick.a[lang], 2600), 700);
    setTimeout(() => second.say(pick.b[lang], 2800), 2500);
  }

  update(t: number, dt: number): void {
    for (const h of this.habitats.values()) h.rect = h.el.getBoundingClientRect();
    for (const c of this.creatures) c.frame(t, dt);
    /* sesekali satwa yang berdekatan mengobrol sendiri */
    if (Math.floor(t * 2) !== Math.floor((t - dt) * 2)) {
      const walkers = this.creatures.filter((c) => c.visible && c.id !== 'kupu');
      for (let i = 0; i < walkers.length; i++) {
        for (let j = i + 1; j < walkers.length; j++) {
          const a = walkers[i];
          const b = walkers[j];
          if (a.habitat === b.habitat && a.id !== b.id && Math.hypot(a.x - b.x, a.y - b.y) < 150) this.talk(a, b);
        }
      }
    }
  }

  relabel(): void {
    this.creatures.forEach((c) => c.label());
  }

  impact(c: Creature, big = false): void {
    const [sx, sy] = c.screen();
    dust(sx, sy, big ? 18 : 8);
    c.sx = 1.16;
    c.sy = 0.8;
    if (big) sfx.thud();
  }
}

export const fauna = new FaunaEngine();
