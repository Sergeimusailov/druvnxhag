// Общий тултип версии 2 — как подсказка у таймера в ивенте (Figma 16671:1223):
// белый пузырь 15/18 #333, скругление 8, хвостик 24×8 смотрит на элемент.
//   Tooltip24.show(anchor, { text, title, timeout });  Tooltip24.hide();
// Встаёт под элементом (если снизу нет места — над ним), не вылезает за края
// экрана. Повторный тап по тому же элементу, тап мимо или прокрутка — прячут.

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

  function show(el, { text = '', title = '', timeout = 0, width = 233 } = {}) {
    if (anchor === el) { hide(); return; }
    hide();
    const host = el.closest('.v2-app') || document.body;
    tip = document.createElement('div');
    tip.className = 'tip24';
    tip.setAttribute('role', 'tooltip');
    tip.innerHTML = `${title ? `<b>${title}</b>` : ''}<span>${text}</span>`;
    host.appendChild(tip);
    const h = host.getBoundingClientRect();
    const a = el.getBoundingClientRect();
    tip.style.width = `${Math.min(width, h.width - 32)}px`;
    const cx = a.left + a.width / 2 - h.left;
    const left = Math.min(Math.max(cx - tip.offsetWidth / 2, 16), h.width - 16 - tip.offsetWidth);
    const gap = 12;
    const fitsBelow = a.bottom - h.top + gap + tip.offsetHeight + 16 <= h.height;
    const top = fitsBelow ? a.bottom - h.top + gap : a.top - h.top - gap - tip.offsetHeight;
    tip.classList.toggle('is-above', !fitsBelow);
    tip.style.left = `${left}px`;
    tip.style.top = `${top}px`;
    tip.style.setProperty('--tail', `${Math.min(Math.max(cx - left, 20), tip.offsetWidth - 20)}px`);
    anchor = el;
    requestAnimationFrame(() => tip && tip.classList.add('is-visible'));
    if (timeout) timer = setTimeout(hide, timeout);
  }

  document.addEventListener('pointerdown', (e) => {
    if (tip && !(anchor && anchor.contains(e.target))) hide();
  }, true);
  document.addEventListener('scroll', () => hide(), true);
  document.addEventListener('v2:screen', hide);

  return { show, hide };
})();
