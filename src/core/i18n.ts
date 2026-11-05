import { ui, type UiKey } from '../data/portfolio';
import { useWorld } from './world';

export function useT(): (k: UiKey) => string {
  const lang = useWorld((s) => s.lang);
  return (k) => ui[lang][k];
}

export const fmtAlt = (a: number): string => (a > 0 ? `+${a}` : a < 0 ? `−${Math.abs(a)}` : '0');
