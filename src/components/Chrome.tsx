/* Elemen yang selalu ada di layar: bar atas, altimeter, batang pohon,
   partikel, buku fauna, dan notifikasi. */
import { useEffect, useRef, useState } from 'react';
import { fmtAlt, useT } from '../core/i18n';
import { onLayout } from '../core/layout';
import { jump } from '../core/scroll';
import { compact, forestSeed, onTick, reduced } from '../core/ticker';
import { useWorld, world, type FaunaId } from '../core/world';
import { FAUNA } from '../data/fauna';
import { layers, site } from '../data/portfolio';
import { ART, KUNANG_ART } from '../fauna/art';
import { clamp, ctx2d, lerp, rng, sprite, TAU, type Sprite } from '../flora/flora';

export function TopBar() {
  const t = useT();
  const lang = useWorld((s) => s.lang);
  const sound = useWorld((s) => s.sound);
  return (
    <header className="top">
      <a className="top__mark" href="#mencuat" aria-label={site.name} onClick={(e) => { e.preventDefault(); jump(0); }}>
        <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 29C16 17 20 9 28 5c1 10-3 18-12 20M16 29c0-9-4-15-11-17 0 8 4 13 11 15" /></svg>
        <span>{site.initials}</span>
      </a>
      <div className="top__right">
        <a className="top__link" href={site.links.github} target="_blank" rel="noopener">GitHub</a>
        <button type="button" className={`sound ${sound ? 'is-on' : ''}`} aria-pressed={sound} aria-label={sound ? t('soundOn') : t('soundOff')} title={sound ? t('soundOn') : t('soundOff')} onClick={() => world.setSound(!sound)}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4Z" /><path className="sound__wave" d="M16 8.5a5 5 0 0 1 0 7M18.6 6a8.5 8.5 0 0 1 0 12" fill="none" /></svg>
        </button>
        <button type="button" className="lang" aria-label={t('langLabel')} onClick={() => world.setLang(lang === 'id' ? 'en' : 'id')}>
          <span className={lang === 'id' ? 'is-on' : ''}>ID</span><i /><span className={lang === 'en' ? 'is-on' : ''}>EN</span>
        </button>
      </div>
    </header>
  );
}

export function Altimeter() {
  const t = useT();
  const lang = useWorld((s) => s.lang);
  const M = useRef<HTMLElement>(null);
  const L = useRef<HTMLElement>(null);
  const N = useRef<HTMLSpanElement>(null);
  const [idx, setIdx] = useState(0);
  const langRef = useRef(lang);
  langRef.current = lang;

  useEffect(() => {
    let stops: { y: number; alt: number; light: number }[] = [];
    let last = -1;
    const measure = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      stops = layers.map((l, i) => ({ y: i === 0 ? 0 : (document.getElementById(l.id) as HTMLElement).getBoundingClientRect().top + scrollY, alt: l.alt, light: l.light }));
      stops.push({ y: max, alt: -9, light: 0 });
    };
    const offL = onLayout(measure, 9, true);
    const off = onTick(() => {
      if (stops.length < 2) return;
      const y = window.scrollY;
      let k = 0;
      while (k < stops.length - 2 && y >= stops[k + 1].y) k++;
      const a = stops[k];
      const b = stops[k + 1];
      const f = clamp((y - a.y) / Math.max(1, b.y - a.y));
      const alt = lerp(a.alt, b.alt, f);
      const light = lerp(a.light, b.light, f);
      const sign = alt >= 0.05 ? '+' : alt <= -0.05 ? '−' : '';
      (M.current as HTMLElement).textContent = `${sign}${Math.abs(alt).toFixed(alt > -10 && alt < 10 ? 1 : 0)}`;
      (L.current as HTMLElement).textContent = light >= 10 ? String(Math.round(light)) : light.toFixed(1).replace('.0', '');
      let i = 0;
      layers.forEach((_, n) => {
        if (y + innerHeight * 0.4 >= stops[n].y) i = n;
      });
      if (i !== last) {
        last = i;
        setIdx(i);
      }
    });
    return () => {
      off();
      offL();
    };
  }, []);

  return (
    <nav className="alti is-on" aria-label={t('navLabel')}>
      <div className="alti__read">
        <b ref={M}>+45</b><em>m</em>
        <span className="alti__name" ref={N}>{layers[idx].name[lang]}</span>
        <small>{t('light')} <span ref={L}>100</span>%</small>
      </div>
      <ol className="alti__list">
        {layers.map((l, i) => (
          <li key={l.id}>
            <a href={`#${l.id}`} className={i === idx ? 'is-on' : ''} onClick={(e) => { e.preventDefault(); jump(i === 0 ? 0 : (document.getElementById(l.id) as HTMLElement)); }}>{`${fmtAlt(l.alt)} m`}</a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function Trunks() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const build = () => {
      const box = ref.current as HTMLDivElement;
      const forest = box.parentElement as HTMLElement;
      const W = forest.clientWidth;
      const H = forest.clientHeight;
      const r = rng(31);
      const mobile = W < 760;
      const defs = mobile
        ? [{ x: 0.02, w: 62, near: 1 }, { x: 0.99, w: 76, near: 1 }, { x: 0.66, w: 30, near: 0 }]
        : [{ x: 0.035, w: 150, near: 1 }, { x: 0.975, w: 190, near: 1 }, { x: 0.27, w: 62, near: 0 }, { x: 0.71, w: 96, near: 0 }, { x: 0.48, w: 34, near: 0 }];
      const S = (n: number) => n.toFixed(1);
      let out = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><defs>
        <linearGradient id="tN" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#16402f"/><stop offset=".4" stop-color="#113428"/><stop offset="1" stop-color="#07170f"/></linearGradient>
        <linearGradient id="tF" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#1b4a3a"/><stop offset="1" stop-color="#0e2c22"/></linearGradient>
      </defs>`;
      defs.forEach((d) => {
        const x0 = d.x * W;
        const ph = r() * TAU;
        const Ls: [number, number][] = [];
        const Rs: [number, number][] = [];
        const flare = d.near ? d.w * 1.5 : d.w * 0.9;
        const wobble = (y: number) => Math.sin(y * 0.0013 + ph) * d.w * 0.24 + Math.sin(y * 0.0041 + ph) * d.w * 0.05;
        const fl = (y: number) => Math.pow(clamp((y - (H - 640)) / 640), 3.2) * flare;
        for (let y = -20; y <= H + 40; y += 40) {
          const taper = 1 + (y / H) * 0.12;
          Ls.push([x0 + wobble(y) - (d.w / 2) * taper - fl(y), y]);
          Rs.push([x0 + wobble(y) + (d.w / 2) * taper + fl(y) * 0.9, y]);
        }
        const path = `M${Ls.map((p) => `${S(p[0])} ${p[1]}`).join('L')}L${Rs.reverse().map((p) => `${S(p[0])} ${p[1]}`).join('L')}Z`;
        out += `<path d="${path}" fill="url(#${d.near ? 'tN' : 'tF'})" opacity="${d.near ? 0.95 : 0.3}"/>`;
        const barks = d.near ? 7 : 3;
        for (let b = 0; b < barks; b++) {
          const u = (b + 1) / (barks + 1);
          const ph2 = r() * TAU;
          let line = '';
          for (let y = -20; y <= H + 40; y += 80) {
            const xx = x0 + wobble(y) + (u - 0.5) * (d.w + fl(y) * 1.9) + Math.sin(y * 0.02 + ph2) * 2.4;
            line += `${line ? 'L' : 'M'}${S(xx)} ${y}`;
          }
          out += `<path d="${line}" fill="none" stroke="#6fae8a" stroke-width="1" opacity="${d.near ? 0.1 : 0.05}"/>`;
        }
      });
      box.innerHTML = `${out}</svg>`;
    };
    return onLayout(build, 8, true);
  }, []);
  return <div className="trunks" ref={ref} aria-hidden="true" />;
}

export function Motes() {
  const ref = useRef<HTMLCanvasElement>(null);
  const night = useWorld((s) => s.night);
  const nightRef = useRef(0);
  nightRef.current = night;
  useEffect(() => {
    if (reduced) return;
    const c = ref.current as HTMLCanvasElement;
    const x = ctx2d(c);
    let W = 0;
    let H = 0;
    let list: { x: number; y: number; s: number; vx: number; vy: number; ph: number; f: number }[] = [];
    let leaves: { x: number; y: number; rot: number; vr: number; vy: number; sway: number; ph: number; sc: number; sp: Sprite }[] = [];
    const build = () => {
      W = c.width = innerWidth;
      H = c.height = innerHeight;
      const r = rng(forestSeed + 7);
      const n = compact() ? 16 : 30;
      list = Array.from({ length: n }, () => ({ x: r() * W, y: r() * H, s: r.range(0.8, 2.3), vx: r.range(-6, 6), vy: r.range(-9, 7), ph: r() * TAU, f: r.range(0.4, 1.3) }));
      leaves = Array.from({ length: compact() ? 2 : 3 }, (_, i) => ({ x: r() * W, y: r() * H, rot: r() * TAU, vr: r.range(-0.7, 0.7), vy: r.range(24, 46), sway: r.range(20, 60), ph: r() * TAU, sc: r.range(0.26, 0.46), sp: sprite('jahe', i % 2 ? 'lit' : 'mid', 90, i % 3, 0) }));
    };
    const offL = onLayout(build, 7);
    const off = onTick((t, dt) => {
      x.clearRect(0, 0, W, H);
      const y = window.scrollY;
      const akar = document.getElementById('akar');
      const below = akar ? y > akar.getBoundingClientRect().top + y - innerHeight * 0.5 : false;
      const n = nightRef.current;
      const col = below ? '239,178,92' : n > 0.5 ? '210,250,120' : '238,246,190';
      for (const m of list) {
        m.x += (m.vx + Math.sin(t * m.f + m.ph) * 8) * dt;
        m.y += (below ? -Math.abs(m.vy) - 3 : m.vy) * dt;
        if (m.x < -10) m.x = W + 10;
        if (m.x > W + 10) m.x = -10;
        if (m.y < -10) m.y = H + 10;
        if (m.y > H + 10) m.y = -10;
        const a = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(t * m.f * 1.6 + m.ph));
        const R = m.s * (n > 0.5 && !below ? 1.7 : 1);
        x.fillStyle = `rgba(${col},${a.toFixed(3)})`;
        x.beginPath();
        x.arc(m.x, m.y, R, 0, TAU);
        x.fill();
      }
      if (!below && y > 60) {
        for (const l of leaves) {
          l.y += l.vy * dt;
          l.rot += l.vr * dt;
          const px = l.x + Math.sin(t * 0.6 + l.ph) * l.sway;
          if (l.y > H + 60) {
            l.y = -60;
            l.x = Math.random() * W;
          }
          x.save();
          x.translate(px, l.y);
          x.rotate(l.rot);
          x.scale(l.sc, l.sc);
          x.globalAlpha = 0.62;
          x.drawImage(l.sp.canvas, -l.sp.px, -l.sp.py);
          x.restore();
        }
      }
    });
    return () => {
      off();
      offL();
    };
  }, []);
  return <canvas className="motes" ref={ref} aria-hidden="true" />;
}

const art = (id: FaunaId) => (id === 'kunang' ? KUNANG_ART : ART[id]);

export function Journal() {
  const t = useT();
  const lang = useWorld((s) => s.lang);
  const found = useWorld((s) => s.found);
  const open = useWorld((s) => s.journalOpen);
  const total = FAUNA.length;
  return (
    <>
      <button type="button" className={`journal-btn ${found.length === total ? 'is-full' : ''}`} aria-expanded={open} onClick={() => world.setJournal(!open)}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4Zm0 13a3 3 0 0 1 3-3h11" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /></svg>
        <span className="journal-btn__label">{t('journal')}</span>
        <b>{found.length}/{total}</b>
      </button>
      <aside className={`journal ${open ? 'is-open' : ''}`} aria-hidden={!open} inert={!open}>
        <header className="journal__head">
          <div>
            <h2>{t('journal')}</h2>
            <p>{found.length === total ? t('journalDone') : t('journalIntro')}</p>
          </div>
          <button type="button" onClick={() => world.setJournal(false)} aria-label={t('journalClose')}>×</button>
        </header>
        <div className="journal__meter"><i style={{ width: `${(found.length / total) * 100}%` }} /></div>
        <ul className="journal__list">
          {FAUNA.map((s) => {
            const known = found.includes(s.id);
            const layer = layers.find((l) => l.id === s.layer);
            return (
              <li key={s.id} className={known ? 'is-known' : ''}>
                <button
                  type="button"
                  title={t('journalGo')}
                  onClick={() => {
                    world.setJournal(false);
                    jump(s.layer === 'mencuat' ? 0 : (document.getElementById(s.layer) as HTMLElement));
                  }}
                >
                  <span className="journal__art" dangerouslySetInnerHTML={{ __html: art(s.id) }} />
                  <span className="journal__text">
                    <b>{known ? s.name[lang] : t('journalUnknown')}</b>
                    {known && <i>{s.latin}</i>}
                    <span>{known ? s.fact[lang] : s.hint[lang]}</span>
                    <small>{layer ? `${fmtAlt(layer.alt)} m · ${layer.name[lang]}` : ''}</small>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>
    </>
  );
}

export function Toast() {
  const toast = useWorld((s) => s.toast);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => world.clearToast(), 3200);
    return () => clearTimeout(id);
  }, [toast]);
  return (
    <div className={`toast ${toast ? 'is-on' : ''}`} role="status">
      {toast?.text}
    </div>
  );
}
