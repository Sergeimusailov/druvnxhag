// Рубашки колоды по макету Figma (файл L9YY2OHqMbFIK7tqx1nuLJ, раздел
// «Рубашки», узел 18036:39909): 30 рубашек 80×80, радиус 20, обводка 2px
// #7f7f7f, фон #1c1c1e. В макете кроме «базовой» — растровые картинки; здесь
// каждая перерисована векторами (SVG 100×100), без картинок и canvas.
//
//   BACKS_FIGMA — [{ id, name, node, draw(h) }]; draw возвращает содержимое
//   SVG (можно со своими <defs>), h — помощники ниже (BACK_FIGMA_HELPERS).
//
// Отрисовка и подключение — js/catalog/backs.js. Подробно — docs/catalog.md.

const BACK_FIGMA_HELPERS = (() => {
  const n = (v) => +(+v).toFixed(2);
  const rect = (x, y, w, h, fill, extra = '') => `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" fill="${fill}"${extra}/>`;
  const circle = (x, y, r, fill, extra = '') => `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="${fill}"${extra}/>`;
  const ring = (x, y, r, stroke, w, extra = '') => `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="none" stroke="${stroke}" stroke-width="${n(w)}"${extra}/>`;
  const poly = (pts, fill, extra = '') => `<polygon points="${pts.map(([x, y]) => `${n(x)},${n(y)}`).join(' ')}" fill="${fill}"${extra}/>`;
  const line = (d, stroke, w, extra = '') => `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${n(w)}" stroke-linecap="round" stroke-linejoin="round"${extra}/>`;
  const bg = (fill) => `<rect width="100" height="100" fill="${fill}"/>`;
  // звезда: k лучей, внешний радиус r, внутренний r * k2, поворот rot°
  const starPts = (x, y, r, k = 5, k2 = 0.45, rot = 0) => Array.from({ length: k * 2 }, (_, i) => {
    const a = (Math.PI / k) * i + (rot * Math.PI) / 180;
    const rr = i % 2 ? r * k2 : r;
    return [x + Math.sin(a) * rr, y - Math.cos(a) * rr];
  });
  const star = (x, y, r, fill, k = 5, k2 = 0.45, rot = 0, extra = '') => poly(starPts(x, y, r, k, k2, rot), fill, extra);
  const diamond = (x, y, hw, hh, fill, extra = '') => poly([[x, y - hh], [x + hw, y], [x, y + hh], [x - hw, y]], fill, extra);
  // детерминированный ГПСЧ
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
  // гладкая замкнутая клякса через точки (Catmull-Rom → кривые Безье)
  function blob(cx, cy, r, seed, k = 7, wob = 0.28) {
    const R = rng(seed);
    const pts = Array.from({ length: k }, (_, i) => {
      const a = (Math.PI * 2 * i) / k;
      const rr = r * (1 - wob / 2 + R() * wob);
      return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr];
    });
    let d = `M${n(pts[0][0])} ${n(pts[0][1])}`;
    for (let i = 0; i < k; i++) {
      const p0 = pts[(i - 1 + k) % k];
      const p1 = pts[i];
      const p2 = pts[(i + 1) % k];
      const p3 = pts[(i + 2) % k];
      d += `C${n(p1[0] + (p2[0] - p0[0]) / 6)} ${n(p1[1] + (p2[1] - p0[1]) / 6)} ${n(p2[0] - (p3[0] - p1[0]) / 6)} ${n(p2[1] - (p3[1] - p1[1]) / 6)} ${n(p2[0])} ${n(p2[1])}`;
    }
    return `${d}Z`;
  }
  // зерно (фактура как на текстурных картинках макета)
  const grain = (tone = 'light', op = 0.18, id = 'g') => {
    const v = tone === 'dark' ? 0 : 1;
    return `<defs><filter id="${id}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="matrix" values="0 0 0 0 ${v} 0 0 0 0 ${v} 0 0 0 0 ${v} 5 0 0 0 -2.6"/></filter></defs><rect width="100" height="100" filter="url(#${id})" opacity="${op}"/>`;
  };

  // червячки без касаний: дуги, S-образные фигуры и колечки; новая фигура
  // ставится, только если все её точки дальше w + gap от уже поставленных.
  // colors — [цвет, доля] (выбирается по доле), w — толщина
  function worms(seed, { colors = [['#454b54', 1]], w = 7, gap = 3.5, tries = 4000, rings = true } = {}) {
    const R = rng(seed);
    const taken = [];
    const free = (pts) => pts.every(([x, y]) => taken.every(([a, b]) => Math.hypot(a - x, b - y) >= w + gap));
    const pickColor = () => { let t = R(); for (const [c, p] of colors) { if ((t -= p) <= 0) return c; } return colors[0][0]; };
    const arc = (cx, cy, r, a0, sweep) => {
      const k = Math.max(3, Math.round((Math.abs(sweep) * r) / 1.5));
      return Array.from({ length: k }, (_, i) => {
        const a = a0 + (sweep * i) / (k - 1);
        return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
      });
    };
    let out = '';
    for (let t = 0; t < tries; t++) {
      const cx = -8 + R() * 116;
      const cy = -8 + R() * 116;
      const long = t < tries * 0.62;
      const col = pickColor();
      let pts;
      let svg;
      if (rings && !long && R() < 0.5) {
        pts = arc(cx, cy, 4, 0, Math.PI * 2);
        svg = `<circle cx="${n(cx)}" cy="${n(cy)}" r="4" fill="none" stroke="${col}" stroke-width="${n(w * 0.65)}"/>`;
      } else {
        const r = long ? 9 + R() * 9 : 5 + R() * 5;
        const a0 = R() * Math.PI * 2;
        const dir = R() < 0.5 ? -1 : 1;
        const sweep = dir * Math.PI * (long ? 0.8 + R() * 0.7 : 0.6 + R() * 0.6);
        pts = arc(cx, cy, r, a0, sweep);
        if (long && R() < 0.55) {
          const [ex, ey] = pts[pts.length - 1];
          const a1 = a0 + sweep;
          const r2 = r * (0.6 + R() * 0.5);
          pts = pts.concat(arc(ex + Math.cos(a1) * r2, ey + Math.sin(a1) * r2, r2, a1 + Math.PI, -dir * Math.PI * (0.6 + R() * 0.5)).slice(1));
        }
        svg = `<path d="M${pts.map(([x, y]) => `${n(x)} ${n(y)}`).join('L')}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
      }
      if (!free(pts)) continue;
      taken.push(...pts);
      out += svg;
    }
    return out;
  }

  // равномерный разброс: сетка cols×rows, в каждой клетке точка со сдвигом
  const jitter = (seed, cols, rows, amount = 0.32) => {
    const R = rng(seed);
    const pts = [];
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      pts.push([((i + 0.5 + (R() - 0.5) * 2 * amount) * 100) / cols, ((j + 0.5 + (R() - 0.5) * 2 * amount) * 100) / rows, R()]);
    }
    return pts;
  };

  // изолинии поля высот (marching squares) — линии одного поля не пересекаются
  function contours(field, levels, step = 2) {
    const N = Math.round(100 / step) + 1;
    const v = [];
    for (let j = 0; j < N; j++) { v[j] = []; for (let i = 0; i < N; i++) v[j][i] = field(i * step - 2, j * step - 2); }
    return levels.map((L) => {
      let d = '';
      for (let j = 0; j < N - 1; j++) for (let i = 0; i < N - 1; i++) {
        const a = v[j][i]; const b = v[j][i + 1]; const c = v[j + 1][i + 1]; const e = v[j + 1][i];
        const x = i * step - 2; const y = j * step - 2;
        const pts = [];
        const cut = (p, q, x0, y0, x1, y1) => { if ((p < L) !== (q < L)) { const t = (L - p) / (q - p); pts.push([x0 + (x1 - x0) * t, y0 + (y1 - y0) * t]); } };
        cut(a, b, x, y, x + step, y);
        cut(b, c, x + step, y, x + step, y + step);
        cut(e, c, x, y + step, x + step, y + step);
        cut(a, e, x, y, x, y + step);
        for (let k = 0; k + 1 < pts.length; k += 2) d += `M${n(pts[k][0])} ${n(pts[k][1])}L${n(pts[k + 1][0])} ${n(pts[k + 1][1])}`;
      }
      return d;
    });
  }

  return { n, rect, circle, ring, poly, line, bg, star, starPts, diamond, rng, blob, grain, worms, jitter, contours };
})();

const BACKS_FIGMA = [
  // ---------- ряд 1 ----------
  {
    id: 'card-01', name: 'Базовая', node: '18036:78019',
    draw: ({ bg, diamond }) => {
      // шахматка, повёрнутая на 45°: серые ромбы #4f4f4f на #1c1c1e
      let out = bg('#1c1c1e');
      // светлые ромбы по квадратной сетке, скруглённые; тёмные — между ними
      const step = 50;
      for (let j = -1; j <= 2; j++) for (let i = -1; i <= 2; i++) {
        out += diamond(25 + i * step, 25 + j * step, 21, 21, '#4f4f4f', ' stroke="#4f4f4f" stroke-width="7" stroke-linejoin="round"');
      }
      return out;
    },
  },
  {
    id: 'card-02', name: 'Червячки', node: '18036:78043',
    draw: ({ bg, worms }) => bg('#050507') + worms(202, { colors: [['#454b54', 1]], w: 7 }),
  },
  {
    id: 'card-03', name: 'Арлекин', node: '18047:78190',
    draw: ({ bg, diamond, star }) => {
      // колонки ромбов через четверть ширины (красные / шалфейные по очереди),
      // звёзды — посередине кремовых промежутков
      let out = bg('#ffe8c6');
      for (let c = 0; c <= 4; c++) {
        const x = c * 25;
        const off = c % 2 ? 12 : 0;
        for (let r = -1; r <= 5; r++) out += diamond(x, r * 24 + off + 3, 6.8, 12, c % 2 ? '#c9d3c0' : '#ec5a32');
      }
      for (let c = 0; c < 4; c++) for (let r = 0; r < 5; r++) out += star(12.5 + c * 25, 15 + r * 24, 5, '#f5a33a');
      return out;
    },
  },
  {
    id: 'card-04', name: 'Посыпка', node: '18047:78192',
    draw: ({ bg, line, jitter, n }) => {
      // крупная посыпка, разбросана равномерно (сетка 4×5 со сдвигом)
      const cols = ['#f29ab8', '#7fb2e5', '#5cc28f', '#f5a35a', '#f2d04a', '#e86a6a'];
      return bg('#fff8e8') + jitter(4, 4, 5, 0.3).map(([x, y, r], i) => {
        const a = r * Math.PI;
        return line(`M${n(x - Math.cos(a) * 4)} ${n(y - Math.sin(a) * 4)}l${n(Math.cos(a) * 8)} ${n(Math.sin(a) * 8)}`, cols[i % cols.length], 2.8);
      }).join('');
    },
  },
  {
    id: 'card-05', name: 'Рельеф', node: '18047:78193',
    draw: ({ bg, contours }) => {
      // изолинии рельефа: несколько холмов, линии одного поля не пересекаются
      const hill = (x, y, cx, cy, h, r) => h * Math.exp(-((x - cx) ** 2 + (y - cy) ** 2) / (2 * r * r));
      const field = (x, y) => hill(x, y, 64, 34, 1, 20) + hill(x, y, 22, 74, 0.8, 26) + hill(x, y, 96, 90, 0.55, 16)
        + 0.06 * Math.sin(x * 0.09) * Math.cos(y * 0.11);
      const levels = [0.08, 0.17, 0.27, 0.38, 0.5, 0.62, 0.75, 0.88];
      const cols = ['#2f6fd6', '#33c3e8', '#4b4bd6', '#2f9fe0', '#33c3e8', '#5b4fd8', '#2f9fe0', '#33c3e8'];
      return bg('#000') + contours(field, levels, 1.6).map((d, i) => `<path d="${d}" fill="none" stroke="${cols[i]}" stroke-width="2.3" stroke-linecap="round"/>`).join('');
    },
  },
  {
    id: 'card-06', name: 'Травы', node: '18047:78194',
    draw: ({ bg, line, n }) => {
      // как в макете: две группы зелёных наклонных волн, жёлтые волны справа
      // сверху, бирюзовые справа снизу; группы не касаются, обрывков у края нет
      const wavyV = (x, y0, y1, slant, amp = 2.6) => { let d = ''; for (let y = y0; y <= y1; y += 2.5) d += `${d ? 'L' : 'M'}${n(x + ((y - y0) / (y1 - y0)) * slant + amp * Math.sin(y * 0.34))} ${n(y)}`; return d; };
      const wavyH = (y, x0, x1, amp = 2.4) => { let d = ''; for (let x = x0; x <= x1; x += 2.5) d += `${d ? 'L' : 'M'}${n(x)} ${n(y + amp * Math.sin(x * 0.34))}`; return d; };
      const W = 3.8;
      let out = bg('#ffffff');
      for (let k = 0; k < 4; k++) out += line(wavyV(6 + k * 9, 24, 98, 10), '#9cb36f', W);
      for (let k = 0; k < 3; k++) out += line(wavyV(46 + k * 9, -4, 58, 6), '#9cb36f', W);
      for (let k = 0; k < 4; k++) out += line(wavyH(20 + k * 8, 82, 106), '#e9c046', W);
      for (let k = 0; k < 4; k++) out += line(wavyH(70 + k * 8, 54, 106), '#9ccac6', W);
      return out;
    },
  },
  {
    id: 'card-07', name: 'Озорная', node: '18047:78195',
    draw: ({ bg, star, circle, line }) => bg('#ffffff')
      + star(42, 8, 19, '#f6a821', 5, 0.48, 0, ' stroke="#f6a821" stroke-width="3" stroke-linejoin="round"')
      + star(92, 34, 13, '#f2643a', 5, 0.46, 18, ' stroke="#f2643a" stroke-width="2.4" stroke-linejoin="round"')
      + circle(0, 32, 9, '#7ccbc2') + circle(100, 84, 8, '#7ccbc2')
      + line('M6 56Q14 44 22 56T38 56T54 56T70 54', '#8cc152', 3.4)
      + line('M18 72l6 6-6 6 6 6', '#f2643a', 3.4)
      + star(62, 86, 12, '#f7c95c', 5, 0.62, 0, ' stroke="#f7c95c" stroke-width="5" stroke-linejoin="round"') + circle(62, 86, 3.4, '#f2a33a'),
  },
  {
    id: 'card-08', name: 'Мемфис', node: '18047:78196',
    draw: ({ bg, line, circle, rect }) => bg('#050404')
      + line('M16 34a5 5 0 1 1 5 5a10 10 0 1 1 10 -10a15 15 0 1 1 -15 -15', '#f05a1e', 5.5)
      + line('M30 2Q45 18 60 4', '#29b2ea', 5)
      + rect(70, 4, 24, 9, '#f27ad6', ' rx="4.5" transform="rotate(20 82 8)"')
      + line('M50 36h16l-16 11h16l-16 11h16l-16 11', '#1fa25a', 5.2)
      + circle(42, 40, 3.2, '#fff') + circle(72, 92, 3, '#fff') + circle(94, 46, 3.6, '#9b5cf2') + circle(30, 54, 3, '#f05a1e')
      + rect(4, 66, 14, 7, '#fff', ' rx="3.5" transform="rotate(-35 11 69)"')
      + line('M90 70Q100 80 92 96', '#f7c21c', 5) + line('M36 80q8 -6 16 0', '#29b2ea', 4),
  },
  {
    id: 'card-09', name: 'Звёзды', node: '18047:78197',
    draw: ({ bg, star, grain }) => {
      let out = bg('#2680c6');
      [[16, 16, 13], [62, 10, 18], [42, 48, 9], [86, 40, 8], [14, 66, 8], [54, 80, 11], [88, 88, 9], [30, 92, 6], [76, 62, 6], [96, 8, 5], [4, 40, 5]]
        .forEach(([x, y, r], i) => { out += star(x, y, r, '#f6c51a', 8, 0.42, i * 7); });
      return out + grain('light', 0.16);
    },
  },
  {
    id: 'card-10', name: 'Синева', node: '18047:78198',
    draw: ({ bg, line, circle }) => bg('#ece4d8')
      + ['M8 -6Q-4 30 20 30Q42 30 40 52Q38 76 62 78Q84 80 86 106', 'M60 -6Q58 20 78 24Q100 28 104 46', 'M-6 72Q10 66 14 86Q16 100 30 106']
        .map((d) => line(d, '#1765b3', 13)).join('')
      + circle(40, 12, 7, '#1765b3') + circle(94, 70, 6, '#1765b3'),
  },

  // ---------- ряд 2 ----------
  {
    id: 'card-11', name: 'Лабиринт', node: '18047:78199',
    draw: ({ bg, worms }) => bg('#050504') + worms(111, { colors: [['#6b6b6b', 0.55], ['#4a4a4a', 0.33], ['#e6c400', 0.12]], w: 6.5 }),
  },
  {
    id: 'card-12', name: 'Камуфляж', node: '18047:78200',
    draw: ({ bg, blob, circle }) => {
      // синяя основа, кремовые извилистые ленты, тёмные пятна внутри синего
      const band = (d, w) => `<path d="${d}" fill="none" stroke="#f2ead6" stroke-width="${w}" stroke-linecap="round"/>`;
      return bg('#3e6288')
        + `<path d="${blob(24, 50, 24, 31, 7, 0.4)}" fill="#203f68"/>`
        + `<path d="${blob(84, 84, 16, 33, 7, 0.4)}" fill="#203f68"/>`
        + `<path d="${blob(70, 14, 13, 35, 6, 0.4)}" fill="#203f68"/>`
        + `<path d="${blob(0, 0, 24, 36, 6, 0.3)}" fill="#f2ead6"/>`
        + band('M46 -6C50 14 62 18 68 30S80 56 106 58', 14)
        + band('M86 -6C90 8 96 18 106 22', 12)
        + band('M-6 84C8 74 24 70 34 78S48 98 56 106', 14)
        + band('M60 106C66 94 78 92 92 98', 9)
        + `<path d="${blob(100, 86, 12, 39, 6, 0.3)}" fill="#f2ead6"/>`
        + `<path d="${blob(28, 46, 11, 37, 6, 0.45)}" fill="#0f1c2d"/>`
        + `<path d="${blob(70, 10, 7, 38, 6, 0.4)}" fill="#0f1c2d"/>`
        + circle(30, 42, 1.6, '#fff') + circle(66, 66, 1.6, '#fff') + circle(16, 92, 1.4, '#fff');
    },
  },
  {
    id: 'card-13', name: 'Смайлы', node: '18047:78201',
    draw: ({ bg, circle }) => bg('#ffffff')
      // цветные круги без лиц, немного «отдалены»: виден край композиции
      + `<g transform="translate(50 50) scale(0.8) translate(-50 -50)">`
      + circle(92, 2, 24, '#f47fc0') + circle(-4, 42, 16, '#ec5b2e') + circle(56, 40, 36, '#8fd3ea')
      + circle(12, 90, 34, '#18a356') + circle(86, 94, 30, '#f6b51e') + circle(-14, 4, 14, '#f6b51e') + circle(110, 50, 12, '#18a356')
      + '</g>',
  },
  {
    id: 'card-14', name: 'Конфетти', node: '18047:78202',
    draw: ({ bg, line, circle, jitter, n }) => {
      // крупные цветные крестики и точки, равномерно (сетка 6×6 со сдвигом)
      const cols = ['#3aa0ff', '#38d39f', '#f5c542', '#ff5a5a', '#ff9a3a'];
      return bg('#000000') + jitter(14, 6, 6, 0.32).map(([x, y, r], i) => {
        const col = cols[i % cols.length];
        return r < 0.3 ? circle(x, y, 1.4, col) : line(`M${n(x - 2.4)} ${n(y - 2.4)}l4.8 4.8M${n(x + 2.4)} ${n(y - 2.4)}l-4.8 4.8`, col, 1.8);
      }).join('');
    },
  },
  {
    id: 'card-15', name: 'Воронка', node: '18047:78203',
    draw: ({ bg, ring, rng, n }) => {
      const R = rng(15);
      let out = bg('#000000');
      for (let k = 1; k <= 12; k++) {
        const len = n(4 + R() * 10);
        out += ring(50, 52, k * 6.4, '#bdbdbd', 1, ` stroke-dasharray="${len} ${n(2 + R() * 5)} ${n(len * 1.6)} ${n(3 + R() * 4)}" stroke-dashoffset="${n(R() * 30)}" opacity="${n(0.95 - k * 0.035)}"`);
      }
      return out;
    },
  },
  {
    id: 'card-16', name: 'Цветочки', node: '18047:78204',
    draw: ({ bg, n }) => {
      const flower = (cx, cy, R0) => {
        let d = '';
        for (let k = 0; k <= 72; k++) {
          const a = (Math.PI * 2 * k) / 72;
          const r = R0 * (0.68 + 0.32 * Math.abs(Math.cos(3 * a)));
          d += `${k ? 'L' : 'M'}${n(cx + Math.cos(a) * r)} ${n(cy + Math.sin(a) * r)}`;
        }
        return `<path d="${d}Z" fill="none" stroke="#f2b631" stroke-width="3.2" stroke-linejoin="round"/>`;
      };
      return bg('#000000') + [[20, 22, 13], [64, 18, 12], [100, 42, 12], [30, 70, 13], [76, 76, 13], [0, 96, 9], [-2, 26, 8]].map(([x, y, r]) => flower(x, y, r)).join('');
    },
  },
  {
    id: 'card-17', name: 'Космос', node: '18047:78205',
    draw: ({ bg, circle, ring, rng, grain }) => {
      const R = rng(17);
      let out = bg('#1a1919');
      for (let i = 0; i < 26; i++) out += circle(R() * 100, R() * 100, 0.6 + R() * 0.9, '#ffffff', ' opacity="0.85"');
      out += circle(78, 62, 11, '#2a7fd8') + circle(12, 32, 5, '#ffffff') + circle(40, 92, 3.2, '#ffffff') + circle(62, 30, 2.6, '#ffffff');
      [[30, 46], [58, 84], [86, 16]].forEach(([x, y]) => { out += ring(x, y, 3, '#e33b3b', 1.6); });
      [[24, 18], [48, 64], [70, 8], [90, 40], [16, 80]].forEach(([x, y]) => { out += circle(x, y, 1.8, '#f5a33a'); });
      out += circle(8, 60, 1.6, '#2a7fd8') + circle(52, 18, 1.4, '#2a7fd8');
      return out + grain('light', 0.12);
    },
  },
  {
    id: 'card-18', name: 'Облака', node: '18047:78206',
    draw: ({ bg, circle }) => {
      const cloud = (x, y, s) => {
        const parts = [[0, 0, 0.42], [-0.42, 0.12, 0.3], [0.42, 0.14, 0.3], [-0.2, -0.22, 0.32], [0.2, -0.18, 0.34], [0, 0.22, 0.3]];
        const layer = (grow, fill) => parts.map(([dx, dy, r]) => circle(x + dx * s, y + dy * s, r * s + grow, fill)).join('');
        return layer(3.2, '#8a8a8a') + layer(1.8, '#000000') + layer(0, '#e3e3e3');
      };
      return bg('#000000') + cloud(54, 10, 26) + cloud(4, 52, 22) + cloud(64, 90, 28) + cloud(100, 54, 20);
    },
  },
  {
    id: 'card-19', name: 'Ромбы', node: '18047:78207',
    draw: ({ bg, diamond, rng }) => {
      // ромбы встык, каждый залит растром (точки по диагональной сетке);
      // яркость плавно гаснет сверху вниз, часть ромбов тёмные
      const R = rng(19);
      const LV = [[0, 0], [0.5, 80], [0.62, 130], [0.75, 185], [0.88, 240]];
      let defs = '<defs>';
      LV.forEach(([size, g], li) => {
        if (!li) return;
        const P = 2.8;
        const d = size * 2.35;
        defs += `<pattern id="ht${li}" width="${P}" height="${P}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="${P}" height="${P}" fill="#060606"/><rect x="${(P - d) / 2}" y="${(P - d) / 2}" width="${d}" height="${d}" fill="rgb(${g},${g},${g})"/></pattern>`;
      });
      defs += '</defs>';
      let out = defs + bg('#060606');
      const h = 11.5;
      for (let j = -1; j <= 10; j++) for (let i = -1; i <= 5; i++) {
        const x = i * 2 * h + (j % 2 ? h : 0);
        const y = j * h;
        const fade = Math.max(0.14, 1 - Math.max(0, y + 4) / 100);
        const v = fade * (0.3 + R() * 0.85);
        const lv = R() < 0.28 ? 0 : Math.min(4, Math.round(v * 4.4));
        const fill = lv ? `url(#ht${lv})` : '#060606';
        out += diamond(x, y, h, h, fill, ` stroke="${fill}" stroke-width="0.8"`);
      }
      return out;
    },
  },
  {
    id: 'card-20', name: 'Растр', node: '18047:78208',
    draw: ({ bg, circle }) => {
      let out = bg('#060606');
      for (let y = 2; y < 100; y += 4) for (let x = 2; x < 100; x += 4) {
        const d = Math.abs(x - y + 6) / 46;
        const r = 1.5 * (1 - d) * (0.8 + 0.2 * Math.sin(x * 0.6 + y * 0.4));
        if (r > 0.18) out += circle(x, y, r, '#b0b0b0');
      }
      return out;
    },
  },

  // ---------- ряд 3 ----------
  {
    id: 'card-21', name: 'Кристаллы', node: '18047:78209',
    draw: ({ bg, diamond, n }) => {
      let out = bg('#060606');
      for (let y = 4; y < 100; y += 7) for (let x = 4; x < 100; x += 7) {
        const d = Math.abs(x + y - 104) / 52;
        const s = 3.6 * (1 - d) + 0.6;
        if (s > 1) out += diamond(x, y, s, s, 'none', ` stroke="${s > 2.6 ? '#e6e6e6' : '#8a8a8a'}" stroke-width="${n(0.5 + s * 0.12)}"`);
      }
      return out;
    },
  },
  {
    id: 'card-22', name: 'Пиксели', node: '18047:78210',
    draw: ({ bg, rect, line, rng, n }) => {
      // крупная сетка крестиков и квадратиков; светлые прямоугольные «пятна»
      const R = rng(22);
      const zones = [[10, 2, 78, 18, 0.75], [44, 42, 70, 62, 0.6], [66, 82, 100, 100, 0.9], [0, 68, 12, 82, 0.55], [20, 88, 50, 100, 0.4]];
      let out = bg('#131313');
      const step = 6;
      for (let y = step / 2; y < 100; y += step) for (let x = step / 2; x < 100; x += step) {
        let b = 0.12 + R() * 0.15;
        zones.forEach(([x0, y0, x1, y1, v]) => { if (x >= x0 && x <= x1 && y >= y0 && y <= y1) b = Math.max(b, v * (0.7 + R() * 0.3)); });
        const g = Math.round(50 + b * 170);
        const col = `rgb(${g},${g},${g})`;
        if (b > 0.5) out += rect(x - 2, y - 2, 4, 4, col);
        else if (R() < 0.5) out += line(`M${n(x - 1.4)} ${n(y - 1.4)}l2.8 2.8M${n(x + 1.4)} ${n(y - 1.4)}l-2.8 2.8`, col, 0.9);
        else out += rect(x - 1, y - 1, 2, 2, col);
      }
      return out;
    },
  },
  {
    id: 'card-23', name: 'Пламя', node: '18047:78211',
    draw: ({ bg, grain, n }) => {
      // полосы «зебры» по диагонали: волнистые, сужаются к концам
      let out = bg('#03080d');
      let body = '';
      const band = (x0, x1, base, k, w, col) => {
        const top = [];
        const bot = [];
        for (let x = x0; x <= x1; x += 3) {
          const t = (x - x0) / (x1 - x0);
          const y = base + 5 * Math.sin(x * 0.07 + k);
          const ww = w * Math.sin(Math.PI * Math.min(1, t * 1.15));
          top.push(`${n(x)} ${n(y - ww)}`);
          bot.unshift(`${n(x)} ${n(y + ww)}`);
        }
        return `<path d="M${top.join('L')}L${bot.join('L')}Z" fill="${col}"/>`;
      };
      for (let k = 0; k < 11; k++) {
        const base = -40 + k * 13;
        body += band(-30 + (k % 3) * 12, 60 + (k % 2) * 30, base, k, 3.6, k % 3 ? '#1b6fa0' : '#2a8fcc');
        body += band(70 + (k % 2) * 10, 150, base + 6, k + 2, 3, '#1b6fa0');
      }
      out += `<g transform="rotate(-35 50 50)">${body}</g>`;
      return out + grain('light', 0.14);
    },
  },
  {
    id: 'card-24', name: 'Ацтек', node: '18047:78212',
    draw: ({ bg, rect }) => {
      // пиксельный узор: розовый фон, тёмно-синяя ступенчатая решётка ромбов,
      // в каждом ромбе — синий ступенчатый ромбик с розовой серединой
      let tile = '';
      const u = 3.6;
      const N = 16;
      const C = N / 2;
      for (let cy = 0; cy < N; cy++) for (let cx = 0; cx < N; cx++) {
        const px = cx + 0.5;
        const py = cy + 0.5;
        const dc = Math.abs(px - C) + Math.abs(py - C);
        const dk = Math.min(...[[0, 0], [N, 0], [0, N], [N, N]].map(([ax, ay]) => Math.abs(px - ax) + Math.abs(py - ay)));
        const navy = (dc >= 7 && dc <= 9) || dc === 2 || dc === 3 || dk === 2 || dk === 3;
        if (navy) tile += rect(cx * u, cy * u, u + 0.15, u + 0.15, '#141a53');
      }
      return `<defs><pattern id="az" width="${N * u}" height="${N * u}" patternUnits="userSpaceOnUse" x="-6" y="-14" shape-rendering="crispEdges">${tile}</pattern></defs>${bg('#fbd9d0')}<rect width="100" height="100" fill="url(#az)"/>`;
    },
  },
  {
    id: 'card-25', name: 'Вспышка', node: '18047:78213',
    draw: ({ bg, poly, star }) => {
      let out = bg('#ffffff');
      const k = 32;
      for (let i = 0; i < k; i += 2) {
        const a0 = (Math.PI * 2 * i) / k;
        const a1 = (Math.PI * 2 * (i + 1)) / k;
        const r0 = 15;
        const r1 = 90;
        out += poly([[50 + Math.cos(a0) * r0, 50 + Math.sin(a0) * r0], [50 + Math.cos(a0) * r1, 50 + Math.sin(a0) * r1], [50 + Math.cos(a1) * r1, 50 + Math.sin(a1) * r1], [50 + Math.cos(a1) * r0 * 1.4, 50 + Math.sin(a1) * r0 * 1.4]], '#000000');
      }
      return out + star(50, 50, 12, '#000000', 4, 0.22);
    },
  },
  {
    id: 'card-26', name: 'Вертушка', node: '18047:78214',
    draw: ({ bg, poly }) => {
      let out = bg('#eec2e3');
      const k = 24;
      for (let i = 0; i < k; i += 2) {
        const a0 = (Math.PI * 2 * i) / k;
        const a1 = (Math.PI * 2 * (i + 1)) / k;
        out += poly([[50, 50], [50 + Math.cos(a0) * 90, 50 + Math.sin(a0) * 90], [50 + Math.cos(a1) * 90, 50 + Math.sin(a1) * 90]], '#050505');
      }
      return out;
    },
  },
  {
    id: 'card-27', name: 'Плитка', node: '18047:78215',
    draw: ({ bg, rect }) => {
      // скруглённые розовые квадраты встык — между углами проступают красные звёздочки
      let out = bg('#ea3b3b');
      const s = 33;
      for (let j = -1; j <= 3; j++) for (let i = -1; i <= 3; i++) out += rect(i * s + 2, j * s + 20, s, s, '#f0aeca', ' rx="12"');
      return out;
    },
  },
  {
    id: 'card-28', name: 'Спираль', node: '18047:78216',
    draw: ({ bg, line, grain, n }) => {
      let d = '';
      for (let t = 0; t <= Math.PI * 9; t += 0.15) {
        const r = 2 + t * 2.1;
        d += `${d ? 'L' : 'M'}${n(52 + Math.cos(t) * r)} ${n(52 + Math.sin(t) * r)}`;
      }
      return bg('#000000') + line(d, '#22c02a', 5.6) + grain('dark', 0.35);
    },
  },
  {
    id: 'card-29', name: 'Сетка', node: '18047:78217',
    draw: ({ bg, rect, circle }) => {
      // бордовый фон, тонкая розовая сетка, крупные круги в узлах через один
      let out = bg('#6b1021');
      const s = 30;
      for (let k = 0; k < 4; k++) {
        const v = 6 + k * s;
        out += rect(v - 0.45, 0, 0.9, 100, '#d07ba3') + rect(0, v - 0.45, 100, 0.9, '#d07ba3');
      }
      for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) if ((i + j) % 2 === 0) out += circle(6 + i * s, 6 + j * s, 10, '#ee8cc4');
      return out;
    },
  },
  {
    id: 'card-30', name: 'Карнавал', node: '18047:78218',
    draw: ({ bg, diamond, star }) => {
      let out = bg('#fde3d0');
      const pal = ['#fb9a3c', '#f9a8c8', '#f2643a', '#fde3d0'];
      const w = 33;
      const h = 46;
      // звезда в каждом ромбе; звёзды — вторым проходом, чтобы ромбы их не перекрывали
      let stars = '';
      for (let j = -1; j <= 5; j++) for (let i = -1; i <= 3; i++) {
        const x = i * w + (j % 2 ? w / 2 : 0);
        const y = j * h / 2;
        const col = pal[(((i + j * 2) % 4) + 4) % 4];
        out += diamond(x, y, w / 2, h / 2, col);
        stars += star(x, y, 7, col === '#fb9a3c' || col === '#f2643a' ? '#ffffff' : '#fb9a3c', 4, 0.3);
      }
      return out + stars;
    },
  },
];
