// Каталог рамок аватара — единый источник для всех экранов (профиль,
// настройки профиля, поиск матча, матч, награды). Рамку берут по id:
//
//   FRAME_CATALOG.get('rare-03')          — описание рамки (неизвестный id → «Белая»)
//   FRAME_CATALOG.apply(el, 'rare-03')    — нарисовать рамку на элементе
//   FRAME_CATALOG.random()                — случайная рамка из всего пула
//   FRAME_CATALOG.list / byRarity('rare') — списки
//   FRAME_CATALOG.css(id)                 — фон рамки строкой (только обычные)
//
// Элемент рамки рисует фон из CSS-переменной --pf-frame (обычно
// `background: var(--pf-frame)` + padding — толщина рамки), внутри картинка.
// Редкость: basic — обычные (заливка/градиент + узор), rare — редкие
// (анимированный перелив цвета, движущийся узор, частицы), epic — эпические
// (свои CSS-эффекты в css/catalog/frames.css). Сейчас в игре только обычные
// (ACTIVE): 30 штук — «Белая», 27 сгенерированных frame-NN (заливка + приём:
// крупный или мелкий узор, зерно, камушки, фестоны, зубцы, строчка, полосы)
// и 2 новогодние ny-*; редкие, эпические и прежние градиенты описаны, но выключены.
// Сгенерированные — из build/gen-frames.mjs → js/catalog/frames.generated.js.
// Подробно — docs/catalog.md.

const FRAME_CATALOG = (() => {
  // ---------- узоры: SVG-плитка s×s, цвет c ----------
  const sw = (s) => (s * 0.14).toFixed(1);
  const FRAME_PATTERNS = {
    dots: (s, c) => `<circle cx="${s / 2}" cy="${s / 2}" r="${s * 0.2}" fill="${c}"/>`,
    polka: (s, c) => `<circle cx="0" cy="0" r="${s * 0.16}" fill="${c}"/><circle cx="${s}" cy="0" r="${s * 0.16}" fill="${c}"/><circle cx="0" cy="${s}" r="${s * 0.16}" fill="${c}"/><circle cx="${s}" cy="${s}" r="${s * 0.16}" fill="${c}"/><circle cx="${s / 2}" cy="${s / 2}" r="${s * 0.16}" fill="${c}"/>`,
    stripes: (s, c) => `<path d="M${-s / 2} ${s / 2}L${s / 2} ${-s / 2}M0 ${s}L${s} 0M${s / 2} ${s * 1.5}L${s * 1.5} ${s / 2}" stroke="${c}" stroke-width="${(s * 0.22).toFixed(1)}"/>`,
    checks: (s, c) => `<rect width="${s / 2}" height="${s / 2}" fill="${c}"/><rect x="${s / 2}" y="${s / 2}" width="${s / 2}" height="${s / 2}" fill="${c}"/>`,
    rhombus: (s, c) => `<path d="M${s / 2} ${s * 0.12}L${s * 0.88} ${s / 2}L${s / 2} ${s * 0.88}L${s * 0.12} ${s / 2}Z" fill="${c}"/>`,
    zigzag: (s, c) => `<path d="M0 ${s * 0.65}L${s / 4} ${s * 0.35}L${s / 2} ${s * 0.65}L${s * 0.75} ${s * 0.35}L${s} ${s * 0.65}" fill="none" stroke="${c}" stroke-width="${sw(s)}" stroke-linejoin="round"/>`,
    waves: (s, c) => `<path d="M0 ${s / 2}Q${s / 4} ${s * 0.18} ${s / 2} ${s / 2}T${s} ${s / 2}" fill="none" stroke="${c}" stroke-width="${sw(s)}"/>`,
    rings: (s, c) => `<circle cx="${s / 2}" cy="${s / 2}" r="${s * 0.28}" fill="none" stroke="${c}" stroke-width="${sw(s)}"/>`,
    cross: (s, c) => `<path d="M${s / 2} ${s * 0.2}V${s * 0.8}M${s * 0.2} ${s / 2}H${s * 0.8}" stroke="${c}" stroke-width="${(s * 0.16).toFixed(1)}" stroke-linecap="round"/>`,
    triangles: (s, c) => `<path d="M${s / 2} ${s * 0.18}L${s * 0.84} ${s * 0.8}H${s * 0.16}Z" fill="${c}"/>`,
    stars: (s, c) => `<path d="M${s / 2} ${s * 0.1}L${s * 0.6} ${s * 0.4}L${s * 0.9} ${s / 2}L${s * 0.6} ${s * 0.6}L${s / 2} ${s * 0.9}L${s * 0.4} ${s * 0.6}L${s * 0.1} ${s / 2}L${s * 0.4} ${s * 0.4}Z" fill="${c}"/>`,
    // снежинка с иконки новогоднего ивента (js/catalog/snowflake.js)
    snowflake: (s, c) => SNOWFLAKE.svg(SNOWFLAKE.EVENT, { x: s / 2, y: s / 2, r: s * 0.44, ink: c }),
    scales: (s, c) => `<path d="M0 ${s / 2}A${s / 2} ${s / 2} 0 0 0 ${s} ${s / 2}M${-s / 2} ${s}A${s / 2} ${s / 2} 0 0 0 ${s / 2} ${s}A${s / 2} ${s / 2} 0 0 0 ${s * 1.5} ${s}M${-s / 2} 0A${s / 2} ${s / 2} 0 0 0 ${s / 2} 0A${s / 2} ${s / 2} 0 0 0 ${s * 1.5} 0" fill="none" stroke="${c}" stroke-width="${sw(s)}"/>`,
  };

  const patternURL = ({ kind, size, ink }) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${FRAME_PATTERNS[kind](size, ink)}</svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  };

  // ---------- заливки ----------
  const fillCSS = ({ type, angle }, [a, b, c, d]) => {
    switch (type) {
      case 'solid': return b;
      case 'linear': return `linear-gradient(${angle}deg, ${a}, ${b} 50%, ${c})`;
      case 'linear2': return `linear-gradient(${angle}deg, ${a}, ${c})`;
      case 'radial': return `radial-gradient(circle at 30% 25%, ${a}, ${b} 55%, ${c})`;
      case 'conic': return `conic-gradient(from ${angle}deg, ${a}, ${b}, ${c}, ${b}, ${a})`;
      // редкие — анимированные: угол var(--fx-a) крутится (css/catalog/frames.css)
      case 'spin': return `conic-gradient(from var(--fx-a), ${a}, ${b}, ${c}, ${d}, ${a})`;
      case 'turn': return `linear-gradient(var(--fx-a), ${a}, ${b}, ${c}, ${d})`;
      // перелив течёт: полотно 2× по высоте, цвета повторяются — шов не виден
      case 'flow': return `linear-gradient(${angle}deg, ${a}, ${b}, ${c}, ${d}, ${a}) 0 0 / 100% 200%`;
      default: return b;
    }
  };

  const svgURL = (w, h, body) => `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`)}")`;

  // ---------- рамки нового вида: заливка + приём (deco) + шум ----------
  // мелкие узоры: плитка s×s, тонкие линии
  const MICRO = {
    microdots: (s, c) => `<circle cx="${s / 2}" cy="${s / 2}" r="${s * 0.17}" fill="${c}"/>`,
    hatch: (s, c) => `<path d="M${-s / 2} ${s / 2}L${s / 2} ${-s / 2}M0 ${s}L${s} 0M${s / 2} ${s * 1.5}L${s * 1.5} ${s / 2}" stroke="${c}" stroke-width="${(s * 0.18).toFixed(2)}"/>`,
    pin: (s, c) => `<rect x="${s * 0.4}" width="${s * 0.2}" height="${s}" fill="${c}"/>`,
    crosshatch: (s, c) => `<path d="M0 0L${s} ${s}M${s} 0L0 ${s}" stroke="${c}" stroke-width="${(s * 0.14).toFixed(2)}"/>`,
    mcheck: (s, c) => `<rect width="${s / 2}" height="${s / 2}" fill="${c}"/><rect x="${s / 2}" y="${s / 2}" width="${s / 2}" height="${s / 2}" fill="${c}"/>`,
    plus: (s, c) => `<path d="M${s / 2} ${s * 0.22}V${s * 0.78}M${s * 0.22} ${s / 2}H${s * 0.78}" stroke="${c}" stroke-width="${(s * 0.18).toFixed(2)}"/>`,
  };

  // фигурки-«камушки» по сторонам рамки (поле 10×10)
  const STUD = {
    star: (c) => `<path d="M5 0.4L6.3 3.6L9.8 3.8L7.1 6L8 9.5L5 7.6L2 9.5L2.9 6L0.2 3.8L3.7 3.6Z" fill="${c}"/>`,
    star8: (c) => `<path d="M5 0L6.1 2.4L8.5 1.5L7.6 3.9L10 5L7.6 6.1L8.5 8.5L6.1 7.6L5 10L3.9 7.6L1.5 8.5L2.4 6.1L0 5L2.4 3.9L1.5 1.5L3.9 2.4Z" fill="${c}"/>`,
    diamond: (c) => `<path d="M5 0.5L9 5L5 9.5L1 5Z" fill="${c}"/>`,
    dot: (c) => `<circle cx="5" cy="5" r="3.6" fill="${c}"/>`,
    plus: (c) => `<path d="M5 1V9M1 5H9" stroke="${c}" stroke-width="2.6" stroke-linecap="round"/>`,
  };

  // край рамки: плитка вдоль верхней кромки (w×h), для остальных сторон — поворот
  const EDGE = {
    scallop: (w, h, c) => `<path d="M0 0A${w / 2} ${h} 0 0 0 ${w} 0Z" fill="${c}"/>`,
    teeth: (w, h, c) => `<path d="M0 0L${w / 2} ${h}L${w} 0Z" fill="${c}"/>`,
    stitch: (w, h, c) => `<rect x="${w * 0.2}" y="${h * 0.45}" width="${w * 0.6}" height="${(h * 0.3).toFixed(2)}" rx="${(h * 0.15).toFixed(2)}" fill="${c}"/>`,
  };
  function edgeLayers(kind, w, h, c) {
    const draw = EDGE[kind];
    const top = svgURL(w, h, draw(w, h, c));
    const bottom = svgURL(w, h, `<g transform="rotate(180 ${w / 2} ${h / 2})">${draw(w, h, c)}</g>`);
    const left = svgURL(h, w, `<g transform="translate(0 ${w}) rotate(-90)">${draw(w, h, c)}</g>`);
    const right = svgURL(h, w, `<g transform="translate(${h} 0) rotate(90)">${draw(w, h, c)}</g>`);
    return [
      `${top} left top / ${w}px ${h}px repeat-x`,
      `${bottom} left bottom / ${w}px ${h}px repeat-x`,
      `${left} left top / ${h}px ${w}px repeat-y`,
      `${right} right top / ${h}px ${w}px repeat-y`,
    ];
  }

  // зерно «как в печати»: мелкие светлые или тёмные крапинки, как у рубашек;
  // amount из описания рамки приглушается до 35%
  const noiseLayer = (tone, amount = 0.5) => {
    const v = tone === 'dark' ? 0 : 1;
    const body = `<filter id="n" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="matrix" values="0 0 0 0 ${v} 0 0 0 0 ${v} 0 0 0 0 ${v} 5 0 0 0 -2.85"/></filter><rect width="64" height="64" filter="url(#n)" opacity="${+(amount * 0.35).toFixed(3)}"/>`;
    return `${svgURL(64, 64, body)} 0 0 / 64px 64px`;
  };

  const shade = (c, k) => `color-mix(in srgb, ${c} ${100 - Math.abs(k)}%, ${k > 0 ? '#fff' : '#000'})`;
  function baseCSS({ type, angle, width = 4 }, [m, s2, a]) {
    switch (type) {
      case 'grad': return `linear-gradient(${angle}deg, ${shade(m, 35)}, ${m} 50%, ${shade(m, -35)})`;
      case 'duo': return `linear-gradient(${angle}deg, ${m}, ${a})`;
      case 'split': return `linear-gradient(${angle}deg, ${m} 50%, ${s2} 50%)`;
      case 'quarters': return `conic-gradient(from ${angle}deg, ${m} 0 25%, ${s2} 0 50%, ${m} 0 75%, ${s2} 0)`;
      case 'bands': return `repeating-linear-gradient(${angle}deg, ${m} 0 ${width}px, ${s2} ${width}px ${width * 2}px)`;
      case 'bands3': return `repeating-linear-gradient(${angle}deg, ${m} 0 ${width}px, ${s2} ${width}px ${width * 2}px, ${a} ${width * 2}px ${width * 3}px)`;
      default: return m;
    }
  }

  function styledCSS(f) {
    const layers = [];
    const d = f.deco || {};
    if (f.noise) layers.push(noiseLayer(f.noise.tone, f.noise.amount));
    if (d.kind === 'pattern') layers.push(`${patternURL({ kind: d.pattern, size: d.size, ink: d.ink })} 0 0 / ${d.size}px ${d.size}px`);
    if (d.kind === 'micro') layers.push(`${svgURL(d.size, d.size, MICRO[d.pattern](d.size, d.ink))} 0 0 / ${d.size}px ${d.size}px`);
    if (d.kind === 'studs') {
      const u = svgURL(10, 10, STUD[d.shape](d.ink));
      const pos = d.many ? ['25% top', '75% top', '25% bottom', '75% bottom', 'left 25%', 'left 75%', 'right 25%', 'right 75%'] : ['center top', 'center bottom', 'left center', 'right center'];
      pos.forEach((p) => layers.push(`${u} ${p} / ${d.size}px ${d.size}px no-repeat`));
    }
    if (d.kind === 'edge') layers.push(...edgeLayers(d.edge, d.w, d.h, d.ink));
    if (d.under) layers.push(`${svgURL(d.under.size, d.under.size, MICRO[d.under.pattern](d.under.size, d.under.ink))} 0 0 / ${d.under.size}px ${d.under.size}px`);
    layers.push(baseCSS(f.fill, f.colors));
    return layers.join(', ');
  }

  const generatedCSS = (f) => (f.style ? styledCSS(f) : `${patternURL(f.pattern)} 0 0 / ${f.pattern.size}px ${f.pattern.size}px, ${fillCSS(f.fill, f.colors)}`);

  // ---------- прежние рамки: в игре только «Белая» (рамка по умолчанию),
  // остальные — простые градиенты — выключены (retired) ----------
  const LEGACY_FRAMES = [
    { id: 'white', name: 'Белая', rarity: 'basic', css: '#fff' },
    { id: 'dark', name: 'Графит', rarity: 'basic', retired: true, css: '#48484a' },
    { id: 'gold', name: 'Золото', rarity: 'basic', retired: true, css: 'linear-gradient(135deg, #fff2a8, #f5b400 50%, #c27a00)' },
    { id: 'ice', name: 'Лёд', rarity: 'basic', retired: true, css: 'linear-gradient(135deg, #e6f6ff, #7fd4ff 50%, #3f8cff)' },
    { id: 'mint', name: 'Мята', rarity: 'basic', retired: true, css: 'linear-gradient(135deg, #d6ffef, #2fd18f 55%, #0f7a52)' },
    { id: 'rose', name: 'Роза', rarity: 'basic', retired: true, css: 'linear-gradient(135deg, #ffe0ea, #ff5c8a 55%, #b0124a)' },
    { id: 'fire', name: 'Огонь', rarity: 'basic', retired: true, css: 'linear-gradient(135deg, #ffe066, #ff6a1a 55%, #c2161b)' },
    { id: 'violet', name: 'Фиолет', rarity: 'basic', retired: true, css: 'linear-gradient(135deg, #e3d4ff, #8c5cff 55%, #4b1fb0)' },
    { id: 'ocean', name: 'Океан', rarity: 'basic', retired: true, css: 'linear-gradient(135deg, #8ff0e0, #18a8b8 50%, #0b4f7a)' },
    // «Радуга» была только в версии 3 (там id 'rainbow')
    { id: 'spectrum', name: 'Радуга', rarity: 'basic', retired: true, css: 'conic-gradient(from 0deg, #ff7ad9, #ffdd2d, #6ff0ff, #b36bff, #ff7ad9)' },
  ];
  const EPIC_FRAMES = [
    { id: 'holo', name: 'Голограмма', rarity: 'epic', fx: 'shine sparks' },
    { id: 'plasma', name: 'Плазма', rarity: 'epic', fx: '' },
    { id: 'royal', name: 'Корона', rarity: 'epic', fx: 'shine sparks' },
    { id: 'flame', name: 'Пламя', rarity: 'epic', fx: 'embers' },
    { id: 'frost', name: 'Иней', rarity: 'epic', fx: 'shine sparks' },
    { id: 'void', name: 'Бездна', rarity: 'epic', fx: 'sparks' },
  ];

  const generated = (typeof FRAMES_GENERATED !== 'undefined' ? FRAMES_GENERATED : []).map((f) => ({ ...f, css: generatedCSS(f) }));

  // все описанные рамки (редкие и эпические сохранены на будущее)…
  const all = [
    ...LEGACY_FRAMES,
    ...generated.filter((f) => f.rarity === 'basic' && !f.theme && f.style),
    ...generated.filter((f) => f.rarity === 'basic' && !f.theme && !f.style),
    ...generated.filter((f) => f.theme),
    ...generated.filter((f) => f.rarity === 'rare'),
    ...EPIC_FRAMES,
  ].map((f) => ({ ...f, epic: f.rarity === 'epic' }));
  // …но в игре сейчас только обычные: выдаются, видны в настройках и у
  // соперника. Включить редкость — добавить её сюда.
  const ACTIVE = ['basic'];
  const list = all.filter((f) => ACTIVE.includes(f.rarity) && !f.retired);

  const byId = new Map(list.map((f) => [f.id, f]));
  // старые id из прошлых версий настроек → нынешние; выбранная раньше
  // выключенная (редкая / эпическая) рамка показывается «Белой»
  const ALIASES = { rainbow: 'holo' };

  const get = (id) => byId.get(ALIASES[id] || id) || list[0];
  const byRarity = (r) => list.filter((f) => f.rarity === r);
  const random = (filter) => {
    const pool = filter ? list.filter(filter) : list;
    return pool[Math.floor(Math.random() * pool.length)];
  };
  const css = (id) => get(id).css || list[0].css;

  // нарисовать рамку на элементе (аватар, превью в настройках и т. п.)
  function apply(el, id) {
    const f = get(id);
    [...el.classList].filter((c) => c.startsWith('fx-') || c.startsWith('fr-')).forEach((c) => el.classList.remove(c));
    el.classList.remove('fr24-epic');
    FX_EMITTER.clear(el);
    el.dataset.frame = f.id;
    if (f.rarity === 'epic') {
      el.classList.add('fr24-epic', 'fr-anim', `fx-${f.id}`);
      if (f.fx.includes('shine')) el.classList.add('fx-shine');
      el.style.removeProperty('--pf-frame');
      if (f.fx.includes('sparks')) FX_EMITTER.emit(el, 'spark', f.id === 'void' ? 4 : 6);
      if (f.fx.includes('embers')) FX_EMITTER.emit(el, 'ember', 8);
      return f;
    }
    el.style.setProperty('--pf-frame', f.css);
    if (f.rarity === 'rare') {
      el.classList.add('fr-anim', 'fr-rare', `fr-rare-${f.fill.type}`);
      const t = f.pattern.size;
      el.style.setProperty('--fr-px', `${f.pattern.drift[0] * t}px`);
      el.style.setProperty('--fr-py', `${f.pattern.drift[1] * t}px`);
      el.style.setProperty('--fr-pat-t', `${f.pattern.speed}s`);
      el.style.setProperty('--fr-fill-t', `${f.fill.speed}s`);
      if (f.fx) FX_EMITTER.emit(el, f.fx.kind, f.fx.count, { color: f.fx.color, seed: f.id.length });
    }
    return f;
  }

  return { list, all, ACTIVE, get, byRarity, random, css, apply, patternURL, PATTERNS: FRAME_PATTERNS };
})();
