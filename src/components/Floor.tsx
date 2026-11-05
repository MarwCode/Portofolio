import { useEffect, useRef, useState } from 'react';
import { fmtAlt, useT } from '../core/i18n';
import { onLayout } from '../core/layout';
import { sfx } from '../core/sound';
import { onTick, reduced, touch } from '../core/ticker';
import { useWorld } from '../core/world';
import { layers, nursery } from '../data/portfolio';
import { fauna } from '../fauna/engine';
import { sparkle } from '../fauna/fx';
import { ctx2d, rng, Specimen, SPECIES, TAU, type Ink, type SpeciesName } from '../flora/flora';
import { Reveal } from './Reveal';

/* ---------- petak tahap Teman AI ---------- */
function Bed({ i }: { i: number }) {
  const t = useT();
  const lang = useWorld((s) => s.lang);
  const n = nursery[i];
  const cv = useRef<HTMLCanvasElement>(null);
  const box = useRef<HTMLLIElement>(null);
  const [shake, setShake] = useState(false);
  const grow = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!n.done || !n.species) return;
    const sp = new Specimen(cv.current as HTMLCanvasElement, SPECIES[n.species], { seed: n.seed });
    let v = reduced ? 1 : 0;
    let on = reduced;
    if (reduced) sp.render(1);
    const io = new IntersectionObserver((e, o) => {
      if (e[0].isIntersecting) {
        on = true;
        o.disconnect();
      }
    }, { threshold: 0.3 });
    io.observe(box.current as HTMLLIElement);
    grow.current = () => {
      v = 0;
      on = true;
    };
    const off = onTick((_t, dt) => {
      if (!on || v >= 1) return;
      v = Math.min(1, v + dt / 1.8);
      sp.render(v);
    });
    const offL = onLayout(() => sp.resize(), 3);
    return () => {
      off();
      offL();
      io.disconnect();
    };
  }, [n]);

  const click = () => {
    if (n.done) {
      grow.current?.();
      sfx.pop();
    } else {
      setShake(true);
      sfx.thud();
      setTimeout(() => setShake(false), 700);
    }
  };

  return (
    <li className={`bed ${n.done ? 'is-done' : 'is-next'}`} ref={box}>
      <button type="button" className="bed__pot" onClick={click} aria-label={`${t('floorStage')} ${n.stage}: ${n.label[lang]}`}>
        {n.done ? <canvas ref={cv} aria-hidden="true" /> : <span className={`bed__seed ${shake ? 'is-shake' : ''}`} aria-hidden="true" />}
        {!n.done && shake && <span className="bed__tip">{t('floorSeed')}</span>}
      </button>
      <p className="bed__label">
        <span className="bed__stage">{`${t('floorStage')} ${n.stage} · ${n.done ? t('floorDone') : t('floorNext')}`}</span>
        <span>{n.label[lang]}</span>
      </p>
    </li>
  );
}

/* ---------- lahan tanam ---------- */
interface Plant { x: number; y: number; w: number; h: number; sp: Specimen; cv: HTMLCanvasElement; t: number; bloom: number; bloomColor: string }
interface Seed { x: number; y: number; vy: number; gy: number; done?: boolean }

const INKS: Pick<Ink, 'line' | 'fill' | 'glow'>[] = [
  { line: '#cfe68a', fill: 'rgba(207,230,138,.2)', glow: '#efb25c' },
  { line: '#9ed79a', fill: 'rgba(158,215,154,.2)', glow: '#c9f25a' },
  { line: '#eaf0d8', fill: 'rgba(234,240,216,.14)', glow: '#c9f25a' },
  { line: '#e6c07a', fill: 'rgba(230,192,122,.2)', glow: '#c9f25a' },
];

export const plotApi = { bloomNear: (_x: number) => {} };

function Plot() {
  const t = useT();
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [count, setCount] = useState(0);
  const [blooms, setBlooms] = useState(0);

  useEffect(() => {
    const host = wrap.current as HTMLDivElement;
    const c = canvas.current as HTMLCanvasElement;
    const x = ctx2d(c);
    let W = 0;
    let H = 0;
    let dpr = 1;
    let bg: HTMLCanvasElement | null = null;
    let plants: Plant[] = [];
    let seeds: Seed[] = [];
    let dirty = true;
    let visible = false;

    const groundY = (px: number) => H - 64 + Math.sin(px * 0.006) * 12 + Math.sin(px * 0.017 + 2) * 5;

    const addPlant = (px: number, grown: boolean) => {
      const r = rng(Math.floor(Math.random() * 1e9));
      const species = r.pick<SpeciesName>(['tunas', 'pakisKecil', 'tunas', 'jamur', 'pakisKecil']);
      const maxH = Math.min(260, H * 0.6);
      const h = species === 'jamur' ? r.range(60, 110) : r.range(90, maxH);
      const w = h * 1.5;
      const cv = document.createElement('canvas');
      const sp = new Specimen(cv, SPECIES[species], { seed: Math.floor(r() * 1e6), size: { width: w, height: h }, ink: r.pick(INKS), maxDpr: 1.5 });
      const plant: Plant = { x: px, y: groundY(px), w, h, sp, cv, t: grown ? 1 : 0, bloom: 0, bloomColor: r.pick(['#ff7ba8', '#ffd24d', '#ff8f4d', '#e8a0ff']) };
      sp.render(plant.t);
      plants.push(plant);
      if (plants.length > 70) plants.splice(0, 1);
      dirty = true;
    };

    const build = () => {
      const rect = c.getBoundingClientRect();
      dpr = Math.min(devicePixelRatio || 1, 1.5);
      W = rect.width;
      H = rect.height;
      c.width = Math.round(W * dpr);
      c.height = Math.round(H * dpr);
      bg = document.createElement('canvas');
      bg.width = c.width;
      bg.height = c.height;
      const g = ctx2d(bg);
      g.scale(dpr, dpr);
      const r = rng(404);
      g.beginPath();
      g.moveTo(0, H);
      for (let px = 0; px <= W + 6; px += 6) g.lineTo(px, groundY(px));
      g.lineTo(W, H);
      g.closePath();
      const soil = g.createLinearGradient(0, H - 80, 0, H);
      soil.addColorStop(0, '#2c3b1e');
      soil.addColorStop(0.2, '#2b2214');
      soil.addColorStop(1, '#231710');
      g.fillStyle = soil;
      g.fill();
      for (let i = 0; i < W / 7; i++) {
        const px = r() * W;
        const py = groundY(px) + r.range(-1, 7);
        g.save();
        g.translate(px, py);
        g.rotate(r.range(-0.5, 0.5));
        g.fillStyle = r.pick(['#6d4a22', '#8a6230', '#54391c', '#3f4d24', '#a57a3a']);
        g.globalAlpha = r.range(0.5, 0.95);
        g.beginPath();
        g.ellipse(0, 0, r.range(3, 9), r.range(1, 2.4), 0, 0, TAU);
        g.fill();
        g.restore();
      }
      g.lineCap = 'round';
      for (let i = 0; i < W / 2.4; i++) {
        const px = r() * W;
        const py = groundY(px) + 2;
        const h = r.range(4, 20);
        g.strokeStyle = r.pick(['#3f6b35', '#2e5a33', '#5c8a3e', '#254a2c']);
        g.globalAlpha = r.range(0.6, 1);
        g.lineWidth = r.range(0.8, 1.8);
        g.beginPath();
        g.moveTo(px, py);
        g.quadraticCurveTo(px + r.range(-3, 3), py - h * 0.6, px + r.range(-7, 7), py - h);
        g.stroke();
      }
      plants = plants.filter((p) => p.x < W);
      plants.forEach((p) => (p.y = groundY(p.x)));
      if (!plants.length) {
        const n = Math.max(5, Math.round(W / 170));
        for (let i = 0; i < n; i++) addPlant(((i + r.range(0.1, 0.9)) / n) * W, true);
      }
      dirty = true;
    };

    const plantAt = (cx: number, cy: number) => {
      const rect = c.getBoundingClientRect();
      const px = cx - rect.left;
      const py = cy - rect.top;
      const gy = groundY(px);
      setCount((v) => v + 1);
      sfx.pop();
      if (reduced || py >= gy - 8) addPlant(px, reduced);
      else seeds.push({ x: px, y: py, vy: 40, gy });
      dirty = true;
    };

    /* jari menanam saat diketuk, supaya scroll tidak ikut menanam */
    let finger = false;
    const down = (e: PointerEvent) => {
      finger = e.pointerType !== 'mouse';
      if (!finger) plantAt(e.clientX, e.clientY);
    };
    const click = (e: MouseEvent) => {
      if (finger) plantAt(e.clientX, e.clientY);
      finger = false;
    };
    c.addEventListener('pointerdown', down);
    c.addEventListener('click', click);

    plotApi.bloomNear = (screenX: number) => {
      const rect = c.getBoundingClientRect();
      const px = screenX - rect.left;
      let any = false;
      for (const p of plants) {
        if (Math.abs(p.x - px) < 170 && p.bloom === 0) {
          p.bloom = 0.01;
          any = true;
          setBlooms((v) => v + 1);
          sparkle(rect.left + p.x, rect.top + p.y - p.h, p.bloomColor, 8);
        }
      }
      if (any) sfx.sparkle();
    };

    const io = new IntersectionObserver((e) => {
      visible = e[0].isIntersecting;
      dirty = true;
    }, { rootMargin: '120px' });
    io.observe(host);

    const off = onTick((_t, dt) => {
      if (!visible) return;
      for (const s of seeds) {
        s.vy += 1500 * dt;
        s.y += s.vy * dt;
        if (s.y >= s.gy) {
          s.done = true;
          addPlant(s.x, false);
        }
      }
      if (seeds.some((s) => s.done)) seeds = seeds.filter((s) => !s.done);
      for (const p of plants) {
        if (p.t < 1) {
          p.t = Math.min(1, p.t + dt / 2.2);
          p.sp.render(p.t);
          dirty = true;
        }
        if (p.bloom > 0 && p.bloom < 1) {
          p.bloom = Math.min(1, p.bloom + dt / 0.7);
          dirty = true;
        }
      }
      if (seeds.length) dirty = true;
      if (!dirty || !bg) return;
      dirty = false;
      x.setTransform(1, 0, 0, 1, 0, 0);
      x.clearRect(0, 0, c.width, c.height);
      x.setTransform(dpr, 0, 0, dpr, 0, 0);
      x.drawImage(bg, 0, 0, W, H);
      for (const p of plants) {
        x.drawImage(p.cv, p.x - p.w / 2, p.y - p.h + 3, p.w, p.h);
        if (p.bloom > 0) {
          /* bunga kecil di pucuk */
          const k = p.bloom;
          const px = p.x;
          const py = p.y - p.h * 0.86;
          x.fillStyle = p.bloomColor;
          for (let i = 0; i < 6; i++) {
            const a = (i / 6) * TAU;
            x.beginPath();
            x.ellipse(px + Math.cos(a) * 8 * k, py + Math.sin(a) * 8 * k, 7 * k, 4 * k, a, 0, TAU);
            x.fill();
          }
          x.fillStyle = '#ffe9a0';
          x.beginPath();
          x.arc(px, py, 4 * k, 0, TAU);
          x.fill();
        }
      }
      x.fillStyle = '#efb25c';
      for (const s of seeds) {
        x.beginPath();
        x.ellipse(s.x, s.y, 3, 4.4, 0, 0, TAU);
        x.fill();
      }
    });

    const offL = onLayout(build, 3);

    fauna.addHabitat({ id: 'lantai', el: host, ground: groundY, width: () => W });

    return () => {
      off();
      offL();
      io.disconnect();
    };
  }, []);

  return (
    <div className="plot" ref={wrap}>
      <div className="plot__copy wrap">
        <p className="plot__title">{t('plotTitle')}</p>
        <p className="plot__hint">
          {touch ? t('plotHintTouch') : t('plotHint')} <b>{count}</b> {t('plotCount')}{blooms > 0 ? <>, <b>{blooms}</b> {t('plotBloom')}</> : null}
        </p>
      </div>
      <canvas ref={canvas} aria-hidden="true" />
    </div>
  );
}

export default function Floor() {
  const t = useT();
  const lang = useWorld((s) => s.lang);
  const lantai = layers[3];
  return (
    <section className="floor" id="lantai">
      <div className="wrap">
        <Reveal as="p" className="stratum">{`${fmtAlt(lantai.alt)} m · ${lantai.name[lang]}`}</Reveal>
        <div className="floor__head">
          <Reveal as="h2">{t('floorTitle')}</Reveal>
          <div>
            <Reveal as="p" className="floor__fact">{t('floorFact')}</Reveal>
            <Reveal as="p" className="lead">{t('floorP')}</Reveal>
          </div>
        </div>
        <ol className="nursery">{nursery.map((_, i) => <Bed key={i} i={i} />)}</ol>
      </div>
      <Plot />
    </section>
  );
}
