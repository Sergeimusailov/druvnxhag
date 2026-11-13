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

  // Все виды — «близким планом»: фигуры крупные и их немного, чтобы рубашка
  // читалась и на колоде в матче (34 px).
  const STYLES = {
    // сетка мотивов в шахматном порядке (2 в ряд), между ними снежные точки
    tile(b, r, c) {
      const k = 2;
      const cell = 100 / k;
      let out = '';
      for (let j = -1; j <= k; j++) {
        for (let i = -1; i <= k; i++) {
          const x = i * cell + cell / 2 + (j % 2 ? cell / 2 : 0);
          const y = j * cell + cell / 2;
          const m = b.motifs[(((i + j) % b.motifs.length) + b.motifs.length) % b.motifs.length];
          out += MOTIFS.draw(m, x, y, cell * 0.64, c, b.variant, b.flake);
          if (b.dots) out += circle(x + cell / 2, y, 2.6, c.accent2);
        }
      }
      return out;
    },

    // «свитер»: полосы узоров — показан крупный фрагмент (×2.5), 2–3 полосы
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
      return `<g transform="translate(50 50) scale(2.5) translate(-50 -50)">${out}</g>`;
    },

    // пейзаж: крупная луна у края, два-три больших дерева на холме, сугроб
    poster(b, r, c) {
      let out = '';
      const left = r() < 0.5;
      const moon = { x: left ? 14 + r() * 10 : 76 + r() * 10, y: 12 + r() * 6, r: 15 + r() * 4 };
      out += circle(moon.x, moon.y, moon.r, c.accent2);
      // снег — не на луне
      for (let i = 0, k = 0; k < 10 && i < 60; i++) {
        const x = r() * 100;
        const y = 6 + r() * 46;
        const rr = 1.2 + r() * 1.2;
        if (Math.hypot(x - moon.x, y - moon.y) < moon.r + rr + 2) continue;
        out += circle(x, y, rr, c.ink);
        k++;
      }
      const hill = (base, amp, ph, fr) => (x) => base + amp * Math.sin(x * fr + ph);
      const layers = [
        { f: hill(56 + r() * 4, 6, r() * 6, 0.04), fill: b.pal.bg[1], op: 1 },
        { f: hill(70 + r() * 4, 7, r() * 6, 0.035), fill: c.ink, op: 0.55 },
        { f: hill(86 + r() * 3, 5, r() * 6, 0.05), fill: c.ink, op: 1 },
      ];
      layers.forEach((L, li) => {
        let d = `M0 100L0 ${n(L.f(0))}`;
        for (let x = 5; x <= 100; x += 5) d += `L${x} ${n(L.f(x))}`;
        out += `<path d="${d}L100 100Z" fill="${L.fill}" opacity="${L.op}"/>`;
        if (li === 1) {
          const spots = r() < 0.5 ? [22, 54, 84] : [30, 70];
          spots.forEach((sx) => {
            const x = sx + (r() - 0.5) * 8;
            const s = 26 + r() * 12;
            out += MOTIFS.tree(x, L.f(x) - s * 0.36, s, { ...c, ink: c.accent }, 3);
          });
        }
      });
      return out;
    },

    // народная открытка: кайма с крупными фестонами или зубцами, звёзды в
    // углах, большой мотив в середине (ёлка, подарок, снежинка, звезда — не круг)
    folk(b, r, c, bgRef) {
      let out = rect(0, 0, 100, 100, c.accent);
      out += `<rect x="13" y="13" width="74" height="74" rx="4" fill="${bgRef}"/>`;
      if (b.sub === 'zig') {
        const w = 74 / 6;
        for (let x = 13; x < 86.9; x += w) out += poly([[x, 13], [x + w, 13], [x + w / 2, 20]], c.accent) + poly([[x, 87], [x + w, 87], [x + w / 2, 80]], c.accent);
        for (let y = 13; y < 86.9; y += w) out += poly([[13, y], [13, y + w], [20, y + w / 2]], c.accent) + poly([[87, y], [87, y + w], [80, y + w / 2]], c.accent);
      } else {
        for (let x = 19.2; x <= 81; x += 12.36) out += circle(x, 13, 5.4, c.accent) + circle(x, 87, 5.4, c.accent);
        for (let y = 19.2; y <= 81; y += 12.36) out += circle(13, y, 5.4, c.accent) + circle(87, y, 5.4, c.accent);
      }
      [[10, 10], [90, 10], [10, 90], [90, 90]].forEach(([x, y]) => { out += MOTIFS.star8(x, y, 17, c.accent2); });
      const m = b.motifs[0];
      const size = { tree: 58, gift: 44, snowflake: 58, star: 52 }[m] || 50;
      out += MOTIFS.draw(m, 50, 51, size, { ...c, accent: c.accent2 }, b.variant, b.flake);
      return out;
    },

    // крупная форма — у каждой рубашки своя (sub):
    //  tree  — гигантская ёлка из трёх ярусов во весь рост, игрушки, звезда
    //  balls — горка из трёх огромных снежков у края, летящие снежки
    //  slope — склон горки по диагонали с лыжнёй, большое солнце в углу
    big(b, r, c) {
      let out = '';
      if (b.sub === 'tree') {
        const x0 = 44 + r() * 12;
        [[-2, 46, 34], [20, 76, 46], [46, 108, 60]].forEach(([top, bottom, hw]) => {
          out += poly([[x0, top], [x0 + hw, bottom], [x0 - hw, bottom]], c.ink);
        });
        [[x0 - 14, 38, c.accent], [x0 + 18, 62, c.accent2], [x0 - 24, 70, c.accent2], [x0 + 6, 88, c.accent], [x0 + 34, 94, c.accent]].forEach(([x, y, col]) => { out += circle(x, y, 5.5, col); });
        out += MOTIFS.star(x0, 9, 22, c.accent2);
      } else if (b.sub === 'balls') {
        const right = r() < 0.5;
        const X = (x) => (right ? x : 100 - x);
        out += circle(X(50), 90, 24, c.ink) + circle(X(92), 88, 22, c.ink) + circle(X(72), 52, 19, c.ink);
        [[X(22), 30, 7], [X(38), 14, 4.5]].forEach(([x, y, rr]) => {
          out += circle(x, y, rr, c.ink);
          const dir = right ? -1 : 1;
          for (let k = 0; k < 3; k++) out += `<path d="M${n(x + dir * (rr + 3))} ${n(y - rr * 0.6 + k * rr * 0.6)}h${n(dir * (6 + k * 3))}" stroke="${c.ink}" stroke-width="2" stroke-linecap="round" opacity="0.7"/>`;
        });
      } else {
        const up = r() < 0.5;
        const Y = (y) => y;
        const X = (x) => (up ? x : 100 - x);
        out += circle(X(14), 14, 16, c.accent2);
        out += `<path d="M${X(-5)} 100L${X(-5)} 84Q${X(50)} 78 ${X(105)} 30L${X(105)} 100Z" fill="${c.ink}"/>`;
        [6, 15].forEach((d) => { out += `<path d="M${X(-5)} ${n(Y(84 + d))}Q${X(50)} ${n(78 + d)} ${X(105)} ${n(30 + d * 1.1)}" fill="none" stroke="${c.accent}" stroke-width="3.5" stroke-linecap="round"/>`; });
        out += MOTIFS.tree(X(84), 30, 22, { ...c, ink: c.accent }, 3);
        [[X(40), 40, 2.2], [X(58), 22, 1.8], [X(76), 12, 2.4], [X(30), 58, 1.8]].forEach(([x, y, rr]) => { out += circle(x, y, rr, c.ink); });
      }
      return out;
    },

    // гирлянда: одна провисающая нить, на ней 3–4 крупные игрушки и звезда
    garland(b, r, c) {
      let out = '';
      const cols = [c.accent, c.accent2, c.ink];
      for (let i = 0; i < 8; i++) out += circle(r() * 100, 62 + r() * 38, 1.4 + r() * 1.4, c.ink);
      const y0 = 4 + r() * 6;
      const y1 = y0 + (r() - 0.5) * 10;
      const sag = 26 + r() * 8;
      const P = (t) => [-5 + 110 * t, (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * (Math.max(y0, y1) + sag) + t * t * y1];
      out += `<path d="M-5 ${n(y0)}Q50 ${n(Math.max(y0, y1) + sag)} 105 ${n(y1)}" fill="none" stroke="${c.ink}" stroke-width="2.4" opacity="0.9"/>`;
      const count = 3 + Math.floor(r() * 2);
      for (let k = 1; k <= count; k++) {
        const [x, y] = P(k / (count + 1));
        const len = 5 + (k % 2) * 9;
        const col = cols[k % 3];
        out += `<path d="M${n(x)} ${n(y)}v${len}" stroke="${c.ink}" stroke-width="1.6" opacity="0.9"/>`;
        if (k === count && count === 4) out += MOTIFS.star(x, y + len + 11, 24, col);
        else out += MOTIFS.ornament(x, y + len + 13, 30, { ...c, ink: col, accent: col === c.ink ? c.accent : c.ink });
      }
      return out;
    },

    // снегопад: четыре-пять очень крупных снежинок разных форм, немного снега
    snowfall(b, r, c) {
      let out = '';
      const items = [];
      for (let tries = 0; items.length < 5 && tries < 900; tries++) {
        const s = 30 + r() * 20;
        const x = r() * 100;
        const y = r() * 100;
        if (items.some((o) => Math.hypot(o.x - x, o.y - y) < (o.s + s) / 2 + 3)) continue;
        items.push({ x, y, s });
      }
      const flakes = b.flakes || [SNOWFLAKE.EVENT];
      items.forEach((o, i) => {
        out += `<g opacity="${n(0.65 + r() * 0.35)}">${MOTIFS.snowflake(o.x, o.y, o.s, c.ink, flakes[i % flakes.length], r() * 30)}</g>`;
      });
      for (let i = 0; i < 8; i++) out += circle(r() * 100, r() * 100, 1.6 + r() * 1.6, i % 4 ? c.ink : c.accent2);
      return out;
    },

    // абстракция в духе плаката: волны / ступени / ромбы / стежки / арки
    geo(b, r, c) {
      let out = '';
      const sub = b.sub;
      if (sub === 'waves') {
        // три толстые волны внизу, косая черта, пара снежинок-точек
        for (let k = 0; k < 3; k++) {
          const y0 = 54 + k * 17;
          let d = `M-6 ${n(y0)}`;
          for (let x = 0; x <= 108; x += 4) d += `L${x} ${n(y0 + 6 * Math.sin(x * 0.1 + k * 0.9))}`;
          out += `<path d="${d}" fill="none" stroke="${c.ink}" stroke-width="7.5" stroke-linecap="round"/>`;
        }
        out += `<path d="M84 -8L40 62" stroke="${c.accent2}" stroke-width="7" stroke-linecap="round"/>`;
        [[18 + r() * 10, 16 + r() * 8], [62 + r() * 14, 34 + r() * 6], [22 + r() * 10, 40 + r() * 4]].forEach(([x, y]) => { out += circle(x, y, 2.6, c.ink); });
      } else if (sub === 'stairs') {
        let d = 'M0 100';
        let x = 0;
        let y = 88;
        while (x < 100 && y > 10) { d += `L${n(x)} ${n(y)}`; x += 16; d += `L${n(x)} ${n(y)}`; y -= 16; }
        out += `<path d="${d}L${n(x)} 100Z" fill="${c.ink}"/>`;
        out += `<path d="${d}" fill="none" stroke="${c.accent}" stroke-width="2.6" transform="translate(-6 -6)"/>`;
        out += MOTIFS.star8(24 + r() * 8, 22 + r() * 6, 22, c.accent2);
      } else if (sub === 'diamonds') {
        for (let j = 0; j < 6; j++) for (let i = 0; i < 6 - j; i++) out += MOTIFS.diamond(10 + i * 18 + (j % 2) * 9, 90 - j * 18, 15, c.ink);
        out += `<circle cx="${n(72 + r() * 8)}" cy="${n(24 + r() * 8)}" r="9" fill="none" stroke="${c.accent2}" stroke-width="4.5"/>`;
      } else if (sub === 'stitch') {
        // крупные стежки-крестики сеткой
        for (let y = 10; y < 116; y += 32) for (let x = 10 + ((y - 10) / 32 % 2) * 16; x < 116; x += 32) out += `<path d="M${x - 9} ${y - 9}l18 18M${x + 9} ${y - 9}l-18 18" stroke="${c.ink}" stroke-width="7" stroke-linecap="square"/>`;
      } else {
        // arcs: ряд крупных арок, столбики, шарики над ними
        for (let x = 8; x < 104; x += 16) out += rect(x - 3.5, 68 + ((x - 8) / 16 % 2) * 8, 7, 40, c.ink);
        for (let x = 0; x < 120; x += 26) out += `<path d="M${x - 13} 60A13 13 0 0 1 ${x + 13} 60" fill="none" stroke="${c.ink}" stroke-width="5"/>`;
        for (let x = 13; x < 110; x += 26) out += circle(x, 36, 5, c.accent);
        out += MOTIFS.star(20 + r() * 60, 14 + r() * 6, 18, c.accent2);
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
