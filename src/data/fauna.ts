/* ==========================================================================
   fauna.ts — nama, fakta, dan ucapan satwa. Mau ganti dialog? Edit di sini.
   ========================================================================== */
import type { FaunaId, Lang } from '../core/world';
import type { LayerId } from './portfolio';

type T = Record<Lang, string>;
type Lines = Record<Lang, string[]>;

export interface Species {
  id: FaunaId;
  name: T;
  latin: string;
  layer: LayerId;
  fact: T;
  hint: T;
  lines: {
    poke: Lines;
    held: Lines;
    lost: Lines;
    night?: Lines;
  };
}

export const FAUNA: Species[] = [
  {
    id: 'serindit',
    name: { id: 'Serindit', en: 'Blue-crowned hanging parrot' },
    latin: 'Loriculus galgulus',
    layer: 'mencuat',
    fact: {
      id: 'Burung kecil yang dikenal lewat budaya Melayu Riau. Tidurnya menggantung terbalik dari dahan.',
      en: 'A small parrot well known in Riau Malay culture. It sleeps hanging upside down from branches.',
    },
    hint: { id: 'Ada yang hinggap di akar gantung.', en: 'Someone is perching on the vines.' },
    lines: {
      poke: {
        id: ['Cit cit!', 'Hei, itu bulu mahal!', 'Kamu lihat portofolionya? Lumayan kan.', 'Aku yang jaga kanopi di sini.'],
        en: ['Tweet tweet!', 'Hey, these feathers are expensive!', 'Seen the portfolio? Not bad, right?', 'I guard the canopy here.'],
      },
      held: {
        id: ['Lepasin!', 'Aku bisa terbang sendiri!', 'Wei wei wei!'],
        en: ['Let go!', 'I can fly on my own!', 'Whoa whoa whoa!'],
      },
      lost: {
        id: ['Ini di mana? Daunnya mana?', 'Hm, bukan kanopi.'],
        en: ['Where is this? Where are the leaves?', 'Hm, this is not the canopy.'],
      },
      night: {
        id: ['Zzz... aku tidur terbalik, jangan ganggu.', 'Sudah malam, besok lagi.'],
        en: ['Zzz... I sleep upside down, do not disturb.', "It's night, come back tomorrow."],
      },
    },
  },
  {
    id: 'kupu',
    name: { id: 'Kupu-kupu raja', en: 'Rajah Brooke birdwing' },
    latin: 'Trogonoptera brookiana',
    layer: 'mencuat',
    fact: {
      id: 'Sayap hitamnya berpita hijau terang seperti deretan gigi. Sulit ditangkap, coba saja.',
      en: 'Black wings with a bright green band of tooth-like marks. Hard to catch, go ahead and try.',
    },
    hint: { id: 'Kejar yang terbang menghindari kursor.', en: 'Chase whatever flies away from your cursor.' },
    lines: {
      poke: { id: ['Eits, kena!', 'Geli!'], en: ['Oops, you got me!', 'That tickles!'] },
      held: { id: ['Awas sayapku!'], en: ['Mind the wings!'] },
      lost: { id: ['Bunganya mana?'], en: ['Where are the flowers?'] },
    },
  },
  {
    id: 'siamang',
    name: { id: 'Siamang', en: 'Siamang' },
    latin: 'Symphalangus syndactylus',
    layer: 'kanopi',
    fact: {
      id: 'Owa terbesar di dunia. Kantong suaranya bisa mengembang sebesar kepala, dan teriakannya terdengar jauh di hutan.',
      en: 'The largest gibbon in the world. Its throat sac swells to the size of its head, and its call carries far through the forest.',
    },
    hint: { id: 'Dia suka bergelantungan. Ayun akarnya.', en: 'He loves to swing. Pull the vines.' },
    lines: {
      poke: {
        id: ['WUUUP!', 'WUUP WUUP!', 'Dengar suaraku? Itu dari kantong ini.'],
        en: ['WHOOOP!', 'WHOOP WHOOP!', 'Hear that? It all comes from this sac.'],
      },
      held: {
        id: ['Lempar! Lempar ke akar!', 'Tanganku panjang, tenang.'],
        en: ['Throw me! At the vines!', 'Long arms, no worries.'],
      },
      lost: {
        id: ['Akarnya mana? Tanganku nganggur.', 'Terlalu rendah buatku.'],
        en: ['Where are the vines? My arms are idle.', 'Too low for me.'],
      },
    },
  },
  {
    id: 'kukang',
    name: { id: 'Kukang', en: 'Sunda slow loris' },
    latin: 'Nycticebus coucang',
    layer: 'tajuk',
    fact: {
      id: 'Primata malam yang bergerak sangat pelan. Termasuk sedikit primata yang gigitannya berbisa.',
      en: 'A nocturnal primate that moves very slowly. One of the few primates with a venomous bite.',
    },
    hint: { id: 'Cek dahan di atas lembar spesimen. Dia lambat.', en: 'Check the branch above the specimen sheets. He is slow.' },
    lines: {
      poke: {
        id: ['...ha...lo...', '...sa...bar...', '...tadi... kamu... bilang... apa...?'],
        en: ['...he...llo...', '...pa...tience...', '...what... did... you... say...?'],
      },
      held: { id: ['...pe...lan... pe...lan...', '...aku... takut... tinggi...'], en: ['...slow...ly... slow...ly...', '...afraid... of... heights...'] },
      lost: { id: ['...ini... di... mana...'], en: ['...where... is... this...'] },
      night: { id: ['Akhirnya malam! Ini jamku!', 'Sekarang aku cepat, lihat!'], en: ['Night at last! This is my hour!', "Now I'm fast, watch!"] },
    },
  },
  {
    id: 'gajah',
    name: { id: 'Anak gajah sumatera', en: 'Sumatran elephant calf' },
    latin: 'Elephas maximus sumatranus',
    layer: 'lantai',
    fact: {
      id: 'Salah satu rumahnya adalah Taman Nasional Tesso Nilo di Riau. Klik dia, dan belalainya menyiram tanaman.',
      en: 'One of its homes is Tesso Nilo National Park in Riau. Click it and the trunk waters the plants.',
    },
    hint: { id: 'Dia suka tanaman yang kamu tanam.', en: 'It likes the plants you grow.' },
    lines: {
      poke: {
        id: ['Prrrooot!', 'Tanamanmu aku siram ya.', 'Biar mekar!'],
        en: ['Pawooo!', "I'll water your plants.", 'Let them bloom!'],
      },
      held: {
        id: ['Kok kamu kuat banget?!', 'Turunin, aku berat!'],
        en: ['How are you this strong?!', "Put me down, I'm heavy!"],
      },
      lost: { id: ['Tanahnya aneh di sini.', 'Rumputnya mana?'], en: ['The ground feels odd here.', 'Where is the grass?'] },
    },
  },
  {
    id: 'katak',
    name: { id: 'Katak pohon', en: 'Tree frog' },
    latin: 'Rhacophoridae',
    layer: 'lantai',
    fact: {
      id: 'Keluarga katak yang hidup di pepohonan, dengan bantalan jari untuk menempel. Paling ramai saat malam.',
      en: 'A family of frogs that live in trees, with toe pads for gripping. Noisiest at night.',
    },
    hint: { id: 'Kecil, hijau, suka melompat.', en: 'Small, green, loves to hop.' },
    lines: {
      poke: { id: ['Kung!', 'Kung kung!', 'Hop!'], en: ['Ribbit!', 'Ribbit ribbit!', 'Hop!'] },
      held: { id: ['Licin kan?', 'Kaki panjang ini gunanya apa kalau diangkat?'], en: ['Slippery, right?', "What's the use of long legs up here?"] },
      lost: { id: ['Keringnya...', 'Butuh embun.'], en: ['So dry...', 'I need some dew.'] },
      night: { id: ['KUNG KUNG KUNG!', 'Ini konser malamku!'], en: ['RIBBIT RIBBIT!', 'My night concert!'] },
    },
  },
  {
    id: 'trenggiling',
    name: { id: 'Trenggiling', en: 'Sunda pangolin' },
    latin: 'Manis javanica',
    layer: 'akar',
    fact: {
      id: 'Mamalia bersisik yang menggulung jadi bola saat terancam. Di sini kamu bisa melemparnya, tenang saja, ini cuma kode.',
      en: 'A scaly mammal that rolls into a ball when threatened. Here you can throw it, relax, it is only code.',
    },
    hint: { id: 'Cek terowongan di bawah akar.', en: 'Check the tunnel beneath the roots.' },
    lines: {
      poke: { id: ['Eh!', 'Gulung dulu.', 'Sisikku bukan untuk dipencet.'], en: ['Hey!', 'Rolling up.', 'These scales are not buttons.'] },
      held: { id: ['Aku bola sekarang.', 'Mmmf.'], en: ["I'm a ball now.", 'Mmmf.'] },
      lost: { id: ['Terang sekali di sini.', 'Semutnya mana?'], en: ['So bright here.', 'Where are the ants?'] },
    },
  },
  {
    id: 'kunang',
    name: { id: 'Kunang-kunang', en: 'Fireflies' },
    latin: 'Lampyridae',
    layer: 'gambut',
    fact: {
      id: 'Kumbang yang cahayanya berasal dari reaksi kimia di tubuhnya. Di sini mereka mengikuti kursormu.',
      en: 'Beetles whose light comes from a chemical reaction inside their bodies. Here they follow your cursor.',
    },
    hint: { id: 'Gelap sekali di lapisan paling bawah.', en: 'It is very dark at the very bottom.' },
    lines: { poke: { id: [''], en: [''] }, held: { id: [''], en: [''] }, lost: { id: [''], en: [''] } },
  },
];

export const speciesById = Object.fromEntries(FAUNA.map((s) => [s.id, s])) as Record<FaunaId, Species>;

/* Dialog saat dua satwa dipertemukan. Kuncinya urut abjad, dipisah "|". */
export const ENCOUNTERS: Record<string, { a: T; b: T }[]> = {
  'gajah|katak': [
    { a: { id: 'Eh, ada yang hijau di dekat kakiku.', en: "Hey, something green is by my foot." }, b: { id: 'Hati-hati, jangan injak aku!', en: "Careful, don't step on me!" } },
  ],
  'gajah|siamang': [
    { a: { id: 'Naik sini, aku angkut.', en: "Hop on, I'll carry you." }, b: { id: 'Akarku lebih cepat.', en: 'My vines are faster.' } },
  ],
  'gajah|serindit': [
    { a: { id: 'Kecil sekali kamu.', en: 'You are so tiny.' }, b: { id: 'Tapi aku bisa terbang. Kamu?', en: 'But I can fly. Can you?' } },
  ],
  'gajah|kukang': [
    { a: { id: 'Halo kukang!', en: 'Hello loris!' }, b: { id: '...ha...', en: '...he...' } },
  ],
  'gajah|trenggiling': [
    { a: { id: 'Bola apa ini?', en: 'What kind of ball is this?' }, b: { id: 'Jangan ditendang.', en: "Don't kick me." } },
  ],
  'katak|kukang': [
    { a: { id: 'Kamu lambat banget.', en: 'You are so slow.' }, b: { id: '...aku... de...ngar...', en: '...i... heard... that...' } },
  ],
  'katak|serindit': [
    { a: { id: 'Lomba lompat?', en: 'Jumping contest?' }, b: { id: 'Aku terbang, curang dong.', en: "I fly, that's cheating." } },
  ],
  'katak|trenggiling': [
    { a: { id: 'Semut buatmu, nyamuk buatku.', en: 'Ants for you, mosquitoes for me.' }, b: { id: 'Sepakat.', en: 'Deal.' } },
  ],
  'kukang|siamang': [
    { a: { id: '...cepat... sekali...', en: '...so... fast...' }, b: { id: 'Kamu saja yang kelamaan!', en: "You're just taking forever!" } },
  ],
  'kukang|serindit': [
    { a: { id: '...kamu... terbalik...', en: '...you... are... upside... down...' }, b: { id: 'Kamu yang terlalu lama lihatnya.', en: 'You took too long to notice.' } },
  ],
  'kukang|trenggiling': [
    { a: { id: '...bo...la...?', en: '...ba...ll...?' }, b: { id: 'Bukan, ini aku.', en: "No, it's me." } },
  ],
  'serindit|siamang': [
    { a: { id: 'Berisik! Aku lagi nyanyi.', en: "So loud! I'm singing here." }, b: { id: 'WUUUP! Duet?', en: 'WHOOOP! Duet?' } },
  ],
  'serindit|trenggiling': [
    { a: { id: 'Bola berjalan?!', en: 'A walking ball?!' }, b: { id: 'Burung gantung?!', en: 'A hanging bird?!' } },
  ],
  'siamang|trenggiling': [
    { a: { id: 'Aku lempar ya?', en: 'Can I throw you?' }, b: { id: 'Semua orang bilang gitu.', en: 'Everyone says that.' } },
  ],
};
