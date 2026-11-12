// Эмиттер частиц каталога — без canvas и WebGL: частица — элемент <i>,
// движение — CSS-анимация (css/catalog/fx.css). Эмиттер только расставляет
// частицы: место, задержку, размер, цвет. Разброс «случайный», но
// одинаковый при каждой отрисовке (зависит от номера частицы и зерна).
//
//   FX_EMITTER.html('spark', 6)                         — искры по периметру
//   FX_EMITTER.html('ember', 8, { color: '#ffd34d' })  — угольки поднимаются вверх
//   FX_EMITTER.html('star', 14, { seed: 3 })           — звёзды мерцают по всей площади
//   FX_EMITTER.emit(el, 'spark', 6, opts)              — то же, сразу внутрь элемента
//   FX_EMITTER.clear(el)                                — убрать частицы эмиттера
//
// Элемент-носитель должен быть position: relative (частицы — absolute).
// Подробно — docs/catalog.md, раздел «Эмиттер частиц».

const FX_EMITTER = (() => {
  const rnd = (i, k) => {
    const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
    return x - Math.floor(x);
  };
  const f2 = (n) => n.toFixed(2);

  // точки по периметру рамки (в % от размера носителя)
  const RING = [[10, 6], [88, 4], [97, 62], [70, 97], [6, 88], [42, 2], [99, 30], [30, 98]];

  // цвет частицы (и её свечения — у угольков и звёзд)
  const color = (opts, prop) => (opts.color ? `;${prop}:${opts.color}${prop === '--fx-c' ? `;--fx-glow:${opts.color}` : ''}` : '');

  const KINDS = {
    // вспыхивающая искра-звёздочка на кромке
    spark: (i, opts) => {
      const [x, y] = RING[i % RING.length];
      return `<i class="fx-sp" data-fx style="--x:${x}%;--y:${y}%;--d:${f2(i * 0.37)}s${color(opts, '--spark')}"></i>`;
    },
    // уголёк: появляется у нижнего края и улетает вверх
    ember: (i, opts) => {
      const s = opts.seed || 0;
      return `<i class="fx-em" data-fx style="--x:${(8 + rnd(i + s, 1) * 84).toFixed(0)}%;--d:${f2(rnd(i + s, 2) * 2)}s;--s:${f2(0.6 + rnd(i + s, 3) * 0.7)}${color(opts, '--fx-c')}"></i>`;
    },
    // мерцающая звезда в случайной точке
    star: (i, opts) => {
      const s = opts.seed || 0;
      return `<i class="fx-st" data-fx style="--x:${(6 + rnd(i + s, 4) * 88).toFixed(0)}%;--y:${(6 + rnd(i + s, 5) * 88).toFixed(0)}%;--d:${f2(rnd(i + s, 6) * 3)}s;--s:${f2(0.5 + rnd(i + s, 7) * 0.8)}${color(opts, '--fx-c')}"></i>`;
    },
  };

  function html(kind, count, opts = {}) {
    const make = KINDS[kind];
    if (!make) return '';
    return Array.from({ length: count }, (_, i) => make(i, opts)).join('');
  }

  function clear(el) {
    el.querySelectorAll(':scope > [data-fx]').forEach((n) => n.remove());
  }

  function emit(el, kind, count, opts) {
    el.insertAdjacentHTML('beforeend', html(kind, count, opts));
  }

  return { KINDS, html, emit, clear };
})();
