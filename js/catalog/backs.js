// Каталог рубашек колоды — единый источник для профиля, настроек, поиска
// матча и матча. Рубашку берут по id:
//
//   BACK_CATALOG.get('back-07')     — описание (неизвестный id → первая рубашка)
//   BACK_CATALOG.html('back-07')    — разметка рубашки (квадрат, тянется по носителю)
//   BACK_CATALOG.random()           — случайная из каталога
//   BACK_CATALOG.list               — все рубашки
//
// Сейчас в игре только обычные (ACTIVE): 30 зимних рубашек из генератора
// (build/gen-backs.mjs → js/catalog/backs.generated.js) — тёплый фон цветов
// ёлочного шара и узор из снежинок (js/catalog/snowflake.js).
// Стили — .cb24 в css/cosmetics24.css. Подробно — docs/catalog.md.

const BACK_CATALOG = (() => {
  const fillCSS = ({ type, angle }, [a, b, c]) => {
    switch (type) {
      case 'linear': return `linear-gradient(${angle}deg, ${a}, ${b} 55%, ${c})`;
      case 'radial': return `radial-gradient(circle at 30% 25%, ${a}, ${b} 55%, ${c})`;
      default: return b;
    }
  };

  // узор: SVG 100×100 — плитка (сетка) или вся рубашка (россыпь)
  function patternCSS(b) {
    const [s1, s2 = s1] = b.flakes;
    const ink = b.ink;
    const flake = (spec, x, y, r, rot = b.rot) => SNOWFLAKE.svg(spec, { x, y, r, rot, ink });
    const dot = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${ink}"/>`;
    let body;
    let tile = 100 / b.density;
    switch (b.layout) {
      case 'grid':
        body = flake(s1, 50, 50, 34);
        break;
      case 'stagger':
        body = flake(s1, 25, 25, 19) + flake(s1, 75, 75, 19);
        break;
      case 'mix':
        body = flake(s1, 27, 27, 21) + flake(s2, 75, 75, 13, b.rot + 15) + dot(76, 24, 3) + dot(24, 76, 3);
        break;
      default: // scatter
        tile = 100;
        body = b.scatter.items.map((o) => flake(o.s ? s2 : s1, o.x, o.y, o.r, o.rot)).join('')
          + b.scatter.dots.map(([x, y, r]) => dot(x, y, r)).join('');
    }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">${body}</svg>`;
    const t = +tile.toFixed(3);
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}") 0 0 / ${t}% ${t}%`;
  }

  const generated = (typeof BACKS_GENERATED !== 'undefined' ? BACKS_GENERATED : []).map((b) => ({
    ...b,
    bgCSS: fillCSS(b.bg, b.colors),
    patCSS: patternCSS(b),
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

  // неизвестный id (в том числе рубашки прошлых версий: classic, dots…) → первая
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
    return `<span class="cb24 cb24-gen" data-back="${b.id}" style="--cb:${b.colors[1]};--cb-bg:${attr(b.bgCSS)};--pat:${attr(b.patCSS)}"><span class="cb24-pat"></span></span>`;
  }

  return { list, all, ACTIVE, get, random, html };
})();
