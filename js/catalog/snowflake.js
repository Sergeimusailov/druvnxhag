// Снежинки для каталога (узоры рамок и рубашек). Снежинка — SVG из шести
// одинаковых лучей; луч собирается из параметров, поэтому форм много:
//
//   SNOWFLAKE.svg(spec, { x, y, r, rot, ink })  — <g> снежинки для вставки в SVG
//   spec = {
//     branches: [[t, len, angle], …]  — веточки: место на луче (0…1 от центра),
//                                       длина (доля радиуса), угол к лучу (°)
//     tip: 'none' | 'fork' | 'diamond' | 'arrow' | 'bar'   — кончик луча
//     core: 'none' | 'hex' | 'hexfill' | 'star'            — середина
//     width: толщина линий (в долях радиуса, ~0.08…0.16)
//   }
// Пресет EVENT — снежинка с иконки новогоднего ивента (assets/v2-event-snowflake.png):
// ромбики на кончиках, веточки «галочкой», шестиугольник в центре.
// Подробно — docs/catalog.md.

const SNOWFLAKE = (() => {
  const EVENT = { branches: [[0.55, 0.32, 50]], tip: 'diamond', core: 'hex', width: 0.12 };

  const f = (n) => +n.toFixed(2);

  // один луч, направленный вверх; центр снежинки (0,0), радиус 1
  function arm(spec) {
    const parts = ['M0 0V-0.86'];
    const fills = [];
    for (const [t, len, ang] of spec.branches || []) {
      const a = (ang * Math.PI) / 180;
      const y = -t;
      const dx = f(Math.sin(a) * len);
      const dy = f(-Math.cos(a) * len);
      parts.push(`M0 ${f(y)}l${dx} ${dy}M0 ${f(y)}l${-dx} ${dy}`);
    }
    switch (spec.tip) {
      case 'fork': parts.push('M0 -0.78l0.16 -0.2M0 -0.78l-0.16 -0.2'); break;
      case 'arrow': parts.push('M-0.14 -0.84L0 -1L0.14 -0.84'); break;
      case 'bar': parts.push('M-0.14 -0.9H0.14'); break;
      case 'diamond': fills.push('M0 -1.02L0.12 -0.86L0 -0.7L-0.12 -0.86Z'); break;
      default: parts[0] = 'M0 0V-1';
    }
    return { stroke: parts.join(''), fill: fills.join('') };
  }

  function core(spec) {
    const hex = (r) => Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 3) * i;
      return `${i ? 'L' : 'M'}${f(Math.sin(a) * r)} ${f(-Math.cos(a) * r)}`;
    }).join('') + 'Z';
    switch (spec.core) {
      case 'hex': return { stroke: hex(0.24), fill: '' };
      case 'hexfill': return { stroke: '', fill: hex(0.2) };
      case 'star': return { stroke: '', fill: Array.from({ length: 12 }, (_, i) => {
        const a = (Math.PI / 6) * i;
        const r = i % 2 ? 0.1 : 0.26;
        return `${i ? 'L' : 'M'}${f(Math.sin(a) * r)} ${f(-Math.cos(a) * r)}`;
      }).join('') + 'Z' };
      default: return { stroke: '', fill: '' };
    }
  }

  // <g> снежинки: центр (x, y), радиус r, поворот rot (°), цвет ink
  function svg(spec, { x = 12, y = 12, r = 10, rot = 0, ink = '#fff' } = {}) {
    const a = arm(spec);
    const c = core(spec);
    const sw = f(spec.width || 0.12);
    const arms = [0, 60, 120, 180, 240, 300].map((d) => `<g transform="rotate(${d})">${a.stroke ? `<path d="${a.stroke}"/>` : ''}${a.fill ? `<path d="${a.fill}" fill="${ink}" stroke="none"/>` : ''}</g>`).join('');
    const mid = `${c.stroke ? `<path d="${c.stroke}"/>` : ''}${c.fill ? `<path d="${c.fill}" fill="${ink}" stroke="none"/>` : ''}`;
    return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(r)})" fill="none" stroke="${ink}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${arms}${mid}</g>`;
  }

  return { EVENT, svg };
})();
