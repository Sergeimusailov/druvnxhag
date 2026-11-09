// Шторки (bottom sheet) — одно поведение для всех: плавно выезжают снизу,
// закрываются смахиванием вниз, тапом по фону или кнопкой.
//   const sheet = bottomSheet(sheetEl, backdropEl, { onClose });
//   sheet.open(); sheet.close();
// Шапка (заголовок, описание) закреплена, листается только список .bs-scroll.
// Смахнуть шторку можно за шапку, а за список — когда он прокручен в самый верх.
//
// Движение — anime.js (js/anim24.js): sheetShow / sheetHide — выезд снизу и
// уезд вниз по оси y в пикселях (от высоты шторки), фон — opacity. Пока палец
// тянет шторку, её y ставится напрямую (anime.set), и при отпускании она
// уезжает или возвращается ровно с этого места.
//   .bs       — 450 (фон 350), кривая ios
//   .v2-sheet — 420 (фон 300), кривая ios

const sheetY = new WeakMap(); // текущий сдвиг шторки вниз, px (во время перетаскивания)

function sheetTiming(sheetEl) {
  return sheetEl.classList.contains('v2-sheet') ? [420, 300] : [450, 350];
}

function sheetShow(sheetEl, backdropEl) {
  const [ms, backMs] = sheetTiming(sheetEl);
  anime.remove(sheetEl);
  const from = sheetY.has(sheetEl) ? sheetY.get(sheetEl) : sheetEl.offsetHeight * 1.05;
  sheetY.delete(sheetEl);
  sheetEl.classList.add('is-open');
  A24.play(sheetEl, { y: [from, 0], duration: ms, ease: A24.EASE.ios });
  if (backdropEl) {
    anime.remove(backdropEl);
    backdropEl.classList.add('is-open');
    A24.play(backdropEl, { opacity: [0, 1], duration: backMs, ease: A24.EASE.ease });
  }
}

function sheetHide(sheetEl, backdropEl) {
  const [ms, backMs] = sheetTiming(sheetEl);
  anime.remove(sheetEl);
  const from = sheetY.has(sheetEl) ? sheetY.get(sheetEl) : 0;
  sheetY.delete(sheetEl);
  anime.animate(sheetEl, {
    y: [from, sheetEl.offsetHeight * 1.05],
    duration: ms,
    ease: A24.EASE.ios,
    onComplete: () => {
      sheetEl.classList.remove('is-open');
      A24.clear(sheetEl, { y: 0 });
    },
  });
  if (backdropEl) {
    anime.remove(backdropEl);
    anime.animate(backdropEl, {
      opacity: [1, 0],
      duration: backMs,
      ease: A24.EASE.ease,
      onComplete: () => {
        backdropEl.classList.remove('is-open');
        A24.clear(backdropEl, { opacity: 0 });
      },
    });
  }
}

function attachSheetSwipe(sheetEl, close) {
  let startY = null;
  let dy = 0;
  let t0 = 0;

  const begin = (y) => {
    startY = y;
    dy = 0;
    t0 = performance.now();
    sheetEl.classList.add('is-dragging');
  };
  const move = (y) => {
    dy = Math.max(0, y - startY);
    anime.remove(sheetEl);
    anime.set(sheetEl, { y: dy });
    sheetY.set(sheetEl, dy);
  };
  const end = () => {
    if (startY === null) return;
    startY = null;
    sheetEl.classList.remove('is-dragging');
    const fast = dy > 40 && dy / Math.max(1, performance.now() - t0) > 0.6;
    if (dy > sheetEl.offsetHeight * 0.25 || fast) close();
    else {
      // не дотянули — шторка возвращается на место
      sheetY.delete(sheetEl);
      A24.play(sheetEl, { y: [dy, 0], duration: sheetTiming(sheetEl)[0], ease: A24.EASE.ios });
    }
  };

  // шапка шторки (всё, кроме прокручиваемого списка) — тянем пальцем или мышью
  sheetEl.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    if (e.target.closest('button, a, input, label, .bs-scroll')) return;
    begin(e.clientY);
    sheetEl.setPointerCapture(e.pointerId);
  });
  sheetEl.addEventListener('pointermove', (e) => {
    if (startY !== null && !scrollDrag) move(e.clientY);
  });
  sheetEl.addEventListener('pointerup', () => { if (!scrollDrag) end(); });
  sheetEl.addEventListener('pointercancel', () => { if (!scrollDrag) end(); });

  // список (.bs-scroll) листается сам; если он в самом верху и палец тянет
  // вниз — вместо прокрутки едет вся шторка (как в iOS)
  // жест, начатый в прокрученном списке, только листает — шторку не тянет
  let scrollDrag = false;
  let touchY0 = 0;
  let atTop = false;
  sheetEl.querySelectorAll('.bs-scroll').forEach((sc) => {
    sc.addEventListener('touchstart', (e) => {
      touchY0 = e.touches[0].clientY;
      atTop = sc.scrollTop <= 0;
      scrollDrag = false;
    }, { passive: true });
    sc.addEventListener('touchmove', (e) => {
      const y = e.touches[0].clientY;
      if (!scrollDrag) {
        if (!atTop || sc.scrollTop > 0 || y - touchY0 < 6) return;
        scrollDrag = true;
        begin(touchY0);
      }
      e.preventDefault();
      move(y);
    }, { passive: false });
    const stop = () => {
      if (!scrollDrag) return;
      scrollDrag = false;
      end();
    };
    sc.addEventListener('touchend', stop);
    sc.addEventListener('touchcancel', stop);
  });
}

function bottomSheet(sheetEl, backdropEl, opts = {}) {
  let shown = false;
  function open() {
    shown = true;
    sheetEl.setAttribute('aria-hidden', 'false');
    sheetShow(sheetEl, backdropEl);
  }
  function close() {
    if (!shown) return;
    shown = false;
    sheetEl.setAttribute('aria-hidden', 'true');
    sheetHide(sheetEl, backdropEl);
    if (opts.onClose) opts.onClose();
  }
  attachSheetSwipe(sheetEl, close);
  if (backdropEl) backdropEl.addEventListener('click', close);
  sheetEl.querySelectorAll('[data-sheet-close]').forEach((b) => b.addEventListener('click', close));
  return { open, close, el: sheetEl };
}
