import { useEffect, useRef } from 'react';
import { fmtAlt, useT } from '../core/i18n';
import { onLayout } from '../core/layout';
import { onTick, pointer, reduced, stacked } from '../core/ticker';
import { useWorld } from '../core/world';
import { layers, projects, type Project } from '../data/portfolio';
import { fauna } from '../fauna/engine';
import { clamp, Specimen, SPECIES } from '../flora/flora';
import { openNotes } from './ProjectDialog';

/* tinggi permukaan dahan di dalam track, harus cocok dengan .drawer__branch */
const BRANCH_Y = 94;

interface PlateState {
  el: HTMLElement;
  art: HTMLElement;
  cv: HTMLCanvasElement;
  sp: Specimen;
  /** nilai yang sedang diseret; null berarti ikut scroll */
  manual: number | null;
  /** waktu kembali tumbuh setelah dilepas */
  regrow: number;
  lean: number;
}

function Plate({ p, i }: { p: Project; i: number }) {
  const t = useT();
  const lang = useWorld((s) => s.lang);
  const n = String(i + 1).padStart(2, '0');
  return (
    <article className="plate" data-i={i}>
      <div className="sheet">
        <div className="plate__art" title={lang === 'id' ? 'Seret untuk memutar waktu' : 'Drag to rewind time'}>
          <span className="plate__num" aria-hidden="true">{n}</span>
          <canvas aria-hidden="true" />
        </div>
        <div className="plate__body">
          <p className="plate__kicker">{`${t('workPlate')} ${n} / ${String(projects.length).padStart(2, '0')} · ${p.common[lang]}`}</p>
          <h3 className="plate__title">{p.title}</h3>
          <p className="plate__latin">{p.latin}</p>
          <p className="plate__desc">{p.desc[lang]}</p>
          {p.points[lang].length > 0 && (
            <ul className="plate__points">
              {p.points[lang].map((x) => <li key={x}>{x}</li>)}
            </ul>
          )}
          <p className="plate__why">{p.why[lang]}</p>
          <div className="plate__foot">
            <button type="button" className="link" onClick={() => openNotes(i)}>{t('workNotes')}</button>
            <a className="link link--ghost" href={p.repo} target="_blank" rel="noopener">{t('workRepo')} <span aria-hidden="true">↗</span></a>
          </div>
          <div className="plate__stack">{p.stack.map((s) => <span key={s}>{s}</span>)}</div>
        </div>
      </div>
    </article>
  );
}

export default function Drawer() {
  const t = useT();
  const lang = useWorld((s) => s.lang);
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLElement>(null);
  const tajuk = layers[2];

  useEffect(() => {
    const sec = section.current as HTMLElement;
    const trk = track.current as HTMLDivElement;
    const plates: PlateState[] = [];
    let top = 0;
    let trackMax = 0;
    let len = 0;
    let vw = innerWidth;
    let vh = innerHeight;
    let hover: PlateState | null = null;
    let scrub: PlateState | null = null;
    let scrubX = 0;
    let scrubFrom = 1;

    trk.querySelectorAll<HTMLElement>('.plate[data-i]').forEach((el) => {
      const p = projects[Number(el.dataset.i)];
      const cv = el.querySelector('canvas') as HTMLCanvasElement;
      const art = el.querySelector('.plate__art') as HTMLElement;
      const st: PlateState = { el, art, cv, sp: new Specimen(cv, SPECIES[p.species], { seed: p.seed }), manual: null, regrow: 0, lean: 0 };
      plates.push(st);
      art.addEventListener('pointerenter', () => (hover = st));
      art.addEventListener('pointerleave', () => {
        if (hover === st) hover = null;
      });
      art.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'touch') return;
        scrub = st;
        scrubX = e.clientX;
        scrubFrom = st.sp.t < 0 ? 1 : st.sp.t;
        st.manual = scrubFrom;
        art.classList.add('is-scrub');
        e.preventDefault();
      });
      if (reduced) st.sp.render(1);
    });

    const move = (e: PointerEvent) => {
      if (!scrub) return;
      const w = scrub.art.clientWidth;
      scrub.manual = clamp(scrubFrom + (e.clientX - scrubX) / (w * 0.9));
    };
    const up = () => {
      if (scrub) {
        scrub.art.classList.remove('is-scrub');
        scrub.regrow = 1;
      }
      scrub = null;
    };
    addEventListener('pointermove', move);
    addEventListener('pointerup', up);
    addEventListener('pointercancel', up);

    const offLayout = onLayout(() => {
      vw = innerWidth;
      vh = innerHeight;
      if (stacked()) {
        sec.style.height = '';
        trk.style.transform = '';
        trackMax = 0;
      } else {
        trackMax = Math.max(0, trk.scrollWidth - vw);
        sec.style.height = `${vh + trackMax * 0.8}px`;
      }
      len = trackMax * 0.8;
      top = sec.getBoundingClientRect().top + scrollY;
      plates.forEach((p) => p.sp.resize());
    }, 1, true);

    const off = onTick((_t, dt) => {
      if (reduced) return;
      const y = window.scrollY;
      const sideways = !stacked();
      let tx = 0;
      if (sideways) {
        const p = len ? clamp((y - top) / len) : 0;
        tx = -p * trackMax;
        trk.style.transform = `translate3d(${tx.toFixed(1)}px,0,0)`;
        (bar.current as HTMLElement).style.transform = `scaleX(${p.toFixed(4)})`;
        if (y < top - vh * 1.2 || y > top + len + vh) return;
      }
      for (const pl of plates) {
        let g: number;
        if (sideways) {
          const x = pl.el.offsetLeft + tx;
          g = clamp((vw * 0.98 - x) / (vw * 0.62));
        } else {
          const r = pl.el.getBoundingClientRect().top;
          if (r > vh * 1.4) continue;
          g = clamp((vh * 0.92 - r) / (vh * 0.62));
        }
        if (pl.manual != null) {
          if (pl !== scrub) {
            pl.regrow -= dt / 1.4;
            pl.manual += (1 - pl.manual) * Math.min(1, dt * 2.4);
            if (pl.regrow <= 0) pl.manual = null;
          }
          if (pl.manual != null) g = pl.manual;
        }
        pl.sp.render(g);
        /* tanaman miring mengikuti kursor, seperti kena angin */
        let target = 0;
        if (pl === hover && pointer.x != null) {
          const r = pl.art.getBoundingClientRect();
          target = clamp((pointer.x - (r.left + r.width / 2)) / r.width, -0.5, 0.5) * 5;
        }
        pl.lean += (target - pl.lean) * 0.08;
        if (Math.abs(pl.lean) > 0.02) pl.cv.style.transform = `skewX(${(-pl.lean).toFixed(2)}deg)`;
      }
    });

    /* dahan di atas lembar spesimen: rumah kukang */
    const firstSheet = () => trk.querySelector('.plate[data-i="0"] .sheet') as HTMLElement;
    fauna.addHabitat({
      id: 'tajuk',
      el: trk,
      ground: () => (stacked() ? (firstSheet().parentElement as HTMLElement).offsetTop + 12 : BRANCH_Y),
      width: () => trk.scrollWidth,
    });

    return () => {
      off();
      offLayout();
      removeEventListener('pointermove', move);
      removeEventListener('pointerup', up);
      removeEventListener('pointercancel', up);
    };
  }, []);

  return (
    <section className="drawer" id="tajuk" ref={section}>
      <div className="drawer__stage">
        <div className="drawer__track" ref={track}>
          <div className="drawer__branch" aria-hidden="true" />
          <div className="plate plate--intro">
            <p className="stratum">{`${fmtAlt(tajuk.alt)} m · ${tajuk.name[lang]}`}</p>
            <h2>{t('workTitle')}</h2>
            <p className="lead">{t('workP')}</p>
          </div>
          {projects.map((p, i) => <Plate key={p.title} p={p} i={i} />)}
        </div>
        <div className="drawer__progress" aria-hidden="true"><i ref={bar} /></div>
      </div>
    </section>
  );
}
