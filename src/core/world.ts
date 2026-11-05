/* Status dunia yang dipakai bersama: bahasa, jam hutan, buku fauna, suara. */
import { useSyncExternalStore } from 'react';

export type Lang = 'id' | 'en';

export type FaunaId = 'serindit' | 'kupu' | 'siamang' | 'kukang' | 'gajah' | 'katak' | 'trenggiling' | 'kunang';

const store = {
  get(k: string): string | null {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set(k: string, v: string): void {
    try {
      localStorage.setItem(k, v);
    } catch {
      /* mode privat */
    }
  },
};

export interface WorldState {
  lang: Lang;
  /** 0 siang, 1 malam */
  night: number;
  found: FaunaId[];
  journalOpen: boolean;
  sound: boolean;
  toast: { id: number; text: string } | null;
}

function loadFound(): FaunaId[] {
  try {
    const raw = store.get('rimba-fauna');
    return raw ? (JSON.parse(raw) as FaunaId[]) : [];
  } catch {
    return [];
  }
}

let state: WorldState = {
  lang: store.get('porto-lang') === 'en' ? 'en' : 'id',
  night: 0,
  found: loadFound(),
  journalOpen: false,
  sound: false,
  toast: null,
};

const listeners = new Set<() => void>();

function set(patch: Partial<WorldState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

export const world = {
  get: () => state,
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
  setLang(lang: Lang) {
    store.set('porto-lang', lang);
    document.documentElement.lang = lang;
    set({ lang });
  },
  setNight(night: number) {
    if (Math.abs(night - state.night) < 0.002) return;
    document.documentElement.style.setProperty('--night', night.toFixed(3));
    set({ night });
  },
  /** true kalau spesies ini baru pertama kali ditemukan */
  discover(id: FaunaId): boolean {
    if (state.found.includes(id)) return false;
    const found = [...state.found, id];
    store.set('rimba-fauna', JSON.stringify(found));
    set({ found });
    return true;
  },
  resetFound() {
    store.set('rimba-fauna', '[]');
    set({ found: [] });
  },
  setJournal(journalOpen: boolean) {
    set({ journalOpen });
  },
  setSound(sound: boolean) {
    set({ sound });
  },
  toast(text: string) {
    set({ toast: { id: Date.now(), text } });
  },
  clearToast() {
    set({ toast: null });
  },
};

export function useWorld<T>(pick: (s: WorldState) => T): T {
  return useSyncExternalStore(world.subscribe, () => pick(state));
}
