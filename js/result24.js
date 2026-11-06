// Экран результата матча в версии 2 (Figma 17424:119405): «Победа за вами»
// с малиной и конфетти или «Победа была близко» с мороженым, ниже — плашка
// «Получено монет ⓘ  × N» и две кнопки: «Ещё матч» / «Реванш» и «На главный
// экран». Крестик — на главную.
// Дневной лимит монет за матчи — 1000 (localStorage v2.matchCoinsDay): за
// победу 50, за поражение 25, сверх лимита — сколько осталось (вплоть до × 0).
// Когда набрано полдневного лимита и больше — тултип «В день можно получить не
// более 1000 монет», когда лимит исчерпан — «Лимит за сегодня исчерпан…».
// Тап по всей плашке «Получено монет» — шторка «Лимит монет»: таймер до
// сброса (тап по нему — тултип), полоса «Получено монет N / 1000».
// Внизу матча — демо-кнопки «Победа», «Поражение» и «Монет за день» (0 → 500 →
// 1000), чтобы быстро посмотреть все состояния.
// Подключается в match.html после match.js и tooltip24.js; в версии 3 ничего
// не делает (там свой экран итогов, js/match-result3.js).

(() => {
  if (document.documentElement.dataset.app === '3') return;

  const HOME = 'v2.html';
  const LIMIT = 1000;
  const REWARD = { win: 50, loss: 25 };
  const DAY_KEY = 'v2.matchCoinsDay';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sleep = (ms) => new Promise((r) => setTimeout(r, reduce ? 0 : ms));

  /* ---------- Дневной лимит ---------- */

  const today = () => {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  };
  function loadDay() {
    try {
      const s = JSON.parse(localStorage.getItem(DAY_KEY) || 'null');
      if (s && s.day === today()) return s.got;
    } catch (e) { /* ignore */ }
    return 0;
  }
  function saveDay(got) {
    try { localStorage.setItem(DAY_KEY, JSON.stringify({ day: today(), got })); } catch (e) { /* ignore */ }
  }
  function untilMidnight() {
    const now = new Date();
    const end = new Date(now);
    end.setHours(24, 0, 0, 0);
    const s = Math.max(0, Math.floor((end - now) / 1000));
    const p = (n) => String(n).padStart(2, '0');
    return `${p(Math.floor(s / 3600))}:${p(Math.floor(s / 60) % 60)}:${p(s % 60)}`;
  }

  /* ---------- Разметка ---------- */

  const CLOSE_SVG = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M4.31752 20.4484C3.8556 19.9972 3.86634 19.2023 4.31752 18.7619L10.924 12.1447L4.31752 5.53822C3.86634 5.09779 3.8556 4.31361 4.31752 3.84095C4.77943 3.37904 5.56361 3.38978 6.01478 3.84095L12.6212 10.4474L19.2277 3.84095C19.6896 3.38978 20.4523 3.38978 20.9249 3.8517C21.3976 4.30287 21.3869 5.08705 20.9357 5.53822L14.3292 12.1447L20.9357 18.7619C21.3869 19.213 21.3869 19.9865 20.9249 20.4484C20.463 20.921 19.6896 20.9103 19.2277 20.4591L12.6212 13.8527L6.01478 20.4591C5.56361 20.9103 4.79017 20.9103 4.31752 20.4484Z" fill="currentColor"/></svg>';
  // «i» 12px #9299a2 в кружке 22px белый 10% (tui-button tooltip)
  const INFO_SVG = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><circle cx="6" cy="2.4" r="1.25" fill="currentColor"/><path d="M4.4 4.9H6.5V9.6M4.6 9.8H8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const CLOCK_SVG = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><circle cx="6" cy="6" r="5.5" fill="currentColor"/><path d="M6 3v3.2l2 1.3" stroke="#3a3a3c" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  const root = document.createElement('section');
  root.className = 'r24';
  root.id = 'r24';
  root.setAttribute('aria-hidden', 'true');
  root.innerHTML = `
    <div class="r24-bg" aria-hidden="true"></div>
    <div class="r24-confetti" aria-hidden="true"></div>
    <div class="r24-bar"><a class="m24-btn r24-close" href="${HOME}" aria-label="Закрыть">${CLOSE_SVG}</a></div>
    <div class="r24-content">
      <div class="r24-head">
        <h1 class="r24-title" id="r24Title"></h1>
        <div class="r24-art"><img id="r24Art" src="assets/result24-win.webp" alt=""></div>
      </div>
      <button class="r24-coins" id="r24Coins" type="button" aria-label="Получено монет — подробнее о дневном лимите">
        <span class="r24-coins-label">Получено монет<span class="r24-info" id="r24Info">${INFO_SVG}</span></span>
        <span class="r24-plate"><img src="assets/result24-coin.webp" alt=""><b id="r24Amount">× 0</b></span>
      </button>
    </div>
    <div class="r24-foot">
      <a class="r24-cta" id="r24Again" href="match.html"></a>
      <a class="r24-flat" href="${HOME}">На главный экран</a>
    </div>
    <div class="bs-backdrop" id="r24Backdrop"></div>
    <section class="bs r24-sheet" id="r24Sheet" aria-hidden="true" role="dialog" aria-label="Лимит монет">
      <div class="bs-grab"><span></span></div>
      <button class="r24-reset" id="r24Reset" type="button">${CLOCK_SVG}<span>Сброс через <span id="r24Timer">00:00:00</span></span></button>
      <h2 class="r24-sheet-title">Лимит монет</h2>
      <p class="r24-sheet-text">В день можно получить не более ${LIMIT.toLocaleString('ru-RU').replace(/\s/g, '')} монет</p>
      <div class="r24-track"><span id="r24Fill"></span></div>
      <div class="r24-track-labels"><span>Получено монет</span><span id="r24Got"></span></div>
    </section>`;
  document.body.appendChild(root);

  const $ = (id) => document.getElementById(id);
  const sheet = bottomSheet($('r24Sheet'), $('r24Backdrop'), { onClose: () => { clearInterval(timerId); Tooltip24.hide(); } });
  let timerId = null;

  function openLimits() {
    Tooltip24.hide();
    const got = loadDay();
    $('r24Fill').style.width = `${Math.min(1, got / LIMIT) * 100}%`;
    $('r24Got').textContent = `${got} / ${LIMIT}`;
    $('r24Timer').textContent = untilMidnight();
    clearInterval(timerId);
    timerId = setInterval(() => { $('r24Timer').textContent = untilMidnight(); }, 1000);
    sheet.open();
  }

  $('r24Coins').addEventListener('click', openLimits);
  $('r24Reset').addEventListener('click', () => {
    Tooltip24.show($('r24Reset'), {
      text: 'Счетчик времени до сброса лимитов по полученным монетам. После сброса сможете получать монеты',
      above: true,
    });
  });

  /* ---------- Конфетти (по смыслу: в макете — картинка, тут анимация) ---------- */

  const COLORS = ['#ff3b5c', '#2f6bff', '#ffdd2d', '#3fcf6b', '#ffffff', '#ff8a1f', '#b36bff'];
  function piece(layer, x, y) {
    const c = document.createElement('i');
    const w = 4 + Math.random() * 6;
    c.style.width = `${w}px`;
    c.style.height = `${w * (Math.random() < 0.5 ? 1 : 2.2)}px`;
    c.style.left = `${x}px`;
    c.style.top = `${y}px`;
    c.style.background = COLORS[Math.floor(Math.random() * COLORS.length)];
    if (Math.random() < 0.25) c.style.borderRadius = '50%';
    layer.appendChild(c);
    return c;
  }

  function confetti() {
    if (reduce) return;
    const layer = root.querySelector('.r24-confetti');
    const box = root.getBoundingClientRect();
    const art = $('r24Art').getBoundingClientRect();
    const cx = art.left + art.width / 2 - box.left;
    const cy = art.top + art.height / 2 - box.top;
    // залп из-за малины: разлетается во все стороны и осыпается
    for (let i = 0; i < 70; i++) {
      const c = piece(layer, cx, cy);
      const a = Math.random() * Math.PI * 2;
      const d = 90 + Math.random() * 150;
      const dx = Math.cos(a) * d;
      const dy = Math.sin(a) * d * 0.8;
      const rot = (Math.random() - 0.5) * 1080;
      c.animate([
        { transform: 'translate(-50%, -50%) rotate(0) scale(0.3)', opacity: 1 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotate(${rot * 0.4}deg) scale(1)`, opacity: 1, offset: 0.3 },
        { transform: `translate(calc(-50% + ${dx * 1.15}px), calc(-50% + ${dy + 260}px)) rotate(${rot}deg) scale(0.9)`, opacity: 0 },
      ], { duration: 2200 + Math.random() * 1200, delay: Math.random() * 120, easing: 'cubic-bezier(0.15, 0.7, 0.4, 1)', fill: 'both' })
        .finished.then(() => c.remove());
    }
    // потом ещё пару секунд конфетти падает сверху, покачиваясь
    for (let i = 0; i < 46; i++) {
      const c = piece(layer, Math.random() * box.width, -20);
      const sway = (Math.random() - 0.5) * 80;
      c.animate([
        { transform: 'translateY(0) rotate(0)', opacity: 1 },
        { transform: `translate(${sway}px, ${box.height * 0.5}px) rotate(${(Math.random() - 0.5) * 540}deg)`, opacity: 1, offset: 0.6 },
        { transform: `translate(${-sway * 0.5}px, ${box.height * 0.85}px) rotate(${(Math.random() - 0.5) * 900}deg)`, opacity: 0 },
      ], { duration: 3000 + Math.random() * 1800, delay: 300 + Math.random() * 2200, easing: 'linear', fill: 'both' })
        .finished.then(() => c.remove());
    }
  }

  /* ---------- Показ ---------- */

  let shown = false;
  async function showResult24(isWin) {
    if (shown) return;
    shown = true;
    const before = loadDay();
    const gain = Math.max(0, Math.min(REWARD[isWin ? 'win' : 'loss'], LIMIT - before));
    const got = before + gain;
    saveDay(got);
    if (gain && typeof addCoins === 'function') addCoins(gain);

    $('r24Title').textContent = isWin ? 'Победа за вами' : 'Победа была близко';
    $('r24Art').src = isWin ? 'assets/result24-win.webp' : 'assets/result24-loss.webp';
    $('r24Again').textContent = isWin ? 'Ещё матч' : 'Реванш';
    $('r24Amount').textContent = '× 0';
    root.classList.toggle('is-win', isWin);
    root.classList.add('is-open');
    root.setAttribute('aria-hidden', 'false');

    // заголовок, иллюстрация, монеты и кнопки появляются по очереди
    const pop = (el, frames, delay, duration = 500) => (reduce ? null : el.animate(frames, { duration, delay, easing: 'cubic-bezier(0.3, 1.3, 0.5, 1)', fill: 'backwards' }));
    pop(root.querySelector('.r24-title'), [{ transform: 'translateY(-16px)', opacity: 0 }, { transform: 'none', opacity: 1 }], 150);
    pop(root.querySelector('.r24-art'), [{ transform: 'scale(0.4)', opacity: 0 }, { transform: 'none', opacity: 1 }], 300, 650);
    pop($('r24Coins'), [{ transform: 'translateY(20px) scale(0.9)', opacity: 0 }, { transform: 'none', opacity: 1 }], 650);
    pop(root.querySelector('.r24-foot'), [{ transform: 'translateY(30px)', opacity: 0 }, { transform: 'none', opacity: 1 }], 850);
    if (isWin) setTimeout(confetti, reduce ? 0 : 450);

    // монеты набегают от 0 до полученных
    await sleep(900);
    const t0 = performance.now();
    const dur = reduce ? 0 : 600;
    await new Promise((resolve) => {
      (function tick(now) {
        const t = dur ? Math.min(1, (now - t0) / dur) : 1;
        $('r24Amount').textContent = `× ${Math.round(gain * (1 - (1 - t) ** 3))}`;
        if (t < 1) requestAnimationFrame(tick); else resolve();
      })(t0);
    });
    if (gain && !reduce) root.querySelector('.r24-plate').animate([{ transform: 'scale(1)' }, { transform: 'scale(1.08)' }, { transform: 'scale(1)' }], { duration: 300, easing: 'ease-out' });

    // лимит: половина и больше — подсказка о лимите, исчерпан — что ждать сброса
    await sleep(400);
    if (got >= LIMIT) {
      Tooltip24.show($('r24Info'), { text: 'Лимит за сегодня исчерпан. Подождите, когда лимит сбросится', above: true });
    } else if (got >= LIMIT / 2) {
      Tooltip24.show($('r24Info'), { text: `В день можно получить не более ${LIMIT} монет`, above: true });
    }
  }

  // результат реальной партии — новый экран вместо прежнего
  // eslint-disable-next-line no-global-assign
  showResultScreen = (winnerOwner) => showResult24(winnerOwner === 'you');

  /* ---------- Демо-кнопки внизу матча ---------- */

  const STEPS = [0, 500, LIMIT];
  const demo = document.createElement('div');
  demo.className = 'r24-demo';
  demo.innerHTML = '<button type="button" data-demo="win">Победа</button><button type="button" data-demo="loss">Поражение</button><button type="button" data-demo="limit"></button>';
  const limitBtn = demo.querySelector('[data-demo="limit"]');
  const paintLimit = () => { limitBtn.textContent = `Монет за день: ${loadDay()}`; };
  paintLimit();
  document.querySelector('.match').appendChild(demo);
  demo.addEventListener('click', (e) => {
    const b = e.target.closest('[data-demo]');
    if (!b) return;
    if (b.dataset.demo === 'limit') {
      const cur = loadDay();
      const next = STEPS.find((s) => s > cur);
      saveDay(next === undefined ? 0 : next);
      paintLimit();
      return;
    }
    state.gameOver = true;
    stopTimer();
    showResult24(b.dataset.demo === 'win');
  });
})();
