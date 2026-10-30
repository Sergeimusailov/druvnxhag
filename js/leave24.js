// Подтверждение выхода из поиска соперника и из матча (по смыслу, макета нет):
// по «‹» у кнопки всплывает стеклянное меню в духе контекстного меню iOS 26 —
// раскрывается из кнопки, сверху «Выйти из матча?» и пояснение, что без наград,
// ниже пункты «Остаться» и «Выйти» (красный). Тап мимо или «Остаться» —
// меню схлопывается обратно в кнопку. После конца матча «‹» уходит без вопроса.
//   LEAVE24.confirm(anchorEl, href)
// Подключается в match.html до matchmaking24.js и match.js (версии 2 и 3).

const LEAVE24 = (() => {
  const EXIT_SVG = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M10 4H6.5A2.5 2.5 0 0 0 4 6.5v11A2.5 2.5 0 0 0 6.5 20H10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M15 8l4 4-4 4M19 12H9.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const STAY_SVG = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  let open = null;

  function close() {
    if (!open) return;
    const { menu, veil } = open;
    open = null;
    menu.classList.remove('is-open');
    veil.classList.remove('is-open');
    setTimeout(() => { menu.remove(); veil.remove(); }, 260);
  }

  function confirm(anchor, href) {
    if (open) { close(); return; }
    const veil = document.createElement('div');
    veil.className = 'lv24-veil';
    const menu = document.createElement('div');
    menu.className = 'lv24-menu';
    menu.setAttribute('role', 'dialog');
    menu.setAttribute('aria-label', 'Выйти из матча?');
    menu.innerHTML = `
      <div class="lv24-head">
        <b>Выйти из матча?</b>
        <span>Если выйдете сейчас, останетесь без наград за матч</span>
      </div>
      <button class="lv24-item" type="button" data-lv="stay"><span>Остаться</span>${STAY_SVG}</button>
      <button class="lv24-item is-danger" type="button" data-lv="leave"><span>Выйти</span>${EXIT_SVG}</button>`;
    document.body.append(veil, menu);

    // меню встаёт под кнопкой, от её левого края, и раскрывается из неё
    const a = anchor.getBoundingClientRect();
    const left = Math.max(12, Math.min(a.left, window.innerWidth - menu.offsetWidth - 12));
    menu.style.left = `${left}px`;
    menu.style.top = `${a.bottom + 10}px`;
    menu.style.transformOrigin = `${a.left + a.width / 2 - left}px -10px`;

    veil.addEventListener('click', close);
    menu.addEventListener('click', (e) => {
      const item = e.target.closest('[data-lv]');
      if (!item) return;
      if (item.dataset.lv === 'leave') location.href = href;
      else close();
    });
    open = { menu, veil };
    requestAnimationFrame(() => {
      menu.classList.add('is-open');
      veil.classList.add('is-open');
    });
  }

  // «‹» в шапке матча: пока партия идёт — спрашиваем; после конца — сразу выходим
  document.addEventListener('click', (e) => {
    const back = e.target.closest('.match-topbar .back-btn');
    if (!back) return;
    if (typeof state !== 'undefined' && state.gameOver) return;
    e.preventDefault();
    confirm(back, back.href);
  }, true);

  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

  return { confirm, close, isOpen: () => !!open };
})();
