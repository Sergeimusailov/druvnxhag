// Матч в версии 2: тот же облик, что в профиле — аватар, рамка и рубашка
// колоды из настроек профиля (js/cosmetics24.js). Колода — квадратная
// рубашка без счётчика. Шапка как на остальных экранах: «‹», «Матч / чей ход»,
// «?» со шторкой ответов на вопросы. Фон — общий фон приложения.
// Подключается до js/match.js; в версии 3 ничего не делает.

const MATCH24 = (() => {
  if (document.documentElement.dataset.app === '3') return undefined;
  const get = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const PHOTO = 'assets/v2-avatar-photo.svg';
  const avatar = get('v2.profileAvatar') || PHOTO;
  const frame = get('v2.profileFrame') || 'white';
  const back = COSMETICS24.back(get('v2.profileBack') || 'classic').id;
  // соперник — стандартный облик
  const OPP = { back: 'classic' };

  return {
    avatar, frame, back,
    backHTML: (owner) => COSMETICS24.backHTML(owner === 'you' ? back : OPP.back),
  };
})();

if (MATCH24) {
  document.documentElement.classList.add('m24');

  // шапка: «‹» на главную, «Матч» и чей ход, «?»
  const bar = document.querySelector('.match-topbar');
  const backBtn = bar.querySelector('.back-btn');
  backBtn.href = 'v2.html';
  backBtn.className = 'm24-btn back-btn';
  backBtn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 12C5.01082 11.635 5.14061 11.3237 5.43265 11.0446L13.8692 2.85424C14.0964 2.61808 14.3992 2.5 14.7453 2.5C15.4484 2.5 16 3.03672 16 3.73446C16 4.07797 15.8594 4.38927 15.6214 4.63616L8.0177 12L15.6214 19.3638C15.8594 19.6 16 19.9113 16 20.2548C16 20.9633 15.4484 21.5 14.7453 21.5C14.3992 21.5 14.0964 21.3819 13.8692 21.1458L5.43265 12.9554C5.14061 12.6763 5 12.365 5 12Z" fill="currentColor"/></svg>`;
  const help = document.getElementById('infoBtn');
  help.className = 'm24-btn info-btn';
  help.setAttribute('aria-label', 'Ответы на вопросы');
  help.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M5.33936 7.72565C5.54822 4.35296 8.44774 1.68005 11.994 1.68005C15.6759 1.68005 18.6606 4.56139 18.6606 8.11569C18.6606 11.3385 16.2067 14.008 13.0042 14.4779L13 16.5001H9L9.00421 13.5762C9.00421 11.9607 10.3205 10.651 11.994 10.6509C13.4445 10.6509 14.6203 9.51568 14.6203 8.1155C14.6203 6.71532 13.4445 5.58025 11.994 5.58025C10.6809 5.58025 9.59288 6.51055 9.39862 7.72565H5.33936ZM11.5859 22.5001H9L9.00421 19.8653C9.00421 19.1113 9.59694 18.5001 10.3779 18.5001H13.0042L13 21.135C13 21.8889 12.3669 22.5001 11.5859 22.5001Z" fill="currentColor"/></svg>`;

  // игрок: аватар и рамка из профиля, колода — рубашка из профиля
  const you = document.querySelector('.player-you');
  const youImg = you.querySelector('.avatar-you');
  youImg.src = MATCH24.avatar;
  const youFrame = document.createElement('span');
  youFrame.className = 'm24-frame';
  youImg.replaceWith(youFrame);
  youFrame.appendChild(youImg);
  COSMETICS24.applyFrame(youFrame, MATCH24.frame);
  you.querySelector('.player-name').textContent = 'Александр К.';

  // соперник: красная рамка (цвет его карт на поле), стандартная рубашка
  const oppImg = document.querySelector('.avatar-opp');
  const oppFrame = document.createElement('span');
  oppFrame.className = 'm24-frame';
  oppImg.replaceWith(oppFrame);
  oppFrame.appendChild(oppImg);
  oppFrame.style.setProperty('--pf-frame', '#e32d2d');

  document.getElementById('deckYou').innerHTML = MATCH24.backHTML('you');
  document.getElementById('deckOpp').innerHTML = MATCH24.backHTML('opp');

  // «?» — шторка ответов на вопросы о матче
  const main = document.querySelector('.match');
  main.insertAdjacentHTML('beforeend', `
    <div class="bs-backdrop" id="m24Backdrop"></div>
    <section class="bs bs-tall" id="m24Faq" aria-hidden="true" role="dialog" aria-label="Ответы на вопросы">
      <div class="bs-grab"><span></span></div>
      <div class="bs-scroll bs-scroll-all">
        <h2 class="bs-title">Ответы на вопросы</h2>
        <div class="bs-faq bs-scroll-body" id="m24FaqList"></div>
      </div>
    </section>`);
  const FAQ = [
    ['Как ходить?', 'Перетащите карту из руки на свободную клетку поля. Ходите по очереди с соперником, по одной карте за ход.'],
    ['Как захватить карту соперника?', 'Числа по сторонам карты — её сила. Если ваша сторона сильнее соседней стороны карты соперника, его карта переходит к вам.'],
    ['Кто побеждает?', 'Когда все 9 клеток заняты, побеждает тот, у кого больше карт на поле. Счёт — над полем.'],
    ['Сколько времени на ход?', 'Таймер в центре показывает время хода. Не успели — ход переходит сопернику.'],
    ['Что за карты рядом с аватарками?', 'Это колоды игроков. На вашей — рубашка, которую вы выбрали в профиле.'],
    ['Как поменять аватар, рамку и рубашку?', 'В профиле: «Настроить» → «Аватарки», «Рамки» или «Рубашка колоды». Выбор сразу появится в матче.'],
  ];
  const chev = '<svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M1.5 1.5 6.5 7l-5 5.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const list = document.getElementById('m24FaqList');
  list.innerHTML = FAQ.map(([q, a]) => `<div class="bs-faq-item"><button class="bs-faq-q"><span>${q}</span>${chev}</button><p class="bs-faq-a">${a}</p></div>`).join('');
  list.addEventListener('click', (e) => {
    const q = e.target.closest('.bs-faq-q');
    if (q) q.parentElement.classList.toggle('is-open');
  });
  const faq = bottomSheet(document.getElementById('m24Faq'), document.getElementById('m24Backdrop'));
  help.addEventListener('click', () => {
    list.parentElement.scrollTop = 0;
    faq.open();
  });
}
