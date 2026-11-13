// Каталог рубашек колоды — единый источник для профиля, настроек, поиска
// матча и матча. Рубашку берут по id:
//
//   BACK_CATALOG.get('winter-07')   — описание (неизвестный id → первая рубашка)
//   BACK_CATALOG.html('winter-07')  — разметка рубашки (квадрат, тянется по носителю)
//   BACK_CATALOG.random()           — случайная из каталога
//   BACK_CATALOG.list               — рубашки в игре; all — вместе с выключенными
//
// Сейчас в игре только обычные (ACTIVE): 30 зимних рубашек из генератора
// (build/gen-backs.mjs → js/catalog/backs.generated.js). Рубашка — одна SVG-
// картинка 100×100 во весь размер: фон (цвет или градиент), композиция из
// зимних мотивов (js/catalog/motifs.js), по желанию — шум «как в печати».
// Виды композиций — STYLES ниже. Раскладка внутри вида берётся из зерна
// рубашки (seed), поэтому одинакова при каждой отрисовке.
// Стили — .cb24 в css/cosmetics24.css. Подробно — docs/catalog.md.

const BACK_CATALOG = (() => {
  const { n, rect, circle, poly, starPts } = MOTIFS;

  // детерминированный ГПСЧ (mulberry32)
  const prng = (seed) => {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  // фон: цвет или линейный градиент под углом
  function background(b) {
    const [a, c] = b.pal.bg;
    if (b.grad == null) return { defs: '', body: rect(0, 0, 100, 100, a) };
    return {
      defs: `<linearGradient id="bg" gradientTransform="rotate(${b.grad} 0.5 0.5)"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${c}"/></linearGradient>`,
      body: '<rect width="100" height="100" fill="url(#bg)"/>',
    };
  }

  // шум «как в печати»: светлые или тёмные крапинки (SVG feTurbulence)
  function noise(tone, seed) {
    const v = tone === 'dark' ? 0 : 1;
    return {
      defs: `<filter id="nz" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="2" seed="${seed % 97}" stitchTiles="stitch"/><feColorMatrix type="matrix" values="0 0 0 0 ${v} 0 0 0 0 ${v} 0 0 0 0 ${v} 5 0 0 0 -2.85"/></filter>`,
      body: `<rect width="100" height="100" filter="url(#nz)" opacity="${tone === 'dark' ? 0.22 : 0.3}"/>`,
    };
  }

  const STYLES = {
    // сетка мотивов в шахматном порядке, между ними снежные точки
    tile(b, r, c) {
      const k = b.n || 3;
      const cell = 100 / k;
      let out = '';
      for (let j = -1; j <= k; j++) {
        for (let i = -1; i <= k; i++) {
          const x = i * cell + cell / 2 + (j % 2 ? cell / 2 : 0);
          const y = j * cell + cell / 2;
          const m = b.motifs[(((i + j) % b.motifs.length) + b.motifs.length) % b.motifs.length];
          out += MOTIFS.draw(m, x, y, cell * 0.62, c, b.variant, b.flake);
          if (b.dots) out += circle(x + cell / 2, y, cell * 0.05, c.accent2);
        }
      }
      return out;
    },

    // «свитер»: полосы узоров сверху вниз — зубцы, точки, ряд мотивов
    knit(b, r, c) {
      const colors = [c.ink, c.accent, c.accent2];
      const bands = ['zig', 'line', 'motif', 'line', 'dots', 'checks', 'zig', 'motif', 'xs'];
      let y = 2 + r() * 4;
      let out = '';
      let k = Math.floor(r() * bands.length);
      while (y < 100) {
        const type = bands[k % bands.length];
        const col = colors[k % 3];
        k++;
        if (type === 'line') { out += rect(0, y, 100, 1.6, col); y += 4; }
        if (type === 'dots') { for (let x = 3; x < 100; x += 6) out += circle(x, y + 1.5, 1.2, col); y += 5.5; }
        if (type === 'zig') {
          const p = [[0, y + 6]];
          for (let x = 0; x <= 100; x += 8) p.push([x + 4, y], [x + 8, y + 6]);
          p.push([100, y + 6]);
          out += poly(p, col);
          y += 9;
        }
        if (type === 'checks') {
          for (let x = 0; x < 100; x += 6) out += rect(x, y + ((x / 6) % 2 ? 3 : 0), 3, 3, col);
          y += 9;
        }
        if (type === 'xs') {
          for (let x = 5; x < 100; x += 10) out += `<path d="M${x - 2.5} ${n(y)}l5 5M${x + 2.5} ${n(y)}l-5 5" stroke="${col}" stroke-width="1.6" stroke-linecap="round"/>`;
          y += 8.5;
        }
        if (type === 'motif') {
          const m = b.motifs[k % b.motifs.length];
          const cc = { ...c, ink: col, accent: col === c.ink ? c.accent : c.ink };
          for (let x = 8 + (k % 2) * 7; x < 100; x += 15) out += MOTIFS.draw(m, x, y + 6.5, 11, cc, 1, b.flake);
          y += 16;
        }
      }
      return out;
    },

    // открытка-пейзаж: слои сугробов, ёлки на холме, луна сбоку, снегопад
    poster(b, r, c) {
      let out = '';
      const left = r() < 0.5;
      out += circle(left ? 18 + r() * 12 : 70 + r() * 12, 16 + r() * 12, 8 + r() * 5, c.accent2);
      for (let i = 0; i < 22; i++) out += circle(r() * 100, r() * 62, 0.5 + r() * 1.1, c.ink);
      const hill = (base, amp, ph, fr) => (x) => base + amp * Math.sin(x * fr + ph);
      const layers = [
        { f: hill(60 + r() * 6, 5, r() * 6, 0.05), fill: b.pal.bg[1], op: 1 },
        { f: hill(72 + r() * 5, 6, r() * 6, 0.045), fill: c.ink, op: 0.55 },
        { f: hill(86 + r() * 4, 4, r() * 6, 0.06), fill: c.ink, op: 1 },
      ];
      layers.forEach((L, li) => {
        let d = `M0 100L0 ${n(L.f(0))}`;
        for (let x = 5; x <= 100; x += 5) d += `L${x} ${n(L.f(x))}`;
        out += `<path d="${d}L100 100Z" fill="${L.fill}" opacity="${L.op}"/>`;
        if (li === 1) {
          const count = 3 + Math.floor(r() * 4);
          for (let t = 0; t < count; t++) {
            const x = 8 + r() * 84;
            const s = 12 + r() * 12;
            out += MOTIFS.tree(x, L.f(x) - s * 0.36, s, { ...c, ink: c.accent }, 3);
          }
        }
      });
      return out;
    },

    // народная открытка: широкая кайма с фестонами или зубцами, звёзды в
    // углах, крупный мотив в середине (ёлка, подарок, снежинка, звезда — не круг)
    folk(b, r, c, bgRef) {
      let out = rect(0, 0, 100, 100, c.accent);
      out += `<rect x="13" y="13" width="74" height="74" rx="4" fill="${bgRef}"/>`;
      if (b.sub === 'zig') {
        for (let x = 13; x < 87; x += 7.4) out += poly([[x, 13], [x + 7.4, 13], [x + 3.7, 18]], c.accent) + poly([[x, 87], [x + 7.4, 87], [x + 3.7, 82]], c.accent);
        for (let y = 13; y < 87; y += 7.4) out += poly([[13, y], [13, y + 7.4], [18, y + 3.7]], c.accent) + poly([[87, y], [87, y + 7.4], [82, y + 3.7]], c.accent);
      } else {
        for (let x = 17; x <= 83; x += 8.25) out += circle(x, 13, 3.6, c.accent) + circle(x, 87, 3.6, c.accent);
        for (let y = 17; y <= 83; y += 8.25) out += circle(13, y, 3.6, c.accent) + circle(87, y, 3.6, c.accent);
      }
      [[10, 10], [90, 10], [10, 90], [90, 90]].forEach(([x, y]) => { out += MOTIFS.star8(x, y, 12, c.accent2); });
      [[50, 6.5], [50, 93.5], [6.5, 50], [93.5, 50]].forEach(([x, y]) => { out += MOTIFS.diamond(x, y, 5, c.ink); });
      const m = b.motifs[0];
      const size = { tree: 46, gift: 34, snowflake: 46, star: 40 }[m] || 40;
      out += MOTIFS.draw(m, 50, 51, size, { ...c, accent: c.accent2 }, b.variant, b.flake);
      return out;
    },

    // плакат: стопка уголков-«ёлочек» и снежки горкой, звезда на острие
    chevron(b, r, c) {
      let out = '';
      const tipX = 30 + r() * 40;
      const flip = b.sub === 'up';
      const y0 = flip ? 50 : 6;
      for (let k = 0; k < 7; k++) {
        const y = y0 + k * 6.5;
        const tipY = flip ? y - 24 : y + 24;
        out += `<polyline points="-4,${n(y)} ${n(tipX)},${n(tipY)} 104,${n(y)}" fill="none" stroke="${c.ink}" stroke-width="2.8" stroke-linejoin="miter"/>`;
      }
      const tipY = flip ? y0 - 30 : y0 + 6 * 6.5 + 32;
      out += MOTIFS.star(tipX, tipY, 11, c.accent2);
      // горка снежков — в стороне от острия
      const bx = tipX < 50 ? 74 : 26;
      const by = flip ? 12 : 76;
      [[0, 0], [-4.4, 7.5], [4.4, 7.5], [-8.8, 15], [0, 15], [8.8, 15]].forEach(([dx, dy]) => { out += circle(bx + dx, by + dy, 3.6, c.accent); });
      return out;
    },

    // гирлянды: провисающие нити, на них игрушки и звёздочки
    garland(b, r, c) {
      let out = '';
      const cols = [c.accent, c.accent2, c.ink];
      for (let i = 0; i < 22; i++) out += circle(r() * 100, 40 + r() * 60, 0.4 + r() * 0.9, c.ink);
      const rows = b.n || 3;
      for (let g = 0; g < rows; g++) {
        const y0 = 6 + g * (86 / rows);
        const y1 = y0 + (r() - 0.5) * 8;
        const sag = 12 + r() * 8;
        const P = (t) => {
          const x = -5 + 110 * t;
          const y = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * (Math.max(y0, y1) + sag) + t * t * y1;
          return [x, y];
        };
        out += `<path d="M-5 ${n(y0)}Q50 ${n(Math.max(y0, y1) + sag)} 105 ${n(y1)}" fill="none" stroke="${c.ink}" stroke-width="0.9" opacity="0.8"/>`;
        const count = 5 + Math.floor(r() * 2);
        for (let k = 1; k <= count; k++) {
          const [x, y] = P(k / (count + 1));
          const len = 2.5 + ((k + g) % 3) * 2;
          const col = cols[(k + g) % 3];
          out += `<path d="M${n(x)} ${n(y)}v${len}" stroke="${c.ink}" stroke-width="0.6" opacity="0.8"/>`;
          if ((k + g) % 4 === 3) out += MOTIFS.star(x, y + len + 3, 7, col);
          else out += MOTIFS.ornament(x, y + len + 3.6, 8, { ...c, ink: col, accent: col === c.ink ? c.accent : c.ink });
        }
      }
      return out;
    },

    // снегопад: снежинки разных форм и размеров, точки, лёгкий шум
    snowfall(b, r, c) {
      let out = '';
      const items = [];
      for (let tries = 0; items.length < 14 && tries < 500; tries++) {
        const s = 6 + r() * 16;
        const x = r() * 100;
        const y = r() * 100;
        if (items.some((o) => Math.hypot(o.x - x, o.y - y) < (o.s + s) / 2 + 2)) continue;
        items.push({ x, y, s });
      }
      const flakes = b.flakes || [SNOWFLAKE.EVENT];
      items.forEach((o, i) => {
        out += `<g opacity="${n(0.55 + r() * 0.45)}">${MOTIFS.snowflake(o.x, o.y, o.s, c.ink, flakes[i % flakes.length], r() * 30)}</g>`;
      });
      for (let i = 0; i < 26; i++) out += circle(r() * 100, r() * 100, 0.5 + r() * 1.3, i % 5 ? c.ink : c.accent2);
      return out;
    },

    // абстракция в духе плаката: волны / ступени / ромбы / стежки / арки
    geo(b, r, c) {
      let out = '';
      const sub = b.sub;
      if (sub === 'waves') {
        for (let k = 0; k < 8; k++) {
          const y0 = 46 + k * 7;
          let d = `M-2 ${n(y0)}`;
          for (let x = 3; x <= 104; x += 5) d += `L${x} ${n(y0 + 3 * Math.sin(x * 0.22 + k * 0.7))}`;
          out += `<path d="${d}" fill="none" stroke="${c.ink}" stroke-width="2.6" stroke-linecap="round"/>`;
        }
        out += `<path d="M78 -4L34 70" stroke="${c.accent2}" stroke-width="3.2" stroke-linecap="round"/>`;
        for (let i = 0; i < 10; i++) out += circle(r() * 100, r() * 40, 0.6 + r() * 1, c.ink);
      } else if (sub === 'stairs') {
        let d = 'M0 100';
        let x = 0;
        let y = 92;
        while (x < 100 && y > 8) { d += `L${n(x)} ${n(y)}`; x += 9; d += `L${n(x)} ${n(y)}`; y -= 9; }
        out += `<path d="${d}L${n(x)} 100Z" fill="${c.ink}"/>`;
        out += `<path d="${d.replace('M0 100', 'M0 ' + 100)}" fill="none" stroke="${c.accent}" stroke-width="1.6" transform="translate(-4 -4)"/>`;
        out += MOTIFS.star8(24 + r() * 10, 20 + r() * 8, 13, c.accent2);
      } else if (sub === 'diamonds') {
        const s = 9;
        for (let j = 0; j < 9; j++) for (let i = 0; i < 9 - j; i++) out += MOTIFS.diamond(8 + i * 11 + (j % 2) * 5.5, 92 - j * 11, s, c.ink);
        out += `<circle cx="${n(70 + r() * 12)}" cy="${n(22 + r() * 10)}" r="6" fill="none" stroke="${c.accent2}" stroke-width="3"/>`;
      } else if (sub === 'stitch') {
        for (let y = 4; y < 104; y += 12) for (let x = 4 + ((y / 12) % 2) * 6; x < 104; x += 12) out += `<path d="M${x - 3.5} ${y - 3.5}l7 7M${x + 3.5} ${y - 3.5}l-7 7" stroke="${c.ink}" stroke-width="2.6" stroke-linecap="square"/>`;
        for (let i = 0; i < 3; i++) {
          const x = 20 + r() * 60;
          const y = 15 + r() * 70;
          out += `<path d="M${n(x - 5)} ${n(y - 5)}l10 10M${n(x + 5)} ${n(y - 5)}l-10 10" stroke="${c.accent2}" stroke-width="4.5" stroke-linecap="square"/>`;
        }
      } else {
        // arcs: ряд горок-арок и столбики
        for (let x = 6; x < 100; x += 10) out += rect(x - 2.2, 70 + ((x / 10) % 2) * 6, 4.4, 40, c.ink);
        for (let x = 0; x < 110; x += 16) out += `<path d="M${x - 8} 62A8 8 0 0 1 ${x + 8} 62" fill="none" stroke="${c.ink}" stroke-width="3"/>`;
        for (let x = 8; x < 110; x += 16) out += circle(x, 44, 3.2, c.accent);
        out += MOTIFS.star(18 + r() * 64, 18 + r() * 10, 12, c.accent2);
      }
      return out;
    },
  };

  function svgFor(b) {
    const r = prng(b.seed);
    const c = { ink: b.pal.ink, accent: b.pal.accent, accent2: b.pal.accent2, bg: b.pal.bg[0] };
    const bg = background(b);
    const nz = b.noise ? noise(b.noise, b.seed) : { defs: '', body: '' };
    const bgRef = b.grad == null ? b.pal.bg[0] : 'url(#bg)';
    const body = STYLES[b.style](b, r, c, bgRef);
    const isFolk = b.style === 'folk';
    return `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><defs>${bg.defs}${nz.defs}</defs>${isFolk ? '' : bg.body}${body}${nz.body}</svg>`;
  }

  const url = (svg) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

  const generated = (typeof BACKS_GENERATED !== 'undefined' ? BACKS_GENERATED : []).map((b) => ({
    ...b,
    colors: [b.pal.bg[0], b.pal.bg[1], b.pal.ink],
    bgCSS: `${url(svgFor(b))} center / 100% 100% no-repeat`,
  }));

  // эпические рубашки прошлой версии — описаны, но сейчас выключены
  // (облик — .cb24-<id> в css/cosmetics24.css, частицы — FX_EMITTER)
  const EPIC_BACKS = [
    { id: 'holo', name: 'Голофольга', rarity: 'epic', fx: 'holo sheen' },
    { id: 'cosmos', name: 'Космос', rarity: 'epic', fx: 'stars' },
    { id: 'storm', name: 'Шторм', rarity: 'epic', fx: 'bolt sparks' },
    { id: 'goldfoil', name: 'Золото', rarity: 'epic', fx: 'sheen sparks' },
    { id: 'inferno', name: 'Инферно', rarity: 'epic', fx: 'embers' },
    { id: 'prism', name: 'Призма', rarity: 'epic', fx: 'sheen' },
  ];

  const all = [...generated, ...EPIC_BACKS].map((b) => ({ ...b, epic: b.rarity === 'epic' }));
  // в игре сейчас только обычные; включить редкость — добавить её сюда
  const ACTIVE = ['basic'];
  const list = all.filter((b) => ACTIVE.includes(b.rarity));
  const byId = new Map(list.map((b) => [b.id, b]));

  // неизвестный id (в том числе рубашки прошлых версий) → первая
  const get = (id) => byId.get(id) || list[0];
  const random = () => list[Math.floor(Math.random() * list.length)];
  const attr = (s) => s.replace(/"/g, '&quot;');

  function epicHTML(b) {
    let inner = '<span class="cb24-pat"></span><span class="cb24-emb"></span>';
    if (b.fx.includes('holo')) inner += '<span class="cb24-foil"></span>';
    if (b.fx.includes('sheen')) inner += '<span class="cb24-sheen"></span>';
    if (b.fx.includes('stars')) inner += FX_EMITTER.html('star', 14);
    if (b.fx.includes('bolt')) inner += '<svg class="cb24-bolt" viewBox="0 0 24 24"><path d="M13.5 2 5 13.5h6L9.5 22 19 9.5h-6.2L13.5 2Z"/></svg>';
    if (b.fx.includes('sparks')) inner += FX_EMITTER.html('spark', 5);
    if (b.fx.includes('embers')) inner += FX_EMITTER.html('ember', 10);
    return `<span class="cb24 cb24-${b.id} is-epic" data-back="${b.id}">${inner}</span>`;
  }

  function html(id) {
    const b = get(id);
    if (b.epic) return epicHTML(b);
    return `<span class="cb24 cb24-gen" data-back="${b.id}" style="--cb:${b.pal.bg[1]};--cb-bg:${attr(b.bgCSS)}"></span>`;
  }

  return { list, all, ACTIVE, STYLES, get, random, html, svg: svgFor };
})();
