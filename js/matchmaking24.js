// Поиск соперника перед матчем (по смыслу, по референсу Marvel Snap; макета нет).
// «Найти матч» на главной ведёт на match.html — сначала поверх поля экран
// поиска: шапка как в матче («‹» с подтверждением выхода, «Поиск соперника»). Игрок — аватар в
// рамке с рубашкой колоды в верхнем углу и плашка с именем и статусом: я —
// сверху (аватар слева, синяя плашка вправо), соперник — снизу зеркально
// (красная плашка слева, аватар справа). В центре — скрещённые мечи в
// светящемся круге с диагональным сиянием, под ними статус. Пока ищем, на месте
// соперника радар с перебором затемнённых аватарок. Через 2–3 с соперник найден: радар
// гаснет, соперник въезжает справа налево, мечи вспыхивают жёлтым, «Соперник
// найден!». Потом «Начинаем матч» с лоадером; игроки разъезжаются влево и
// вправо, экран гаснет, а матч под ним проявляется.
// match.js ждёт window.MATCH_GATE и только потом вызывает initGame().
// Подключается после cosmetics24.js и match24.js, до match.js. Работает в
// версиях 2 и 3; ?nosearch — сразу в матч (для проверок).

window.MATCH_GATE = (() => {
  if (/[?&]nosearch\b/.test(location.search)) return null;
  const isV3 = document.documentElement.dataset.app === '3';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const get = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  // имя и аватар — те же, что в шапке матча (в версии 2 их уже подставил
  // match24.js из профиля, в версии 3 — свои)
  const fromMatch = (sel, prop) => { const el = document.querySelector(sel); return el ? el[prop] : ''; };
  const avatar = fromMatch('.avatar-you', 'src') || get('v2.profileAvatar') || 'assets/v2-avatar-photo.svg';
  const youName = fromMatch('.player-you .player-name', 'textContent') || 'Александр К.';
  const oppAvatar = fromMatch('.avatar-opp', 'src') || 'assets/Ava01.png';
  const oppName = fromMatch('.player-opponent .player-name', 'textContent') || 'Константин К.';
  const frame = get('v2.profileFrame') || 'white';
  const back = get('v2.profileBack') || 'classic';
  const status = get(isV3 ? 'v3.profileStatus' : 'v2.profileStatus') || get('v2.profileStatus') || 'Т-Ранжира';
  const C = typeof COSMETICS24 !== 'undefined' ? COSMETICS24 : null;

  const BACK_SVG = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 12C5.01082 11.635 5.14061 11.3237 5.43265 11.0446L13.8692 2.85424C14.0964 2.61808 14.3992 2.5 14.7453 2.5C15.4484 2.5 16 3.03672 16 3.73446C16 4.07797 15.8594 4.38927 15.6214 4.63616L8.0177 12L15.6214 19.3638C15.8594 19.6 16 19.9113 16 20.2548C16 20.9633 15.4484 21.5 14.7453 21.5C14.3992 21.5 14.0964 21.3819 13.8692 21.1458L5.43265 12.9554C5.14061 12.6763 5 12.365 5 12Z" fill="currentColor"/></svg>';

  // игрок — аватар в рамке, рубашка колоды в верхнем углу, рядом плашка с именем и статусом
  const playerHTML = (who, img, name, sub, deckId) => `
    <div class="mm24-player mm24-${who}">
      <div class="mm24-plate"><b class="mm24-name">${name}</b><span class="mm24-sub">${sub}</span></div>
      <div class="mm24-ava">
        <span class="m24-frame mm24-frame"><img class="avatar" src="${img}" alt=""></span>
        <span class="mm24-deck">${C ? C.backHTML(deckId) : ''}</span>
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
        <div class="mm24-title-text">Поиск соперника</div>
      </div>
      <span aria-hidden="true"></span>
    </div>
    <div class="mm24-center">
      <span class="mm24-vs"><svg class="mm24-swords" viewBox="0 0 64 64" fill="currentColor" aria-hidden="true"><g transform="translate(32 31) rotate(45)"><path d="M0-29 4.5-22.5V7h-9v-29.5Z"/><path d="M0-25V5" stroke="#000" stroke-opacity=".22" stroke-width="1.6" stroke-linecap="round"/><rect x="-11" y="7" width="22" height="5" rx="2.5"/><rect x="-2.6" y="12" width="5.2" height="10" rx="1.6"/><circle cy="25.5" r="4"/></g><g transform="translate(32 31) rotate(-45)"><path d="M0-29 4.5-22.5V7h-9v-29.5Z"/><path d="M0-25V5" stroke="#000" stroke-opacity=".22" stroke-width="1.6" stroke-linecap="round"/><rect x="-11" y="7" width="22" height="5" rx="2.5"/><rect x="-2.6" y="12" width="5.2" height="10" rx="1.6"/><circle cy="25.5" r="4"/></g></svg></span>
      <div class="mm24-msg-row"><span class="mm24-loader" aria-hidden="true"></span><div class="mm24-msg" id="mm24Msg" role="status">Ищем соперника<span class="mm24-dots"><i>.</i><i>.</i><i>.</i></span></div></div>
    </div>
    ${playerHTML('you', avatar, youName, status, back)}
    <div class="mm24-opp-slot">
      <div class="mm24-radar" aria-hidden="true">
        <span class="mm24-ring"></span><span class="mm24-ring"></span><span class="mm24-ring"></span>
        <span class="mm24-sweep"></span>
        <span class="mm24-scan"><img id="mm24Scan" src="${SEARCH_AVAS[0]}" alt=""></span>
      </div>
      ${playerHTML('opp', oppAvatar, oppName, 'Делай, как надо', 'classic')}
    </div>`;
  document.body.appendChild(root);
  document.documentElement.classList.add('mm24-on');

  // рамки как в матче: в версии 2 — из профиля, в версии 3 — синяя; у соперника красная
  if (C && !isV3) C.applyFrame(root.querySelector('.mm24-you .mm24-frame'), frame);
  else root.querySelector('.mm24-you .mm24-frame').style.setProperty('--pf-frame', '#2265d3');
  root.querySelector('.mm24-opp .mm24-frame').style.setProperty('--pf-frame', '#e32d2d');

  // «‹» — подтверждение выхода (js/leave24.js): без наград за матч
  const backEl = root.querySelector('.mm24-back');
  backEl.addEventListener('click', (e) => {
    e.preventDefault();
    LEAVE24.confirm(backEl, backEl.href);
  });

  const msgEl = root.querySelector('#mm24Msg');
  const scanImg = root.querySelector('#mm24Scan');
  const wait = (ms) => new Promise((r) => setTimeout(r, reduce ? Math.min(ms, 300) : ms));
  // пока открыто меню «Выйти из матча?», поиск стоит на месте
  const hold = async () => { while (LEAVE24.isOpen()) await new Promise((r) => setTimeout(r, 100)); };

  function showMsg(text, cls) {
    msgEl.className = `mm24-msg ${cls}`;
    msgEl.textContent = text;
    msgEl.animate([
      { opacity: 0, transform: 'scale(0.6)' },
      { opacity: 1, transform: 'scale(1.1)', offset: 0.6 },
      { opacity: 1, transform: 'scale(1)' },
    ], { duration: 420, easing: 'cubic-bezier(0.3, 1.4, 0.5, 1)' });
  }

  // искры из мечей, когда соперник найден
  function burst() {
    const c = root.querySelector('.mm24-vs');
    const colors = ['#ffdd2d', '#fff', '#ff5c5c', '#6fa8ff'];
    for (let i = 0; i < 20; i++) {
      const s = document.createElement('span');
      s.className = 'mm24-spark';
      s.style.background = colors[i % colors.length];
      c.appendChild(s);
      const a = Math.random() * Math.PI * 2;
      const d = 50 + Math.random() * 60;
      s.animate([
        { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
        { transform: `translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d}px)) scale(0.2)`, opacity: 0 },
      ], { duration: 700 + Math.random() * 400, easing: 'cubic-bezier(0.2, 0.7, 0.3, 1)' }).finished.then(() => s.remove());
    }
  }

  // появление матча: клетки поля плавно проявляются по очереди, карты руки
  // по одной приплывают снизу вверх с небольшой задержкой
  function introMatch() {
    if (reduce) return;
    document.querySelectorAll('#board .cell').forEach((c, i) => {
      c.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 600, delay: 200 + i * 50, easing: 'ease-out', fill: 'backwards' });
    });
    document.querySelectorAll('#hand .hand-slot').forEach((s, i) => {
      s.animate([
        { transform: 'translateY(160px)', opacity: 0 },
        { transform: 'translateY(-6px)', opacity: 1, offset: 0.75 },
        { transform: 'none', opacity: 1 },
      ], { duration: 650, delay: 500 + i * 140, easing: 'cubic-bezier(0.2, 0.8, 0.3, 1)', fill: 'backwards' });
    });
  }

  let start;
  const gate = new Promise((r) => { start = r; });
  (async () => {
    // перебор аватарок в радаре
    let k = 0;
    const shuffle = setInterval(() => { scanImg.src = SEARCH_AVAS[(k = (k + 1) % SEARCH_AVAS.length)]; }, 140);

    await wait(2000 + Math.random() * 1000);
    await hold();
    clearInterval(shuffle);

    // нашли: радар гаснет, соперник въезжает справа налево, мечи скрещиваются со вспышкой
    root.classList.add('is-found');
    if (navigator.vibrate) navigator.vibrate([20, 40, 30]);
    await wait(500);
    burst();
    showMsg('Соперник найден!', 'is-found');
    await wait(2200);

    await hold();
    // «Начинаем матч» и лоадер — время рассмотреть соперника
    showMsg('Начинаем матч', 'is-start');
    root.classList.add('is-start');
    await wait(1800);

    await hold();
    // игроки разъезжаются влево и вправо, экран гаснет —
    // под ним запускается матч и проявляется
    root.classList.add('is-leaving');
    await wait(450);
    start();
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    root.classList.add('is-gone');
    introMatch();
    await wait(650);
    document.documentElement.classList.remove('mm24-on');
    root.remove();
  })();
  return gate;
})();
