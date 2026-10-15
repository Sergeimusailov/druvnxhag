// Версия 3 (match.html?app=3): новый экран итогов матча (Figma 15959:35983,
// 15959:36287). Победа — больше опыта и три подарка, поражение — немного
// опыта и один подарок. Опыт с анимацией набегает в полосу уровня (тот же
// уровень, что в профиле и на главной: localStorage v3.level). Если полоса
// дошла до конца — экран «Новый уровень»: подарок → открытие → «Награды за
// уровень» → «Забрать», и полоса добирает остаток. Внизу матча — демо-кнопки
// «Выиграл / Проиграл». В версии 2 ничего не меняется.

(() => {
  if (!isApp3()) return;

  // «назад» из матча — на главную версии 3
  const backBtn = document.querySelector('.match-topbar .back-btn');
  if (backBtn) backBtn.href = 'v2.html?app=3';

  const LEVEL_KEY = 'v3.level';
  const PER_LEVEL = 1000;
  const HOME = 'v2.html?app=3';

  function loadLevel() {
    try {
      const s = JSON.parse(localStorage.getItem(LEVEL_KEY) || 'null');
      if (s) return s;
    } catch (e) { /* ignore */ }
    return { level: 1, xp: 640 };
  }

  function saveLevel(l) {
    try { localStorage.setItem(LEVEL_KEY, JSON.stringify(l)); } catch (e) { /* ignore */ }
  }

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const fmt = (n) => n.toLocaleString('ru-RU');
  const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const FRAMES = [
    ['Золотая рамка', 'linear-gradient(135deg, #fff2a8, #f5b400 50%, #c27a00)'],
    ['Радужная рамка', 'conic-gradient(from 0deg, #ff7ad9, #ffdd2d, #6ff0ff, #b36bff, #ff7ad9)'],
    ['Ледяная рамка', 'linear-gradient(135deg, #e6f6ff, #7fd4ff 50%, #3f8cff)'],
    ['Огненная рамка', 'linear-gradient(135deg, #ffe066, #ff6a1a 55%, #c2161b)'],
  ];

  // подарки: карта, рамка, аватарка, монеты
  function rewardHTML(kind) {
    if (kind === 'card') {
      const card = rand(CARD_ROSTER);
      return { html: `<div class="card owner-you">${cardInnerHTML(card)}</div>`, label: card.name };
    }
    if (kind === 'frame') {
      const [name, css] = rand(FRAMES);
      return { html: `<span class="m3-frame" style="--f:${css}"><img src="assets/avatars-sq/sq-${String(1 + Math.floor(Math.random() * 16)).padStart(2, '0')}.png" alt=""></span>`, label: name };
    }
    if (kind === 'avatar') {
      const n = String(1 + Math.floor(Math.random() * 16)).padStart(2, '0');
      return { html: `<img class="m3-avatar" src="assets/avatars-sq/sq-${n}.png" alt="">`, label: 'Аватарка' };
    }
    return { html: '<img class="m3-coin" src="assets/v2-coin.png" alt="">', label: '+20 монет' };
  }

  function tilesHTML(kinds) {
    return kinds.map((k, i) => {
      const r = rewardHTML(k);
      return `<div class="m3-tile" style="--i:${i}"><div class="m3-tile-box">${r.html}</div><span class="m3-tile-label">${r.label}</span></div>`;
    }).join('');
  }

  /* ---------- Разметка ---------- */

  const closeSVG = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 5l14 14M19 5L5 19" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>';
  const root = document.createElement('div');
  root.className = 'm3';
  root.innerHTML = `
    <section class="m3-screen" id="m3Result">
      <div class="m3-glow"></div>
      <div class="m3-bar"><a class="m3-icon" href="${HOME}" aria-label="Закрыть">${closeSVG}</a><span></span><button class="m3-icon" aria-label="Помощь">?</button></div>
      <h1 class="m3-title" id="m3Title"></h1>
      <p class="m3-sub" id="m3Sub"></p>
      <div class="m3-tiles" id="m3Tiles"></div>
      <div class="m3-level">
        <div class="m3-lvl-badge" id="m3LvlBadge"><b id="m3LvlNum"></b><span>Уровень</span></div>
        <div class="m3-lvl-main">
          <div class="m3-lvl-top"><span class="m3-lvl-xp" id="m3LvlXp"></span><span class="m3-lvl-gain" id="m3LvlGain"></span></div>
          <div class="m3-lvl-track"><span class="m3-lvl-old" id="m3LvlOld"></span><span class="m3-lvl-fill" id="m3LvlFill"></span></div>
          <div class="m3-lvl-rows" id="m3LvlRows"></div>
        </div>
      </div>
      <div class="m3-actions">
        <button class="m3-cta" id="m3Cta"></button>
        <a class="m3-home" href="${HOME}" aria-label="На главную"><svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M3.5 11.2 12 4l8.5 7.2" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 10v9a1 1 0 0 0 1 1h3.5v-5.5h3V20H17a1 1 0 0 0 1-1v-9" fill="currentColor"/></svg></a>
      </div>
    </section>

    <section class="m3-screen m3-up" id="m3LevelUp">
      <div class="m3-bar"><span></span><span></span><span></span></div>
      <h1 class="m3-title">Новый уровень</h1>
      <div class="m3-star"><div class="m3-star-rays"></div><svg viewBox="0 0 100 100"><polygon points="50,2 61,32 94,22 72,48 98,66 64,68 66,98 50,76 34,98 36,68 2,66 28,48 6,22 39,32" fill="url(#m3sg)" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/><defs><linearGradient id="m3sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6c4"/><stop offset="1" stop-color="#ffc21a"/></linearGradient></defs></svg><b id="m3StarNum"></b></div>
      <div class="m3-divider"></div>
      <p class="m3-sub">Награда за уровень</p>
      <img class="m3-up-gift" src="assets/v2-gift-big.png" alt="">
      <button class="m3-cta" id="m3OpenGift">Открыть награды</button>
    </section>

    <section class="m3-screen m3-open" id="m3Open">
      <div class="m3-open-rays"></div>
      <div class="m3-open-flash" id="m3Flash"></div>
      <img class="m3-open-gift" id="m3OpenGiftImg" src="assets/v2-gift-big.png" alt="">
      <p class="m3-open-hint" id="m3OpenHint">Нажмите, чтобы открыть</p>
    </section>

    <section class="m3-screen" id="m3LevelRewards">
      <div class="m3-glow"></div>
      <div class="m3-bar"><span></span><span></span><span></span></div>
      <h1 class="m3-title">Награды за уровень</h1>
      <div class="m3-tiles m3-tiles-pyramid" id="m3LvlTiles"></div>
      <button class="m3-cta" id="m3Claim">Забрать</button>
    </section>

    <div class="m3-sparks" id="m3Sparks"></div>
    <div class="m3-demo"><button data-demo="win">Демо: выиграл</button><button data-demo="loss">Демо: проиграл</button></div>`;
  document.querySelector('.match').appendChild(root);

  const $ = (id) => document.getElementById(id);
  const show = (id) => { $(id).classList.add('is-open'); };
  const hide = (id) => { $(id).classList.remove('is-open'); };

  /* ---------- Полоса уровня ---------- */

  let lvl = loadLevel();

  function paintBar(xp, oldXp) {
    $('m3LvlNum').textContent = lvl.level;
    $('m3LvlXp').textContent = `${fmt(Math.round(xp))} / ${fmt(PER_LEVEL)}`;
    $('m3LvlFill').style.width = `${Math.min(1, xp / PER_LEVEL) * 100}%`;
    $('m3LvlOld').style.width = `${Math.min(1, oldXp / PER_LEVEL) * 100}%`;
  }

  function tween(ms, fn) {
    return new Promise((resolve) => {
      const t0 = performance.now();
      (function tick(now) {
        const t = Math.min(1, (now - t0) / ms);
        fn(1 - (1 - t) ** 3);
        if (t < 1) requestAnimationFrame(tick); else resolve();
      })(t0);
    });
  }

  function burst(el, color) {
    const r = el.getBoundingClientRect();
    const box = root.getBoundingClientRect();
    const cx = r.left + r.width / 2 - box.left;
    const cy = r.top + r.height / 2 - box.top;
    for (let i = 0; i < 14; i++) {
      const s = document.createElement('i');
      const a = (i / 14) * Math.PI * 2;
      const d = 40 + Math.random() * 40;
      s.style.left = `${cx}px`;
      s.style.top = `${cy}px`;
      s.style.background = color;
      $('m3Sparks').appendChild(s);
      s.animate([{ transform: 'translate(-50%,-50%) scale(1)', opacity: 1 }, { transform: `translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d}px)) scale(0.2)`, opacity: 0 }], { duration: 600, easing: 'cubic-bezier(0.2, 0.7, 0.3, 1)' }).finished.then(() => s.remove());
    }
  }

  // опыт набегает в полосу; на каждом переполнении — экран нового уровня
  async function addXp(gain) {
    let left = gain;
    const gainEl = $('m3LvlGain');
    gainEl.textContent = `+${fmt(gain)}`;
    gainEl.animate([{ transform: 'scale(0.4)', opacity: 0 }, { transform: 'scale(1.25)', opacity: 1 }, { transform: 'scale(1)' }], { duration: 450, easing: 'ease-out' });
    await sleep(500);
    while (left > 0) {
      const from = lvl.xp;
      const step = Math.min(left, PER_LEVEL - from);
      await tween(Math.max(500, step * 1.2), (e) => paintBar(from + step * e, from));
      lvl.xp = from + step;
      left -= step;
      if (lvl.xp >= PER_LEVEL) {
        $('m3LvlBadge').animate([{ transform: 'scale(1)' }, { transform: 'scale(1.3)' }, { transform: 'scale(1)' }], { duration: 400, easing: 'ease-out' });
        burst($('m3LvlBadge'), '#ffdd2d');
        await sleep(450);
        lvl = { level: lvl.level + 1, xp: 0 };
        saveLevel(lvl);
        await levelUp();
        paintBar(0, 0);
      }
    }
    saveLevel(lvl);
  }

  /* ---------- Новый уровень ---------- */

  function once(el, type) {
    return new Promise((r) => el.addEventListener(type, r, { once: true }));
  }

  async function levelUp() {
    $('m3StarNum').textContent = lvl.level;
    show('m3LevelUp');
    const star = document.querySelector('.m3-star');
    star.animate([{ transform: 'scale(0) rotate(-120deg)' }, { transform: 'scale(1.2) rotate(10deg)', offset: 0.7 }, { transform: 'scale(1) rotate(0)' }], { duration: 700, easing: 'ease-out' });
    setTimeout(() => burst(star, '#ffd36b'), 500);
    await once($('m3OpenGift'), 'click');

    // открытие подарка: падает, качается, вспышка
    show('m3Open');
    hide('m3LevelUp');
    const gift = $('m3OpenGiftImg');
    gift.getAnimations().forEach((a) => a.cancel());
    gift.style.opacity = '';
    await gift.animate([{ transform: 'translateY(-80px) scale(0.2)', opacity: 0 }, { transform: 'translateY(10px) scale(1.1)', opacity: 1, offset: 0.6 }, { transform: 'none', opacity: 1 }], { duration: 650, easing: 'ease-out' }).finished;
    $('m3OpenHint').classList.add('is-visible');
    gift.classList.add('is-idle');
    await Promise.race([once($('m3Open'), 'click'), sleep(2400)]);
    $('m3OpenHint').classList.remove('is-visible');
    gift.classList.remove('is-idle');
    await gift.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(-10deg) scale(1.05)' }, { transform: 'rotate(10deg) scale(1.1)' }, { transform: 'rotate(-12deg) scale(1.15)' }, { transform: 'rotate(0) scale(1.25)' }], { duration: 520, easing: 'ease-in' }).finished;
    $('m3Flash').animate([{ opacity: 0, transform: 'scale(0.3)' }, { opacity: 1, transform: 'scale(3)' }, { opacity: 0, transform: 'scale(5)' }], { duration: 600, easing: 'ease-out' });
    gift.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250, fill: 'forwards' });
    await sleep(300);

    // «Награды за уровень»: три подарка выпрыгивают по очереди
    $('m3LvlTiles').innerHTML = tilesHTML(['card', 'frame', 'avatar']);
    show('m3LevelRewards');
    hide('m3Open');
    await once($('m3Claim'), 'click');
    hide('m3LevelRewards');
    await sleep(250);
  }

  /* ---------- Экран итогов ---------- */

  let shown = false;
  async function showResult3(isWin) {
    if (shown) return;
    shown = true;
    const gains = isWin ? [['Матч дня', 300], ['Победа', 700]] : [['Поражение', 200]];
    const total = gains.reduce((s, [, n]) => s + n, 0);
    $('m3Title').textContent = isWin ? 'Победа за вами' : 'Победа была близко';
    $('m3Sub').textContent = isWin ? 'Награды за матч' : 'Это был полезный опыт';
    $('m3Tiles').innerHTML = tilesHTML(isWin ? ['card', 'frame', 'avatar'] : ['coins']);
    $('m3LvlRows').innerHTML = gains.map(([n, v]) => `<div><span>${n}</span><b>+${fmt(v)}</b></div>`).join('');
    $('m3LvlGain').textContent = '';
    $('m3Cta').textContent = isWin ? 'Ещё матч' : 'Реванш';
    $('m3Result').classList.toggle('is-loss', !isWin);
    lvl = loadLevel();
    paintBar(lvl.xp, lvl.xp);
    show('m3Result');
    await sleep(900);
    await addXp(total);
  }

  $('m3Cta').addEventListener('click', () => { location.href = 'match.html?app=3'; });

  // результат реальной партии — новый экран вместо прежнего
  // eslint-disable-next-line no-global-assign
  showResultScreen = (winnerOwner) => showResult3(winnerOwner === 'you');

  root.querySelector('.m3-demo').addEventListener('click', (e) => {
    const b = e.target.closest('[data-demo]');
    if (!b) return;
    state.gameOver = true;
    stopTimer();
    showResult3(b.dataset.demo === 'win');
  });
})();
