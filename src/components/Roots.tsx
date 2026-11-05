import { useEffect, useRef } from 'react';
import { fmtAlt, useT } from '../core/i18n';
import { onLayout } from '../core/layout';
import { sfx } from '../core/sound';
import { onTick, reduced, touch } from '../core/ticker';
import { useWorld } from '../core/world';
import { layers, projects, taproot, tech } from '../data/portfolio';
import { fauna } from '../fauna/engine';
import { clamp, ctx2d, lerp, rng, TAU, type Rng } from '../flora/flora';
import { openNotes } from './ProjectDialog';
import { Reveal } from './Reveal';

type Pt = [number, number];
interface Hair { at: number; o: Pt; end: Pt; ctrl: Pt; s: number }
interface Edge { p: number; t: string; pts: Pt[]; hairs: Hair[]; delay: number; speed: number; ph: number; w: number }
interface Pull { x: number; y: number; vx: number; vy: number; held: boolean }

/* lantai terowongan trenggiling: berbukit supaya bolanya bisa menggelinding */
const tunnelTop = 96;
function terrain(x: number, H: number): number {
  return H - 40 + Math.sin(x * 0.0058) * 26 + Math.sin(x * 0.0021 + 1.4) * 12;
}

function rootPath(a: { x: number; y: number }, b: { x: number; y: number }, r: Rng): Pt[] {
  const n = 54;
  const wander = r.range(16, 54);
  const f1 = r.range(3, 7);
  const f2 = r.range(8, 15);
  const p1 = r() * TAU;
  const p2 = r() * TAU;
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const s = i / n;
    const e = s * s * (3 - 2 * s);
    const env = Math.sin(s * Math.PI);
    pts.push([lerp(a.x, b.x, e) + env * (Math.sin(s * f1 + p1) * wander + Math.sin(s * f2 + p2) * wander * 0.3), lerp(a.y, b.y, s)]);
  }
  return pts;
}

export default function Roots() {
  const t = useT();
  const lang = useWorld((s) => s.lang);
  const section = useRef<HTMLElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const soilC = useRef<HTMLCanvasElement>(null);
  const rootC = useRef<HTMLCanvasElement>(null);
  const akar = layers[4];

  useEffect(() => {
    const sec = section.current as HTMLElement;
    const box = wrap.current as HTMLDivElement;
    const c = rootC.current as HTMLCanvasElement;
    const x = ctx2d(c);
    let W = 0;
    let H = 0;
    let dpr = 1;
    let edges: Edge[] = [];
    let active: { p?: number; t?: string } | null = null;
    let pinned = false;
    let visible = false;
    let g = reduced ? 1 : 0;
    const pulls = new Map<string, Pull>(tech.map((n) => [n, { x: 0, y: 0, vx: 0, vy: 0, held: false }]));
    const techEls = Array.from(box.querySelectorAll<HTMLButtonElement>('.roott'));
    const projEls = Array.from(box.querySelectorAll<HTMLButtonElement>('.rootp'));

    const edgeOn = (e: Edge) => (active ? (active.p != null ? e.p === active.p : e.t === active.t) : false);

    const setActive = (a: { p?: number; t?: string } | null) => {
      active = a;
      const onP = new Set<string>();
      const onT = new Set<string>();
      if (a) {
        edges.forEach((e) => {
          if (edgeOn(e)) {
            onP.add(String(e.p));
            onT.add(e.t);
          }
        });
      }
      projEls.forEach((b) => {
        b.classList.toggle('is-on', onP.has(b.dataset.p as string));
        b.classList.toggle('is-dim', !!a && !onP.has(b.dataset.p as string));
      });
      techEls.forEach((b) => {
        b.classList.toggle('is-on', onT.has(b.dataset.t as string));
        b.classList.toggle('is-dim', !!a && !onT.has(b.dataset.t as string));
      });
    };

    const drawSoil = () => {
      const s = soilC.current as HTMLCanvasElement;
      const rect = s.getBoundingClientRect();
      s.width = Math.round(rect.width);
      s.height = Math.round(rect.height);
      const q = ctx2d(s);
      const SW = s.width;
      const SH = s.height;
      const r = rng(9);
      for (let i = 0; i < 9; i++) {
        const base = (SH * (i + 0.7)) / 9;
        const ph = r() * TAU;
        q.beginPath();
        q.moveTo(0, base);
        for (let px = 0; px <= SW + 20; px += 20) q.lineTo(px, base + Math.sin(px * 0.004 + ph) * 18 + Math.sin(px * 0.013 + ph) * 6);
        q.lineTo(SW, base + 90);
        q.lineTo(0, base + 90);
        q.closePath();
        q.fillStyle = `rgba(${i % 2 ? '70,44,24' : '10,6,4'},.1)`;
        q.fill();
      }
      const speck = Math.floor((SW * SH) / 1500);
      for (let i = 0; i < speck; i++) {
        q.fillStyle = r() < 0.5 ? 'rgba(150,108,70,.14)' : 'rgba(0,0,0,.2)';
        q.fillRect(r() * SW, r() * SH, r.range(1, 2.6), r.range(1, 2.2));
      }
      const stones = Math.floor((SW * SH) / 42000);
      for (let i = 0; i < stones; i++) {
        const px = r() * SW;
        const py = r() * (SH - 160);
        const rx = r.range(5, 30);
        const ry = rx * r.range(0.45, 0.8);
        const gr = q.createRadialGradient(px - rx * 0.3, py - ry * 0.4, 1, px, py, rx);
        gr.addColorStop(0, 'rgba(120,98,76,.5)');
        gr.addColorStop(1, 'rgba(46,32,22,.5)');
        q.fillStyle = gr;
        q.beginPath();
        q.ellipse(px, py, rx, ry, r.range(-0.5, 0.5), 0, TAU);
        q.fill();
      }
      /* terowongan trenggiling */
      q.beginPath();
      q.moveTo(0, SH);
      for (let px = 0; px <= SW + 8; px += 8) q.lineTo(px, terrain(px, SH));
      for (let px = SW; px >= -8; px -= 8) q.lineTo(px, terrain(px, SH) - tunnelTop - Math.sin(px * 0.01) * 10);
      q.closePath();
      q.fillStyle = 'rgba(8,4,2,.82)';
      q.fill();
      q.strokeStyle = 'rgba(158,112,68,.36)';
      q.lineWidth = 2;
      q.stroke();
    };

    const build = () => {
      const r0 = box.getBoundingClientRect();
      dpr = Math.min(devicePixelRatio || 1, 1.5);
      W = r0.width;
      H = r0.height;
      c.width = Math.round(W * dpr);
      c.height = Math.round(H * dpr);
      const r = rng(2026);
      const projA: Record<string, { x: number; y: number }> = {};
      projEls.forEach((b) => {
        const q = b.getBoundingClientRect();
        projA[b.dataset.p as string] = { x: q.left + q.width / 2 - r0.left, y: q.bottom - r0.top };
      });
      const techA: Record<string, { x: number; y: number }> = {};
      techEls.forEach((b) => {
        const q = b.getBoundingClientRect();
        const pull = pulls.get(b.dataset.t as string) as Pull;
        techA[b.dataset.t as string] = { x: q.left + q.width / 2 - r0.left - pull.x, y: q.top - r0.top + 4 - pull.y };
      });
      edges = [];
      projects.forEach((p, i) => {
        const list = p.stack.concat(p.stack.includes(taproot) ? [] : [taproot]);
        list.forEach((name) => {
          if (!techA[name]) return;
          const pts = rootPath(projA[i], techA[name], r);
          const hairs: Hair[] = [];
          const count = Math.floor(r.range(3, 8));
          for (let k = 0; k < count; k++) {
            const at = r.range(0.14, 0.92);
            const o = pts[Math.floor(at * (pts.length - 1))];
            const side = r() < 0.5 ? -1 : 1;
            const len = r.range(16, 64);
            hairs.push({ at, o, end: [o[0] + side * len, o[1] + r.range(4, 34)], ctrl: [o[0] + side * len * 0.5, o[1] - r.range(0, 8)], s: at });
          }
          edges.push({ p: i, t: name, pts, hairs, delay: r.range(0, 0.24), speed: r.range(0.08, 0.17), ph: r(), w: name === taproot ? 5.4 : r.range(2.4, 4.2) });
        });
      });
      drawSoil();
    };

    const io = new IntersectionObserver((e) => {
      visible = e[0].isIntersecting;
    }, { rootMargin: '120px' });
    io.observe(sec);

    /* label teknologi bisa ditarik; akarnya melar lalu memantul balik */
    let dragEl: HTMLButtonElement | null = null;
    let dragPull: Pull | null = null;
    let sx = 0;
    let sy = 0;
    let travel = 0;
    const move = (e: PointerEvent) => {
      if (!dragPull) return;
      const nx = e.clientX - sx;
      const ny = e.clientY - sy;
      travel += Math.abs(nx - dragPull.x) + Math.abs(ny - dragPull.y);
      dragPull.x = nx;
      dragPull.y = ny;
    };
    const up = () => {
      if (dragPull) {
        dragPull.held = false;
        dragEl?.classList.remove('is-held');
      }
      dragPull = null;
      dragEl = null;
    };
    addEventListener('pointermove', move);
    addEventListener('pointerup', up);
    addEventListener('pointercancel', up);

    techEls.forEach((b) => {
      const name = b.dataset.t as string;
      const a = { t: name };
      b.addEventListener('pointerenter', () => !pinned && !touch && setActive(a));
      b.addEventListener('pointerleave', () => !pinned && !touch && setActive(null));
      b.addEventListener('focus', () => setActive(a));
      b.addEventListener('blur', () => !pinned && setActive(null));
      b.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'touch') return;
        const pull = pulls.get(name) as Pull;
        dragPull = pull;
        dragEl = b;
        pull.held = true;
        sx = e.clientX - pull.x;
        sy = e.clientY - pull.y;
        travel = 0;
        b.classList.add('is-held');
        e.preventDefault();
      });
      b.addEventListener('click', () => {
        if (travel > 8) return;
        const same = active?.t === name && pinned;
        pinned = !same;
        setActive(same ? null : a);
        sfx.pop();
      });
    });
    projEls.forEach((b) => {
      const i = Number(b.dataset.p);
      b.addEventListener('pointerenter', () => !pinned && !touch && setActive({ p: i }));
      b.addEventListener('pointerleave', () => !pinned && !touch && setActive(null));
      b.addEventListener('focus', () => setActive({ p: i }));
      b.addEventListener('blur', () => !pinned && setActive(null));
      b.addEventListener('click', () => openNotes(i));
    });

    const off = onTick((tt, dt) => {
      if (!visible) return;
      const q = c.getBoundingClientRect();
      if (!reduced) g = Math.max(g, clamp((innerHeight * 0.92 - q.top) / (q.height * 0.72)));
      /* pegas label */
      techEls.forEach((b) => {
        const p = pulls.get(b.dataset.t as string) as Pull;
        if (!p.held) {
          p.vx += (-160 * p.x - 11 * p.vx) * dt;
          p.vy += (-160 * p.y - 11 * p.vy) * dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
        }
        if (Math.abs(p.x) + Math.abs(p.y) > 0.1 || p.held) b.style.transform = `translate(${p.x.toFixed(1)}px,${p.y.toFixed(1)}px)`;
        else if (b.style.transform) b.style.transform = '';
      });
      x.setTransform(dpr, 0, 0, dpr, 0, 0);
      x.clearRect(0, 0, W, H);
      x.lineCap = 'round';
      x.lineJoin = 'round';
      const any = !!active;
      const at = (e: Edge, i: number): Pt => {
        /* ujung akar ikut tertarik, pangkalnya tidak bergerak */
        const pull = pulls.get(e.t) as Pull;
        const s = i / (e.pts.length - 1);
        const k = s * s;
        return [e.pts[i][0] + pull.x * k, e.pts[i][1] + pull.y * k];
      };
      for (let pass = 0; pass < 2; pass++) {
        for (const e of edges) {
          const on = edgeOn(e);
          if ((pass === 1) !== on) continue;
          const gi = clamp((g - e.delay) / (1 - e.delay));
          if (gi <= 0) continue;
          const n = e.pts.length - 1;
          const end = Math.floor(n * gi);
          x.strokeStyle = on ? '#ffd98f' : any ? 'rgba(125,88,54,.3)' : 'rgba(158,112,68,.74)';
          for (let i = 0; i < end; i += 3) {
            const j = Math.min(end, i + 3);
            x.lineWidth = lerp(e.w, 0.8, i / n) * (on ? 1.15 : 1);
            x.beginPath();
            const p0 = at(e, i);
            x.moveTo(p0[0], p0[1]);
            for (let k = i + 1; k <= j; k++) {
              const pk = at(e, k);
              x.lineTo(pk[0], pk[1]);
            }
            x.stroke();
          }
          x.lineWidth = 0.8;
          x.globalAlpha = on ? 0.9 : any ? 0.2 : 0.42;
          x.beginPath();
          const pull = pulls.get(e.t) as Pull;
          for (const h of e.hairs) {
            if (gi < h.at) continue;
            const k = h.s * h.s;
            x.moveTo(h.o[0] + pull.x * k, h.o[1] + pull.y * k);
            x.quadraticCurveTo(h.ctrl[0] + pull.x * k, h.ctrl[1] + pull.y * k, h.end[0] + pull.x * k, h.end[1] + pull.y * k);
          }
          x.stroke();
          x.globalAlpha = 1;
        }
      }
      if (!reduced) {
        x.globalCompositeOperation = 'lighter';
        for (const e of edges) {
          const on = edgeOn(e);
          if (any && !on) continue;
          const gi = clamp((g - e.delay) / (1 - e.delay));
          if (gi < 0.4) continue;
          const beads = on ? 3 : 1;
          for (let b = 0; b < beads; b++) {
            const s = (tt * e.speed * (on ? 2.4 : 1) + e.ph + b / beads) % 1;
            const p = at(e, Math.floor(s * gi * (e.pts.length - 1)));
            const R = on ? 9 : 6;
            const gr = x.createRadialGradient(p[0], p[1], 0, p[0], p[1], R);
            gr.addColorStop(0, on ? 'rgba(201,242,90,1)' : 'rgba(239,178,92,.85)');
            gr.addColorStop(1, 'rgba(239,178,92,0)');
            x.fillStyle = gr;
            x.beginPath();
            x.arc(p[0], p[1], R, 0, TAU);
            x.fill();
          }
        }
        x.globalCompositeOperation = 'source-over';
      }
    });

    const offL = onLayout(build, 6, true);

    fauna.addHabitat({
      id: 'akar',
      el: sec,
      ground: (px) => terrain(px, sec.clientHeight) - 2,
      width: () => sec.clientWidth,
    });

    return () => {
      off();
      offL();
      io.disconnect();
      removeEventListener('pointermove', move);
      removeEventListener('pointerup', up);
      removeEventListener('pointercancel', up);
    };
  }, []);

  return (
    <section className="roots" id="akar" ref={section}>
      <canvas className="roots__soil" ref={soilC} aria-hidden="true" />
      <div className="wrap roots__wrap" ref={wrap}>
        <canvas className="roots__canvas" ref={rootC} aria-hidden="true" />
        <div className="roots__projects">
          {projects.map((p, i) => <button key={p.title} type="button" className="rootp" data-p={i}>{p.title}</button>)}
        </div>
        <div className="roots__copy">
          <Reveal as="p" className="stratum">{`${fmtAlt(akar.alt)} m · ${akar.name[lang]}`}</Reveal>
          <Reveal as="h2">{t('rootsTitle')}</Reveal>
          <Reveal as="p" className="lead">{touch ? t('rootsPTouch') : t('rootsP')}</Reveal>
        </div>
        <div className="roots__tech">
          {tech.map((n) => <button key={n} type="button" className="roott" data-t={n}>{n}</button>)}
        </div>
      </div>
    </section>
  );
}
