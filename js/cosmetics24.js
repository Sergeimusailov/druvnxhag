// Косметика профиля версии 2: рамки аватара и рубашки колоды двух категорий.
//  • Обычные — рамки с заливкой или градиентом; рубашки разного сплошного
//    цвета, у каждой свой простой узор.
//  • Эпические — анимированные: рамки с переливами, вращающимся сиянием,
//    бликами и искрами (реф — Marvel Snap); рубашки с фольгой, шейдерными
//    переливами, свечением и частицами.
// Всё рисуется CSS (css/cosmetics24.css), картинки не нужны.

const COSMETICS24 = (() => {
  const FRAMES = [
    { id: 'white', name: 'Белая', css: '#fff' },
    { id: 'dark', name: 'Графит', css: '#48484a' },
    { id: 'gold', name: 'Золото', css: 'linear-gradient(135deg, #fff2a8, #f5b400 50%, #c27a00)' },
    { id: 'ice', name: 'Лёд', css: 'linear-gradient(135deg, #e6f6ff, #7fd4ff 50%, #3f8cff)' },
    { id: 'mint', name: 'Мята', css: 'linear-gradient(135deg, #d6ffef, #2fd18f 55%, #0f7a52)' },
    { id: 'rose', name: 'Роза', css: 'linear-gradient(135deg, #ffe0ea, #ff5c8a 55%, #b0124a)' },
    { id: 'fire', name: 'Огонь', css: 'linear-gradient(135deg, #ffe066, #ff6a1a 55%, #c2161b)' },
    { id: 'violet', name: 'Фиолет', css: 'linear-gradient(135deg, #e3d4ff, #8c5cff 55%, #4b1fb0)' },
    { id: 'ocean', name: 'Океан', css: 'linear-gradient(135deg, #8ff0e0, #18a8b8 50%, #0b4f7a)' },
    // эпические — анимированные
    { id: 'holo', name: 'Голограмма', epic: true, fx: 'shine sparks' },
    { id: 'plasma', name: 'Плазма', epic: true, fx: '' },
    { id: 'royal', name: 'Корона', epic: true, fx: 'shine sparks' },
    { id: 'flame', name: 'Пламя', epic: true, fx: 'embers' },
    { id: 'frost', name: 'Иней', epic: true, fx: 'shine sparks' },
    { id: 'void', name: 'Бездна', epic: true, fx: 'sparks' },
  ];

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

  // старые id из прошлой версии настроек → новые
  const LEGACY = { rainbow: 'holo', base: 'classic', blue: 'stripes', green: 'rings', red: 'dots' };

  // стабильный «случайный» разброс частиц (одинаковый при каждой отрисовке)
  const rnd = (i, k) => {
    const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
    return x - Math.floor(x);
  };

  // искры по периметру рамки
  const RING = [[10, 6], [88, 4], [97, 62], [70, 97], [6, 88], [42, 2], [99, 30], [30, 98]];
  const sparks = (n) => RING.slice(0, n).map(([x, y], i) => `<i class="fx-sp" style="--x:${x}%;--y:${y}%;--d:${(i * 0.37).toFixed(2)}s"></i>`).join('');
  const embers = (n) => Array.from({ length: n }, (_, i) => `<i class="fx-em" style="--x:${(8 + rnd(i, 1) * 84).toFixed(0)}%;--d:${(rnd(i, 2) * 2).toFixed(2)}s;--s:${(0.6 + rnd(i, 3) * 0.7).toFixed(2)}"></i>`).join('');
  const stars = (n) => Array.from({ length: n }, (_, i) => `<i class="fx-st" style="--x:${(6 + rnd(i, 4) * 88).toFixed(0)}%;--y:${(6 + rnd(i, 5) * 88).toFixed(0)}%;--d:${(rnd(i, 6) * 3).toFixed(2)}s;--s:${(0.5 + rnd(i, 7) * 0.8).toFixed(2)}"></i>`).join('');

  const frame = (id) => FRAMES.find((f) => f.id === (LEGACY[id] || id)) || FRAMES[0];
  const back = (id) => BACKS.find((b) => b.id === (LEGACY[id] || id)) || BACKS[0];

  // украшения эпической рамки (искры, угольки) — вставляются внутрь элемента рамки
  function frameDecor(f) {
    if (!f.epic) return '';
    let html = '';
    if (f.fx.includes('sparks')) html += sparks(f.id === 'void' ? 4 : 6);
    if (f.fx.includes('embers')) html += embers(8);
    return html;
  }

  // применить рамку к элементу (аватар или превью в настройках)
  function applyFrame(el, id) {
    const f = frame(id);
    [...el.classList].filter((c) => c.startsWith('fx-')).forEach((c) => el.classList.remove(c));
    el.classList.toggle('fr24-epic', !!f.epic);
    el.querySelectorAll('.fx-sp, .fx-em').forEach((n) => n.remove());
    if (f.epic) {
      el.classList.add(`fx-${f.id}`);
      if (f.fx.includes('shine')) el.classList.add('fx-shine');
      el.style.removeProperty('--pf-frame');
      el.insertAdjacentHTML('beforeend', frameDecor(f));
    } else {
      el.style.setProperty('--pf-frame', f.css);
    }
  }

  function backHTML(id) {
    const b = back(id);
    let inner = '<span class="cb24-pat"></span><span class="cb24-emb"></span>';
    if (b.fx) {
      if (b.fx.includes('holo')) inner += '<span class="cb24-foil"></span>';
      if (b.fx.includes('sheen')) inner += '<span class="cb24-sheen"></span>';
      if (b.fx.includes('stars')) inner += stars(14);
      if (b.fx.includes('bolt')) inner += '<svg class="cb24-bolt" viewBox="0 0 24 24"><path d="M13.5 2 5 13.5h6L9.5 22 19 9.5h-6.2L13.5 2Z"/></svg>';
      if (b.fx.includes('sparks')) inner += sparks(5);
      if (b.fx.includes('embers')) inner += embers(10);
    }
    return `<span class="cb24 cb24-${b.id}${b.epic ? ' is-epic' : ''}">${inner}</span>`;
  }

  return { FRAMES, BACKS, frame, back, applyFrame, backHTML };
})();
