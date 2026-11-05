import { useEffect, useRef, useSyncExternalStore } from 'react';
import { useT } from '../core/i18n';
import { useWorld } from '../core/world';
import { projects } from '../data/portfolio';
import { Specimen, SPECIES } from '../flora/flora';

/* Catatan lapangan: buku catatan kertas krem, satu halaman per proyek */
let current: number | null = null;
const subs = new Set<() => void>();
const set = (v: number | null) => {
  current = v;
  subs.forEach((f) => f());
};
export const openNotes = (i: number): void => set(i);

const PAPER_INK = { line: '#1d3a2c', fill: 'rgba(29,58,44,.1)', soft: 'rgba(29,58,44,.5)', glow: '#b5541c' };

export default function ProjectDialog() {
  const t = useT();
  const lang = useWorld((s) => s.lang);
  const i = useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => {
        subs.delete(f);
      };
    },
    () => current,
  );
  const dlg = useRef<HTMLDialogElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const d = dlg.current;
    if (!d) return;
    if (i == null) {
      if (d.open) d.close();
      return;
    }
    if (!d.open) d.showModal();
    const c = cv.current as HTMLCanvasElement;
    const p = projects[i];
    const sp = new Specimen(c, SPECIES[p.species], { seed: p.seed, ink: PAPER_INK });
    let raf = 0;
    const t0 = performance.now();
    const grow = (now: number) => {
      const k = Math.min(1, (now - t0) / 1400);
      sp.render(k);
      if (k < 1) raf = requestAnimationFrame(grow);
    };
    raf = requestAnimationFrame(grow);
    return () => cancelAnimationFrame(raf);
  }, [i]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (current == null) return;
      if (e.key === 'ArrowRight') set((current + 1) % projects.length);
      if (e.key === 'ArrowLeft') set((current - 1 + projects.length) % projects.length);
    };
    addEventListener('keydown', key);
    return () => removeEventListener('keydown', key);
  }, []);

  const p = i == null ? null : projects[i];

  return (
    <dialog
      className="notes"
      ref={dlg}
      onClose={() => set(null)}
      onClick={(e) => {
        if (e.target === dlg.current) set(null);
      }}
    >
      {p && i != null && (
        <div className="notes__page">
          <button type="button" className="notes__close" onClick={() => set(null)} aria-label={t('notesClose')}>×</button>
          <div className="notes__art"><canvas ref={cv} aria-hidden="true" /></div>
          <div className="notes__body">
            <p className="notes__kicker">{`${t('notesTitle')} · ${t('workPlate')} ${String(i + 1).padStart(2, '0')}`}</p>
            <h3>{p.title}</h3>
            <p className="notes__latin">{p.latin} · {p.common[lang]}</p>
            <p className="notes__desc">{p.desc[lang]}</p>
            <dl className="notes__facts">
              {p.notes.map((n) => (
                <div key={n.label.id}><dt>{n.label[lang]}</dt><dd>{n.value[lang]}</dd></div>
              ))}
            </dl>
            {p.points[lang].length > 0 && (
              <>
                <h4>{t('notesFeatures')}</h4>
                <ul>{p.points[lang].map((x) => <li key={x}>{x}</li>)}</ul>
              </>
            )}
            <h4>{t('notesWhy')}</h4>
            <p className="notes__why">{p.why[lang]}</p>
            <h4>{t('notesStack')}</h4>
            <p className="notes__stack">{p.stack.join(' · ')}</p>
            <div className="notes__foot">
              <a className="link link--ink" href={p.repo} target="_blank" rel="noopener">{t('workRepo')} <span aria-hidden="true">↗</span></a>
              <span className="notes__nav">
                <button type="button" aria-label={t('notesPrev')} onClick={() => set((i - 1 + projects.length) % projects.length)}>←</button>
                <button type="button" aria-label={t('notesNext')} onClick={() => set((i + 1) % projects.length)}>→</button>
              </span>
            </div>
          </div>
        </div>
      )}
    </dialog>
  );
}
