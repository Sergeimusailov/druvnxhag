// Генератор рамок аватара: npm run gen:frames
//
// Дописывает рамки в js/catalog/frames.generated.js до нужного количества.
// Уже выданные рамки (их id и облик) не трогает — новые получают следующие
// номера и палитры, которых ещё нет. Отрисовка — js/catalog/frames.js.
// Подробно — docs/catalog.md.
//
//   node build/gen-frames.mjs                — дописать недостающие
//   node build/gen-frames.mjs --fresh        — собрать список заново (id поменяют облик!)
//   node build/gen-frames.mjs --seed 42      — другое зерно для новых рамок
import fs from 'node:fs';

const FILE = new URL('../js/catalog/frames.generated.js', import.meta.url);
const argSeed = process.argv.indexOf('--seed');
const SEED = argSeed > 0 ? Number(process.argv[argSeed + 1]) : 2411;
const FRESH = process.argv.includes('--fresh');

// сколько сгенерированных рамок должно быть (+ 10 прежних обычных в
// js/catalog/frames.js = 30 обычных: 18 генерированных + 2 новогодние)
const TARGET = { basic: 18, rare: 10 };

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

// уже выданные рамки
let existing = [];
if (!FRESH && fs.existsSync(FILE)) {
  const src = fs.readFileSync(FILE, 'utf8');
  existing = JSON.parse(src.slice(src.indexOf('['), src.lastIndexOf(']') + 1));
}
// новые рамки — своим потоком случайных чисел, чтобы не зависеть от старых
const rnd = prng(SEED + existing.length * 7919);
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const int = (min, max) => min + Math.floor(rnd() * (max - min + 1));
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// палитры обычных рамок: светлый, основной, тёмный (название — имя рамки)
const BASIC_PALETTES = [
  ['Лаванда', ['#efe6ff', '#a98bff', '#5b3fc4']],
  ['Коралл', ['#ffe3d6', '#ff7a59', '#c23a1e']],
  ['Лайм', ['#f4ffd1', '#a6e22e', '#4f8a0b']],
  ['Сапфир', ['#d9e6ff', '#3d6bff', '#122f9e']],
  ['Изумруд', ['#d4fbe6', '#1fbf75', '#0a6440']],
  ['Янтарь', ['#fff1cc', '#ffb020', '#b86a00']],
  ['Малина', ['#ffd9e8', '#e6336f', '#8e0f3d']],
  ['Бирюза', ['#d2fbf7', '#20c9c0', '#0a6f73']],
  ['Сирень', ['#f6dcff', '#c86bf0', '#7a2aa6']],
  ['Персик', ['#ffeede', '#ffa86b', '#c8622b']],
  ['Индиго', ['#dfe0ff', '#5a55e8', '#28237d']],
  ['Мёд', ['#fff6c9', '#f2c230', '#9c7300']],
  ['Слива', ['#f0d9ef', '#9b3b8f', '#4d1047']],
  ['Небо', ['#e5f7ff', '#5cc4ff', '#1d73b8']],
  ['Песок', ['#fbf1de', '#d9b27c', '#8a6634']],
  ['Сталь', ['#eef1f5', '#8d99ab', '#3e4757']],
  ['Вишня', ['#ffd6dc', '#d61f45', '#7a0a22']],
  ['Хвоя', ['#dff5e3', '#3f9e5a', '#1c4f2c']],
  ['Терракота', ['#ffe0d1', '#d0673f', '#7f2f16']],
  ['Ультрамарин', ['#dde3ff', '#2f45d8', '#101c6e']],
  ['Фуксия', ['#ffd9f7', '#e03cc6', '#7d1170']],
  ['Олива', ['#f1f3d8', '#9aa63a', '#4f5714']],
  ['Шоколад', ['#f3e2d6', '#8a5a3c', '#3f2414']],
  ['Полночь', ['#d7dbea', '#3b4470', '#141a33']],
];

// палитры редких: четыре цвета для перелива
const RARE_PALETTES = [
  ['Аврора', ['#7affc8', '#36c6ff', '#9d6bff', '#ff7ad9']],
  ['Неон', ['#39ff88', '#00e5ff', '#ff2bd6', '#fff04d']],
  ['Закат', ['#ffd166', '#ff7a3d', '#e6336f', '#6b2bd6']],
  ['Лагуна', ['#d2fff8', '#2fe0d0', '#1b8cff', '#0b3f8a']],
  ['Мираж', ['#ffe9a8', '#ffb3c7', '#b9a6ff', '#7fe3ff']],
  ['Комета', ['#ffffff', '#a6c8ff', '#4b5dff', '#1a1446']],
  ['Нектар', ['#fff36b', '#ffb020', '#ff5c8a', '#ff9ae0']],
  ['Туманность', ['#2a1259', '#7a2bd6', '#ff5cc8', '#ffd6f4']],
  ['Кварц', ['#fff0f6', '#ffc2dc', '#d79bff', '#ffffff']],
  ['Лава', ['#2b0a05', '#c2161b', '#ff6a1a', '#ffd34d']],
  ['Бриз', ['#effff8', '#9cf2c8', '#4fd1ff', '#ffffff']],
  ['Сумерки', ['#0f1a3d', '#3a3f9e', '#e66aa8', '#ffb86b']],
];

// новогодние рамки — цвета и узор с иконок новогоднего ивента:
// ёлочный шар (assets/v2-snow-pts2.png) и снежинка (assets/v2-event-snowflake.png)
const NY_FRAMES = [
  {
    id: 'ny-ball', name: 'Ёлочный шар', rarity: 'basic', theme: 'ny',
    colors: ['#fe9951', '#fd651a', '#f12941'],
    fill: { type: 'radial', angle: 0 },
    pattern: { kind: 'snowflake', size: 20, ink: 'rgba(255,255,255,0.55)' },
  },
  {
    id: 'ny-snowflake', name: 'Снежинка', rarity: 'basic', theme: 'ny',
    colors: ['#cedeff', '#567dff', '#283dd9'],
    fill: { type: 'linear', angle: 135 },
    pattern: { kind: 'snowflake', size: 20, ink: 'rgba(255,255,255,0.5)' },
  },
];

// узоры — отрисовка в js/catalog/frames.js (FRAME_PATTERNS)
const PATTERNS = ['dots', 'polka', 'stripes', 'checks', 'rhombus', 'zigzag', 'waves', 'rings', 'cross', 'triangles', 'stars', 'scales'];
const FILLS = ['solid', 'linear', 'linear2', 'radial', 'conic'];
const ANIMS = ['spin', 'turn', 'flow'];
const PARTICLES = [null, 'spark', 'ember', 'star'];

const lum = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
};
const lightest = (colors) => colors.reduce((a, c) => (lum(c) > lum(a) ? c : a));
const ink = (hex, strong) => (lum(hex) > 150 ? `rgba(0,0,0,${strong ? 0.3 : 0.24})` : `rgba(255,255,255,${strong ? 0.5 : 0.4})`);
const pad = (n) => String(n).padStart(2, '0');

const used = new Set(existing.map((f) => f.name));
const count = (r) => existing.filter((f) => f.rarity === r && !f.theme).length;
// узоры по кругу, начиная с наименее использованных
const patternQueue = (r) => {
  const n = (k) => existing.filter((f) => f.rarity === r && f.pattern.kind === k).length;
  return shuffle(PATTERNS).sort((a, b) => n(a) - n(b));
};

const added = [];

const basicPats = patternQueue('basic');
const basicPalettes = shuffle(BASIC_PALETTES.filter(([name]) => !used.has(name)));
for (let i = count('basic'); i < TARGET.basic && basicPalettes.length; i++) {
  const [name, colors] = basicPalettes.shift();
  added.push({
    id: `basic-${pad(i + 1)}`,
    name,
    rarity: 'basic',
    colors,
    fill: { type: pick(FILLS), angle: pick([45, 90, 135, 160, 200, 315]) },
    pattern: { kind: basicPats[(i - count('basic')) % basicPats.length], size: pick([14, 16, 18, 20]), ink: ink(colors[1], false) },
  });
}

const rarePats = patternQueue('rare');
const rarePalettes = shuffle(RARE_PALETTES.filter(([name]) => !used.has(name)));
for (let i = count('rare'); i < TARGET.rare && rarePalettes.length; i++) {
  const [name, colors] = rarePalettes.shift();
  const particle = PARTICLES[int(0, PARTICLES.length - 1)];
  const [dx, dy] = pick([[1, 0], [0, 1], [1, 1], [-1, 1], [0, -1]]);
  added.push({
    id: `rare-${pad(i + 1)}`,
    name,
    rarity: 'rare',
    colors,
    fill: { type: ANIMS[i % ANIMS.length], angle: pick([45, 90, 135, 180]), speed: pick([3, 4, 5, 6]) },
    pattern: { kind: rarePats[(i - count('rare')) % rarePats.length], size: pick([16, 18, 20]), ink: ink(colors[1], true), drift: [dx, dy], speed: pick([2, 3, 4]) },
    fx: particle ? { kind: particle, count: particle === 'spark' ? 5 : 7, color: lightest(colors) } : null,
  });
}

for (const ny of NY_FRAMES) if (!existing.some((f) => f.id === ny.id)) added.push(ny);

const all = [...existing, ...added];
const out = `// СГЕНЕРИРОВАНО build/gen-frames.mjs — руками не править, дописать
// недостающие: npm run gen:frames. Описание полей — docs/catalog.md.
// Отрисовка — js/catalog/frames.js.

const FRAMES_GENERATED = ${JSON.stringify(all, null, 2)};
`;
fs.writeFileSync(FILE, out);
console.log(`frames: было ${existing.length}, добавлено ${added.length} (${added.map((f) => f.id).join(', ') || '—'})`);
