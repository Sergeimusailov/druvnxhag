// Поиск соперника перед матчем (Figma 17687:179282 «Основной сценарий»: «Ищем
// соперника», «Нашли соперника», «Подключаемся к матчу»).
// «Найти матч» на главной ведёт на match.html — сначала поверх поля экран
// поиска. Шапка tui-app-bar: «‹» (подтверждение выхода), «Матч» и под ним этап
// поиска, «?» — шторка ответов на вопросы матча. Игрок — аватар 96 в рамке с
// рубашкой колоды в нижнем углу и тёмная плашка с именем и статусом: я — сверху
// (аватар слева), соперник — снизу зеркально (аватар справа). В центре — мечи
// в чёрном круге с жёлтой обводкой на жёлтом диагональном луче. Пока ищем, на
// месте соперника «Ищем соперника» с лоадером. Через 2–3 с соперник найден:
// надпись гаснет, соперник въезжает справа, круг вспыхивает, залп частиц. Потом «Подключаемся
// к матчу», и экран поиска гаснет — под ним проявляется матч. Всё время из
// круга с мечами вылетают жёлтые частицы, при «нашли» — залпом.
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
  const back = get('v2.profileBack') || '';
  const status = get(isV3 ? 'v3.profileStatus' : 'v2.profileStatus') || get('v2.profileStatus') || 'Т-Ранжира';
  const C = typeof COSMETICS24 !== 'undefined' ? COSMETICS24 : null;

  // иконки из макета: tui-ic-service / back-ios-alt, tui-ic-medium / question,
  // tui-ic-medium / swords, tui-loader, луч за кругом (Group 1, 323×88 + размытие 5)
  const BACK_SVG = '<svg width="12" height="24" viewBox="0 0 12 24" fill="none" aria-hidden="true"><path d="M8.92396 2.8947C9.42057 2.41555 10.2111 2.42959 10.6906 2.92595C11.17 3.42257 11.1568 4.21402 10.6603 4.69353L3.04993 12.0392L10.6554 19.3019C11.1545 19.7787 11.1722 20.5703 10.6954 21.0695C10.2186 21.5685 9.42801 21.5862 8.92884 21.1095L0.389778 12.9562C-0.128033 12.4617 -0.130179 11.6351 0.384895 11.1379L8.92396 2.8947Z" fill="currentColor"/></svg>';
  const HELP_SVG = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M5.33936 7.72559C5.54822 4.3529 8.44774 1.67999 11.994 1.67999C15.6759 1.67999 18.6606 4.56132 18.6606 8.11563C18.6606 11.3384 16.2067 14.0079 13.0042 14.4779L13 16.5001H9L9.00421 13.5762C9.00421 11.9606 10.3205 10.6509 11.994 10.6509C13.4445 10.6509 14.6203 9.51562 14.6203 8.11544C14.6203 6.71526 13.4445 5.58019 11.994 5.58019C10.6809 5.58019 9.59288 6.51049 9.39862 7.72559H5.33936ZM11.5859 22.5001H9L9.00421 19.8652C9.00421 19.1113 9.59694 18.5001 10.3779 18.5001H13.0042L13 21.1349C13 21.8889 12.3669 22.5001 11.5859 22.5001Z" fill="currentColor"/></svg>';
  const SWORDS_SVG = '<svg class="mm24-swords" width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true"><defs><linearGradient id="mm24SwG" x1="49" y1="5.83332" x2="18.6667" y2="37.3333" gradientUnits="userSpaceOnUse"><stop stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0.7"/></linearGradient></defs><path d="M38.7525 6.35097C39.7577 5.15831 41.269 4.52076 42.7944 4.69504L49 5.42357L49.5934 11.7158C49.7629 13.2844 49.1715 14.8384 48.0116 15.872L21.3458 39.6361L15.6421 33.7711L38.7525 6.35097Z" fill="url(#mm24SwG)"/><path d="M13.4894 31.5575C12.5781 30.6205 11.1007 30.6205 10.1895 31.5575L8.03699 33.771L11.8393 37.6808L2.33325 47.4558L4.73709 49.9276C6.55954 51.8016 9.51431 51.8016 11.3368 49.9276L17.543 43.5458L19.6956 45.7594C20.6069 46.6964 22.0843 46.6964 22.9955 45.7594L25.148 43.546L13.4894 31.5575Z" fill="#fff"/><path d="M35.0258 27.4447L40.3579 33.7712L34.6542 39.6362L28 33.706L35.0258 27.4447Z" fill="#fff" fill-opacity="0.6"/><path d="M20.9741 27.4447L7.9883 15.872C6.82845 14.8384 6.23702 13.2844 6.40652 11.7158L7 5.4236L13.2055 4.69508C14.731 4.52079 16.2422 5.15834 17.2474 6.351L28 19.1087L20.9741 27.4447Z" fill="#fff" fill-opacity="0.6"/><path d="M46.4233 35.3603C47.335 34.4238 47.2938 32.9479 46.3311 32.0637L44.0571 29.9752L32.3916 41.9569C31.4799 42.8934 31.5211 44.3693 32.4837 45.2535L34.7578 47.342L38.457 43.5459L44.6633 49.9277C46.4858 51.8017 49.4405 51.8017 51.263 49.9277L53.6668 47.4559L44.1623 37.6825L46.4233 35.3603Z" fill="#fff"/></svg>';
  const STREAK_PATH = 'M4.99991 93C10.4183 91.662 15.8349 90.3175 21.2498 88.9666C69.9837 76.8086 118.576 64.1297 167.026 50.9297C215.476 37.7296 263.784 24.0087 311.95 9.76662C317.302 8.18417 322.652 6.5953 328 4.99999C322.582 6.33801 317.165 7.68246 311.75 9.03335C263.016 21.1913 214.424 33.8703 165.974 47.0703C117.524 60.2703 69.2161 73.9913 21.05 88.2334C15.6982 89.8158 10.3482 91.4047 4.99991 93Z';
  const STREAK_SVG = `<svg class="mm24-streak" width="333" height="98" viewBox="0 0 333 98" fill="none" aria-hidden="true"><defs><filter id="mm24StF" x="0" y="0" width="333" height="98" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="2.5"/></filter><linearGradient id="mm24StG" x1="5.65707" y1="95.4121" x2="328.657" y2="7.41207" gradientUnits="userSpaceOnUse"><stop stop-color="#EECE2A" stop-opacity="0"/><stop offset="0.52791" stop-color="#EECE2A"/><stop offset="1" stop-color="#EECE2A" stop-opacity="0"/></linearGradient></defs><path d="${STREAK_PATH}" fill="url(#mm24StG)" filter="url(#mm24StF)"/><path d="${STREAK_PATH}" fill="url(#mm24StG)"/></svg>`;
  const LOADER_SVG = '<svg class="mm24-loader" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M23.001 12C23.5527 12 24.0043 12.4481 23.9584 12.9979C23.7766 15.1778 23.0014 17.2735 21.7082 19.0534C20.2187 21.1036 18.1183 22.6296 15.7082 23.4127C13.2981 24.1958 10.7019 24.1958 8.2918 23.4127C5.88168 22.6296 3.78133 21.1036 2.2918 19.0534C0.80226 17.0033 5.33694e-07 14.5342 0 12C-5.33693e-07 9.46585 0.802258 6.99675 2.29179 4.94658C3.78133 2.89641 5.88167 1.37042 8.29179 0.587323C10.3842 -0.0925529 12.6169 -0.182169 14.7463 0.318476C15.2834 0.44475 15.57 1.0127 15.3995 1.53743C15.229 2.06215 14.6659 2.34406 14.1268 2.22673C12.4011 1.85116 10.6002 1.9381 8.90921 2.48753C6.90037 3.14024 5.14974 4.41216 3.90821 6.12097C2.66668 7.82979 1.998 9.88779 1.998 12C1.998 14.1122 2.66668 16.1702 3.90821 17.879C5.14974 19.5878 6.90038 20.8598 8.90921 21.5125C10.918 22.1652 13.082 22.1652 15.0908 21.5125C17.0996 20.8598 18.8503 19.5878 20.0918 17.879C21.1369 16.4406 21.7761 14.7547 21.9522 12.9974C22.0072 12.4484 22.4493 12 23.001 12Z" fill="#FFDD2D"/></svg>';

  // игрок — аватар в рамке, рубашка колоды в нижнем углу, рядом плашка с именем и статусом
  const playerHTML = (who, img, name, sub, deckId) => `
    <div class="mm24-player mm24-${who}">
      <div class="mm24-plate"><b class="mm24-name">${name}</b><span class="mm24-sub">${sub}</span></div>
      <div class="mm24-ava">
        <span class="m24-frame mm24-frame"><img class="avatar" src="${img}" alt=""></span>
        <span class="mm24-deck">${C ? C.backHTML(deckId) : ''}</span>
      </div>
    </div>`;

  const root = document.createElement('div');
  root.className = 'mm24';
  root.id = 'mm24';
  root.innerHTML = `
    <div class="mm24-bg" aria-hidden="true"></div>
    <div class="mm24-bar">
      <a class="mm24-back" href="${isV3 ? 'v2.html?app=3' : 'v2.html'}" aria-label="Отменить поиск">${BACK_SVG}</a>
      <div class="mm24-title">
        <div class="mm24-title-text">Матч</div>
        <div class="mm24-step" id="mm24Msg" role="status">Ищем соперника</div>
      </div>
      <button class="mm24-help" type="button" aria-label="Ответы на вопросы">${HELP_SVG}</button>
    </div>
    <div class="mm24-stage">
      ${playerHTML('you', avatar, youName, status, back)}
      <div class="mm24-center">
        ${STREAK_SVG}
        <span class="mm24-vs">${SWORDS_SVG}</span>
      </div>
      <div class="mm24-opp-slot">
        <div class="mm24-search"><span class="mm24-search-text">Ищем соперника</span>${LOADER_SVG}</div>
        ${playerHTML('opp', oppAvatar, oppName, 'Делай, как надо', typeof MATCH24 !== 'undefined' && MATCH24 ? MATCH24.oppBack : '')}
      </div>
    </div>`;
  document.body.appendChild(root);
  document.documentElement.classList.add('mm24-on');
  // на iPhone экран не тянется «резинкой» вместе со страницей
  root.addEventListener('touchmove', (e) => { if (e.cancelable) e.preventDefault(); }, { passive: false });

  // рамки как в матче: в версии 2 — из профиля, у соперника — та же случайная
  // из каталога, что в шапке матча (MATCH24.oppFrame); в версии 3 — синяя и красная
  const oppFrameEl = root.querySelector('.mm24-opp .mm24-frame');
  if (C && !isV3) {
    C.applyFrame(root.querySelector('.mm24-you .mm24-frame'), frame);
    C.applyFrame(oppFrameEl, typeof MATCH24 !== 'undefined' && MATCH24 ? MATCH24.oppFrame : FRAME_CATALOG.random().id);
  } else {
    root.querySelector('.mm24-you .mm24-frame').style.setProperty('--pf-frame', '#2265d3');
    oppFrameEl.style.setProperty('--pf-frame', '#e32d2d');
  }

  // «‹» — подтверждение выхода (js/leave24.js): без наград за матч
  const backEl = root.querySelector('.mm24-back');
  backEl.addEventListener('click', (e) => {
    e.preventDefault();
    LEAVE24.confirm(backEl, backEl.href);
  });

  // «?» — та же шторка ответов на вопросы, что в матче (js/match24.js, только
  // версия 2; в версии 3 шторки нет — кнопка скрыта)
  const helpEl = root.querySelector('.mm24-help');
  if (window.M24_FAQ) helpEl.addEventListener('click', () => window.M24_FAQ.open());
  else helpEl.style.visibility = 'hidden';
  const faqOpen = () => !!(window.M24_FAQ && window.M24_FAQ.el.getAttribute('aria-hidden') === 'false');

  const msgEl = root.querySelector('#mm24Msg');
  const wait = (ms) => new Promise((r) => setTimeout(r, reduce ? Math.min(ms, 300) : ms));
  // пока открыто меню «Выйти из матча?» или шторка «?», поиск стоит на месте
  const hold = async () => { while (LEAVE24.isOpen() || faqOpen()) await new Promise((r) => setTimeout(r, 100)); };

  const $m = (sel) => root.querySelector(sel);
  const E = A24.EASE;

  // этап поиска в подзаголовке шапки: старый текст гаснет, новый проявляется
  function showMsg(text) {
    A24.play(msgEl, { opacity: [1, 0], duration: reduce ? 0 : 150, ease: E.out }).then(() => {
      msgEl.textContent = text;
      A24.play(msgEl, { opacity: [0, 1], duration: reduce ? 0 : 250, ease: E.out });
    });
  }

  // частицы из круга с мечами: одна частица — жёлтая или белая точка 3–7px,
  // вылетает от края круга наружу под случайным углом и гаснет
  const PARTICLE_COLORS = ['#ffdd2d', '#ffdd2d', '#eece2a', '#fff'];
  function particle({ dist = [40, 110], dur = [1000, 1600], size = [3, 7] } = {}) {
    const s = document.createElement('span');
    s.className = 'mm24-spark';
    const sz = size[0] + Math.random() * (size[1] - size[0]);
    const c = PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)];
    s.style.cssText = `width:${sz}px;height:${sz}px;background:${c};box-shadow:0 0 ${sz * 1.5}px ${c};translate:-50% -50%`;
    $m('.mm24-center').appendChild(s);
    const a = Math.random() * Math.PI * 2;
    const r0 = 48; // от обводки круга 96
    const d = r0 + dist[0] + Math.random() * (dist[1] - dist[0]);
    anime.animate(s, {
      x: [Math.cos(a) * r0, Math.cos(a) * d],
      y: [Math.sin(a) * r0, Math.sin(a) * d],
      scale: [1, 0.2],
      opacity: [{ to: 1, duration: 120 }, { to: 0 }],
      duration: dur[0] + Math.random() * (dur[1] - dur[0]),
      ease: 'cubicBezier(0.2, 0.7, 0.3, 1)',
      onComplete: () => s.remove(),
    });
  }
  // постоянный поток, пока открыт экран; после «Нашли соперника» — гуще
  let particleRate = 160;
  let particleTimer = null;
  const emit = () => { particle(); particleTimer = setTimeout(emit, particleRate * (0.6 + Math.random() * 0.8)); };
  if (!reduce) emit();
  const stopParticles = () => clearTimeout(particleTimer);
  // залп, когда соперник найден
  function burst() {
    if (reduce) return;
    for (let i = 0; i < 28; i++) particle({ dist: [50, 120], dur: [700, 1200], size: [4, 8] });
    particleRate = 100;
  }

  // пока ищем: я въезжаю слева, лоадер крутится, круг с мечами «дышит»
  anime.animate($m('.mm24-you'), { x: ['-130%', '0%'], opacity: [0, 1], duration: reduce ? 0 : 600, ease: 'cubicBezier(0.2, 0.9, 0.3, 1.15)' });
  const spin = A24.loop($m('.mm24-loader'), { rotate: [0, 360], duration: 800, ease: 'linear' });
  const breath = A24.loop($m('.mm24-vs'), { scale: [1, 1.04], duration: 800, alternate: true, ease: E.inOut });

  // соперник найден — один таймлайн: «Ищем соперника» с лоадером гаснет,
  // соперник въезжает справа, круг с размаху вспыхивает, луч разгорается,
  // я вздрагиваю, искры
  function foundTimeline() {
    if (breath) breath.revert();
    const tl = anime.createTimeline({ defaults: { ease: E.ease } });
    tl.add($m('.mm24-search'), { opacity: 0, scale: 0.9, duration: 250 }, 0)
      .call(() => { if (spin) spin.cancel(); }, 250)
      .add($m('.mm24-opp-slot .mm24-player'), {
        keyframes: { '0%': { x: '140%', opacity: 0 }, '50%': { x: '70%', opacity: 1 }, '100%': { x: '0%', opacity: 1 } },
        duration: 800,
        ease: 'cubicBezier(0.2, 0.9, 0.3, 1.1)',
      }, 150)
      .add($m('.mm24-streak'), { scaleX: [0.2, 1], filter: ['brightness(2)', 'brightness(1)'], duration: 600, ease: 'cubicBezier(0.2, 0.8, 0.3, 1)' }, 400)
      .add($m('.mm24-vs'), { scale: [1.6, 1], rotate: [-20, 0], duration: 500, ease: 'cubicBezier(0.3, 1.5, 0.5, 1)' }, 400)
      .add($m('.mm24-you'), { keyframes: { '20%': { x: -4, y: 2 }, '40%': { x: 4, y: -2 }, '60%': { x: -3, y: 1 }, '80%': { x: 2, y: -1 }, '100%': { x: 0, y: 0 } }, duration: 350, ease: E.inOut }, 450)
      .call(() => burst(), 500);
    if (reduce) tl.complete();
    return tl;
  }

  // появление матча: клетки поля плавно проявляются по очереди (600, +50),
  // карты руки по одной приплывают снизу (650, +140)
  function introMatch() {
    if (reduce) return;
    const cells = document.querySelectorAll('#board .cell');
    const slots = document.querySelectorAll('#hand .hand-slot');
    anime.set(cells, { opacity: 0 });
    anime.set(slots, { opacity: 0, y: 160 });
    cells.forEach((c, i) => A24.play(c, { opacity: [0, 1], duration: 600, delay: 200 + i * 50, ease: E.out }));
    slots.forEach((s, i) => A24.play(s, {
      keyframes: { '0%': { y: 160, opacity: 0 }, '75%': { y: -6, opacity: 1 }, '100%': { y: 0, opacity: 1 } },
      duration: 650,
      delay: 500 + i * 140,
      ease: 'cubicBezier(0.2, 0.8, 0.3, 1)',
    }));
  }

  let start;
  const gate = new Promise((r) => { start = r; });
  (async () => {
    await wait(2000 + Math.random() * 1000);
    await hold();

    // нашли
    root.classList.add('is-found');
    if (navigator.vibrate) navigator.vibrate([20, 40, 30]);
    showMsg('Нашли соперника');
    foundTimeline();
    // «Нашли соперника» — 2,2 с, затем «Подключаемся к матчу» — 1,8 с
    await wait(2200);

    await hold();
    showMsg('Подключаемся к матчу');
    await wait(1800);

    await hold();
    // переход в матч — фейд: экран поиска гаснет, под ним проявляется матч
    root.classList.add('is-leaving');
    start();
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    introMatch();
    await anime.animate(root, { opacity: [1, 0], duration: reduce ? 200 : 500, ease: E.out });
    stopParticles();
    anime.remove(root.querySelectorAll('*'));
    root.remove();
    document.documentElement.classList.remove('mm24-on');
  })();
  return gate;
})();
