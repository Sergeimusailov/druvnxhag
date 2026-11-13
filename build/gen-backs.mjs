// Генератор рубашек колоды: npm run gen:backs
//
// 30 обычных зимних рубашек: тёплый фон в цветах ёлочного шара с иконки
// новогоднего ивента (assets/v2-snow-pts2.png: персик → оранжевый → красный
// → розовый) и узор из снежинок разных форм. Без эмблемы по центру.
// Результат — js/catalog/backs.generated.js (руками не править), отрисовка —
// js/catalog/backs.js и js/catalog/snowflake.js. Подробно — docs/catalog.md.
//
//   node build/gen-backs.mjs            — зерно по умолчанию
//   node build/gen-backs.mjs --seed 7   — другой набор
import fs from 'node:fs';

const argSeed = process.argv.indexOf('--seed');
const SEED = argSeed > 0 ? Number(process.argv[argSeed + 1]) : 1225;
const COUNT = 30;

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

// фоны: [светлый, основной, тёмный] — оттенки ёлочного шара
const PALETTES = [
  ['#fe9951', '#fd651a', '#f12941'], // сам шар: оранжевый → красный
  ['#fd651a', '#ec4418', '#b8231a'], // жар
  ['#f64b1d', '#f12941', '#a8122b'], // алый
  ['#fd9773', '#fd6387', '#f12941'], // коралл → розовый низ шара
  ['#ffb36b', '#fe9951', '#fd651a'], // мандарин
  ['#f12941', '#c41634', '#7d0d24'], // клюква
  ['#fe9951', '#fd394e', '#fd6387'], // закат
  ['#ec4418', '#b8321a', '#7a1e10'], // кирпич
  ['#ffc38f', '#fd9773', '#ec4418'], // абрикос
  ['#fd651a', '#f12941', '#8f1430'], // красный апельсин
];

const NAMES = [
  'Мандарин', 'Рябина', 'Клюква', 'Брусника', 'Глинтвейн', 'Облепиха', 'Хурма', 'Корица', 'Имбирь', 'Карамель',
  'Леденец', 'Гирлянда', 'Хлопушка', 'Бенгалка', 'Камин', 'Варежка', 'Шарф', 'Снегирь', 'Свиристель', 'Ёлочный шар',
  'Фонарик', 'Мишура', 'Пряник', 'Морс', 'Какао', 'Зарево', 'Огонёк', 'Угольки', 'Сургуч', 'Валенок',
];

const lum = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
};

// формы снежинок: ивентовая + случайные (веточки, кончик, середина, толщина)
const EVENT = { branches: [[0.55, 0.32, 50]], tip: 'diamond', core: 'hex', width: 0.12 };
function randomFlake() {
  const n = pick([0, 1, 1, 2, 2, 3]);
  const ts = shuffle([0.3, 0.42, 0.55, 0.68, 0.78]).slice(0, n).sort();
  return {
    branches: ts.map((t) => [t, r2(between(0.16, 0.36) * (1.1 - t * 0.5)), pick([40, 45, 50, 55, 60])]),
    tip: pick(['none', 'fork', 'diamond', 'arrow', 'bar']),
    core: pick(['none', 'hex', 'hexfill', 'star']),
    width: r2(between(0.09, 0.15)),
  };
}
const SHAPES = [EVENT, ...Array.from({ length: 13 }, randomFlake)];

// раскладки узора (отрисовка — js/catalog/backs.js)
//  grid    — сетка n×n, в клетке одна снежинка
//  stagger — шахматный порядок, две одинаковые снежинки в клетке
//  mix     — крупная и мелкая снежинки разной формы + снежные точки
//  scatter — свободная россыпь разного размера и поворота по всей рубашке
const LAYOUTS = ['grid', 'stagger', 'mix', 'scatter'];
const DENSITY = { grid: [2, 3, 4], stagger: [1, 2], mix: [1, 2], scatter: [1] };

// россыпь: снежинки не налезают друг на друга и на край
function scatter() {
  const items = [];
  const count = Math.floor(between(6, 10));
  for (let tries = 0; items.length < count && tries < 400; tries++) {
    const r = between(8, 17);
    const x = between(r + 2, 98 - r);
    const y = between(r + 2, 98 - r);
    if (items.some((o) => Math.hypot(o.x - x, o.y - y) < o.r + r + 3)) continue;
    items.push({ x: r2(x), y: r2(y), r: r2(r), rot: r2(between(0, 30)), s: items.length % 3 === 2 ? 1 : 0 });
  }
  const dots = Array.from({ length: Math.floor(between(6, 14)) }, () => [r2(between(4, 96)), r2(between(4, 96)), r2(between(1, 2.2))])
    .filter(([x, y]) => !items.some((o) => Math.hypot(o.x - x, o.y - y) < o.r + 2));
  return { items, dots };
}

const names = shuffle(NAMES);
const backs = [];
for (let i = 0; i < COUNT; i++) {
  const colors = PALETTES[i % PALETTES.length];
  const layout = LAYOUTS[(i + Math.floor(i / PALETTES.length)) % LAYOUTS.length];
  const light = lum(colors[1]) > 150;
  const ink = light
    ? pick(['rgba(140,18,24,0.42)', 'rgba(255,255,255,0.75)'])
    : pick(['rgba(255,255,255,0.62)', 'rgba(255,255,255,0.48)', 'rgba(255,236,214,0.7)']);
  const shapes = shuffle(SHAPES.map((_, k) => k)).slice(0, 2);
  const back = {
    id: `back-${String(i + 1).padStart(2, '0')}`,
    name: names[i],
    rarity: 'basic',
    colors,
    bg: { type: pick(['linear', 'linear', 'radial', 'solid']), angle: pick([135, 150, 160, 180, 200]) },
    ink,
    layout,
    density: pick(DENSITY[layout]),
    flakes: shapes.map((k) => SHAPES[k]),
    rot: r2(between(0, 30)),
  };
  if (layout === 'scatter') back.scatter = scatter();
  backs.push(back);
}

const out = `// СГЕНЕРИРОВАНО build/gen-backs.mjs (зерно ${SEED}) — руками не править,
// перегенерировать: npm run gen:backs. Описание полей — docs/catalog.md.
// Отрисовка — js/catalog/backs.js.

const BACKS_GENERATED = ${JSON.stringify(backs, null, 1)};
`;
fs.writeFileSync(new URL('../js/catalog/backs.generated.js', import.meta.url), out);
console.log(`backs: ${backs.length} → js/catalog/backs.generated.js`);
