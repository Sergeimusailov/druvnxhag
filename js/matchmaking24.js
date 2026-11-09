// Поиск соперника перед матчем (по смыслу, по референсу Marvel Snap; макета нет).
// «Найти матч» на главной ведёт на match.html — сначала поверх поля экран
// поиска: шапка как в матче («‹» с подтверждением выхода, «Поиск соперника»). Игрок — аватар в
// рамке с рубашкой колоды в верхнем углу и плашка с именем и статусом: я —
// сверху (аватар слева, синяя плашка вправо), соперник — снизу зеркально
// (красная плашка слева, аватар справа). В центре — скрещённые мечи в
// светящемся круге с диагональным сиянием, под ними статус. Пока ищем, на месте
// соперника радар с перебором затемнённых аватарок. Через 2–3 с соперник найден: радар
// гаснет, соперник въезжает справа налево, мечи вспыхивают жёлтым, «Соперник
// найден!». Потом «Начинаем матч» с лоадером; шов по диагонали через мечи
// вспыхивает, и экран разъезжается по нему вверх и вниз, как шторки, —
// под ним уже матч.
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
    <div class="mm24-stage">
      ${playerHTML('you', avatar, youName, status, back)}
      <div class="mm24-center">
        <span class="mm24-beam" aria-hidden="true"></span><span class="mm24-halo" aria-hidden="true"></span>
        <span class="mm24-vs"><svg class="mm24-swords" viewBox="0 0 64 64" fill="currentColor" aria-hidden="true"><g transform="translate(32 31) rotate(45)"><path d="M0-29 4.5-22.5V7h-9v-29.5Z"/><path d="M0-25V5" stroke="#000" stroke-opacity=".22" stroke-width="1.6" stroke-linecap="round"/><rect x="-11" y="7" width="22" height="5" rx="2.5"/><rect x="-2.6" y="12" width="5.2" height="10" rx="1.6"/><circle cy="25.5" r="4"/></g><g transform="translate(32 31) rotate(-45)"><path d="M0-29 4.5-22.5V7h-9v-29.5Z"/><path d="M0-25V5" stroke="#000" stroke-opacity=".22" stroke-width="1.6" stroke-linecap="round"/><rect x="-11" y="7" width="22" height="5" rx="2.5"/><rect x="-2.6" y="12" width="5.2" height="10" rx="1.6"/><circle cy="25.5" r="4"/></g></svg></span>
        <div class="mm24-msg-row"><span class="mm24-loader" aria-hidden="true"></span><div class="mm24-msg" id="mm24Msg" role="status">Ищем соперника<span class="mm24-dots"><i>.</i><i>.</i><i>.</i></span></div></div>
      </div>
      <div class="mm24-opp-slot">
        <div class="mm24-radar" aria-hidden="true">
          <span class="mm24-ring"></span><span class="mm24-ring"></span><span class="mm24-ring"></span>
          <span class="mm24-sweep"></span>
          <span class="mm24-scan"><img id="mm24Scan" src="${SEARCH_AVAS[0]}" alt=""></span>
        </div>
        ${playerHTML('opp', oppAvatar, oppName, 'Делай, как надо', 'classic')}
      </div>
    </div>`;
  document.body.appendChild(root);
  document.documentElement.classList.add('mm24-on');
  // на iPhone экран не тянется «резинкой» вместе со страницей
  root.addEventListener('touchmove', (e) => { if (e.cancelable) e.preventDefault(); }, { passive: false });

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

  const $m = (sel) => root.querySelector(sel);
  const E = A24.EASE;

  function showMsg(text, cls) {
    msgEl.className = `mm24-msg ${cls}`;
    msgEl.textContent = text;
    A24.play(msgEl, {
      keyframes: { '0%': { opacity: 0, scale: 0.6 }, '60%': { opacity: 1, scale: 1.1 }, '100%': { opacity: 1, scale: 1 } },
      duration: 420,
      ease: 'cubicBezier(0.3, 1.4, 0.5, 1)',
    });
  }

  // искры из мечей, когда соперник найден
  function burst() {
    if (reduce) return;
    const c = $m('.mm24-vs');
    const colors = ['#ffdd2d', '#fff', '#ff5c5c', '#6fa8ff'];
    for (let i = 0; i < 20; i++) {
      const s = document.createElement('span');
      s.className = 'mm24-spark';
      s.style.background = colors[i % colors.length];
      s.style.translate = '-50% -50%';
      c.appendChild(s);
      const a = Math.random() * Math.PI * 2;
      const d = 50 + Math.random() * 60;
      anime.animate(s, {
        x: [0, Math.cos(a) * d],
        y: [0, Math.sin(a) * d],
        scale: [1, 0.2],
        opacity: [1, 0],
        duration: 700 + Math.random() * 400,
        ease: 'cubicBezier(0.2, 0.7, 0.3, 1)',
        onComplete: () => s.remove(),
      });
    }
  }

  // пока ищем: я въезжаю слева; радар (кольца расходятся, луч вращается),
  // три точки мигают по очереди, круг с мечами «дышит»
  const loops = [];
  anime.animate($m('.mm24-you'), { x: ['-130%', '0%'], opacity: [0, 1], duration: reduce ? 0 : 600, ease: 'cubicBezier(0.2, 0.9, 0.3, 1.15)' });
  root.querySelectorAll('.mm24-ring').forEach((ring, i) => loops.push(A24.loop(ring, { scale: [0.9, 1.7], opacity: [0.9, 0], duration: 1800, delay: i * 600, ease: E.out })));
  loops.push(A24.loop($m('.mm24-sweep'), { rotate: [0, 360], duration: 1200, ease: 'linear' }));
  root.querySelectorAll('.mm24-dots i').forEach((dot, i) => loops.push(A24.loop(dot, {
    keyframes: { '0%': { opacity: 0.2 }, '30%': { opacity: 1 }, '60%': { opacity: 0.2 }, '100%': { opacity: 0.2 } },
    duration: 1200,
    delay: i * 200,
    ease: 'linear',
  })));
  const breath = A24.loop($m('.mm24-vs'), { scale: [1, 1.05], duration: 800, alternate: true, ease: E.inOut });

  // соперник найден — один таймлайн: радар сжимается и гаснет, красное свечение
  // проявляется, соперник въезжает справа, луч «выстреливает», мечи с размаху
  // врезаются, я вздрагиваю, искры и надпись
  function foundTimeline() {
    loops.forEach((l) => l && l.cancel());
    if (breath) breath.revert();
    const tl = anime.createTimeline({ defaults: { ease: E.ease } });
    tl.add($m('.mm24-radar'), { scale: 0.4, opacity: 0, duration: 300 }, 0)
      .add($m('.mm24-glow.is-opp'), { opacity: [0, 0.38], duration: 800 }, 0)
      .add($m('.mm24-opp-slot .mm24-player'), {
        keyframes: { '0%': { x: '140%', opacity: 0 }, '50%': { x: '70%', opacity: 1 }, '100%': { x: '0%', opacity: 1 } },
        duration: 800,
        ease: 'cubicBezier(0.2, 0.9, 0.3, 1.1)',
      }, 150)
      .add($m('.mm24-halo'), { opacity: [0.4, 1], duration: 500 }, 0)
      .add($m('.mm24-beam'), { scaleX: [0, 1], opacity: [0.3, 1], filter: ['brightness(2)', 'brightness(1)'], duration: 600, ease: 'cubicBezier(0.2, 0.8, 0.3, 1)' }, 400)
      .add($m('.mm24-vs'), { scale: [2.2, 1], rotate: [-25, 0], opacity: [0, 1], duration: 500, ease: 'cubicBezier(0.3, 1.5, 0.5, 1)' }, 400)
      .add($m('.mm24-swords'), { opacity: [0.45, 1], duration: 300 }, 400)
      .add($m('.mm24-you'), { keyframes: { '20%': { x: -4, y: 2 }, '40%': { x: 4, y: -2 }, '60%': { x: -3, y: 1 }, '80%': { x: 2, y: -1 }, '100%': { x: 0, y: 0 } }, duration: 350, ease: E.inOut }, 450)
      .call(() => { burst(); showMsg('Соперник найден!', 'is-found'); }, 500);
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
    // перебор аватарок в радаре
    let k = 0;
    const shuffle = setInterval(() => { scanImg.src = SEARCH_AVAS[(k = (k + 1) % SEARCH_AVAS.length)]; }, 140);

    await wait(2000 + Math.random() * 1000);
    await hold();
    clearInterval(shuffle);

    // нашли
    root.classList.add('is-found');
    if (navigator.vibrate) navigator.vibrate([20, 40, 30]);
    foundTimeline();
    // надпись «Соперник найден!» — на 500, «Начинаем матч» — через 2200 после неё
    await wait(2700);

    await hold();
    // «Начинаем матч» и лоадер — время рассмотреть соперника
    showMsg('Начинаем матч', 'is-start');
    root.classList.add('is-start');
    const spin = A24.loop($m('.mm24-loader'), { rotate: [0, 360], duration: 800, ease: 'linear' });
    await wait(1800);

    await hold();
    // шов по диагонали (по лучу через мечи) вспыхивает белым, лоадер гаснет —
    // и экран разъезжается по нему как шторки: верх вверх, низ вниз, под ним матч
    root.classList.add('is-seam');
    const seam = anime.createTimeline({ defaults: { duration: 300, ease: E.ease } });
    seam.add($m('.mm24-beam'), { height: 4, boxShadow: ['0 0 14px rgba(170, 140, 255, 0.9)', '0 0 18px #fff, 0 0 40px rgba(170, 140, 255, 0.9)'] }, 0)
      .add($m('.mm24-loader'), { opacity: 0 }, 0);
    await seam;
    if (spin) spin.cancel();
    start();
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    await splitAway();
    document.documentElement.classList.remove('mm24-on');
  })();

  // две копии экрана, обрезанные по диагонали; оригинал убираем сразу
  async function splitAway() {
    const box = root.getBoundingClientRect();
    const vs = $m('.mm24-vs').getBoundingClientRect();
    const W = box.width;
    const H = box.height;
    const cx = vs.left + vs.width / 2 - box.left;
    const cy = vs.top + vs.height / 2 - box.top;
    const k = Math.tan((14 * Math.PI) / 180); // луч .mm24-beam — rotate(-14deg)
    const yL = cy + cx * k;
    const yR = cy - (W - cx) * k;
    const halves = ['top', 'bottom'].map((side) => {
      const h = root.cloneNode(true);
      h.removeAttribute('id');
      h.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
      h.classList.add('is-split');
      h.style.clipPath = side === 'top'
        ? `polygon(0 0, ${W}px 0, ${W}px ${yR}px, 0 ${yL}px)`
        : `polygon(0 ${yL}px, ${W}px ${yR}px, ${W}px ${H}px, 0 ${H}px)`;
      document.body.appendChild(h);
      return h;
    });
    anime.remove(root.querySelectorAll('*'));
    root.remove();
    introMatch();
    if (reduce) {
      await anime.animate(halves, { opacity: [1, 0], duration: 300, ease: 'linear' });
    } else {
      // шторки: сначала чуть навстречу (6px к 12% времени), потом за край, 1000
      const far = Math.max(yL, yR) + 40;
      const farB = H - Math.min(yL, yR) + 40;
      const split = anime.createTimeline({ defaults: { duration: 1000, ease: 'cubicBezier(0.65, 0, 0.25, 1)' } });
      split.add(halves[0], { keyframes: { '0%': { y: 0 }, '12%': { y: 6 }, '100%': { y: -far } } }, 0)
        .add(halves[1], { keyframes: { '0%': { y: 0 }, '12%': { y: -6 }, '100%': { y: farB } } }, 0);
      await split;
    }
    halves.forEach((h) => h.remove());
  }
  return gate;
})();
