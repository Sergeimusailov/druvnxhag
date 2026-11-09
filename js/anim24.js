// Общие анимации версии 2 на anime.js v4 (js/vendor/anime.umd.min.js).
// Все анимации интерфейса идут через anime.animate / anime.createTimeline;
// здесь — общие кривые, длительности и маленькие помощники, чтобы код
// экранов был коротким и одинаковым. Спецификация — docs/animations-v2.md.
//
//   A24.play(targets, params, { keep })   — одноразовая анимация; по окончании
//        инлайн-стили, которые она поставила, убираются (иначе инлайн-transform
//        перебьёт CSS: нажатия :active, позиционирование). keep: true — оставить
//        конечное состояние (например, элемент должен остаться скрытым).
//   A24.clear(targets, params)             — убрать инлайн-значения анимированных свойств
//   A24.pulse(el, scale, duration, ease)  — «пульс»: scale 1 → s → 1
//   A24.squash(el)                         — нажатие с отдачей: 1 → 0.86 → 1.06 → 1
//   A24.popIn(el, peak, duration, delay)  — «впрыгивание» бейджа: 0 → peak → 1
//   A24.reveal(el, cls, on, hidden, visible, duration, ease) — показать / скрыть
//        элемент с CSS-классом видимого состояния (тост, панель, оверлей)
//   A24.loop(el, params)                   — бесконечная анимация (покачивание,
//        свечение); сама останавливается, когда элемент убран со страницы;
//        при «уменьшении движения» не запускается
//   A24.arc(from, pop, ctrl, to, opts)    — ключевые кадры полёта по дуге в цель
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

  // убрать инлайн-значения свойств, которые анимировались. Не используем
  // anime.cleanInlineStyles: он возвращает стили, что были ДО анимации
  // (например, стартовое состояние из anime.set), а нам нужно отдать
  // элемент CSS-классам
  const TRANSFORMS = new Set(['x', 'y', 'z', 'translateX', 'translateY', 'translateZ', 'rotate', 'rotateX', 'rotateY', 'rotateZ', 'scale', 'scaleX', 'scaleY', 'scaleZ', 'skew', 'skewX', 'skewY', 'perspective']);
  const NOT_PROPS = new Set(['duration', 'delay', 'ease', 'loop', 'loopDelay', 'alternate', 'reversed', 'autoplay', 'playbackRate', 'frameRate', 'composition', 'modifier', 'keyframes', 'onBegin', 'onUpdate', 'onRender', 'onLoop', 'onPause', 'onComplete']);
  function propsOf(params) {
    const keys = new Set();
    const add = (o) => Object.keys(o).forEach((k) => { if (!NOT_PROPS.has(k)) keys.add(k); });
    add(params);
    if (params.keyframes) (Array.isArray(params.keyframes) ? params.keyframes : Object.values(params.keyframes)).forEach(add);
    return keys;
  }
  function clear(targets, params) {
    const els = targets instanceof Element ? [targets] : Array.from(targets || []);
    const keys = propsOf(params);
    els.forEach((el) => {
      let transform = false;
      keys.forEach((k) => {
        if (TRANSFORMS.has(k)) transform = true;
        else el.style.removeProperty(k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`));
      });
      if (transform) el.style.removeProperty('transform');
    });
  }

  function play(targets, params, { keep = false } = {}) {
    const done = params.onComplete;
    return anime.animate(targets, {
      ...params,
      onComplete: (self) => {
        if (!keep) clear(targets, params);
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

  // ключевые кадры полёта «в цель»: иконка выпрыгивает из from в pop (к доле
  // времени popAt), затем по квадратичной кривой Безье через ctrl летит в to
  // с ускорением (t²), уменьшаясь до scaleTo; spin — поворот, гаснущий к цели.
  // Координаты — x / y в пикселях (элемент стоит в 0,0 своего слоя)
  function arc(from, pop, ctrl, to, { popAt = 0.22, scaleFrom = 0.4, scalePop = 1.15, scaleTo = 0.5, spin = 0, steps = 12 } = {}) {
    const pct = (v) => `${(v * 100).toFixed(2)}%`;
    const frames = {
      '0%': { x: from.x, y: from.y, scale: scaleFrom, rotate: 0, opacity: 0 },
      [pct(popAt)]: { x: pop.x, y: pop.y, scale: scalePop, rotate: spin, opacity: 1 },
    };
    for (let k = 1; k <= steps; k++) {
      const t = (k / steps) ** 2;
      frames[pct(popAt + (1 - popAt) * (k / steps))] = {
        x: (1 - t) ** 2 * pop.x + 2 * (1 - t) * t * ctrl.x + t * t * to.x,
        y: (1 - t) ** 2 * pop.y + 2 * (1 - t) * t * ctrl.y + t * t * to.y,
        scale: scalePop - (scalePop - scaleTo) * t,
        rotate: spin * (1 - t),
        opacity: 1,
      };
    }
    return frames;
  }

  // «впрыгивание» бейджа или точки: scale 0 → peak → 1 (до старта — scale 0)
  function popIn(el, peak = 1.5, duration = 420, delay = 0) {
    if (!el) return null;
    anime.set(el, { scale: 0 });
    return play(el, { keyframes: [{ scale: [0, peak] }, { scale: 1 }], duration, delay, ease: EASE.out });
  }

  // показать / скрыть элемент, у которого видимое состояние задаёт CSS-класс
  // cls: при показе класс ставится сразу и анимация идёт hidden → visible;
  // при скрытии — visible → hidden, класс снимается в конце. Инлайн-стили
  // после анимации убираются — дальше состояние держит CSS
  function reveal(el, cls, on, hidden, visible, duration = 250, ease = EASE.ease) {
    if (!el) return null;
    const isOn = el.classList.contains(cls) && !el.dataset.a24Hiding;
    if (on === isOn) return null;
    anime.remove(el);
    const from = on ? hidden : visible;
    const to = on ? visible : hidden;
    const params = {};
    Object.keys(to).forEach((k) => { params[k] = [from[k], to[k]]; });
    if (on) {
      delete el.dataset.a24Hiding;
      el.classList.add(cls);
    } else {
      el.dataset.a24Hiding = '1';
    }
    return anime.animate(el, {
      ...params,
      duration,
      ease,
      onComplete: (self) => {
        if (!on) {
          el.classList.remove(cls);
          delete el.dataset.a24Hiding;
        }
        clear(el, params);
      },
    });
  }

  return { EASE, play, clear, pulse, squash, popIn, reveal, loop, wait, reduce, arc };
})();
