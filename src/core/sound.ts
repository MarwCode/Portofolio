/* Suara satwa dibuat langsung oleh Web Audio, tanpa file audio.
   Mati secara bawaan; pengunjung menyalakannya dari tombol di bar atas. */
import { world } from './world';

let ac: AudioContext | null = null;

function audio(): AudioContext | null {
  if (!world.get().sound) return null;
  if (!ac) ac = new AudioContext();
  if (ac.state === 'suspended') void ac.resume();
  return ac;
}

interface Tone {
  from: number;
  to: number;
  dur: number;
  type?: OscillatorType;
  vol?: number;
  at?: number;
}

function tone({ from, to, dur, type = 'sine', vol = 0.12, at = 0 }: Tone) {
  const a = audio();
  if (!a) return;
  const t0 = a.currentTime + at;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(from, t0);
  o.frequency.exponentialRampToValueAtTime(Math.max(20, to), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + Math.min(0.03, dur * 0.3));
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(a.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

export const sfx = {
  chirp() {
    tone({ from: 2600, to: 3800, dur: 0.07 });
    tone({ from: 3400, to: 2400, dur: 0.09, at: 0.08 });
  },
  wuup() {
    tone({ from: 240, to: 620, dur: 0.34, type: 'triangle', vol: 0.2 });
    tone({ from: 300, to: 900, dur: 0.4, type: 'triangle', vol: 0.18, at: 0.36 });
  },
  trumpet() {
    tone({ from: 300, to: 760, dur: 0.14, type: 'sawtooth', vol: 0.07 });
    tone({ from: 760, to: 540, dur: 0.46, type: 'sawtooth', vol: 0.08, at: 0.13 });
  },
  croak() {
    tone({ from: 150, to: 110, dur: 0.1, type: 'square', vol: 0.06 });
    tone({ from: 170, to: 120, dur: 0.12, type: 'square', vol: 0.06, at: 0.14 });
  },
  pop() {
    tone({ from: 520, to: 120, dur: 0.1, vol: 0.14 });
  },
  thud() {
    tone({ from: 130, to: 50, dur: 0.14, vol: 0.2 });
  },
  sparkle() {
    tone({ from: 1300, to: 1900, dur: 0.16, vol: 0.06 });
    tone({ from: 1760, to: 2600, dur: 0.2, vol: 0.05, at: 0.1 });
  },
  sigh() {
    tone({ from: 420, to: 180, dur: 0.8, type: 'triangle', vol: 0.08 });
  },
};
