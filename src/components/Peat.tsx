import { useEffect, useRef } from 'react';
import { fmtAlt, useT } from '../core/i18n';
import { onLayout } from '../core/layout';
import { jump } from '../core/scroll';
import { compact, onTick, pointer } from '../core/ticker';
import { useWorld } from '../core/world';
import { layers, site } from '../data/portfolio';
import { fauna } from '../fauna/engine';
import { sparkle } from '../fauna/fx';
import { ctx2d, rng, TAU } from '../flora/flora';
import { FAUNA } from '../data/fauna';
import { Reveal } from './Reveal';

/* Kunang-kunang: mengikuti kursor, kabur saat diklik */
function useFireflies(host: React.RefObject<HTMLElement | null>, canvas: React.RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const sec = host.current as HTMLElement;
    const c = canvas.current as HTMLCanvasElement;
    const x = ctx2d(c);
    let W = 0;
    let H = 0;
    let visible = false;
    let near = 0;
    let scatter = 0;
    const r = rng(77);
    const N = compact() ? 26 : 54;
    const flies = Array.from({ length: N }, () => ({ x: 0, y: 0, vx: 0, vy: 0, ph: r() * TAU, f: r.range(0.8, 2.2), off: r() * TAU, rad: r.range(16, 120) }));

    const fit = () => {
      W = c.width = sec.clientWidth;
      H = c.height = sec.clientHeight;
      flies.forEach((m) => {
        m.x = r() * W;
        m.y = r() * H;
      });
    };
    const offL = onLayout(fit, 6);

    const io = new IntersectionObserver((e) => {
      visible = e[0].isIntersecting;
    });
    io.observe(sec);

    const click = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('a,button,.fauna')) return;
      scatter = 0.8;
      fauna.discover('kunang');
      sparkle(e.clientX, e.clientY, '#e6ff8c', 16);
    };
    sec.addEventListener('click', click);

    const off = onTick((t, dt) => {
      if (!visible) return;
      x.clearRect(0, 0, W, H);
      const rc = c.getBoundingClientRect();
      const px = pointer.x == null ? null : pointer.x - rc.left;
      const py = pointer.y == null ? null : pointer.y - rc.top;
      const inside = px != null && py != null && px >= 0 && py >= 0 && px <= W && py <= H;
      scatter = Math.max(0, scatter - dt);
      if (inside) {
        near += dt;
        if (near > 2.2) fauna.discover('kunang');
      }
      x.globalCompositeOperation = 'lighter';
      for (const m of flies) {
        let tx = W / 2 + Math.cos(t * 0.12 * m.f + m.ph) * W * 0.42;
        let ty = H / 2 + Math.sin(t * 0.17 * m.f + m.off) * H * 0.4;
        if (inside && !scatter) {
          tx = (px as number) + Math.cos(t * m.f + m.ph) * m.rad;
          ty = (py as number) + Math.sin(t * m.f * 1.3 + m.off) * m.rad;
        }
        const k = scatter ? -5 : inside ? 3.4 : 0.5;
        const dx = (scatter && px != null ? m.x - (px as number) : tx - m.x);
        const dy = (scatter && py != null ? m.y - (py as number) : ty - m.y);
        const s = scatter ? -1 : 1;
        m.vx += dx * Math.abs(k) * s * (k < 0 ? -1 : 1) * dt;
        m.vy += dy * Math.abs(k) * s * (k < 0 ? -1 : 1) * dt;
        m.vx *= 0.93;
        m.vy *= 0.93;
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        const glow = 0.35 + 0.65 * Math.pow(0.5 + 0.5 * Math.sin(t * m.f * 2 + m.ph), 2);
        const R = 9 * glow + 2;
        const g = x.createRadialGradient(m.x, m.y, 0, m.x, m.y, R);
        g.addColorStop(0, `rgba(235,255,150,${glow.toFixed(3)})`);
        g.addColorStop(0.3, `rgba(200,240,90,${(glow * 0.5).toFixed(3)})`);
        g.addColorStop(1, 'rgba(200,240,90,0)');
        x.fillStyle = g;
        x.beginPath();
        x.arc(m.x, m.y, R, 0, TAU);
        x.fill();
      }
      x.globalCompositeOperation = 'source-over';
    });

    return () => {
      off();
      offL();
      io.disconnect();
      sec.removeEventListener('click', click);
    };
  }, [host, canvas]);
}

/* Bunga langka, mekar setelah semua satwa ditemukan */
function Rafflesia() {
  const t = useT();
  const petals = [0, 72, 144, 216, 288];
  return (
    <div className="rafflesia">
      <svg viewBox="-110 -110 220 220" aria-hidden="true">
        {petals.map((a, i) => (
          <g key={a} transform={`rotate(${a})`} className="rafflesia__petal" style={{ animationDelay: `${i * 0.12}s` }}>
            <path d="M-46 -30 C-62 -78 -30 -106 0 -106 C30 -106 62 -78 46 -30 C24 -14 -24 -14 -46 -30 Z" fill="#a8301f" />
            {[[-20, -62, 7], [14, -78, 8], [24, -50, 6], [-8, -88, 5], [-30, -44, 5], [4, -54, 6]].map(([x, y, r], k) => (
              <circle key={k} cx={x} cy={y} r={r} fill="#ecd8b8" />
            ))}
          </g>
        ))}
        <circle r="40" fill="#5e1810" />
        <circle r="30" fill="#2a0a06" />
        <circle r="30" fill="none" stroke="#ecd8b8" strokeWidth="3" strokeDasharray="4 8" />
      </svg>
      <div>
        <p className="rafflesia__title">{t('guardian')}</p>
        <p className="rafflesia__text">{t('rafflesia')}</p>
      </div>
    </div>
  );
}

export default function Peat() {
  const t = useT();
  const lang = useWorld((s) => s.lang);
  const found = useWorld((s) => s.found);
  const section = useRef<HTMLElement>(null);
  const flyC = useRef<HTMLCanvasElement>(null);
  useFireflies(section, flyC);
  const gambut = layers[5];
  const L = site.links;

  useEffect(() => {
    const el = section.current as HTMLElement;
    fauna.addHabitat({ id: 'gambut', el, ground: () => el.clientHeight - 62, width: () => el.clientWidth });
  }, []);

  return (
    <section className="peat" id="gambut" ref={section}>
      <canvas className="peat__flies" ref={flyC} aria-hidden="true" />
      <div className="wrap">
        <Reveal as="p" className="stratum">{`${fmtAlt(gambut.alt)} m · ${gambut.name[lang]}`}</Reveal>
        <Reveal as="h2">{t('peatTitle')}</Reveal>
        <Reveal as="p" className="lead">{t('peatP')}</Reveal>
        <Reveal className="peat__links">
          <a className="link" href={L.github} target="_blank" rel="noopener">GitHub ↗</a>
          {L.email && <a className="link link--ghost" href={`mailto:${L.email}`}>Email</a>}
          {L.linkedin && <a className="link link--ghost" href={L.linkedin} target="_blank" rel="noopener">LinkedIn ↗</a>}
          {L.instagram && <a className="link link--ghost" href={L.instagram} target="_blank" rel="noopener">Instagram ↗</a>}
          {L.cv && <a className="link link--ghost" href={L.cv} target="_blank" rel="noopener">CV</a>}
        </Reveal>
        {found.length >= FAUNA.length && <Rafflesia />}
        <button type="button" className="peat__up" onClick={() => jump(0)}>
          <span aria-hidden="true">↑</span> {t('peatUp')}
        </button>
      </div>
      <footer className="foot wrap">
        <span>© {new Date().getFullYear()} {site.name}</span>
        <span>{t('peatFoot')}</span>
      </footer>
    </section>
  );
}
