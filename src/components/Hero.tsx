import { useEffect, useRef } from 'react';
import { useT } from '../core/i18n';
import { onLayout } from '../core/layout';
import { compact, forestSeed, onTick, pointer, reduced, touch } from '../core/ticker';
import { world, useWorld } from '../core/world';
import { site } from '../data/portfolio';
import { fauna } from '../fauna/engine';
import { Vine, VineSet } from '../fauna/vine';
import { buildHero, clamp, ease, Foliage, lerp } from '../flora/flora';

/** warna yang menempel di daun menurut jam hutan */
export function leafTint(n: number): string | null {
  if (n <= 0.02) return null;
  const k = clamp((n - 0.36) / 0.34);
  const r = Math.round(lerp(150, 6, k));
  const g = Math.round(lerp(64, 14, k));
  const b = Math.round(lerp(16, 34, k));
  const a = n < 0.5 ? 0.36 * (n / 0.5) : lerp(0.36, 0.64, (n - 0.5) * 2);
  return `rgba(${r},${g},${b},${a.toFixed(3)})`;
}

/* ---------- huruf nama yang bisa ditarik dan memantul ---------- */
interface Letter { el: HTMLSpanElement; x: number; y: number; vx: number; vy: number; held: boolean }

function useLetters(host: React.RefObject<HTMLHeadingElement | null>) {
  useEffect(() => {
    const root = host.current;
    if (!root) return;
    const letters: Letter[] = Array.from(root.querySelectorAll<HTMLSpanElement>('[data-letter]')).map((el) => ({ el, x: 0, y: 0, vx: 0, vy: 0, held: false }));
    let active: Letter | null = null;
    let sx = 0;
    let sy = 0;
    const move = (e: PointerEvent) => {
      if (!active) return;
      active.x = e.clientX - sx;
      active.y = e.clientY - sy;
    };
    const up = () => {
      if (active) {
        active.held = false;
        active.el.classList.remove('is-held');
      }
      active = null;
    };
    const handlers = letters.map((l) => {
      const down = (e: PointerEvent) => {
        e.preventDefault();
        active = l;
        l.held = true;
        l.el.classList.add('is-held');
        sx = e.clientX - l.x;
        sy = e.clientY - l.y;
      };
      l.el.addEventListener('pointerdown', down);
      return () => l.el.removeEventListener('pointerdown', down);
    });
    addEventListener('pointermove', move);
    addEventListener('pointerup', up);
    addEventListener('pointercancel', up);
    const off = onTick((_t, dt) => {
      for (const l of letters) {
        if (!l.held) {
          const ax = -190 * l.x - 13 * l.vx;
          const ay = -190 * l.y - 13 * l.vy;
          l.vx += ax * dt;
          l.vy += ay * dt;
          l.x += l.vx * dt;
          l.y += l.vy * dt;
        }
        if (Math.abs(l.x) + Math.abs(l.y) + Math.abs(l.vx) + Math.abs(l.vy) < 0.05) {
          if (l.el.style.transform) l.el.style.transform = '';
          continue;
        }
        l.el.style.transform = `translate(${l.x.toFixed(1)}px,${l.y.toFixed(1)}px) rotate(${(l.x * 0.12).toFixed(2)}deg)`;
      }
    });
    return () => {
      off();
      handlers.forEach((h) => h());
      removeEventListener('pointermove', move);
      removeEventListener('pointerup', up);
      removeEventListener('pointercancel', up);
    };
  }, [host]);
}

/* ---------- matahari yang bisa digeser ---------- */
function Sun() {
  const ref = useRef<HTMLButtonElement>(null);
  const t = useT();
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const root = document.documentElement;
    let u = 0.56;
    let dragging = false;
    const place = () => {
      const stage = el.parentElement as HTMLElement;
      const W = stage.clientWidth;
      const H = stage.clientHeight;
      const x = W * u;
      const y = H * (0.5 - 0.42 * Math.sin(Math.PI * clamp((u - 0.04) / 0.82)));
      el.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`;
      const night = clamp((u - 0.6) / 0.22);
      world.setNight(night);
      root.style.setProperty('--sun-x', `${(u * 100).toFixed(1)}%`);
      root.style.setProperty('--sun-y', `${((y / H) * 100).toFixed(1)}%`);
      root.style.setProperty('--dusk', clamp(night * 2.2).toFixed(3));
      root.style.setProperty('--deep', clamp((night - 0.5) * 2).toFixed(3));
      el.setAttribute('aria-valuenow', String(Math.round(night * 100)));
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      const r = (el.parentElement as HTMLElement).getBoundingClientRect();
      u = clamp((e.clientX - r.left) / r.width, 0.1, 0.84);
      place();
    };
    const down = (e: PointerEvent) => {
      dragging = true;
      el.classList.add('is-held');
      e.preventDefault();
    };
    const up = () => {
      dragging = false;
      el.classList.remove('is-held');
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') u = clamp(u + 0.04, 0.1, 0.84);
      else if (e.key === 'ArrowLeft') u = clamp(u - 0.04, 0.1, 0.84);
      else return;
      e.preventDefault();
      place();
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('keydown', key);
    addEventListener('pointermove', move);
    addEventListener('pointerup', up);
    addEventListener('pointercancel', up);
    const off = onLayout(place, 4);
    return () => {
      off();
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('keydown', key);
      removeEventListener('pointermove', move);
      removeEventListener('pointerup', up);
      removeEventListener('pointercancel', up);
    };
  }, []);
  return (
    <button ref={ref} className="sun" type="button" role="slider" aria-label={t('sunLabel')} aria-valuemin={0} aria-valuemax={100} aria-valuenow={0} title={t('sunLabel')}>
      <i className="sun__disc" />
      <i className="sun__moon" />
    </button>
  );
}

/* ---------- hero ---------- */
export default function Hero() {
  const t = useT();
  const stage = useRef<HTMLDivElement>(null);
  const backC = useRef<HTMLCanvasElement>(null);
  const frontC = useRef<HTMLCanvasElement>(null);
  const vineC = useRef<HTMLCanvasElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const foot = useRef<HTMLDivElement>(null);
  const dusk = useRef<HTMLDivElement>(null);
  const name = useRef<HTMLHeadingElement>(null);
  const night = useWorld((s) => s.night);
  const nightRef = useRef(0);
  nightRef.current = night;

  useLetters(name);

  useEffect(() => {
    const host = stage.current as HTMLDivElement;
    const hero = {
      back: new Foliage(backC.current as HTMLCanvasElement, { maxDpr: compact() ? 1.25 : 1.5 }),
      front: new Foliage(frontC.current as HTMLCanvasElement, { maxDpr: compact() ? 1.25 : 1.5 }),
      vines: new VineSet(vineC.current as HTMLCanvasElement, host),
      t0: 0, tier: 0, every: 1, avg: 0.016, frames: 0, tick: 0, settled: false, key: '', zoom: '', lastNight: -1, built: false, vw: 0, vh: 0,
    };

    const still = () => {
      const s = { t: 2, mx: null, my: null, open: 0, push: 0, tint: leafTint(nightRef.current) };
      hero.back.draw(s);
      hero.front.draw(s);
    };

    const buildVines = () => {
      const W = host.clientWidth;
      const H = host.clientHeight;
      hero.vines.fit();
      if (W === hero.vw && H === hero.vh) return;
      hero.vw = W;
      hero.vh = H;
      const xs = compact() ? [0.2, 0.84] : [0.2, 0.31, 0.7, 0.81];
      hero.vines.vines = xs.map((f, i) => new Vine(W * f, -8, H * (0.3 + (i % 2) * 0.09 + (i === 2 ? 0.05 : 0)), 12, i * 37 + 11));
    };

    const build = () => {
      hero.back.resize();
      hero.front.resize();
      buildHero(hero.back, hero.front, forestSeed, compact());
      hero.settled = false;
      if (reduced || hero.tier >= 3) still();
    };

    const lower = (dt: number) => {
      hero.frames++;
      if (hero.frames < 6) return; /* frame pertama selalu berat karena tekstur diunggah */
      hero.avg = lerp(hero.avg, dt, 0.16);
      if (hero.frames < 16) return;
      if (hero.avg > 0.06) {
        hero.tier = 3;
        document.documentElement.classList.add('is-light');
        hero.settled = true;
        still();
        return;
      }
      if (hero.avg > 0.03 && hero.frames > 70 && hero.tier < 2) {
        hero.tier++;
        hero.frames = 0;
        hero.avg = 0.016;
        if (hero.tier === 1) {
          hero.back.maxDpr = hero.front.maxDpr = 1;
          build();
        } else {
          hero.every = 2;
        }
      }
    };

    const offLayout = onLayout(() => {
      build();
      if (!hero.built) {
        hero.built = true;
        hero.t0 = performance.now() / 1000;
      }
      buildVines();
    }, 2);

    const end = () => Math.max(1, (host.parentElement as HTMLElement).offsetHeight - host.offsetHeight);

    const off = onTick((tt, dt, raw) => {
      if (!hero.built) return;
      const y = window.scrollY;
      const p = clamp(y / end());
      const age = reduced ? 9 : tt - hero.t0;
      const intro = 1 - ease(clamp((age - 0.1) / 2.1));
      const n = nightRef.current;
      if (intro === 0 && !hero.settled) {
        hero.settled = true;
        hero.front.flatten((it) => it.depth > 1, 1.12, true);
      }
      hero.vines.visible = p < 1;
      hero.vines.tint = n;
      if (p < 1) hero.vines.update(dt);
      if ((p < 1 || intro > 0) && !reduced) {
        if (hero.tier < 3) {
          hero.tick++;
          if (hero.tick % hero.every === 0) {
            const state = {
              t: tt,
              mx: pointer.x,
              my: pointer.y,
              open: Math.pow(p, 1.5) * 1.5 - intro * 0.72,
              push: p < 0.9 && !touch ? 1 : 0,
              tint: leafTint(n),
            };
            hero.back.draw(state);
            hero.front.draw(state);
          }
          lower(raw);
        } else {
          if (n !== hero.lastNight) {
            hero.lastNight = n;
            still();
          }
          const z = p.toFixed(4);
          if (z !== hero.zoom) {
            hero.zoom = z;
            hero.back.canvas.style.transform = `scale(${(1 + p * 0.22).toFixed(4)})`;
            hero.front.canvas.style.transform = `scale(${(1 + p * 1.1).toFixed(4)})`;
          }
        }
      } else if (reduced && n !== hero.lastNight) {
        hero.lastNight = n;
        still();
      }
      if (reduced) return;
      /* hanya sentuh style saat nilainya berubah, supaya teks tidak terus dirender ulang */
      const fade = (1 - clamp((p - 0.34) / 0.42)) * clamp((age - 0.7) / 1);
      const ft = (1 - clamp(p / 0.16)) * clamp((age - 1.4) / 0.8);
      const key = `${p.toFixed(4)}|${fade.toFixed(3)}|${ft.toFixed(3)}`;
      if (key !== hero.key) {
        hero.key = key;
        const c = copy.current as HTMLDivElement;
        c.style.opacity = fade.toFixed(3);
        c.style.transform = p > 0 ? `translateY(${(-p * 16).toFixed(2)}vh) scale(${(1 + p * 0.1).toFixed(4)})` : 'none';
        (foot.current as HTMLDivElement).style.opacity = ft.toFixed(3);
        (dusk.current as HTMLDivElement).style.opacity = clamp((p - 0.55) / 0.45).toFixed(3);
      }
    });

    fauna.addHabitat({
      id: 'mencuat',
      el: host,
      ground: () => host.clientHeight - 28,
      width: () => host.clientWidth,
      vines: () => hero.vines.vines,
    });

    return () => {
      off();
      offLayout();
      hero.vines.destroy();
    };
  }, []);

  return (
    <section className="hero" id="mencuat">
      <div className="hero__stage" ref={stage}>
        <div className="hero__sky" />
        <div className="hero__stars" />
        <div className="hero__rays" />
        <Sun />
        <canvas className="hero__canvas" ref={backC} aria-hidden="true" />
        <div className="hero__copy" ref={copy}>
          <p className="hero__eyebrow">{t('heroEyebrow')}</p>
          <h1 className="hero__name" ref={name} aria-label={site.name}>
            {site.nameLines.map((line) => (
              <span className="hero__row" key={line} aria-hidden="true">
                {line.split('').map((ch, i) => (
                  <span className="hero__ch" data-letter key={i}>
                    {ch}
                  </span>
                ))}
              </span>
            ))}
          </h1>
          <p className="hero__line">{t('heroLine')}</p>
        </div>
        <canvas className="hero__canvas hero__canvas--front" ref={frontC} aria-hidden="true" />
        <canvas className="hero__canvas hero__canvas--vines" ref={vineC} aria-hidden="true" />
        <div className="hero__vignette" />
        <div className="hero__foot" ref={foot}>
          <span className="hero__hint">{touch ? t('heroHintTouch') : t('heroHint')}</span>
          <span className="hero__scroll">
            <i />
            <span>{t('heroScroll')}</span>
          </span>
        </div>
        <div className="hero__dusk" ref={dusk} />
      </div>
    </section>
  );
}
