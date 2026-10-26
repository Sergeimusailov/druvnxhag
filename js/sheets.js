// Шторки (bottom sheet) — одно поведение для всех: плавно выезжают снизу,
// закрываются смахиванием вниз, тапом по фону или кнопкой.
//   const sheet = bottomSheet(sheetEl, backdropEl, { onClose });
//   sheet.open(); sheet.close();
// Шапка (заголовок, описание) закреплена, листается только список .bs-scroll.
// Смахнуть шторку можно за шапку, а за список — когда он прокручен в самый верх.

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
    sheetEl.style.transform = `translateY(${dy}px)`;
  };
  const end = () => {
    if (startY === null) return;
    startY = null;
    sheetEl.classList.remove('is-dragging');
    const fast = dy > 40 && dy / Math.max(1, performance.now() - t0) > 0.6;
    if (dy > sheetEl.offsetHeight * 0.25 || fast) close();
    else sheetEl.style.transform = '';
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
  function open() {
    sheetEl.style.transform = '';
    sheetEl.classList.add('is-open');
    sheetEl.setAttribute('aria-hidden', 'false');
    if (backdropEl) backdropEl.classList.add('is-open');
  }
  function close() {
    if (!sheetEl.classList.contains('is-open')) return;
    sheetEl.style.transform = '';
    sheetEl.classList.remove('is-open');
    sheetEl.setAttribute('aria-hidden', 'true');
    if (backdropEl) backdropEl.classList.remove('is-open');
    if (opts.onClose) opts.onClose();
  }
  attachSheetSwipe(sheetEl, close);
  if (backdropEl) backdropEl.addEventListener('click', close);
  sheetEl.querySelectorAll('[data-sheet-close]').forEach((b) => b.addEventListener('click', close));
  return { open, close, el: sheetEl };
}
