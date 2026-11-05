/* ==========================================================================
   art.ts — gambar SVG satwa. Semua orisinal dan digambar dengan kode.
   Bagian tubuh diberi class f-* supaya bisa digerakkan oleh CSS dan engine.
   ========================================================================== */
import type { FaunaId } from '../core/world';
import { rng } from '../flora/flora';

const eye = (x: number, y: number, r: number, iris = '#1b120b') => `
  <g class="f-eye" style="transform-origin:${x}px ${y}px;transform-box:view-box">
    <circle cx="${x}" cy="${y}" r="${r}" fill="${iris}"/>
    <g class="f-pupil">
      <circle cx="${x}" cy="${y}" r="${r * 0.62}" fill="#050403"/>
      <circle cx="${x + r * 0.32}" cy="${y - r * 0.36}" r="${r * 0.3}" fill="#fff"/>
    </g>
  </g>`;

/* ---------- Serindit: burung kecil lambang Riau ---------- */
const serindit = `
<svg viewBox="-100 -100 200 200" aria-hidden="true">
  <defs>
    <linearGradient id="srB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fd04e"/><stop offset="1" stop-color="#2f9a4c"/></linearGradient>
    <linearGradient id="srW" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#46b45a"/><stop offset="1" stop-color="#17693f"/></linearGradient>
  </defs>
  <g class="f-feet">
    <path d="M-2 40 l-5 22 M14 38 l4 24" stroke="#d98a4a" stroke-width="5" stroke-linecap="round" fill="none"/>
    <path d="M-16 64 h18 M8 64 h20" stroke="#d98a4a" stroke-width="5" stroke-linecap="round"/>
  </g>
  <path class="f-tail" d="M-44 18 C-64 26 -80 36 -92 52 C-74 54 -54 46 -32 32 Z" fill="#1f8a4a"/>
  <path d="M-44 18 C-58 24 -68 30 -80 42 C-66 42 -50 36 -34 26 Z" fill="#2fae5c"/>
  <path d="M-48 6 C-44 34 -14 50 16 44 C44 38 52 8 40 -14 C28 -36 -8 -38 -30 -22 C-42 -14 -50 -6 -48 6 Z" fill="url(#srB)"/>
  <path d="M-48 8 C-46 18 -40 28 -30 34 C-26 24 -26 10 -32 -4 C-40 -6 -46 0 -48 8 Z" fill="#e03232"/>
  <path d="M-34 -12 C-26 -24 -12 -30 2 -30 C-2 -22 -14 -14 -28 -6 Z" fill="#f4b23a"/>
  <circle class="f-head" cx="38" cy="-34" r="32" fill="url(#srB)"/>
  <path d="M16 -56 C24 -68 44 -70 56 -60 C46 -56 30 -52 16 -48 Z" fill="#2e7fe0"/>
  <path d="M30 -4 C40 -2 54 -6 60 -16 C54 -8 42 8 30 16 C24 10 24 2 30 -4 Z" fill="#e8302e"/>
  <path d="M66 -42 C78 -44 86 -36 84 -22 C82 -20 80 -20 78 -22 C78 -30 72 -32 62 -30 Z" fill="#f1762f"/>
  <path d="M66 -30 C72 -30 76 -26 76 -20 C70 -18 66 -20 62 -26 Z" fill="#c9501f"/>
  ${eye(48, -40, 10, '#3a1c0c')}
  <g class="f-wing" style="transform-origin:0px -14px;transform-box:view-box">
    <path d="M6 -16 C22 -12 26 6 12 24 C2 36 -18 42 -32 38 C-34 16 -16 -10 6 -16 Z" fill="url(#srW)"/>
    <path d="M2 -8 C-8 6 -16 18 -22 32 M12 -4 C4 10 -2 22 -8 32 M18 4 C12 14 8 22 2 28" stroke="#0f5a33" stroke-width="2.4" fill="none" stroke-linecap="round"/>
  </g>
</svg>`;

/* ---------- Kupu raja: sayap hitam dengan pita hijau ---------- */
const kupuWing = (s: number) => `
  <g class="f-w${s > 0 ? 'r' : 'l'}" style="transform-origin:0 0;transform-box:view-box">
    <path d="M0 -12 C${s * 30} -90 ${s * 96} -86 ${s * 98} -44 C${s * 98} -20 ${s * 50} 0 0 6 Z" fill="#14161a"/>
    <path d="M0 6 C${s * 40} 4 ${s * 78} 14 ${s * 76} 48 C${s * 72} 76 ${s * 30} 80 ${s * 6} 40 Z" fill="#191b20"/>
    ${[0, 1, 2, 3, 4, 5, 6]
      .map((i) => {
        const a = -2.0 * s + 0;
        const x = s * (24 + i * 10.5);
        const y = -40 - Math.sin(i * 0.55) * 22 + i * 1.5;
        return `<path d="M${x} ${y} l${s * 7} -20 l${s * 6} 22 Z" fill="#52e38a" transform="rotate(${a * 0 + s * (i * 6 - 12)} ${x} ${y})"/>`;
      })
      .join('')}
    <path d="M${s * 12} 22 C${s * 30} 18 ${s * 56} 26 ${s * 58} 44 C${s * 44} 54 ${s * 22} 48 ${s * 12} 22 Z" fill="#35c978"/>
  </g>`;

const kupu = `
<svg viewBox="-100 -100 200 200" aria-hidden="true">
  ${kupuWing(-1)}${kupuWing(1)}
  <path d="M0 -26 C7 -20 7 26 0 44 C-7 26 -7 -20 0 -26 Z" fill="#0d0d10"/>
  <path d="M-6 -14 C-3 -19 3 -19 6 -14 L6 -8 L-6 -8 Z" fill="#e63c3c"/>
  <path d="M-2 -26 C-8 -40 -14 -46 -22 -50 M2 -26 C8 -40 14 -46 22 -50" stroke="#14161a" stroke-width="2.6" fill="none" stroke-linecap="round"/>
</svg>`;

/* ---------- Siamang: lengan panjang, kantong suara besar ---------- */
const siamang = `
<svg viewBox="-120 -130 240 260" aria-hidden="true">
  <defs>
    <radialGradient id="smB" cx=".42" cy=".3" r=".8"><stop offset="0" stop-color="#4b4d5e"/><stop offset=".6" stop-color="#2b2b37"/><stop offset="1" stop-color="#191923"/></radialGradient>
    <radialGradient id="smS" cx=".45" cy=".35" r=".7"><stop offset="0" stop-color="#d2b6ae"/><stop offset="1" stop-color="#8a6e72"/></radialGradient>
  </defs>
  <g class="f-leg-l" style="transform-origin:-22px 62px;transform-box:view-box">
    <path d="M-22 60 C-44 74 -52 92 -36 108" stroke="#262631" stroke-width="20" fill="none" stroke-linecap="round"/>
    <path d="M-36 108 l-12 8 M-36 108 l-4 12 M-36 108 l6 11" stroke="#262631" stroke-width="6" stroke-linecap="round"/>
  </g>
  <g class="f-leg-r" style="transform-origin:22px 62px;transform-box:view-box">
    <path d="M22 60 C44 74 52 92 36 108" stroke="#262631" stroke-width="20" fill="none" stroke-linecap="round"/>
    <path d="M36 108 l12 8 M36 108 l4 12 M36 108 l-6 11" stroke="#262631" stroke-width="6" stroke-linecap="round"/>
  </g>
  <g class="f-arm-r" style="transform-origin:38px 2px;transform-box:view-box">
    <path d="M38 2 C74 22 92 56 80 92" stroke="#262631" stroke-width="17" fill="none" stroke-linecap="round"/>
    <path d="M80 92 l-8 13 M80 92 l1 15 M80 92 l9 11" stroke="#262631" stroke-width="5.5" stroke-linecap="round"/>
  </g>
  <path d="M-46 8 C-54 46 -30 84 0 84 C30 84 54 46 46 8 C40 -16 -40 -16 -46 8 Z" fill="url(#smB)"/>
  <g class="f-arm-l" style="transform-origin:-36px 0px;transform-box:view-box">
    <path d="M-36 0 C-60 -40 -56 -84 -32 -116" stroke="#262631" stroke-width="17" fill="none" stroke-linecap="round"/>
    <path d="M-32 -116 C-24 -124 -14 -124 -10 -116 M-32 -116 C-22 -116 -14 -112 -12 -106" stroke="#262631" stroke-width="6" fill="none" stroke-linecap="round"/>
  </g>
  <g class="f-head">
    <path d="M-38 -38 C-40 -74 -16 -88 2 -88 C24 -88 42 -72 40 -38 C38 -10 -36 -10 -38 -38 Z" fill="url(#smB)"/>
    <path d="M-44 -48 l-10 -6 l6 12 Z M44 -48 l10 -6 l-6 12 Z" fill="#2b2b37"/>
    <path d="M-25 -48 C-24 -64 -6 -68 1 -60 C8 -68 26 -64 26 -48 C26 -32 12 -24 1 -24 C-10 -24 -26 -32 -25 -48 Z" fill="#17161e"/>
    ${eye(-11, -50, 7.5, '#6a3f1e')}
    ${eye(13, -50, 7.5, '#6a3f1e')}
    <path d="M-4 -38 q5 3 10 0" stroke="#3b3a4a" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    <path class="f-mouth" d="M-11 -29 q12 8 24 0" stroke="#4d4a5c" stroke-width="2.6" fill="none" stroke-linecap="round"/>
  </g>
  <ellipse class="f-sac" cx="1" cy="-10" rx="27" ry="24" fill="url(#smS)" style="transform-origin:1px -22px;transform-box:view-box"/>
</svg>`;

/* ---------- Kukang: mata raksasa, gerak sangat pelan ---------- */
const kukang = `
<svg viewBox="-120 -100 240 200" aria-hidden="true">
  <defs>
    <linearGradient id="kkB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cdb192"/><stop offset="1" stop-color="#8d6f55"/></linearGradient>
  </defs>
  <g class="f-limb-a" style="transform-origin:-44px 30px;transform-box:view-box">
    <path d="M-44 28 C-56 44 -60 58 -52 70" stroke="#9c7d60" stroke-width="20" stroke-linecap="round" fill="none"/>
    <path d="M-52 72 h-14 M-52 72 h12 M-52 72 l-2 10" stroke="#7a5d45" stroke-width="6" stroke-linecap="round"/>
  </g>
  <g class="f-limb-b" style="transform-origin:32px 32px;transform-box:view-box">
    <path d="M32 30 C40 46 46 58 40 70" stroke="#9c7d60" stroke-width="18" stroke-linecap="round" fill="none"/>
    <path d="M40 72 h14 M40 72 h-12 M40 72 l2 10" stroke="#7a5d45" stroke-width="6" stroke-linecap="round"/>
  </g>
  <path d="M-84 8 C-88 -30 -44 -52 0 -48 C40 -46 62 -22 58 10 C56 40 18 52 -22 50 C-58 50 -82 38 -84 8 Z" fill="url(#kkB)"/>
  <path d="M-80 -2 C-50 -34 -6 -44 30 -40" stroke="#5e4331" stroke-width="10" fill="none" stroke-linecap="round" opacity=".85"/>
  <g class="f-head" style="transform-origin:50px -6px;transform-box:view-box">
    <circle cx="46" cy="-44" r="9" fill="#a3866a"/>
    <circle cx="96" cy="-44" r="9" fill="#a3866a"/>
    <circle cx="71" cy="-8" r="44" fill="#d9c4a6"/>
    <path d="M58 -50 C50 -32 46 -18 54 -6 C60 -4 66 -10 66 -20 C66 -32 68 -44 68 -52 Z M84 -50 C92 -32 96 -18 88 -6 C82 -4 76 -10 76 -20 C76 -32 74 -44 74 -52 Z" fill="#4b3324"/>
    <path d="M67 -52 C70 -36 71 -14 71 0 C72 -14 73 -36 76 -52 Z" fill="#f2e7d4"/>
    <circle cx="51" cy="-12" r="19" fill="#4b3324"/>
    <circle cx="91" cy="-12" r="19" fill="#4b3324"/>
    ${eye(52, -12, 14.5, '#7a3c10')}
    ${eye(90, -12, 14.5, '#7a3c10')}
    <path d="M65 12 C68 8 74 8 77 12 C75 17 67 17 65 12 Z" fill="#2f1f16"/>
    <path class="f-mouth" d="M62 22 q9 6 18 0" stroke="#5e4331" stroke-width="2.6" fill="none" stroke-linecap="round"/>
  </g>
</svg>`;

/* ---------- Anak gajah sumatera ---------- */
const gajahLeg = (cls: string, x: number) => `
  <g class="${cls}" style="transform-origin:${x}px 30px;transform-box:view-box">
    <path d="M${x - 15} 26 L${x - 13} 80 Q${x} 86 ${x + 13} 80 L${x + 15} 26 Z" fill="#75808d"/>
    <path d="M${x - 11} 80 q4 4 8 0 M${x + 2} 80 q4 4 8 0" stroke="#cfd5da" stroke-width="3" fill="none" stroke-linecap="round"/>
  </g>`;

const gajah = `
<svg viewBox="-125 -105 262 200" aria-hidden="true">
  <defs>
    <linearGradient id="gjB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#aab3bd"/><stop offset=".6" stop-color="#858f9c"/><stop offset="1" stop-color="#6b7583"/></linearGradient>
    <linearGradient id="gjE" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#98a2ae"/><stop offset="1" stop-color="#6d7684"/></linearGradient>
  </defs>
  <path class="f-tail" d="M-88 -6 C-104 6 -108 26 -102 42" stroke="#6d7684" stroke-width="6" fill="none" stroke-linecap="round" style="transform-origin:-88px -6px;transform-box:view-box"/>
  <path d="M-102 42 l-5 11 M-102 42 l1 12 M-102 42 l6 10" stroke="#3b3f47" stroke-width="3" stroke-linecap="round"/>
  ${gajahLeg('f-leg-b', -66)}
  ${gajahLeg('f-leg-d', 34)}
  <path d="M-94 -6 C-94 -50 -50 -66 -6 -62 C32 -60 54 -38 54 -4 C54 30 30 44 -20 44 C-66 44 -94 34 -94 -6 Z" fill="url(#gjB)"/>
  ${gajahLeg('f-leg-a', -46)}
  ${gajahLeg('f-leg-c', 14)}
  <g class="f-trunk" style="transform-origin:86px -16px;transform-box:view-box">
    <path d="M82 -30 C104 -22 114 -2 112 20 C111 34 118 42 128 40 C131 49 118 54 108 48 C96 40 92 26 92 12 C92 0 84 -6 72 -8 Z" fill="url(#gjE)"/>
    <path d="M92 -10 l12 -6 M100 2 l13 -4 M96 16 l15 0 M100 30 l14 4" stroke="#6a7380" stroke-width="2.6" stroke-linecap="round"/>
  </g>
  <g class="f-head">
    <path d="M28 -46 C48 -76 96 -74 106 -36 C112 -8 90 12 62 10 C34 8 18 -18 28 -46 Z" fill="url(#gjB)"/>
    <path d="M44 -72 c2 -10 8 -14 8 -22 M56 -74 c1 -10 6 -14 7 -22 M68 -72 c0 -8 5 -13 8 -18 M34 -66 c0 -8 2 -13 6 -18" stroke="#4c5560" stroke-width="3" fill="none" stroke-linecap="round"/>
    ${eye(78, -30, 7, '#35251a')}
    <path d="M70 -42 q8 -6 16 0" stroke="#5a6470" stroke-width="2.6" fill="none" stroke-linecap="round"/>
    <path class="f-mouth" d="M78 6 q-8 6 -16 2" stroke="#5a6470" stroke-width="3" fill="none" stroke-linecap="round"/>
  </g>
  <g class="f-ear" style="transform-origin:38px -36px;transform-box:view-box">
    <path d="M40 -52 C8 -66 -22 -44 -18 -14 C-16 8 8 18 26 8 C38 2 46 -26 40 -52 Z" fill="url(#gjE)"/>
    <path d="M32 -44 C10 -52 -10 -36 -8 -14 C-6 2 10 8 22 2 C30 -4 36 -24 32 -44 Z" fill="#d9a7a4"/>
  </g>
</svg>`;

/* ---------- Katak pohon ---------- */
const katak = `
<svg viewBox="-100 -90 200 180" aria-hidden="true">
  <defs>
    <linearGradient id="ktB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a5e34f"/><stop offset="1" stop-color="#4fae3f"/></linearGradient>
  </defs>
  <g class="f-hind">
    <path d="M-52 40 C-92 40 -96 0 -62 -8 C-40 -12 -24 8 -28 40 Z" fill="#5dbb43"/>
    <path d="M52 40 C92 40 96 0 62 -8 C40 -12 24 8 28 40 Z" fill="#5dbb43"/>
    <path d="M-48 46 h-40 M-88 46 l-8 -6 M-88 46 l-9 3 M-88 46 l-6 8" stroke="#f0913a" stroke-width="6" stroke-linecap="round"/>
    <path d="M48 46 h40 M88 46 l8 -6 M88 46 l9 3 M88 46 l6 8" stroke="#f0913a" stroke-width="6" stroke-linecap="round"/>
  </g>
  <path d="M-58 10 C-58 -32 -30 -46 0 -46 C30 -46 58 -32 58 10 C58 44 28 52 0 52 C-28 52 -58 44 -58 10 Z" fill="url(#ktB)"/>
  <ellipse class="f-throat" cx="0" cy="26" rx="30" ry="20" fill="#f3f0b0" style="transform-origin:0px 12px;transform-box:view-box"/>
  <path d="M-30 58 v-26 M30 58 v-26" stroke="#5dbb43" stroke-width="13" stroke-linecap="round"/>
  <path d="M-30 58 h-12 M-30 58 h11 M30 58 h12 M30 58 h-11" stroke="#f0913a" stroke-width="6" stroke-linecap="round"/>
  <circle cx="-30" cy="-44" r="23" fill="#7bd047"/>
  <circle cx="30" cy="-44" r="23" fill="#7bd047"/>
  ${eye(-30, -46, 16, '#d9391f')}
  ${eye(30, -46, 16, '#d9391f')}
  <path class="f-mouth" d="M-34 -8 Q0 12 34 -8" stroke="#2f7f35" stroke-width="4" fill="none" stroke-linecap="round"/>
</svg>`;

/* ---------- Trenggiling: bisa berjalan dan menggulung jadi bola ---------- */
function scales(cx: number, cy: number, n: number, place: (i: number) => [number, number, number, number]) {
  const r = rng(cx * 7 + cy + n);
  const fills = ['#a97c45', '#946a38', '#b98c52', '#86602f'];
  let out = '';
  for (let i = 0; i < n; i++) {
    const [x, y, rot, s] = place(i);
    const f = fills[Math.floor(r() * fills.length)];
    out += `<path d="M0 -${s} C${s * 0.95} -${s * 0.55} ${s * 0.86} ${s * 0.62} 0 ${s} C-${s * 0.86} ${s * 0.62} -${s * 0.95} -${s * 0.55} 0 -${s} Z" fill="${f}" stroke="#5e4220" stroke-width="1.5" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(1)})"/>`;
  }
  return out;
}

const walkScales = scales(0, 0, 58, (i) => {
  const row = i % 3;
  const k = Math.floor(i / 3) / 19;
  const x = 58 - k * 186;
  const hump = Math.sin(Math.min(1, k * 1.2) * Math.PI) * 44;
  const taper = 1 - Math.pow(k, 1.6) * 0.8;
  const y = -2 - (hump * (1 - row * 0.56) + 2) * taper + (k > 0.7 ? (k - 0.7) * 56 : 0);
  return [x, y, 90 + (k > 0.7 ? -14 : 8), 15 * (0.6 + 0.5 * taper)];
});

const ballScales = scales(1, 1, 52, (i) => {
  const a = i * 2.399963;
  const rad = 8.6 * Math.sqrt(i + 0.5);
  return [Math.cos(a) * rad, Math.sin(a) * rad, (a * 180) / Math.PI + 90, 15];
});

const trenggiling = `
<svg viewBox="-125 -100 250 200" aria-hidden="true">
  <g class="f-pose-walk">
    <g class="f-leg-a" style="transform-origin:-24px 26px;transform-box:view-box"><path d="M-24 22 v28" stroke="#7a5a33" stroke-width="15" stroke-linecap="round"/><path d="M-24 52 h14 M-24 52 l12 6 M-24 52 l6 8" stroke="#3e2c16" stroke-width="3.4" stroke-linecap="round"/></g>
    <g class="f-leg-b" style="transform-origin:36px 26px;transform-box:view-box"><path d="M36 22 v28" stroke="#7a5a33" stroke-width="15" stroke-linecap="round"/><path d="M36 52 h14 M36 52 l12 6 M36 52 l6 8" stroke="#3e2c16" stroke-width="3.4" stroke-linecap="round"/></g>
    <path d="M60 -8 C74 -14 104 -8 116 14 C108 22 86 26 62 22 Z" fill="#e8cfa3"/>
    <path d="M-120 44 C-96 34 -60 28 -30 28 L66 26 C74 8 66 -20 40 -40 C4 -66 -60 -50 -96 2 Z" fill="#7a5a33"/>
    ${walkScales}
    ${eye(84, 2, 5, '#160d07')}
    <path d="M112 14 l6 3" stroke="#6a4a2a" stroke-width="3" stroke-linecap="round"/>
  </g>
  <g class="f-pose-ball">
    <circle r="78" fill="#7a5a33"/>
    ${ballScales}
  </g>
</svg>`;

export const ART: Record<Exclude<FaunaId, 'kunang'>, string> = { serindit, kupu, siamang, kukang, gajah, katak, trenggiling };

/* Ikon kunang-kunang untuk buku fauna */
export const KUNANG_ART = `
<svg viewBox="-100 -100 200 200" aria-hidden="true">
  <defs><radialGradient id="kgG"><stop offset="0" stop-color="#f6ffb0"/><stop offset=".4" stop-color="#d3f25a"/><stop offset="1" stop-color="#d3f25a" stop-opacity="0"/></radialGradient></defs>
  <circle cx="0" cy="34" r="76" fill="url(#kgG)"/>
  <path d="M-4 -30 C-46 -66 -76 -40 -48 -12 C-34 0 -16 -4 -4 -12 Z M4 -30 C46 -66 76 -40 48 -12 C34 0 16 -4 4 -12 Z" fill="#c9d6c0" opacity=".7"/>
  <path d="M0 -40 C14 -34 16 8 0 18 C-16 8 -14 -34 0 -40 Z" fill="#2a2420"/>
  <circle cx="0" cy="-42" r="11" fill="#e0572f"/>
  <path d="M0 14 C12 18 12 40 0 48 C-12 40 -12 18 0 14 Z" fill="#f2ff9c"/>
  <path d="M-5 -50 C-12 -66 -20 -70 -28 -72 M5 -50 C12 -66 20 -70 28 -72" stroke="#2a2420" stroke-width="3" fill="none" stroke-linecap="round"/>
</svg>`;
