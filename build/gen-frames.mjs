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

// сколько сгенерированных рамок должно быть: 27 обычных frame-NN + «Белая»
// (js/catalog/frames.js) + 2 новогодние = 30 обычных в игре
const TARGET = { basic: 27, rare: 10 };

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
  // рамки старого вида basic-NN (градиент + крупный узор) выведены из игры
  existing = existing.filter((f) => f.rarity !== 'basic' || f.theme || f.style);
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
// узоры редких рамок
const PATTERNS = ['dots', 'polka', 'stripes', 'checks', 'rhombus', 'zigzag', 'waves', 'rings', 'cross', 'triangles', 'stars', 'scales'];
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

// ---------- обычные рамки: заливка + приём + шум ----------
// плоские «печатные» палитры: основной, второй (светлый / контрастный), акцент
const FRAME_PALETTES = [
  ['Мак', ['#e2402f', '#ffd8c9', '#2b2b6b']], ['Горчица', ['#e3a72f', '#fff1c7', '#7a3b1d']],
  ['Шалфей', ['#8fb59a', '#e9f2e3', '#2f4a3a']], ['Барвинок', ['#6f86d6', '#dfe5ff', '#24306b']],
  ['Фуксия', ['#d61f7c', '#ffd1ea', '#5a1c7a']], ['Лайм', ['#a9c93b', '#f2ffd0', '#2f5d2a']],
  ['Терракота', ['#c8623d', '#ffe1d2', '#5e2414']], ['Бирюза', ['#1fa7a0', '#d5fbf6', '#0b4f4c']],
  ['Индиго', ['#3b3fa8', '#d9dbff', '#ffcf5a']], ['Брусника', ['#b0124a', '#ffd9e6', '#3b0a1c']],
  ['Охра', ['#d08a2e', '#fce6c4', '#4a2c0e']], ['Мята', ['#5fd3a8', '#e4fff3', '#14624a']],
  ['Сирень', ['#b48ae6', '#f1e6ff', '#4b2a7a']], ['Коралл', ['#ff7a59', '#ffe3d6', '#7a1e10']],
  ['Асфальт', ['#3a3a40', '#a7a7b0', '#f2c14e']], ['Песок', ['#d9b27c', '#fbf1de', '#6b4a20']],
  ['Море', ['#2a5da8', '#d2e3ff', '#f28c6b']], ['Вишня', ['#a3162e', '#ffd6dc', '#f2c14e']],
  ['Хвоя', ['#2f6b4f', '#d8efe0', '#e94b3c']], ['Персик', ['#ffa86b', '#ffeede', '#a8401a']],
  ['Слива', ['#6d2f6f', '#f0d9ef', '#e3a33b']], ['Небо', ['#5cc4ff', '#e5f7ff', '#1d4f8a']],
  ['Янтарь', ['#f2a516', '#fff1cc', '#8a3b00']], ['Роза', ['#ff5c8a', '#ffe0ea', '#7a0f3a']],
  ['Полночь', ['#1b2a5c', '#9fb0e0', '#f2c14e']], ['Изумруд', ['#1fbf75', '#d4fbe6', '#0a4a2f']],
  ['Шоколад', ['#6b4330', '#e8d2c2', '#e3a33b']],
];
// приёмы и сколько рамок каждого (в сумме 27)
const FRAME_PLAN = [
  ['bold', 4], ['micro', 4], ['grain', 4], ['studs', 3], ['scallop', 3], ['teeth', 3], ['stitch', 2], ['split', 2], ['bands', 2],
];
const MICRO = ['microdots', 'hatch', 'pin', 'crosshatch', 'mcheck', 'plus'];
const BOLD = ['dots', 'polka', 'stripes', 'checks', 'rhombus', 'zigzag', 'waves', 'rings', 'cross', 'triangles', 'stars', 'scales'];
const STUDS = ['star', 'star8', 'diamond', 'dot', 'plus'];
const alpha = (hex, a) => {
  const v = parseInt(hex.slice(1), 16);
  return `rgba(${v >> 16},${(v >> 8) & 255},${v & 255},${a})`;
};
const angle = () => pick([45, 90, 135, 160, 200, 315]);

function frameSpec(style, colors) {
  const [m, s2, a] = colors;
  const light = lum(m) > 150;
  const ink2 = alpha(s2, light ? 0.55 : 0.5);
  const inkA = alpha(a, 0.55);
  const tone = light ? 'dark' : 'light';
  const f = { style, colors, fill: { type: pick(['solid', 'grad']), angle: angle() }, deco: null, noise: null };
  if (style === 'bold') f.deco = { kind: 'pattern', pattern: pick(BOLD), size: pick([16, 18, 20, 22]), ink: pick([ink2, inkA]) };
  if (style === 'micro') f.deco = { kind: 'micro', pattern: pick(MICRO), size: pick([4, 5, 6, 7]), ink: pick([ink2, inkA]) };
  if (style === 'grain') { f.fill = { type: pick(['grad', 'duo']), angle: angle() }; f.noise = { tone, amount: pick([0.5, 0.65, 0.8]) }; }
  if (style === 'studs') {
    f.deco = { kind: 'studs', shape: pick(STUDS), size: pick([10, 12]), ink: pick([s2, a]), many: rnd() < 0.5 };
    if (rnd() < 0.5) f.deco.under = { pattern: pick(MICRO), size: 5, ink: alpha(s2, 0.25) };
  }
  if (style === 'scallop' || style === 'teeth') f.deco = { kind: 'edge', edge: style, w: pick([8, 10, 12]), h: pick([4, 5]), ink: pick([s2, a]) };
  if (style === 'stitch') { f.fill = { type: 'solid', angle: 0 }; f.deco = { kind: 'edge', edge: 'stitch', w: 7, h: 6, ink: s2 }; }
  if (style === 'split') f.fill = { type: pick(['split', 'quarters']), angle: pick([45, 135, 0]) };
  if (style === 'bands') f.fill = { type: pick(['bands', 'bands3']), angle: pick([0, 45, 90, 135]), width: pick([3, 4, 5]) };
  // лёгкое зерно и на части остальных
  if (!f.noise && style !== 'stitch' && rnd() < 0.3) f.noise = { tone, amount: 0.4 };
  return f;
}

const frameCount = existing.filter((f) => f.id.startsWith('frame-')).length;
const framePalettes = shuffle(FRAME_PALETTES.filter(([name]) => !used.has(name)));
const styleQueue = shuffle(FRAME_PLAN.flatMap(([st, k]) => Array(k).fill(st)));
// соседние — разных приёмов
for (let i = 1; i < styleQueue.length; i++) {
  if (styleQueue[i] === styleQueue[i - 1]) {
    const j = styleQueue.findIndex((x, k) => k > i && x !== styleQueue[i]);
    if (j > 0) [styleQueue[i], styleQueue[j]] = [styleQueue[j], styleQueue[i]];
  }
}
for (let i = frameCount; i < TARGET.basic && framePalettes.length; i++) {
  const [name, colors] = framePalettes.shift();
  added.push({ id: `frame-${pad(i + 1)}`, name, rarity: 'basic', ...frameSpec(styleQueue[i % styleQueue.length], colors) });
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
