import { useEffect, useRef } from 'react';
import { useT, fmtAlt } from '../core/i18n';
import { onLayout } from '../core/layout';
import { compact, forestSeed, onTick, pointer, reduced, touch } from '../core/ticker';
import { useWorld } from '../core/world';
import { layers, site } from '../data/portfolio';
import { fauna } from '../fauna/engine';
import { Vine, VineSet } from '../fauna/vine';
import { buildPortrait, Foliage } from '../flora/flora';
import { leafTint } from './Hero';
import { Reveal } from './Reveal';

/* Label herbarium bisa dipindah ke mana saja, klik dua kali untuk kembali */
function useDraggableTag(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let x = 0;
    let y = 0;
    let sx = 0;
    let sy = 0;
    let on = false;
    const apply = () => {
      el.style.setProperty('--tx', `${x}px`);
      el.style.setProperty('--ty', `${y}px`);
    };
    const down = (e: PointerEvent) => {
      on = true;
      sx = e.clientX - x;
      sy = e.clientY - y;
      el.classList.add('is-held');
      e.preventDefault();
    };
    const move = (e: PointerEvent) => {
      if (!on) return;
      x = e.clientX - sx;
      y = e.clientY - sy;
      apply();
    };
    const up = () => {
      on = false;
      el.classList.remove('is-held');
    };
    const reset = () => {
      x = 0;
      y = 0;
      apply();
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('dblclick', reset);
    addEventListener('pointermove', move);
    addEventListener('pointerup', up);
    addEventListener('pointercancel', up);
    return () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('dblclick', reset);
      removeEventListener('pointermove', move);
      removeEventListener('pointerup', up);
      removeEventListener('pointercancel', up);
    };
  }, [ref]);
}

export default function About() {
  const t = useT();
  const lang = useWorld((s) => s.lang);
  const night = useWorld((s) => s.night);
  const nightRef = useRef(night);
  nightRef.current = night;
  const section = useRef<HTMLElement>(null);
  const portraitEl = useRef<HTMLElement>(null);
  const back = useRef<HTMLCanvasElement>(null);
  const front = useRef<HTMLCanvasElement>(null);
  const vineC = useRef<HTMLCanvasElement>(null);
  const tag = useRef<HTMLElement>(null);
  useDraggableTag(tag);
  const kanopi = layers[1];

  useEffect(() => {
    const host = section.current as HTMLElement;
    const b = new Foliage(back.current as HTMLCanvasElement, { maxDpr: 1.5 });
    const f = new Foliage(front.current as HTMLCanvasElement, { maxDpr: 1.5 });
    const vines = new VineSet(vineC.current as HTMLCanvasElement, host);
    let seen = false;
    let lastW = 0;

    const draw = (tt: number) => {
      const r = (back.current as HTMLCanvasElement).getBoundingClientRect();
      const s = {
        t: tt,
        mx: pointer.x == null ? null : pointer.x - r.left,
        my: pointer.y == null ? null : pointer.y - r.top,
        open: 0,
        pushRadius: r.width * 0.5,
        push: touch ? 0 : 1,
        tint: leafTint(nightRef.current),
      };
      b.draw(s);
      f.draw(s);
    };

    const offLayout = onLayout(() => {
      b.resize();
      f.resize();
      buildPortrait(b, f, forestSeed + 3);
      draw(1.4);
      vines.fit();
      const W = host.clientWidth;
      if (W === lastW) return;
      lastW = W;
      const xs = compact() ? [0.2, 0.8] : [0.14, 0.34, 0.55, 0.76];
      const len = compact() ? 120 : Math.min(230, innerHeight * 0.25);
      vines.vines = xs.map((x, i) => new Vine(W * x, -6, len + (i % 2) * 34, 10, i * 91 + 7));
    }, 3);

    const io = new IntersectionObserver((e) => {
      seen = e[0].isIntersecting;
    }, { rootMargin: '120px' });
    io.observe(host);

    const off = onTick((tt, dt) => {
      if (!seen) {
        vines.visible = false;
        return;
      }
      vines.visible = true;
      vines.tint = nightRef.current;
      vines.update(dt);
      if (!reduced && !document.documentElement.classList.contains('is-light')) draw(tt);
    });

    fauna.addHabitat({
      id: 'kanopi',
      el: host,
      ground: () => host.clientHeight - 30,
      width: () => host.clientWidth,
      vines: () => vines.vines,
    });

    return () => {
      off();
      offLayout();
      io.disconnect();
      vines.destroy();
    };
  }, []);

  return (
    <section className="about" id="kanopi" ref={section}>
      <canvas className="about__vines" ref={vineC} aria-hidden="true" />
      <div className="wrap about__grid">
        <Reveal as="figure" className="portrait" innerRef={portraitEl}>
          <div className="portrait__arch">
            <canvas ref={back} aria-hidden="true" />
            <img src={`${import.meta.env.BASE_URL}marwanto-cutout.webp`} alt={`Foto ${site.name} memakai blazer biru Politeknik Caltex Riau`} width={960} height={1279} draggable={false} />
            <canvas ref={front} aria-hidden="true" />
          </div>
          <figcaption className="tag" ref={tag as React.RefObject<HTMLElement>} title={t('labelDrag')}>
            <p className="tag__head">{t('labelHead')}</p>
            <dl>
              <div><dt>{t('labelName')}</dt><dd className="tag__sci">{site.name}</dd></div>
              <div><dt>{t('labelFamily')}</dt><dd>{t('labelFamilyV')}</dd></div>
              <div><dt>{t('labelHabitat')}</dt><dd>{t('labelHabitatV')}</dd></div>
              <div><dt>{t('labelClass')}</dt><dd>3 TI C</dd></div>
              <div><dt>{t('labelStatus')}</dt><dd>{t('labelStatusV')}</dd></div>
            </dl>
          </figcaption>
        </Reveal>
        <div className="about__text">
          <Reveal as="p" className="stratum">{`${fmtAlt(kanopi.alt)} m · ${kanopi.name[lang]}`}</Reveal>
          <Reveal as="h2">{t('aboutTitle')}</Reveal>
          <Reveal as="p" className="lead">{t('aboutP1')}</Reveal>
          <Reveal as="p" className="about__more">{t('aboutP2')}</Reveal>
        </div>
      </div>
      <svg className="about__branch" viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 26 C200 8 340 44 560 28 C760 14 940 44 1140 26 C1260 16 1360 30 1440 22 L1440 52 C1320 60 1220 44 1100 54 C900 66 740 40 540 54 C340 66 180 40 0 54 Z" fill="#13342a" />
        <path d="M0 26 C200 8 340 44 560 28 C760 14 940 44 1140 26 C1260 16 1360 30 1440 22 L1440 30 C1360 38 1260 26 1140 34 C940 50 760 22 560 36 C340 52 200 16 0 34 Z" fill="#3f7a4a" />
      </svg>
    </section>
  );
}
