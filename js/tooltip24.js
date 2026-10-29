// Общий тултип версии 2 — как подсказка у таймера в ивенте (Figma 16671:1223):
// белый пузырь 15/18 #333, скругление 8, хвостик 24×8 смотрит на элемент.
//   Tooltip24.show(anchor, { text, title, timeout, action });  Tooltip24.hide();
// action: { label, onClick } — жёлтая кнопка со стрелкой вправо (переход в
// другой раздел); по нажатию тултип закрывается и вызывается onClick.
// Встаёт под элементом (если снизу нет места — над ним; above: true — сначала
// над элементом), не вылезает за края экрана. Повторный тап по тому же элементу, тап мимо или прокрутка — прячут.

const Tooltip24 = (() => {
  let tip = null;
  let anchor = null;
  let timer = null;

  function hide() {
    clearTimeout(timer);
    if (!tip) return;
    const old = tip;
    old.classList.remove('is-visible');
    setTimeout(() => old.remove(), 200);
    tip = null;
    anchor = null;
  }

  const ARROW = '<svg width="8" height="14" viewBox="0 0 8 14" fill="none" aria-hidden="true"><path d="M1.5 1.5 6.5 7l-5 5.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function show(el, { text = '', title = '', timeout = 0, width = 233, action = null, above = false } = {}) {
    if (anchor === el) { hide(); return; }
    hide();
    const host = el.closest('.v2-app') || document.body;
    tip = document.createElement('div');
    tip.className = 'tip24';
    tip.setAttribute('role', 'tooltip');
    tip.innerHTML = `${title ? `<b>${title}</b>` : ''}<span>${text}</span>${action ? `<button class="tip24-btn" type="button">${action.label}${ARROW}</button>` : ''}`;
    if (action) {
      tip.querySelector('.tip24-btn').addEventListener('click', () => {
        hide();
        action.onClick();
      });
    }
    host.appendChild(tip);
    const h = host.getBoundingClientRect();
    const a = el.getBoundingClientRect();
    tip.style.width = `${Math.min(width, h.width - 32)}px`;
    const cx = a.left + a.width / 2 - h.left;
    const left = Math.min(Math.max(cx - tip.offsetWidth / 2, 16), h.width - 16 - tip.offsetWidth);
    const gap = 12;
    const fitsBelow = a.bottom - h.top + gap + tip.offsetHeight + 16 <= h.height;
    const fitsAbove = a.top - h.top - gap - tip.offsetHeight >= 16;
    const below = above ? !fitsAbove : fitsBelow;
    const top = below ? a.bottom - h.top + gap : a.top - h.top - gap - tip.offsetHeight;
    tip.classList.toggle('is-above', !below);
    tip.style.left = `${left}px`;
    tip.style.top = `${top}px`;
    tip.style.setProperty('--tail', `${Math.min(Math.max(cx - left, 20), tip.offsetWidth - 20)}px`);
    anchor = el;
    requestAnimationFrame(() => tip && tip.classList.add('is-visible'));
    if (timeout) timer = setTimeout(hide, timeout);
  }

  document.addEventListener('pointerdown', (e) => {
    if (tip && !tip.contains(e.target) && !(anchor && anchor.contains(e.target))) hide();
  }, true);
  document.addEventListener('scroll', () => hide(), true);
  document.addEventListener('v2:screen', hide);

  return { show, hide };
})();
