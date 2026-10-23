// Шторки (bottom sheet) — одно поведение для всех: плавно выезжают снизу,
// закрываются смахиванием вниз, тапом по фону или кнопкой.
//   const sheet = bottomSheet(sheetEl, backdropEl, { onClose });
//   sheet.open(); sheet.close();
// Смахивание работает за любое место шторки, кроме прокручиваемой области
// (.bs-scroll), если она не прокручена в самый верх.

function attachSheetSwipe(sheetEl, close) {
  let startY = null;
  let dy = 0;
  let t0 = 0;

  sheetEl.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    if (e.target.closest('button, a, input, label')) return;
    const scroller = e.target.closest('.bs-scroll');
    if (scroller && scroller.scrollTop > 0) return;
    startY = e.clientY;
    dy = 0;
    t0 = performance.now();
    sheetEl.classList.add('is-dragging');
    sheetEl.setPointerCapture(e.pointerId);
  });

  sheetEl.addEventListener('pointermove', (e) => {
    if (startY === null) return;
    dy = Math.max(0, e.clientY - startY);
    sheetEl.style.transform = `translateY(${dy}px)`;
  });

  const end = () => {
    if (startY === null) return;
    startY = null;
    sheetEl.classList.remove('is-dragging');
    const fast = dy > 40 && dy / Math.max(1, performance.now() - t0) > 0.6;
    if (dy > sheetEl.offsetHeight * 0.25 || fast) close();
    else sheetEl.style.transform = '';
  };
  sheetEl.addEventListener('pointerup', end);
  sheetEl.addEventListener('pointercancel', end);
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
