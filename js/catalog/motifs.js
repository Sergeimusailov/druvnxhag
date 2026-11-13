// Зимние мотивы для каталога — простые геометрические фигуры в SVG
// (без деталей и контуров, «плоская печать»). Координаты — в поле 100×100,
// (x, y) — центр мотива, s — размер, c — цвета { ink, accent, accent2, bg }.
//
//   MOTIFS.tree / gift / ornament / snowman / star / star8 / diamond / snowflake / dot
//
// Подробно — docs/catalog.md.

const MOTIFS = (() => {
  const n = (v) => +v.toFixed(1);
  const pts = (arr) => arr.map(([x, y]) => `${n(x)},${n(y)}`).join(' ');
  const poly = (arr, fill, extra = '') => `<polygon points="${pts(arr)}" fill="${fill}"${extra}/>`;
  const rect = (x, y, w, h, fill, rx = 0) => `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}"${rx ? ` rx="${n(rx)}"` : ''} fill="${fill}"/>`;
  const circle = (x, y, r, fill) => `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="${fill}"/>`;

  // звезда с k лучами: внешний радиус r, внутренний r * k2
  const starPts = (x, y, r, k = 5, k2 = 0.45, rot = 0) => Array.from({ length: k * 2 }, (_, i) => {
    const a = (Math.PI / k) * i + (rot * Math.PI) / 180;
    const rr = i % 2 ? r * k2 : r;
    return [x + Math.sin(a) * rr, y - Math.cos(a) * rr];
  });

  // ёлка: v0 — три яруса, v1 — треугольник со звездой, v2 — треугольник
  // с гирляндой, v3 — простой треугольник (силуэт для пейзажа)
  function tree(x, y, s, c, v = 0) {
    const h = s;
    const w = s * 0.8;
    const top = y - h / 2;
    if (v === 1 || v === 3) {
      return poly([[x, top + h * 0.1], [x + w * 0.42, y + h * 0.36], [x - w * 0.42, y + h * 0.36]], c.ink)
        + rect(x - w * 0.07, y + h * 0.36, w * 0.14, h * 0.14, c.ink)
        + (v === 1 ? poly(starPts(x, top + h * 0.1, s * 0.11), c.accent2) : '');
    }
    if (v === 2) {
      const tri = [[x, top], [x + w * 0.45, y + h * 0.38], [x - w * 0.45, y + h * 0.38]];
      const line = (t, dir) => {
        const yy = top + h * t;
        const hw = (w * 0.45 * (yy - top)) / (h * 0.88);
        return `<path d="M${n(x - hw * 0.9)} ${n(yy + dir * h * 0.05)}L${n(x + hw * 0.9)} ${n(yy - dir * h * 0.05)}" stroke="${c.accent}" stroke-width="${n(s * 0.05)}" stroke-linecap="round"/>`;
      };
      return poly(tri, c.ink) + line(0.42, 1) + line(0.66, -1) + rect(x - w * 0.07, y + h * 0.38, w * 0.14, h * 0.12, c.ink);
    }
    let out = '';
    for (let i = 0; i < 3; i++) {
      const t = top + i * h * 0.22;
      const hw = w * (0.24 + i * 0.13);
      out += poly([[x, t], [x + hw, t + h * 0.42], [x - hw, t + h * 0.42]], c.ink);
    }
    return out + rect(x - w * 0.07, top + h * 0.86, w * 0.14, h * 0.14, c.ink);
  }

  // подарок: коробка, крышка, лента крестом, бант из двух треугольников
  function gift(x, y, s, c) {
    const top = y - s / 2;
    return rect(x - s * 0.44, top + s * 0.3, s * 0.88, s * 0.7, c.ink)
      + rect(x - s * 0.5, top + s * 0.16, s, s * 0.2, c.ink)
      + rect(x - s * 0.08, top + s * 0.16, s * 0.16, s * 0.84, c.accent)
      + rect(x - s * 0.44, top + s * 0.56, s * 0.88, s * 0.12, c.accent)
      + poly([[x, top + s * 0.16], [x - s * 0.3, top], [x - s * 0.3, top + s * 0.2]], c.accent)
      + poly([[x, top + s * 0.16], [x + s * 0.3, top], [x + s * 0.3, top + s * 0.2]], c.accent);
  }

  // ёлочная игрушка: шар, колпачок, зигзаг по середине
  function ornament(x, y, s, c) {
    const r = s * 0.4;
    const cy = y + s * 0.08;
    const zig = Array.from({ length: 7 }, (_, i) => [x - r * 0.86 + (r * 1.72 * i) / 6, cy + (i % 2 ? -r * 0.16 : r * 0.16)]);
    return circle(x, cy, r, c.ink)
      + rect(x - s * 0.12, cy - r - s * 0.12, s * 0.24, s * 0.14, c.accent2, s * 0.03)
      + `<polyline points="${pts(zig)}" fill="none" stroke="${c.accent}" stroke-width="${n(s * 0.07)}" stroke-linejoin="round"/>`;
  }

  // снеговик: два шара, шарф, шляпа
  function snowman(x, y, s, c) {
    return circle(x, y + s * 0.2, s * 0.3, c.ink)
      + circle(x, y - s * 0.17, s * 0.2, c.ink)
      + rect(x - s * 0.21, y - s * 0.02, s * 0.42, s * 0.08, c.accent, s * 0.03)
      + rect(x - s * 0.15, y - s * 0.5, s * 0.3, s * 0.16, c.accent2)
      + rect(x - s * 0.22, y - s * 0.35, s * 0.44, s * 0.05, c.accent2);
  }

  const star = (x, y, s, fill, rot = 0) => poly(starPts(x, y, s / 2, 5, 0.45, rot), fill);
  const star8 = (x, y, s, fill) => poly(starPts(x, y, s / 2, 8, 0.5), fill);
  const diamond = (x, y, s, fill) => poly([[x, y - s / 2], [x + s / 2, y], [x, y + s / 2], [x - s / 2, y]], fill);
  const snowflake = (x, y, s, fill, spec = SNOWFLAKE.EVENT, rot = 0) => SNOWFLAKE.svg(spec, { x, y, r: s / 2, rot, ink: fill });
  const dot = (x, y, r, fill) => circle(x, y, r, fill);

  // мотив по имени, все — в цвете c.ink
  const byName = {
    tree: (x, y, s, c, v) => tree(x, y, s, c, v),
    gift: (x, y, s, c) => gift(x, y, s, c),
    ornament: (x, y, s, c) => ornament(x, y, s, c),
    snowman: (x, y, s, c) => snowman(x, y, s, c),
    star: (x, y, s, c) => star(x, y, s, c.ink),
    snowflake: (x, y, s, c, v, spec) => snowflake(x, y, s, c.ink, spec),
  };
  const draw = (name, x, y, s, c, v = 0, spec) => byName[name](x, y, s, c, v, spec);

  return { tree, gift, ornament, snowman, star, star8, diamond, snowflake, dot, draw, rect, circle, poly, starPts, n };
})();
