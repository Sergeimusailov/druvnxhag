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
// (свои CSS-эффекты в css/catalog/frames.css).
// Обычные и редкие с id basic-NN / rare-NN — из генератора
// (build/gen-frames.mjs → js/catalog/frames.generated.js).
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

  const generatedCSS = (f) => `${patternURL(f.pattern)} 0 0 / ${f.pattern.size}px ${f.pattern.size}px, ${fillCSS(f.fill, f.colors)}`;

  // ---------- прежние рамки (id сохранены — выбор игроков не сбрасывается) ----------
  const LEGACY_FRAMES = [
    { id: 'white', name: 'Белая', rarity: 'basic', css: '#fff' },
    { id: 'dark', name: 'Графит', rarity: 'basic', css: '#48484a' },
    { id: 'gold', name: 'Золото', rarity: 'basic', css: 'linear-gradient(135deg, #fff2a8, #f5b400 50%, #c27a00)' },
    { id: 'ice', name: 'Лёд', rarity: 'basic', css: 'linear-gradient(135deg, #e6f6ff, #7fd4ff 50%, #3f8cff)' },
    { id: 'mint', name: 'Мята', rarity: 'basic', css: 'linear-gradient(135deg, #d6ffef, #2fd18f 55%, #0f7a52)' },
    { id: 'rose', name: 'Роза', rarity: 'basic', css: 'linear-gradient(135deg, #ffe0ea, #ff5c8a 55%, #b0124a)' },
    { id: 'fire', name: 'Огонь', rarity: 'basic', css: 'linear-gradient(135deg, #ffe066, #ff6a1a 55%, #c2161b)' },
    { id: 'violet', name: 'Фиолет', rarity: 'basic', css: 'linear-gradient(135deg, #e3d4ff, #8c5cff 55%, #4b1fb0)' },
    { id: 'ocean', name: 'Океан', rarity: 'basic', css: 'linear-gradient(135deg, #8ff0e0, #18a8b8 50%, #0b4f7a)' },
    // «Радуга» была только в версии 3 (там id 'rainbow')
    { id: 'spectrum', name: 'Радуга', rarity: 'basic', css: 'conic-gradient(from 0deg, #ff7ad9, #ffdd2d, #6ff0ff, #b36bff, #ff7ad9)' },
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

  const list = [
    ...LEGACY_FRAMES,
    ...generated.filter((f) => f.rarity === 'basic'),
    ...generated.filter((f) => f.rarity === 'rare'),
    ...EPIC_FRAMES,
  ].map((f) => ({ ...f, epic: f.rarity === 'epic' }));

  const byId = new Map(list.map((f) => [f.id, f]));
  // старые id из прошлых версий настроек → нынешние
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

  return { list, get, byRarity, random, css, apply, patternURL, PATTERNS: FRAME_PATTERNS };
})();
