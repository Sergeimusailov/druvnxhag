// Рамки аватара по макету Figma (файл L9YY2OHqMbFIK7tqx1nuLJ, раздел «Рамки»,
// узел 18162:84720): 30 рамок 80×80, кольцо 8px, радиус 16 (внутри — 64×64, r12).
// Всё на CSS и SVG, без картинок. Фон рамки — строка CSS `background` (слои):
//   • linear / conic / solid — CSS-градиенты и цвета из макета;
//   • radial — SVG-градиент с матрицей из Figma (FRAMES_FIGMA_RADIAL);
//   • svg — рамка, которая в макете целиком векторная (FRAMES_FIGMA_SVG);
//   • узоры поверх градиента — там, где в макете растровые картинки
//     (04, 07, 10, 21, 23, 26): перерисованы векторно (функции ниже).
//
//   FRAMES_FIGMA       — [{ id, name, node, css }]
//   FRAME_FIGMA_SVG_URL(svg) — SVG-строка → слой background
//
// Данные — js/catalog/frames.figma.data.js. Подключение — js/catalog/frames.js.
// Подробно — docs/catalog.md.

const FRAMES_FIGMA = (() => {
  const n = (v) => +(+v).toFixed(2);
  const rng = (seed) => {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  const SVG_NS = 'xmlns="http://www.w3.org/2000/svg"';
  const layer = (svg) => `url("data:image/svg+xml,${encodeURIComponent(svg)}") center / 100% 100% no-repeat`;
  const svg80 = (body) => layer(`<svg ${SVG_NS} width="80" height="80" viewBox="0 0 80 80">${body}</svg>`);
  // точка в кольце (снаружи внутреннего квадрата 8..72), с запасом за край
  const ringPoint = (R, pad = 1) => {
    for (;;) {
      const x = -pad + R() * (80 + 2 * pad);
      const y = -pad + R() * (80 + 2 * pad);
      if (x < 9 || x > 71 || y < 9 || y > 71) return [x, y];
    }
  };

  // ---------- фоны из макета ----------
  const SILVER = 'linear-gradient(223.55deg, #b6b6b6 7.77%, #f7f7f7 57.93%, #737373 94.39%)';
  const BLUE_CONIC = 'conic-gradient(from 210.77deg at 55% 13.13%, #4fcaff 0%, #48a5ff 14.48%, #4080ff 28.95%, #395aff 43.43%, #3235ff 57.91%, #395aff 68.43%, #4080ff 78.95%, #48a5ff 89.48%, #4fcaff 100%)';
  const radial = (id) => {
    const g = FRAMES_FIGMA_RADIAL[id];
    const stops = g.stops.map(([c, o]) => `<stop offset="${o}" stop-color="${c}"/>`).join('');
    return svg80(`<defs><radialGradient id="g" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="10" gradientTransform="${g.m}">${stops}</radialGradient></defs><rect width="80" height="80" fill="url(#g)"/>`);
  };
  const vector = (id) => layer(FRAMES_FIGMA_SVG[id]);

  // ---------- узоры вместо растровых картинок макета ----------
  // 04 — белые бумажки-конфетти
  function confetti() {
    const R = rng(4);
    let b = '';
    for (let i = 0; i < 46; i++) {
      const [x, y] = ringPoint(R, 2);
      const w = 0.7 + R() * 2.6;
      const h = 0.5 + R() * 0.8;
      b += `<rect x="${n(x - w / 2)}" y="${n(y - h / 2)}" width="${n(w)}" height="${n(h)}" fill="#fff" opacity="${n(0.55 + R() * 0.45)}" transform="rotate(${n(R() * 180)} ${n(x)} ${n(y)})"/>`;
    }
    return svg80(b);
  }
  // 07 — ленточки: градиент от серого к белому вдоль каждой, толщина 2.55–2.75
  function streamers() {
    const paths = [
      'M50 -4C58 8 70 6 84 14', 'M38 -3C44 4 46 10 40 22', 'M62 -2C66 14 78 22 86 20',
      'M84 28C74 34 76 46 84 52', 'M73 40C79 50 76 62 84 70', 'M84 60C76 66 72 76 66 84',
      'M50 84C56 74 66 70 72 74', 'M4 26C10 18 18 18 20 10', 'M-2 44C6 40 4 30 10 26', 'M20 84C26 76 34 78 40 70',
    ];
    const defs = '<defs><linearGradient id="a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8a8a92"/><stop offset="1" stop-color="#fff"/></linearGradient><linearGradient id="b" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a8a92"/><stop offset="1" stop-color="#fff"/></linearGradient></defs>';
    return svg80(defs + paths.map((d, i) => `<path d="${d}" fill="none" stroke="url(#${i % 2 ? 'a' : 'b'})" stroke-width="${i % 2 ? 2.55 : 2.75}" stroke-linecap="round"/>`).join(''));
  }
  // 10 — снежная пыль
  function snowDust() {
    const R = rng(10);
    let b = '';
    for (let i = 0; i < 60; i++) {
      const [x, y] = ringPoint(R, 0);
      b += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(0.25 + R() * 0.55)}" fill="#fff" opacity="${n(0.45 + R() * 0.55)}"/>`;
    }
    return svg80(b);
  }
  // 21 — белые изолинии (линии уровня одного поля — не пересекаются)
  function contours() {
    const hill = (x, y, cx, cy, h, r) => h * Math.exp(-((x - cx) ** 2 + (y - cy) ** 2) / (2 * r * r));
    const f = (x, y) => hill(x, y, 70, 6, 1, 20) + hill(x, y, 6, 70, 0.9, 20) + hill(x, y, 78, 78, 0.6, 12) + 0.08 * Math.sin(x * 0.12) * Math.cos(y * 0.1);
    const step = 1.2;
    const N = Math.round(84 / step) + 1;
    const v = [];
    for (let j = 0; j < N; j++) { v[j] = []; for (let i = 0; i < N; i++) v[j][i] = f(i * step - 2, j * step - 2); }
    let d = '';
    [0.14, 0.3, 0.5, 0.72].forEach((L) => {
      for (let j = 0; j < N - 1; j++) for (let i = 0; i < N - 1; i++) {
        const a = v[j][i]; const b = v[j][i + 1]; const c = v[j + 1][i + 1]; const e = v[j + 1][i];
        const x = i * step - 2; const y = j * step - 2;
        const p = [];
        const cut = (q, r, x0, y0, x1, y1) => { if ((q < L) !== (r < L)) { const t = (L - q) / (r - q); p.push([x0 + (x1 - x0) * t, y0 + (y1 - y0) * t]); } };
        cut(a, b, x, y, x + step, y); cut(b, c, x + step, y, x + step, y + step); cut(e, c, x, y + step, x + step, y + step); cut(a, e, x, y, x, y + step);
        for (let k = 0; k + 1 < p.length; k += 2) d += `M${n(p[k][0])} ${n(p[k][1])}L${n(p[k + 1][0])} ${n(p[k + 1][1])}`;
      }
    });
    return svg80(`<path d="${d}" fill="none" stroke="#fff" stroke-width="0.7" stroke-linecap="round" opacity="0.95"/>`);
  }
  // 23 — светящиеся искры (места и размеры — из макета)
  function sparkles() {
    const spots = [[19, -6, 26], [45, 66, 14], [-11, 39, 23], [-1, 2, 23], [66, 8, 14], [61, 25, 26], [-1, 58, 26], [51, -5, 18], [23, 71, 18], [-1, 27, 12], [70, 55, 12], [60, 69, 18]];
    const cols = ['#a98bff', '#ffc94a', '#ff7ad9', '#4fe36d', '#a98bff', '#ff7ad9', '#ffc94a', '#a98bff', '#ff7ad9', '#4fe36d', '#a98bff', '#ffc94a'];
    let b = '<defs><filter id="gl" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="0.9"/></filter></defs>';
    spots.forEach(([x, y, s], i) => {
      const cx = x + s / 2;
      const cy = y + s / 2;
      const r = s * 0.42;
      const k = i % 2 ? 6 : 8;
      const pts = Array.from({ length: k * 2 }, (_, j) => {
        const a = (Math.PI / k) * j + i;
        const rr = j % 2 ? r * 0.16 : r * (j % 4 ? 0.7 : 1);
        return `${n(cx + Math.sin(a) * rr)},${n(cy - Math.cos(a) * rr)}`;
      }).join(' ');
      b += `<polygon points="${pts}" fill="${cols[i]}" filter="url(#gl)" opacity="0.9"/><polygon points="${pts}" fill="${cols[i]}"/><circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r * 0.18)}" fill="#fff"/>`;
    });
    return svg80(b);
  }
  // 26 — крупные белые снежинки (места — из макета)
  function snowflakes() {
    const spots = [[53, 1, 30], [71, 43, 26], [-11, 43, 26], [29, 59, 26], [3, 3, 26], [27, -17, 26]];
    const arm = 'M0 0V-1M0 -0.3l0.18 -0.16M0 -0.3l-0.18 -0.16M0 -0.55l0.2 -0.18M0 -0.55l-0.2 -0.18M0 -0.78l0.13 -0.12M0 -0.78l-0.13 -0.12';
    let b = '';
    spots.forEach(([x, y, s], i) => {
      const r = s * 0.4;
      const arms = [0, 60, 120, 180, 240, 300].map((a) => `<path d="${arm}" transform="rotate(${a})"/>`).join('');
      b += `<g transform="translate(${n(x + s / 2)} ${n(y + s / 2)}) rotate(${i * 9}) scale(${n(r)})" fill="none" stroke="#eef3fb" stroke-width="${n(1.7 / r)}" stroke-linecap="round">${arms}</g>`;
    });
    return svg80(b);
  }

  const L = (...layers) => layers.join(', ');
  const list = [
    ['fr-01', 'Серебро', '18162:84950', () => SILVER],
    ['fr-02', 'Апельсин', '18162:84978', () => radial('fr-02')],
    ['fr-03', 'Аметист', '18162:85008', () => radial('fr-03')],
    ['fr-04', 'Конфетти', '18162:84951', () => L(confetti(), 'linear-gradient(223.57deg, #de323a 6.2%, #e63e43 51.43%, #a20204 94.07%)')],
    ['fr-05', 'Лайм', '18162:84981', () => radial('fr-05')],
    ['fr-06', 'Северное сияние', '18162:85011', () => radial('fr-06')],
    ['fr-07', 'Закат', '18162:84954', () => L(streamers(), 'linear-gradient(223.57deg, #de32ca 6.2%, #e64f3e 51.43%, #ff8c00 69.79%, #ffff23 94.07%)')],
    ['fr-08', 'Мандарин', '18162:84984', () => radial('fr-08')],
    ['fr-09', 'Лимон', '18162:85014', () => radial('fr-09')],
    ['fr-10', 'Фиалка', '18162:84957', () => L(snowDust(), radial('fr-10'))],
    ['fr-11', 'Рассвет', '18162:84987', () => radial('fr-11')],
    ['fr-12', 'Полночь', '18162:85017', () => '#252e5b'],
    ['fr-13', 'Вихрь', '18162:84960', () => vector('fr-13')],
    ['fr-14', 'Лазурь', '18162:84990', () => BLUE_CONIC],
    ['fr-15', 'Лаванда', '18162:85020', () => '#a889e2'],
    ['fr-16', 'Искры', '18162:84963', () => L(vector('fr-16'), BLUE_CONIC)],
    ['fr-17', 'Звёздочки', '18162:84993', () => vector('fr-17')],
    ['fr-18', 'Малина', '18162:85023', () => vector('fr-18')],
    ['fr-19', 'Абрикос', '18162:84966', () => vector('fr-19')],
    ['fr-20', 'Лучи', '18162:84996', () => vector('fr-20')],
    ['fr-21', 'Рельеф', '18162:85026', () => L(contours(), SILVER)],
    ['fr-22', 'Неон', '18162:84969', () => vector('fr-22')],
    ['fr-23', 'Фейерверк', '18162:84999', () => L(sparkles(), '#1f1f1f')],
    ['fr-24', 'Пузыри', '18162:85029', () => vector('fr-24')],
    ['fr-25', 'Далматин', '18162:84972', () => vector('fr-25')],
    ['fr-26', 'Снежинки', '18162:85002', () => L(snowflakes(), BLUE_CONIC)],
    ['fr-27', 'Волны', '18162:85032', () => vector('fr-27')],
    ['fr-28', 'Пастель', '18162:84975', () => vector('fr-28')],
    ['fr-29', 'Платина', '18162:85005', () => SILVER],
    ['fr-30', 'Горошек', '18162:85035', () => vector('fr-30')],
  ];
  return list.map(([id, name, node, css]) => ({ id, name, node, css: css() }));
})();
