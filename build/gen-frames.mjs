// Генератор рамок аватара: npm run gen:frames
//
// Подбирает по «зерну» сочетания «палитра + заливка + узор (+ анимация,
// частицы)» и записывает готовый список в js/catalog/frames.generated.js.
// Список фиксируется в файле: id и облик рамок не меняются, пока генератор
// не запустят снова. Отрисовка по описанию — js/catalog/frames.js.
// Подробно — docs/catalog.md.
//
//   node build/gen-frames.mjs            — зерно по умолчанию
//   node build/gen-frames.mjs --seed 42  — другой набор
import fs from 'node:fs';

const argSeed = process.argv.indexOf('--seed');
const SEED = argSeed > 0 ? Number(process.argv[argSeed + 1]) : 2411;

const BASIC_COUNT = 10; // + 10 прежних обычных = 20
const RARE_COUNT = 10;

// детерминированный ГПСЧ (mulberry32)
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
const int = (min, max) => min + Math.floor(rnd() * (max - min + 1));
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// палитры обычных рамок: светлый, основной, тёмный (названия — имя рамки)
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

// узоры — отрисовка в js/catalog/frames.js (FRAME_PATTERNS)
const PATTERNS = ['dots', 'polka', 'stripes', 'checks', 'rhombus', 'zigzag', 'waves', 'rings', 'cross', 'triangles', 'stars', 'scales'];
const FILLS = ['solid', 'linear', 'linear2', 'radial', 'conic'];
const ANIMS = ['spin', 'turn', 'flow'];
const PARTICLES = [null, 'spark', 'ember', 'star'];

// светлый ли цвет (узор на светлом — тёмный, на тёмном — светлый)
const isLight = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  const r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b > 150;
};
// самый светлый цвет палитры — частицы им заметнее всего
const lum = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
};
const lightest = (colors) => colors.reduce((a, c) => (lum(c) > lum(a) ? c : a));
const ink = (hex, strong) => (isLight(hex) ? `rgba(0,0,0,${strong ? 0.3 : 0.24})` : `rgba(255,255,255,${strong ? 0.5 : 0.4})`);

const pad = (n) => String(n).padStart(2, '0');

const basicPalettes = shuffle(BASIC_PALETTES).slice(0, BASIC_COUNT);
const basicPatterns = shuffle(PATTERNS);
const basic = basicPalettes.map(([name, colors], i) => {
  const fill = pick(FILLS);
  return {
    id: `basic-${pad(i + 1)}`,
    name,
    rarity: 'basic',
    colors,
    fill: { type: fill, angle: pick([45, 90, 135, 160, 200, 315]) },
    pattern: { kind: basicPatterns[i % basicPatterns.length], size: pick([14, 16, 18, 20]), ink: ink(colors[1], false) },
  };
});

const rarePalettes = shuffle(RARE_PALETTES).slice(0, RARE_COUNT);
const rarePatterns = shuffle(PATTERNS);
const rare = rarePalettes.map(([name, colors], i) => {
  const anim = ANIMS[i % ANIMS.length];
  const particle = PARTICLES[int(0, PARTICLES.length - 1)];
  const dirs = [[1, 0], [0, 1], [1, 1], [-1, 1], [0, -1]];
  const [dx, dy] = pick(dirs);
  // средний цвет палитры — по нему цвет узора
  return {
    id: `rare-${pad(i + 1)}`,
    name,
    rarity: 'rare',
    colors,
    fill: { type: anim, angle: pick([45, 90, 135, 180]), speed: pick([3, 4, 5, 6]) },
    pattern: { kind: rarePatterns[i % rarePatterns.length], size: pick([16, 18, 20]), ink: ink(colors[1], true), drift: [dx, dy], speed: pick([2, 3, 4]) },
    fx: particle ? { kind: particle, count: particle === 'spark' ? 5 : 7, color: lightest(colors) } : null,
  };
});

const out = `// СГЕНЕРИРОВАНО build/gen-frames.mjs (зерно ${SEED}) — руками не править,
// перегенерировать: npm run gen:frames. Описание полей — docs/catalog.md.
// Отрисовка — js/catalog/frames.js.

const FRAMES_GENERATED = ${JSON.stringify([...basic, ...rare], null, 2)};
`;
fs.writeFileSync(new URL('../js/catalog/frames.generated.js', import.meta.url), out);
console.log(`frames: ${basic.length} обычных, ${rare.length} редких → js/catalog/frames.generated.js`);
