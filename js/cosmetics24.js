// Косметика профиля версии 2.
//  • Рамки аватара — из общего каталога js/catalog/frames.js (FRAME_CATALOG):
//    обычные, редкие и эпические, берутся по id. Здесь только прокси, чтобы
//    прежние вызовы COSMETICS24.frame / applyFrame / FRAMES работали.
//  • Рубашки колоды — обычные (свой сплошной цвет и узор) и эпические
//    (фольга, переливы, свечение, частицы из js/catalog/fx-emitter.js).
// Всё рисуется CSS (css/cosmetics24.css, css/catalog/*.css), картинки не нужны.

const COSMETICS24 = (() => {
  const FRAMES = FRAME_CATALOG.list;

  const BACKS = [
    { id: 'classic', name: 'Классика' },
    { id: 'dots', name: 'Горошек' },
    { id: 'stripes', name: 'Полоски' },
    { id: 'rhombus', name: 'Ромбы' },
    { id: 'rings', name: 'Круги' },
    { id: 'zigzag', name: 'Зигзаг' },
    // эпические — анимированные
    { id: 'holo', name: 'Голофольга', epic: true, fx: 'holo sheen' },
    { id: 'cosmos', name: 'Космос', epic: true, fx: 'stars' },
    { id: 'storm', name: 'Шторм', epic: true, fx: 'bolt sparks' },
    { id: 'goldfoil', name: 'Золото', epic: true, fx: 'sheen sparks' },
    { id: 'inferno', name: 'Инферно', epic: true, fx: 'embers' },
    { id: 'prism', name: 'Призма', epic: true, fx: 'sheen' },
  ];

  // старые id рубашек из прошлой версии настроек → новые
  const LEGACY = { base: 'classic', blue: 'stripes', green: 'rings', red: 'dots' };

  const frame = (id) => FRAME_CATALOG.get(id);
  const back = (id) => BACKS.find((b) => b.id === (LEGACY[id] || id)) || BACKS[0];
  const applyFrame = (el, id) => FRAME_CATALOG.apply(el, id);

  function backHTML(id) {
    const b = back(id);
    let inner = '<span class="cb24-pat"></span><span class="cb24-emb"></span>';
    if (b.fx) {
      if (b.fx.includes('holo')) inner += '<span class="cb24-foil"></span>';
      if (b.fx.includes('sheen')) inner += '<span class="cb24-sheen"></span>';
      if (b.fx.includes('stars')) inner += FX_EMITTER.html('star', 14);
      if (b.fx.includes('bolt')) inner += '<svg class="cb24-bolt" viewBox="0 0 24 24"><path d="M13.5 2 5 13.5h6L9.5 22 19 9.5h-6.2L13.5 2Z"/></svg>';
      if (b.fx.includes('sparks')) inner += FX_EMITTER.html('spark', 5);
      if (b.fx.includes('embers')) inner += FX_EMITTER.html('ember', 10);
    }
    return `<span class="cb24 cb24-${b.id}${b.epic ? ' is-epic' : ''}">${inner}</span>`;
  }

  return { FRAMES, BACKS, frame, back, applyFrame, backHTML };
})();
