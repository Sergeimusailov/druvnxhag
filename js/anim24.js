// Общие анимации версии 2 на anime.js v4 (js/vendor/anime.umd.min.js).
// Все анимации интерфейса идут через anime.animate / anime.createTimeline;
// здесь — общие кривые, длительности и маленькие помощники, чтобы код
// экранов был коротким и одинаковым. Спецификация — docs/animations-v2.md.
//
//   A24.play(targets, params, { keep })   — одноразовая анимация; по окончании
//        инлайн-стили, которые она поставила, убираются (иначе инлайн-transform
//        перебьёт CSS: нажатия :active, позиционирование). keep: true — оставить
//        конечное состояние (например, элемент должен остаться скрытым).
//   A24.pulse(el, scale, duration, ease)  — «пульс»: scale 1 → s → 1
//   A24.squash(el)                         — нажатие с отдачей: 1 → 0.86 → 1.06 → 1
//   A24.loop(el, params)                   — бесконечная анимация (покачивание,
//        свечение); сама останавливается, когда элемент убран со страницы;
//        при «уменьшении движения» не запускается
//   A24.wait(ms)                           — пауза (Promise)
//   A24.reduce                             — включено ли «уменьшение движения»
//
// Центрирование через -50%: anime.js пишет свойство transform целиком, поэтому
// сдвиг на половину размера задаём отдельным CSS-свойством translate
// (`translate: -50% -50%`) — оно складывается с transform и не теряется.

const A24 = (() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // кривые (cubic-bezier) — те же, что в CSS проекта
  const EASE = {
    ios: 'cubicBezier(0.32, 0.72, 0.35, 1)', // основная: шторки, переходы, сворачивание
    spring: 'cubicBezier(0.34, 1.32, 0.42, 1)', // мягкая пружина: «поп», индикаторы
    springStrong: 'cubicBezier(0.34, 1.56, 0.64, 1)', // сильная пружина: иконки, точки
    outExpo: 'cubicBezier(0.22, 1, 0.36, 1)', // заполнение, искры, появления
    out: 'cubicBezier(0, 0, 0.58, 1)', // CSS ease-out
    in: 'cubicBezier(0.42, 0, 1, 1)', // CSS ease-in
    inOut: 'cubicBezier(0.42, 0, 0.58, 1)', // CSS ease-in-out
    ease: 'cubicBezier(0.25, 0.1, 0.25, 1)', // CSS ease
  };

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  function play(targets, params, { keep = false } = {}) {
    const done = params.onComplete;
    return anime.animate(targets, {
      ...params,
      onComplete: (self) => {
        if (!keep) anime.cleanInlineStyles(self);
        if (done) done(self);
      },
    });
  }

  function pulse(el, scale = 1.2, duration = 300, ease = EASE.out) {
    if (!el) return null;
    return play(el, { keyframes: [{ scale }, { scale: 1 }], duration, ease });
  }

  function squash(el, duration = 360) {
    if (!el) return null;
    return play(el, { keyframes: { '0%': { scale: 1 }, '33%': { scale: 0.86 }, '66%': { scale: 1.06 }, '100%': { scale: 1 } }, duration, ease: EASE.out });
  }

  // бесконечный цикл; останавливается и чистит стили, когда элемент убран
  function loop(el, params) {
    if (!el || reduce) return null;
    const userUpdate = params.onUpdate;
    const anim = anime.animate(el, {
      loop: true,
      ...params,
      onUpdate: (self) => {
        if (!el.isConnected) {
          self.cancel();
          return;
        }
        if (userUpdate) userUpdate(self);
      },
    });
    return anim;
  }

  return { EASE, play, pulse, squash, loop, wait, reduce };
})();
