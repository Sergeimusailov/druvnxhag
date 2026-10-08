// События в версии 2.2 (Figma 15997:61831). Вход — карточки на главной:
// «Новогоднее событие» и «Дейлики». Скелет у событий общий (шапка + трек
// наград), различаются тема, валюта и награды. Трек двигает своя валюта:
// снежинки и листики приходят из заданий (js/tasks22.js). Пока на треке есть
// что забрать, на карточке события горит красный бейдж с количеством.

const EVENTS22 = {
  list: {
    ny: {
      id: 'ny',
      title: 'Новогоднее событие',
      heading: 'Делим 10 000 000 ₽',
      desc: 'Выполняйте задания, копи очки<br>и получай билеты на розыгрыш',
      badge: 'До 1 января',
      colors: ['#3133c2', '#709dff'],
      currency: 'snow',
      step: 10,
      points: 20,
      shown: 2,
      claimed: new Set([1]),
      rewards: ['chest', 'chest', 'ticket', 'chest', 'ticket', 'chest', 'ticket', 'chest', 'ticket', 'chest'],
    },
    daily: {
      id: 'daily',
      title: 'Дейлики',
      heading: '',
      desc: 'Выполняйте задания, копи очки<br>и получай билеты на розыгрыш',
      badge: null, // таймер до полуночи
      colors: ['#c25331', '#ff9670'],
      currency: 'leaf',
      step: 6,
      points: 12,
      shown: 2,
      claimed: new Set([1]),
      rewards: ['chest', 'chest', 'ticket', 'chest', 'ticket', 'chest', 'ticket', 'chest'],
    },
  },
  byCurrency: { snow: 'ny', leaf: 'daily' },

  reached(ev) {
    return Math.min(Math.floor(ev.points / ev.step), ev.rewards.length);
  },

  claimable(ev) {
    let n = 0;
    for (let l = 1; l <= this.reached(ev); l++) if (!ev.claimed.has(l)) n++;
    return n;
  },

  addCurrency(cur, amount) {
    const ev = this.list[this.byCurrency[cur]];
    if (!ev) return;
    ev.points += amount;
    renderEntries22(true);
  },
};

// геометрия трека v2.2: «капля» с иконкой валюты сверху, хвост уходит в линию;
// первый ромб на 162px от верха капли, шаг 90px
const E22_FIRST = 162;
const E22_STEP = 90;
const E22_LINE_TOP = 96;

const e22Screen = document.getElementById('e22Screen');
const e22Scroll = document.getElementById('e22Scroll');
const e22Track = document.getElementById('e22Track');
const e22Entries = document.getElementById('e22Entries');
let e22Current = null;
let e22Animating = false;

/* ---------- Карточки на главной ---------- */

function badgeHTML(n) {
  return n ? `<span class="e22-badge">${n}</span>` : '';
}

function renderEntries22(pulse) {
  // 2.1: на главной один виджет — его полоска тоже от снежинок
  const widgetFill = document.getElementById('eventWidgetFill');
  const nyEv = EVENTS22.list.ny;
  if (widgetFill) widgetFill.style.width = `${(EVENTS22.reached(nyEv) / nyEv.rewards.length) * 100}%`;
  const ny = EVENTS22.list.ny;
  const daily = EVENTS22.list.daily;
  const prevNy = e22Entries.querySelector('[data-event="ny"] .e22-badge');
  const prevDaily = e22Entries.querySelector('[data-event="daily"] .e22-badge');
  const nyCount = EVENTS22.claimable(ny);
  const dailyCount = EVENTS22.claimable(daily);
  e22Entries.innerHTML = `
    <button class="e22-widget" data-event="ny" style="--c1:${ny.colors[0]};--c2:${ny.colors[1]}">
      <span class="e22-widget-title">${ny.title}</span>
      <span class="e22-widget-sub">Разыгрываем 10 000 000 ₽</span>
      <span class="e22-bar"><span style="width:${(EVENTS22.reached(ny) / ny.rewards.length) * 100}%"></span></span>
      <img class="e22-widget-icon" src="${CURRENCY_ICONS.snow}" alt="">
      ${badgeHTML(nyCount)}
    </button>
    <button class="e22-entry" data-event="daily">
      <span class="e22-entry-glow"></span>
      <span class="e22-entry-label">${daily.title}</span>
      <img class="e22-entry-icon" src="${CURRENCY_ICONS.leaf}" alt="">
      <span class="e22-bar e22-bar-thin"><span style="width:${(EVENTS22.reached(daily) / daily.rewards.length) * 100}%"></span></span>
      ${badgeHTML(dailyCount)}
    </button>`;
  // бейдж «впрыгивает», когда валюта пришла из заданий
  if (pulse) {
    [['ny', nyCount, prevNy], ['daily', dailyCount, prevDaily]].forEach(([id, count, prev]) => {
      const badge = e22Entries.querySelector(`[data-event="${id}"] .e22-badge`);
      if (badge && (!prev || prev.textContent !== String(count))) {
        badge.animate([{ transform: 'scale(0)' }, { transform: 'scale(1.5)' }, { transform: 'scale(1)' }], { duration: 420, delay: 400, easing: 'ease-out', fill: 'backwards' });
      }
    });
  }
}

/* ---------- Трек ---------- */

function e22LevelCenter(level) {
  return E22_FIRST + (level - 1) * E22_STEP;
}

function e22FillHeight(reached) {
  return Math.max(0, (reached ? e22LevelCenter(reached) : E22_LINE_TOP) - E22_LINE_TOP);
}

function e22LevelHTML(ev, level) {
  const type = ev.rewards[level - 1];
  const isReached = ev.shown >= level;
  const isTaken = ev.claimed.has(level);
  const side = level % 2 ? 'is-left' : 'is-right';
  const state = !isReached ? 'is-locked' : isTaken ? 'is-taken' : 'is-claimable';
  const item = REWARD_ITEMS[type];
  let action = '';
  if (isTaken) action = `<span class="ev-card-taken" aria-label="Получено">${CHECK_ICON}</span>`;
  else if (isReached) action = `<button class="ev-card-claim" data-level="${level}">Забрать</button>`;
  return `<div class="ev-level ${side} ${state}${isReached ? ' is-reached' : ''}" data-level="${level}" style="top:${e22LevelCenter(level) - 70}px">
    <span class="ev-link"></span>
    <span class="ev-node">${level}</span>
    <div class="ev-card">
      <img class="ev-card-hex" src="assets/${isReached ? 'v2-event-hex-active.svg' : 'v2-event-hex.svg'}" alt="">
      <img class="ev-card-item" src="${item.src}" alt="${item.alt}">
      ${action}
    </div>
  </div>`;
}

function renderTrack22(ev) {
  const n = ev.rewards.length;
  const height = e22LevelCenter(n) + 70 + 40;
  e22Track.innerHTML = `
    <div class="ev-track e22-track" style="height:${height}px">
      <img class="e22-pin" src="assets/${isAppVersion('2.2') ? 'v2-event-pin.svg' : 'v2-event-pin-blue.svg'}" alt="">
      <img class="e22-pin-icon" src="${CURRENCY_ICONS[ev.currency]}" alt="">
      <span class="ev-track-line" style="top:${E22_LINE_TOP}px;height:${height - E22_LINE_TOP - 20}px"></span>
      <span class="ev-track-fill" style="top:${E22_LINE_TOP}px;height:${e22FillHeight(ev.shown)}px"></span>
      ${ev.rewards.map((_, i) => e22LevelHTML(ev, i + 1)).join('')}
    </div>`;
}

// как в 2.1: полоска едет к новым уровням, награды по пути «включаются»
async function animateTrack22(ev) {
  const target = EVENTS22.reached(ev);
  if (e22Animating || ev.shown >= target) return;
  e22Animating = true;
  const fill = e22Track.querySelector('.ev-track-fill');
  while (ev.shown < target && e22Current === ev) {
    const level = ev.shown + 1;
    const levelEl = e22Track.querySelector(`.ev-level[data-level="${level}"]`);
    const r = levelEl.getBoundingClientRect();
    const box = e22Scroll.getBoundingClientRect();
    if (r.bottom > box.bottom - 24) e22Scroll.scrollTo({ top: e22Scroll.scrollTop + r.bottom - box.bottom + 80, behavior: 'smooth' });
    await fill.animate(
      [{ height: `${e22FillHeight(level - 1)}px` }, { height: `${e22FillHeight(level)}px` }],
      { duration: 520, easing: 'cubic-bezier(0.45, 0, 0.25, 1)', fill: 'forwards' }
    ).finished;
    fill.style.height = `${e22FillHeight(level)}px`;
    fill.getAnimations().forEach((a) => a.cancel());
    ev.shown = level;
    levelEl.outerHTML = e22LevelHTML(ev, level);
    const fresh = e22Track.querySelector(`.ev-level[data-level="${level}"]`);
    const card = fresh.querySelector('.ev-card');
    card.classList.add('is-activated');
    card.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.12)' }, { transform: 'scale(1)' }], { duration: 360, easing: 'cubic-bezier(0.34, 1.32, 0.42, 1)' });
    fresh.querySelector('.ev-node').animate([{ transform: 'scale(1)' }, { transform: 'scale(1.4)' }, { transform: 'scale(1)' }], { duration: 320, easing: 'ease-out' });
    await wait(260);
  }
  e22Animating = false;
}

/* ---------- Экран события ---------- */

function e22DailyTimer() {
  const now = new Date();
  return formatLeft(resetTimes(now).daily - now);
}

function openEvent22(id) {
  const ev = EVENTS22.list[id];
  e22Current = ev;
  // 2.1: синяя тема трека, бейдж над заголовком и кнопка «К заданиям»
  e22Screen.classList.toggle('is-v21', !isAppVersion('2.2'));
  e22Screen.style.setProperty('--c1', ev.colors[0]);
  e22Screen.style.setProperty('--c2', ev.colors[1]);
  document.getElementById('e22Title').textContent = ev.title;
  const heading = document.getElementById('e22Heading');
  heading.textContent = ev.heading;
  heading.hidden = !ev.heading;
  document.getElementById('e22Desc').innerHTML = ev.desc;
  document.getElementById('e22BadgeText').textContent = ev.badge || e22DailyTimer();
  renderTrack22(ev);
  e22Scroll.scrollTop = 0;
  e22Screen.classList.add('is-open');
  e22Screen.setAttribute('aria-hidden', 'false');
  setTimeout(() => animateTrack22(ev), 520);
}

function closeEvent22() {
  e22Current = null;
  e22Screen.classList.remove('is-open');
  e22Screen.setAttribute('aria-hidden', 'true');
  renderEntries22();
}

let e22ClaimBusy = false;
e22Track.addEventListener('click', async (e) => {
  const btn = e.target.closest('.ev-card-claim');
  const ev = e22Current;
  if (!btn || !ev || e22ClaimBusy || e22Animating) return;
  e22ClaimBusy = true;
  const level = Number(btn.dataset.level);
  const card = btn.closest('.ev-card');
  await card.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.92)' }, { transform: 'scale(1.06)' }, { transform: 'scale(1)' }], { duration: 320, easing: 'ease-out' }).finished;
  await openGiftOverlay();
  ev.claimed.add(level);
  const levelEl = e22Track.querySelector(`.ev-level[data-level="${level}"]`);
  levelEl.outerHTML = e22LevelHTML(ev, level);
  e22Track.querySelector(`.ev-level[data-level="${level}"] .ev-card`).classList.add('is-pop');
  e22ClaimBusy = false;
});

e22Entries.addEventListener('click', (e) => {
  const entry = e.target.closest('[data-event]');
  if (!entry) return;
  entry.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.95)' }, { transform: 'scale(1)' }], { duration: 220, easing: 'ease-out' });
  openEvent22(entry.dataset.event);
});

document.getElementById('e22Back').addEventListener('click', closeEvent22);
document.getElementById('e22Info').addEventListener('click', () => {
  if (!isAppVersion('2.2')) openNyIntro();
});

// «К заданиям»: задания — единый источник снежинок
document.getElementById('e22Cta').addEventListener('click', () => {
  closeEvent22();
  showScreen('tasks');
});

/* ---------- 2.1: правила при первом входе ---------- */

const NY_INTRO_KEY = 'v2.nyIntroSeen';
const nyIntroEl = document.getElementById('nyIntro');
let nyIntroThen = null;

function openNyIntro(then) {
  nyIntroThen = then || null;
  nyIntroEl.classList.add('is-open');
  nyIntroEl.setAttribute('aria-hidden', 'false');
}

function closeNyIntro() {
  nyIntroEl.classList.remove('is-open');
  nyIntroEl.setAttribute('aria-hidden', 'true');
  try {
    localStorage.setItem(NY_INTRO_KEY, '1');
  } catch (e) {
    /* без хранилища правила просто покажутся снова */
  }
  if (nyIntroThen) setTimeout(nyIntroThen, 120);
  nyIntroThen = null;
}

function nyIntroSeen() {
  try {
    return localStorage.getItem(NY_INTRO_KEY) === '1';
  } catch (e) {
    return false;
  }
}

// виджет на главной (2.1): первый раз — правила, затем событие
function openNyFromHome() {
  if (nyIntroSeen()) openEvent22('ny');
  else openNyIntro(() => openEvent22('ny'));
}

document.getElementById('nyIntroClose').addEventListener('click', closeNyIntro);
document.getElementById('nyIntroCta').addEventListener('click', closeNyIntro);
e22Scroll.addEventListener('scroll', () => e22Scroll.classList.toggle('is-scrolled', e22Scroll.scrollTop > 2), { passive: true });

setInterval(() => {
  if (e22Current && !e22Current.badge) document.getElementById('e22BadgeText').textContent = e22DailyTimer();
}, 1000);

renderEntries22();
if (INITIAL_HASH === 'event' && !isAppVersion('2.2')) openNyFromHome();
