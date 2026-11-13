// Генератор рубашек колоды: npm run gen:backs
//
// 30 обычных зимних рубашек восьми видов композиции (js/catalog/backs.js →
// STYLES): сетка мотивов, «свитер», пейзаж, народная открытка, плакат с
// уголками, гирлянды, снегопад, абстракция. Мотивы — ёлки, подарки,
// игрушки, снеговики, звёзды, снежинки (js/catalog/motifs.js). Цвета — 14
// зимних палитр, фон — цвет или градиент, у части — шум «как в печати».
// Результат — js/catalog/backs.generated.js (руками не править).
// Подробно — docs/catalog.md.
//
//   node build/gen-backs.mjs            — зерно по умолчанию
//   node build/gen-backs.mjs --seed 7   — другой набор
import fs from 'node:fs';

const argSeed = process.argv.indexOf('--seed');
const SEED = argSeed > 0 ? Number(process.argv[argSeed + 1]) : 1231;

function prng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = prng(SEED);
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const between = (a, b) => a + rnd() * (b - a);
const r2 = (n) => +n.toFixed(2);
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// палитры: фон (2 цвета для градиента), основной цвет рисунка, два акцента
const PALETTES = [
  { key: 'red', dark: true, bg: ['#d0172f', '#9e0b22'], ink: '#fff4e6', accent: '#1f6b45', accent2: '#ffcf5a' },
  { key: 'forest', dark: true, bg: ['#1f5c3f', '#123d29'], ink: '#f3efe0', accent: '#d6403a', accent2: '#f2c14e' },
  { key: 'navy', dark: true, bg: ['#22346e', '#0e1638'], ink: '#e8eefc', accent: '#f2c14e', accent2: '#e0526b' },
  { key: 'ice', dark: false, bg: ['#d8eefb', '#8fc4e8'], ink: '#2a5da8', accent: '#e0526b', accent2: '#ffffff' },
  { key: 'ball', dark: false, bg: ['#fe9951', '#f12941'], ink: '#fff3e6', accent: '#7a1030', accent2: '#ffd166' },
  { key: 'berry', dark: true, bg: ['#b0124a', '#6e0b31'], ink: '#ffd9e6', accent: '#ff8fb1', accent2: '#ffffff' },
  { key: 'mustard', dark: false, bg: ['#ecb53c', '#d99a1e'], ink: '#fff6dc', accent: '#c0392b', accent2: '#2d4a7a' },
  { key: 'teal', dark: true, bg: ['#2e7d7a', '#1d5856'], ink: '#bff0dc', accent: '#f28c6b', accent2: '#f6f2e8' },
  { key: 'periwinkle', dark: false, bg: ['#7b90dc', '#4f66b8'], ink: '#24306b', accent: '#ffffff', accent2: '#ffd166' },
  { key: 'cream', dark: false, bg: ['#f3e6cf', '#e6cfa8'], ink: '#b5442b', accent: '#2f6b4f', accent2: '#e3a33b' },
  { key: 'magenta', dark: true, bg: ['#d61f7c', '#8f1a86'], ink: '#ffd1ea', accent: '#5a1c7a', accent2: '#ffe066' },
  { key: 'lime', dark: false, bg: ['#a9c93b', '#7fa42a'], ink: '#ffffff', accent: '#2f5d2a', accent2: '#e94b3c' },
  { key: 'night', dark: true, bg: ['#26221f', '#14110f'], ink: '#e6c27a', accent: '#b8403a', accent2: '#f5efe2' },
  { key: 'wine', dark: true, bg: ['#7a1e2c', '#4f121c'], ink: '#f7c6cf', accent: '#e86a7f', accent2: '#f5e6c8' },
];

// формы снежинок для снегопада и сетки
const EVENT = { branches: [[0.55, 0.32, 50]], tip: 'diamond', core: 'hex', width: 0.12 };
function randomFlake() {
  const k = pick([0, 1, 1, 2, 2, 3]);
  const ts = shuffle([0.3, 0.42, 0.55, 0.68, 0.78]).slice(0, k).sort();
  return {
    branches: ts.map((t) => [t, r2(between(0.16, 0.36) * (1.1 - t * 0.5)), pick([40, 45, 50, 55, 60])]),
    tip: pick(['none', 'fork', 'diamond', 'arrow', 'bar']),
    core: pick(['none', 'hex', 'hexfill', 'star']),
    width: r2(between(0.09, 0.15)),
  };
}

// виды композиции: сколько рубашек, имена, подвиды и подходящие палитры
const PLAN = [
  { style: 'tile', names: ['Ельник', 'Подарки', 'Игрушки', 'Снеговики', 'Звездопад'], motifs: [['tree'], ['gift', 'star'], ['ornament'], ['snowman', 'snowflake'], ['star', 'snowflake']] },
  { style: 'knit', names: ['Свитер', 'Варежка', 'Шарф', 'Носки'] },
  { style: 'poster', names: ['Сочельник', 'Полночь', 'Сугроб', 'Опушка'], dark: true },
  { style: 'folk', names: ['Узор', 'Лубок', 'Ярмарка', 'Рушник'], subs: ['scallop', 'zig'], motifs: [['tree'], ['gift'], ['snowflake'], ['star']] },
  { style: 'chevron', names: ['Ёлочка', 'Снежки', 'Горка'], subs: ['down', 'up'] },
  { style: 'garland', names: ['Гирлянда', 'Мишура', 'Огоньки'], dark: true },
  { style: 'snowfall', names: ['Метель', 'Вьюга', 'Позёмка'] },
  { style: 'geo', names: ['Иней', 'Сосулька', 'Каток', 'Стежок'], subs: ['waves', 'stairs', 'diamonds', 'stitch', 'arcs'] },
];

const palUse = new Map(PALETTES.map((p) => [p.key, 0]));
// наименее использованная подходящая палитра, не повторяясь внутри вида
function choosePalette(plan, usedInStyle) {
  const ok = PALETTES.filter((p) => (plan.dark ? p.dark : true) && !usedInStyle.has(p.key));
  const min = Math.min(...ok.map((p) => palUse.get(p.key)));
  const p = pick(ok.filter((x) => palUse.get(x.key) === min));
  palUse.set(p.key, palUse.get(p.key) + 1);
  usedInStyle.add(p.key);
  return p;
}

const backs = [];
for (const plan of PLAN) {
  const usedInStyle = new Set();
  const subs = plan.subs ? shuffle(plan.subs) : [];
  plan.names.forEach((name, i) => {
    const p = choosePalette(plan, usedInStyle);
    const { key, dark, ...pal } = p;
    const back = {
      name,
      rarity: 'basic',
      style: plan.style,
      pal,
      grad: plan.style === 'poster' ? 90 : rnd() < 0.6 ? pick([90, 120, 135, 160, 200]) : null,
      noise: rnd() < 0.4 ? (dark ? 'light' : 'dark') : null,
      seed: Math.floor(rnd() * 1e6),
    };
    if (subs.length) back.sub = subs[i % subs.length];
    if (plan.motifs) back.motifs = plan.motifs[i % plan.motifs.length];
    if (plan.style === 'knit') back.motifs = shuffle(['tree', 'star', 'snowflake', 'gift']).slice(0, 2);
    if (plan.style === 'tile') { back.n = pick([3, 3, 4]); back.dots = rnd() < 0.5; back.variant = pick([0, 1, 2]); }
    if (plan.style === 'folk') back.variant = pick([0, 2]);
    if (plan.style === 'garland') back.n = pick([2, 3]);
    if (plan.style === 'snowfall' || (back.motifs || []).includes('snowflake')) {
      back.flake = pick([EVENT, randomFlake()]);
      back.flakes = [EVENT, randomFlake(), randomFlake()];
    }
    backs.push(back);
  });
}

// вперемешку, чтобы соседние в настройках были разными; id — по порядку
const ordered = [];
const pool = shuffle(backs);
while (pool.length) {
  const prev = ordered[ordered.length - 1];
  const idx = pool.findIndex((b) => !prev || (b.style !== prev.style && b.pal.bg[0] !== prev.pal.bg[0]));
  ordered.push(pool.splice(idx < 0 ? 0 : idx, 1)[0]);
}
const out = ordered.map((b, i) => ({ id: `winter-${String(i + 1).padStart(2, '0')}`, ...b }));

fs.writeFileSync(new URL('../js/catalog/backs.generated.js', import.meta.url), `// СГЕНЕРИРОВАНО build/gen-backs.mjs (зерно ${SEED}) — руками не править,
// перегенерировать: npm run gen:backs. Описание полей — docs/catalog.md.
// Отрисовка — js/catalog/backs.js.

const BACKS_GENERATED = ${JSON.stringify(out, null, 1)};
`);
console.log(`backs: ${out.length} → js/catalog/backs.generated.js`);
console.log(out.map((b) => `${b.id} ${b.style}${b.sub ? '/' + b.sub : ''} ${b.name}`).join('\n'));
