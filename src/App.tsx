import { useEffect, useRef, useState } from 'react';
import About from './components/About';
import { Altimeter, Journal, Motes, Toast, TopBar, Trunks } from './components/Chrome';
import Drawer from './components/Drawer';
import Floor, { plotApi } from './components/Floor';
import Hero from './components/Hero';
import Peat from './components/Peat';
import ProjectDialog from './components/ProjectDialog';
import Roots from './components/Roots';
import { useT } from './core/i18n';
import { runLayout } from './core/layout';
import { initScroll, nudge } from './core/scroll';
import { onTick, reduced, touch } from './core/ticker';
import { useWorld } from './core/world';
import { fauna } from './fauna/engine';
import { Gajah, Katak, Kukang, Kupu, Serindit, Siamang, Trenggiling } from './fauna/creatures';
import { mountFx } from './fauna/fx';

function spawn() {
  const h = (id: Parameters<typeof fauna.habitat>[0]) => fauna.habitat(id);
  fauna.add(new Serindit(fauna, h('mencuat')));
  [0, 1, 2].forEach((i) => fauna.add(new Kupu(fauna, h('mencuat'), i)));
  fauna.add(new Siamang(fauna, h('kanopi')));
  fauna.add(new Kukang(fauna, h('tajuk')));
  const gajah = fauna.add(new Gajah(fauna, h('lantai')));
  gajah.onSpray = (x) => plotApi.bloomNear(x);
  fauna.add(new Katak(fauna, h('lantai')));
  fauna.add(new Trenggiling(fauna, h('akar')));
}

export default function App() {
  const t = useT();
  const lang = useWorld((s) => s.lang);
  const [ready, setReady] = useState(false);
  const fx = useRef<HTMLCanvasElement>(null);
  const dragLayer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = `Marwanto Asnan · ${lang === 'id' ? 'Portofolio' : 'Portfolio'}`;
    fauna.relabel();
  }, [lang]);

  /* tinggi teks berubah saat ganti bahasa */
  useEffect(() => {
    if (ready) requestAnimationFrame(() => runLayout(true));
  }, [lang, ready]);

  useEffect(() => {
    if (reduced) document.documentElement.classList.add('is-still');
    if (touch) document.documentElement.classList.add('is-touch');
    fauna.dragLayer = dragLayer.current;
    fauna.edgeScroll = nudge;
    const unFx = mountFx(fx.current as HTMLCanvasElement);
    let cancelled = false;
    let spawned = false;

    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const fonts = Promise.all(['360 40px Fraunces', 'italic 300 40px Fraunces', '400 16px "Instrument Sans"', '500 12px "JetBrains Mono"'].map((f) => document.fonts.load(f).catch(() => null)));

    void Promise.race([fonts, wait(1500)]).then(() => {
      /* beri waktu loader tampil sebelum daun dipanggang */
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          if (cancelled) return;
          initScroll();
          runLayout();
          spawn();
          spawned = true;
          setReady(true);
        }),
      );
    });

    const offFauna = onTick((tt, dt) => fauna.update(tt, dt));

    let timer = 0;
    let lastW = innerWidth;
    const resize = () => {
      clearTimeout(timer);
      timer = window.setTimeout(() => {
        /* di HP, address bar yang muncul-hilang jangan memicu gambar ulang */
        if (touch && innerWidth === lastW) return;
        lastW = innerWidth;
        runLayout();
        fauna.creatures.forEach((c) => c.goHome());
      }, 180);
    };
    addEventListener('resize', resize);
    const refit = () => {
      if (spawned) runLayout(true);
    };
    addEventListener('load', refit);
    void document.fonts.ready.then(() => {
      if (!cancelled) requestAnimationFrame(refit);
    });

    return () => {
      cancelled = true;
      unFx();
      offFauna();
      removeEventListener('resize', resize);
      removeEventListener('load', refit);
    };
  }, []);

  return (
    <>
      <a className="skip" href="#kanopi">{t('skip')}</a>
      <div className={`loader ${ready ? 'is-done' : ''}`} aria-hidden="true">
        <span className="loader__seed" />
        <span className="loader__text">{t('loading')}</span>
      </div>
      <TopBar />
      <Altimeter />
      <Motes />
      <canvas className="fx" ref={fx} aria-hidden="true" />
      <div className="nightfall" aria-hidden="true" />
      <div className="drag-layer" ref={dragLayer} />
      <main>
        <Hero />
        <div className="forest">
          <Trunks />
          <About />
          <Drawer />
          <Floor />
        </div>
        <Roots />
        <Peat />
      </main>
      <Journal />
      <Toast />
      <ProjectDialog />
    </>
  );
}
