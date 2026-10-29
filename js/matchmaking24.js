// Поиск соперника перед матчем (по смыслу, как в Marvel Snap; макета нет).
// «Найти матч» на главной ведёт на match.html — сначала поверх поля экран
// поиска: шапка как в матче («‹», по центру статус, «?»), мой профиль в
// левом нижнем углу (аватар, рамка, статус и рубашка колоды из профиля), в правом верхнем — радар поиска с перебором аватарок.
// Через 2–3 с соперник «найден»: радар гаснет, карточка соперника плавно
// въезжает справа налево, VS ударяет со вспышкой и искрами, «Соперник
// найден!», затем «Начало матча» — экран растворяется и стартует обычный матч.
// match.js ждёт window.MATCH_GATE и только потом вызывает initGame().
// Подключается после cosmetics24.js и match24.js, до match.js. Работает в
// версиях 2 и 3; ?nosearch — сразу в матч (для проверок).

window.MATCH_GATE = (() => {
  if (/[?&]nosearch\b/.test(location.search)) return null;
  const isV3 = document.documentElement.dataset.app === '3';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const get = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const avatar = get('v2.profileAvatar') || 'assets/v2-avatar-photo.svg';
  const frame = get('v2.profileFrame') || 'white';
  const back = get('v2.profileBack') || 'classic';
  const status = get(isV3 ? 'v3.profileStatus' : 'v2.profileStatus') || get('v2.profileStatus') || 'Т-Ранжира';
  const C = typeof COSMETICS24 !== 'undefined' ? COSMETICS24 : null;

  const BACK_SVG = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 12C5.01082 11.635 5.14061 11.3237 5.43265 11.0446L13.8692 2.85424C14.0964 2.61808 14.3992 2.5 14.7453 2.5C15.4484 2.5 16 3.03672 16 3.73446C16 4.07797 15.8594 4.38927 15.6214 4.63616L8.0177 12L15.6214 19.3638C15.8594 19.6 16 19.9113 16 20.2548C16 20.9633 15.4484 21.5 14.7453 21.5C14.3992 21.5 14.0964 21.3819 13.8692 21.1458L5.43265 12.9554C5.14061 12.6763 5 12.365 5 12Z" fill="currentColor"/></svg>';
  const HELP_SVG = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M5.33936 7.72565C5.54822 4.35296 8.44774 1.68005 11.994 1.68005C15.6759 1.68005 18.6606 4.56139 18.6606 8.11569C18.6606 11.3385 16.2067 14.008 13.0042 14.4779L13 16.5001H9L9.00421 13.5762C9.00421 11.9607 10.3205 10.651 11.994 10.6509C13.4445 10.6509 14.6203 9.51568 14.6203 8.1155C14.6203 6.71532 13.4445 5.58025 11.994 5.58025C10.6809 5.58025 9.59288 6.51055 9.39862 7.72565H5.33936ZM11.5859 22.5001H9L9.00421 19.8653C9.00421 19.1113 9.59694 18.5001 10.3779 18.5001H13.0042L13 21.135C13 21.8889 12.3669 22.5001 11.5859 22.5001Z" fill="currentColor"/></svg>';

  // колода игрока — три рубашки веером (рубашка из профиля / стандартная)
  const deckHTML = (id) => (C ? `<span class="mm24-deck">${C.backHTML(id).repeat(3)}</span>` : '');

  const profileHTML = (who, img, name, sub, deckId) => `
    <div class="mm24-card mm24-${who}">
      <span class="m24-frame mm24-frame"><img class="avatar" src="${img}" alt=""></span>
      <div class="mm24-info">
        <b class="mm24-name">${name}</b>
        <span class="mm24-sub">${sub}</span>
        ${deckHTML(deckId)}
      </div>
    </div>`;

  const SEARCH_AVAS = Array.from({ length: 16 }, (_, i) => `assets/avatars-sq/sq-${String(i + 1).padStart(2, '0')}.png`);

  const root = document.createElement('div');
  root.className = 'mm24';
  root.id = 'mm24';
  root.innerHTML = `
    <div class="mm24-bg" aria-hidden="true"><span class="mm24-glow is-you"></span><span class="mm24-glow is-opp"></span></div>
    <div class="mm24-bar">
      <a class="m24-btn mm24-back" href="${isV3 ? 'v2.html?app=3' : 'v2.html'}" aria-label="Отменить поиск">${BACK_SVG}</a>
      <div class="mm24-title">
        <div class="mm24-title-text" id="mm24Title">Поиск соперника</div>
        <div class="mm24-status" id="mm24Status">0:00</div>
      </div>
      <button class="m24-btn mm24-help" id="mm24Help" aria-label="Ответы на вопросы"${isV3 ? ' hidden' : ''}>${HELP_SVG}</button>
    </div>
    <div class="mm24-stage">
      <div class="mm24-slot">
        <div class="mm24-radar" aria-hidden="true">
          <span class="mm24-ring"></span><span class="mm24-ring"></span><span class="mm24-ring"></span>
          <span class="mm24-sweep"></span>
          <span class="mm24-scan"><img id="mm24Scan" src="${SEARCH_AVAS[0]}" alt=""><span>?</span></span>
        </div>
        <div class="mm24-searching">Ищем соперника<span class="mm24-dots"><i>.</i><i>.</i><i>.</i></span></div>
        ${profileHTML('opp', 'assets/Ava01.png', 'Константин К.', 'Делай, как надо', 'classic')}
      </div>
      <div class="mm24-center">
        <div class="mm24-vs" aria-hidden="true">VS</div>
        <div class="mm24-msg" id="mm24Msg" role="status"></div>
      </div>
      ${profileHTML('you', avatar, 'Александр К.', status, back)}
    </div>`;
  document.body.appendChild(root);
  document.documentElement.classList.add('mm24-on');

  if (C) {
    C.applyFrame(root.querySelector('.mm24-you .mm24-frame'), frame);
    root.querySelector('.mm24-opp .mm24-frame').style.setProperty('--pf-frame', '#e32d2d');
  }

  // «?» — та же шторка ответов на вопросы, что в матче (версия 2)
  root.querySelector('#mm24Help').addEventListener('click', () => {
    const faq = document.getElementById('infoBtn');
    if (faq) faq.click();
  });

  const titleEl = root.querySelector('#mm24Title');
  const statusEl = root.querySelector('#mm24Status');
  const msgEl = root.querySelector('#mm24Msg');
  const scanImg = root.querySelector('#mm24Scan');
  const wait = (ms) => new Promise((r) => setTimeout(r, reduce ? Math.min(ms, 300) : ms));

  function setTitle(title, status) {
    titleEl.textContent = title;
    statusEl.textContent = status;
    titleEl.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: 'ease-out' });
  }

  function showMsg(text, cls) {
    msgEl.className = `mm24-msg ${cls}`;
    msgEl.textContent = text;
    msgEl.animate([
      { opacity: 0, transform: 'scale(0.6)' },
      { opacity: 1, transform: 'scale(1.12)', offset: 0.6 },
      { opacity: 1, transform: 'scale(1)' },
    ], { duration: 420, easing: 'cubic-bezier(0.3, 1.4, 0.5, 1)' });
  }

  // искры из центра при «Соперник найден»
  function burst() {
    const c = root.querySelector('.mm24-center');
    const colors = ['#ffdd2d', '#fff', '#ff5c5c', '#6fa8ff'];
    for (let i = 0; i < 18; i++) {
      const s = document.createElement('span');
      s.className = 'mm24-spark';
      s.style.background = colors[i % colors.length];
      c.appendChild(s);
      const a = (Math.PI * 2 * i) / 18 + Math.random() * 0.3;
      const d = 70 + Math.random() * 70;
      s.animate([
        { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
        { transform: `translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d}px)) scale(0.2)`, opacity: 0 },
      ], { duration: 700 + Math.random() * 300, easing: 'cubic-bezier(0.2, 0.7, 0.3, 1)' }).finished.then(() => s.remove());
    }
  }

  let start;
  const gate = new Promise((r) => { start = r; });
  (async () => {
    // таймер поиска и перебор аватарок в радаре
    const t0 = performance.now();
    const clock = setInterval(() => {
      const s = Math.floor((performance.now() - t0) / 1000);
      statusEl.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    }, 250);
    let k = 0;
    const shuffle = setInterval(() => { scanImg.src = SEARCH_AVAS[(k = (k + 1) % SEARCH_AVAS.length)]; }, 140);

    await wait(2000 + Math.random() * 1000);
    clearInterval(clock);
    clearInterval(shuffle);

    // нашли: радар гаснет, соперник въезжает справа налево, VS бьёт со вспышкой
    root.classList.add('is-found');
    if (navigator.vibrate) navigator.vibrate([20, 40, 30]);
    setTitle('Соперник найден', 'Готовимся к матчу');
    await wait(450);
    burst();
    showMsg('Соперник найден!', 'is-found');
    await wait(1500);

    setTitle('Начало матча', 'Удачи!');
    showMsg('Начало матча', 'is-start');
    root.classList.add('is-start');
    await wait(1100);

    // экран растворяется — под ним уже запущен обычный матч
    start();
    root.classList.add('is-leaving');
    await wait(600);
    document.documentElement.classList.remove('mm24-on');
    root.remove();
  })();
  return gate;
})();
