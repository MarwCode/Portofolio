import Lenis from 'lenis';
import { onTick, reduced } from './ticker';

let lenis: Lenis | null = null;

export function initScroll(): void {
  if (reduced || lenis) return;
  lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
  onTick((t) => lenis?.raf(t * 1000));
}

export function jump(target: number | HTMLElement): void {
  if (lenis) {
    lenis.scrollTo(target, { duration: 1.8 });
  } else if (typeof target === 'number') {
    window.scrollTo(0, target);
  } else {
    window.scrollTo(0, target.getBoundingClientRect().top + scrollY);
  }
}

export function nudge(dy: number): void {
  if (lenis) lenis.scrollTo(lenis.scroll + dy, { immediate: true });
  else window.scrollBy(0, dy);
}
