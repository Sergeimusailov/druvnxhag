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
      // 2.1: подзаголовок с описанием розыгрыша
      descV21: 'Выполняйте задания, копите снежинки и получайте билеты на розыгрыш. Больше билетов — больше шансов на выигрыш',
      tickets: 12,
      badge: 'До 1 января',
      colors: ['#3133c2', '#709dff'],
      currency: 'snow',
      step: 10,
      // вехи и пороги в снежинках (таблица баланса): шаг 40 → 60 → 100 → 120,
      // финал — 1600. В день 5 заданий по 20 = 100; за ивент можно набрать 2200,
      // так что до финала доходят и с пропусками
      thresholds: [40, 80, 120, 160, 200, 260, 320, 380, 440, 500, 600, 700, 800, 900, 1000, 1120, 1240, 1360, 1480, 1600],
      points: 100,
      // 2.3: сколько снежинок игрок уже «видел» в событии — остальные
      // прилетают анимацией при следующем входе
      seenPoints: 100,
      shown: 2,
      claimed: new Set([1]),
      rewards: ['coins', 'avatar', 'frame', 'coins', 'card', 'avatar', 'ticket', 'frame', 'coins', 'ticket',
        'skin', 'coins', 'card', 'ticket', 'coins+frame', 'coins+skin', 'ticket', 'coins+avatar', 'coins+card', 'ticket'],
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
  // версия 2.2: свои задания внутри «Новогоднего события» — дают снежинки
  nyTasks: [
    { id: 'ny-play5', title: 'Сыграйте 5 матчей', status: 'Заберите до 1 января', state: 'claimable', rewards: [['snow', 10]] },
    { id: 'ny-win3', title: 'Выиграйте 3 матча', status: 'Заберите до 1 января', state: 'claimable', rewards: [['snow', 10]] },
    { id: 'ny-capture', title: 'Захватите 30 карт соперника', status: 'До 1 января', progress: [12, 30], progressLabel: '12 / 30', rewards: [['snow', 10]] },
    { id: 'ny-combo', title: 'Сделайте 10 прострелов', status: 'До 1 января', progress: [3, 10], rewards: [['snow', 10]] },
    { id: 'ny-deck', title: 'Соберите новую колоду', status: 'До 1 января', progress: [0, 1], rewards: [['snow', 10]] },
    { id: 'ny-first', title: 'Сыграйте первый матч события', status: 'Выполнено', state: 'done', rewards: [['snow', 10]] },
  ],

  // порог снежинок для уровня (1..N)
  threshold(ev, level) {
    return ev.thresholds ? ev.thresholds[level - 1] : level * ev.step;
  },

  reached(ev) {
    if (ev.thresholds) return ev.thresholds.filter((t) => ev.points >= t).length;
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
  // счётчик наград, которые можно забрать (Figma 16029:68501)
  const widgetBadge = document.getElementById('eventWidgetBadge');
  if (widgetBadge) {
    const n = EVENTS22.claimable(nyEv);
    const grew = n && (widgetBadge.hidden || Number(widgetBadge.textContent) < n);
    widgetBadge.textContent = n;
    widgetBadge.hidden = !n;
    if (grew && pulse) {
      widgetBadge.animate([{ transform: 'scale(0)' }, { transform: 'scale(1.5)' }, { transform: 'scale(1)' }], { duration: 420, delay: 400, easing: 'ease-out', fill: 'backwards' });
    }
  }
  renderEventFab23();
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

/* ---------- 2.3: кнопка события в углу «Заданий» ---------- */

// ближайший приз трека и сколько снежинок до него; если приз уже можно
// забрать — показываем его с «Забрать» и бейджем
const eventFab = document.getElementById('eventFab');
let eventFabFrac = null;

function renderEventFab23() {
  if (!eventFab) return;
  const ev = EVENTS22.list.ny;
  const reached = EVENTS22.reached(ev);
  const claimable = EVENTS22.claimable(ev);
  const firstUnclaimed = ev.rewards.findIndex((_, i) => i < reached && !ev.claimed.has(i + 1));
  const level = claimable ? firstUnclaimed + 1 : Math.min(reached + 1, ev.rewards.length);
  const [main, extra] = ev.rewards[level - 1].split('+').reverse();
  document.getElementById('eventFabPrize').src = REWARD_ITEMS[main].src;
  const extraEl = document.getElementById('eventFabExtra');
  extraEl.hidden = !extra;
  if (extra) extraEl.src = REWARD_ITEMS[extra].src;
  const fill = document.getElementById('eventFabFill');
  const text = document.getElementById('eventFabText');
  let frac;
  if (claimable) {
    frac = 1;
    text.textContent = 'Забрать';
  } else {
    const prev = level > 1 ? EVENTS22.threshold(ev, level - 1) : 0;
    const next = EVENTS22.threshold(ev, level);
    frac = Math.min(1, Math.max(0, (ev.points - prev) / (next - prev)));
    text.textContent = `${ev.points}/${next}`;
  }
  // полоска доезжает плавно, когда снежинки пришли из заданий
  fill.animate([{ width: `${(eventFabFrac ?? frac) * 100}%` }, { width: `${frac * 100}%` }], { duration: 700, easing: 'cubic-bezier(0.45, 0, 0.25, 1)', fill: 'forwards' });
  eventFabFrac = frac;
  eventFab.classList.toggle('is-claimable', !!claimable);
  // красный счётчик — тот же, что на виджете события на главной, и так же «впрыгивает»
  const badge = document.getElementById('eventFabBadge');
  const grew = claimable && (badge.hidden || Number(badge.textContent) < claimable);
  badge.hidden = !claimable;
  badge.textContent = claimable;
  if (grew && !eventFab.hidden) badge.animate([{ transform: 'scale(0)' }, { transform: 'scale(1.5)' }, { transform: 'scale(1)' }], { duration: 420, delay: 300, easing: 'ease-out', fill: 'backwards' });
}

function syncEventFab23(screen) {
  if (!eventFab) return;
  const show = isAppVersion('2.3') && screen === 'tasks';
  if (show === !eventFab.hidden) return;
  eventFab.hidden = !show;
  if (show) eventFab.animate([{ transform: 'scale(0.4)', opacity: 0 }, { transform: 'scale(1.08)', opacity: 1, offset: 0.7 }, { transform: 'scale(1)' }], { duration: 380, easing: 'ease-out' });
}

document.addEventListener('v2:screen', (e) => syncEventFab23(e.detail.screen));
eventFab?.addEventListener('click', () => {
  eventFab.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.92)' }, { transform: 'scale(1)' }], { duration: 200, easing: 'ease-out' });
  openEvent22('ny');
});

/* ---------- Трек ---------- */

// 2.3: забранные вехи в начале трека сворачиваются в одну строку, чтобы
// сразу под счётчиком стояла ближайшая награда впереди
const E23_ROW_TOP = 118;
const E23_AFTER_ROW = 226;
let e22Collapsed = 0;
let e22Expanded = false;

function e22LevelCenter(level) {
  if (!e22Collapsed) return E22_FIRST + (level - 1) * E22_STEP;
  if (level <= e22Collapsed) return E23_ROW_TOP + 18;
  return E23_AFTER_ROW + (level - e22Collapsed - 1) * E22_STEP;
}

function isNy23(ev) {
  return isAppVersion('2.3') && ev.id === 'ny';
}

// розыгрыш в конце трека: билеты с трека собраны / ещё нет
function e23FinaleHTML(ev) {
  const tickets = ev.rewards.map((r, i) => (r === 'ticket' ? i + 1 : 0)).filter(Boolean);
  const got = tickets.filter((l) => ev.claimed.has(l)).length;
  const all = got === tickets.length;
  const icons = tickets.map((l) => `<img class="${ev.claimed.has(l) ? 'is-got' : ''}" src="assets/v2-ticket-icon.png" alt="">`).join('');
  const body = all
    ? `<p class="e23-fin-title">Вы собрали все билеты!</p>
       <p class="e23-fin-text">Розыгрыш 10 000 000 ₽ пройдёт 25 декабря. Чем больше билетов — тем выше шанс</p>`
    : `<p class="e23-fin-title">Разыгрываем 10 000 000 ₽</p>
       <p class="e23-fin-text">Соберите все ${tickets.length} билетов на треке и участвуйте в розыгрыше 25 декабря</p>`;
  return `<div class="e23-fin${all ? ' is-all' : ''}">
      <div class="e23-fin-tickets">${icons}</div>
      <p class="e23-fin-count">Билеты с трека: <b>${got} из ${tickets.length}</b></p>
      ${body}
      <button class="e23-fin-about" data-about>О розыгрыше</button>
    </div>
    <button class="e23-demo e23-fin-demo" data-fill-track>Демо: заполнить трек</button>`;
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
  // составная награда «монетки + X»: X крупно, монетки — значком в углу
  const [main, extra] = type.split('+').reverse();
  const item = REWARD_ITEMS[main];
  const extraHTML = extra ? `<img class="ev-card-extra" src="${REWARD_ITEMS[extra].src}" alt="${REWARD_ITEMS[extra].alt}">` : '';
  // в ромбе — не номер уровня, а сколько снежинок нужно набрать
  const label = ev.thresholds ? ev.thresholds[level - 1] : level;
  let action = '';
  if (isTaken) action = `<span class="ev-card-taken" aria-label="Получено">${CHECK_ICON}</span>`;
  else if (isReached) action = `<button class="ev-card-claim" data-level="${level}">Забрать</button>`;
  return `<div class="ev-level ${side} ${state}${isReached ? ' is-reached' : ''}" data-level="${level}" style="top:${e22LevelCenter(level) - 70}px">
    <span class="ev-link"></span>
    <span class="ev-node${ev.thresholds ? ' is-cost' : ''}">${label}</span>
    <div class="ev-card">
      <img class="ev-card-hex" src="assets/${isReached ? 'v2-event-hex-active.svg' : 'v2-event-hex.svg'}" alt="">
      <img class="ev-card-item" src="${item.src}" alt="${item.alt}">${extraHTML}
      ${action}
    </div>
  </div>`;
}

function renderTrack22(ev) {
  const n = ev.rewards.length;
  const ny23 = isNy23(ev);
  e22Collapsed = 0;
  if (ny23 && !e22Expanded) {
    while (e22Collapsed < n && ev.claimed.has(e22Collapsed + 1)) e22Collapsed++;
  }
  const k = e22Collapsed;
  const lineEnd = e22LevelCenter(n) + 70 + 20;
  const height = lineEnd + (ny23 ? 330 : 20);
  const plural = (m) => (m % 10 === 1 && m % 100 !== 11 ? 'награда' : m % 10 >= 2 && m % 10 <= 4 && (m % 100 < 10 || m % 100 >= 20) ? 'награды' : 'наград');
  const row = k ? `<button class="e23-collapsed" style="top:${E23_ROW_TOP}px">${CHECK_ICON}Получено ${k} ${plural(k)}<span>Показать</span></button>` : '';
  const levels = ev.rewards.map((_, i) => i + 1).filter((l) => l > k);
  e22Track.innerHTML = `
    <div class="ev-track e22-track" style="height:${height}px">
      <img class="e22-pin" src="assets/v2-event-pin-blue.svg" alt="">
      <img class="e22-pin-icon" src="${CURRENCY_ICONS[ev.currency]}" alt="">
      <span class="e23-stem"></span>
      <span class="e23-hex"><span class="e23-hex-in"><img src="${CURRENCY_ICONS[ev.currency]}" alt=""><span data-pin-count>${ev.seenPoints ?? ev.points}</span></span></span>
      <span class="ev-track-line" style="top:${E22_LINE_TOP}px;height:${lineEnd - E22_LINE_TOP - 20}px"></span>
      <span class="ev-track-fill" style="top:${E22_LINE_TOP}px;height:${k === n ? lineEnd - E22_LINE_TOP - 20 : e22FillHeight(ev.shown)}px"></span>
      ${row}
      ${levels.map((l) => e22LevelHTML(ev, l)).join('')}
      ${ny23 ? `<div class="e23-fin-wrap" style="top:${lineEnd + 8}px">${e23FinaleHTML(ev)}</div>` : ''}
    </div>`;
  if (ny23) updateSnowbar23();
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
  if (isAppVersion('2.2')) updateRewardsDot22();
}

/* ---------- Экран события ---------- */

function e22DailyTimer() {
  const now = new Date();
  return formatLeft(resetTimes(now).daily - now);
}

function openEvent22(id) {
  const ev = EVENTS22.list[id];
  e22Current = ev;
  e22Expanded = false;
  // 2.1: синяя тема трека, бейдж над заголовком и кнопка «К заданиям»
  e22Screen.classList.add('is-v21');
  e22Screen.style.setProperty('--c1', ev.colors[0]);
  e22Screen.style.setProperty('--c2', ev.colors[1]);
  document.getElementById('e22Title').textContent = ev.title;
  const heading = document.getElementById('e22Heading');
  heading.textContent = ev.heading;
  heading.hidden = !ev.heading;
  document.getElementById('e22Desc').innerHTML = ev.descV21 || ev.desc;
  document.getElementById('e22TicketCount').textContent = ev.tickets || 0;
  document.getElementById('e22BadgeText').textContent = ev.badge || e22DailyTimer();
  // 2.3 (Figma 16365:14607): деньги, бейдж «До конца N дней», заголовок в две
  // строки и белая кнопка «Подробнее» — описание розыгрыша спрятано в неё
  const ny23head = isAppVersion('2.3') && ev.id === 'ny';
  if (ny23head) {
    heading.innerHTML = 'Новогоднее событие началось:<br>разыграем 10 000 000 ₽';
    heading.hidden = false;
    document.getElementById('e22BadgeText').textContent = 'До конца 14 дней';
  }
  document.getElementById('e22About').textContent = ny23head ? 'Подробнее' : 'О розыгрыше';
  renderTrack22(ev);
  // 2.1 — только трек; 2.2 — сначала вкладка «Задания» события
  const tabbed = isAppVersion('2.2') && ev.id === 'ny';
  if (tabbed) renderNyTasks22();
  e22Tabs.select(tabbed ? 'tasks' : 'rewards');
  if (tabbed) updateRewardsDot22();
  if (isNy23(ev)) renderPreview23();
  e22Scroll.scrollTop = 0;
  e22Screen.classList.add('is-open');
  e22Screen.setAttribute('aria-hidden', 'false');
  // 2.3: сначала прилетают снежинки, заработанные в «Заданиях», потом едет трек
  if (isNy23(ev)) setTimeout(() => playSnow23(ev).then(() => animateTrack22(ev)), 520);
  else if (!tabbed) setTimeout(() => animateTrack22(ev), 520);
}

function closeEvent22() {
  e22Current = null;
  e22Screen.classList.remove('is-open');
  e22Screen.setAttribute('aria-hidden', 'true');
  renderEntries22();
}

/* ---------- 2.3: превью заданий со снежинками ---------- */

const e23Preview = document.getElementById('e23Preview');
const e23Demo = document.getElementById('e23Demo');

// дневная пачка снежинок: задания из дейликов, у которых в награде снежинки
function snowPack23() {
  return TASK_TABS.daily.tasks
    .filter((t) => (t.rewards || []).some(([cur]) => cur === 'snow'))
    .map((t) => ({ task: t, snow: t.rewards.find(([cur]) => cur === 'snow')[1] }));
}

function packTimer23() {
  const now = new Date();
  return formatLeft(resetTimes(now).daily - now);
}

function renderPreview23() {
  const pack = snowPack23();
  const total = pack.length;
  const done = pack.filter((i) => i.task.state === 'done').length;
  const ready = pack.filter((i) => i.task.state === 'claimable').length;
  // выполненным считается и задание, награду за которое ещё не забрали
  const completed = done + ready;
  const finished = total && completed === total && !ready;

  // задания — отдельные круги без перемычек (это не прогрессия): зелёный с
  // галкой — выполнено (с жёлтым ободком — награду ещё не забрали), тёмный со
  // снежинкой и «+20» — ещё можно сделать
  const nodes = pack.map(({ snow }, i) => {
    const state = i < done ? 'is-done' : i < completed ? 'is-ready' : '';
    const inner = i < completed ? CHECK_ICON : `<img src="${CURRENCY_ICONS.snow}" alt=""><span class="e23-dot-label">+${snow}</span>`;
    return `<span class="e23-dot ${state}">${inner}</span>`;
  }).join('');

  // вся карточка ведёт в «Задания»; таймер — бейдж справа от заголовка
  const label = ready ? `Задания дня. Забрать награды: ${ready}` : 'Задания дня. Перейти к заданиям';
  e23Preview.classList.toggle('is-finished', !!finished);
  e23Preview.innerHTML = `
    <button class="e23-card-link" data-tab="daily" aria-label="${label}"></button>
    <div class="e23-top">
      <span class="e23-title">Задания дня</span>
      <span class="e23-timer-badge">${CLOCK_SVG}<span data-e23-timer>${packTimer23()}</span></span>
    </div>
    <div class="e23-tasks">${nodes}</div>`;
  e23Demo.textContent = finished ? 'Демо: вернуть начало дня' : 'Демо: выполнить все';
}

// таймер до новой пачки тикает, пока превью на экране
setInterval(() => {
  if (!e22Current || !isAppVersion('2.3')) return;
  e23Preview.querySelectorAll('[data-e23-timer]').forEach((el) => { el.textContent = packTimer23(); });
}, 1000);

let e23Saved = null;
// сколько выполненных заданий игрок уже видел в событии — из новых
// кружков вылетают снежинки
let e23SeenDone = snowPack23().filter((i) => i.task.state === 'done').length;

function updateSnowbar23(value) {
  const ev = EVENTS22.list.ny;
  const v = value ?? ev.seenPoints ?? ev.points;
  document.getElementById('e23SnowbarCount').textContent = v;
  const pin = e22Track.querySelector('[data-pin-count]');
  if (pin) pin.textContent = v;
}

// отложенный полёт: снежинки из заданий, выполненных с прошлого захода,
// летят из кружков в счётчик, число накручивается
async function playSnow23(ev) {
  const from = ev.seenPoints ?? ev.points;
  const to = ev.points;
  const doneNow = snowPack23().filter((i) => i.task.state === 'done').length;
  if (to <= from || e22Current !== ev) {
    ev.seenPoints = to;
    e23SeenDone = doneNow;
    updateSnowbar23();
    return;
  }
  const hex = e22Track.querySelector('.e23-hex');
  const target = centerOf(hex.querySelector('img'));
  let dots = Array.from(e23Preview.querySelectorAll('.e23-dot.is-done')).slice(e23SeenDone);
  if (!dots.length) dots = [e23Preview.querySelector('.e23-tasks')];
  const flights = [];
  dots.forEach((dot, di) => {
    dot.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.25)' }, { transform: 'scale(1)' }], { duration: 320, delay: di * 160, easing: 'ease-out' });
    const src = centerOf(dot);
    for (let i = 0; i < 3; i++) {
      flights.push(TASKS22.flyIcon(CURRENCY_ICONS.snow, src, target, di * 160 + i * 80).then(() => {
        hex.animate([{ transform: 'translateX(-50%) scale(1)' }, { transform: 'translateX(-50%) scale(1.15)' }, { transform: 'translateX(-50%) scale(1)' }], { duration: 240, easing: 'ease-out' });
        burstAt(target);
      }));
    }
  });
  // число растёт, пока летят снежинки
  const start = performance.now();
  const total = 900 + dots.length * 160;
  await new Promise((resolve) => {
    (function tick(now) {
      const t = Math.min(1, Math.max(0, (now - start) / total));
      updateSnowbar23(Math.round(from + (to - from) * easeOutCubic(t)));
      if (t < 1) requestAnimationFrame(tick);
      else resolve();
    })(start);
  });
  await Promise.all(flights);
  ev.seenPoints = to;
  e23SeenDone = doneNow;
  updateSnowbar23();
}

// демо — над карточкой, чтобы она оставалась компактной
e23Demo.addEventListener('click', () => {
  const ev = EVENTS22.list.ny;
  const pack = snowPack23();
  if (e23Saved) {
    // откат: возвращаем начало дня без анимаций
    pack.forEach(({ task, snow }) => {
      const was = e23Saved.get(task.id);
      if (was.state !== 'done') ev.points -= snow;
      Object.assign(task, was);
    });
    e23Saved = null;
    ev.seenPoints = ev.points;
    ev.shown = Math.min(ev.shown, EVENTS22.reached(ev));
    e23SeenDone = pack.filter((i) => i.task.state === 'done').length;
    renderPreview23();
    TASKS22_RERENDER();
    renderTrack22(ev);
    renderEntries22();
    return;
  }
  e23Saved = new Map(pack.map(({ task }) => [task.id, { state: task.state, status: task.status }]));
  pack.forEach(({ task, snow }) => {
    if (task.state !== 'done') ev.points += snow;
    task.state = 'done';
    task.status = 'Выполнено сегодня';
  });
  renderEntries22(true);
  renderPreview23();
  TASKS22_RERENDER();
  playSnow23(ev).then(() => animateTrack22(ev));
});

// свёрнутые вехи, «О розыгрыше» и демо заполнения трека
e22Track.addEventListener('click', (e) => {
  const ev = e22Current;
  if (!ev) return;
  if (e.target.closest('.e23-collapsed')) {
    e22Expanded = true;
    renderTrack22(ev);
  } else if (e.target.closest('[data-about]')) {
    openNyIntro();
  } else if (e.target.closest('[data-fill-track]')) {
    ev.rewards.forEach((r, i) => {
      if (!ev.claimed.has(i + 1) && r === 'ticket') ev.tickets += 1;
      ev.claimed.add(i + 1);
    });
    ev.points = Math.max(ev.points, ev.thresholds[ev.thresholds.length - 1]);
    ev.seenPoints = ev.points;
    ev.shown = ev.rewards.length;
    document.getElementById('e22TicketCount').textContent = ev.tickets;
    e22Expanded = false;
    renderTrack22(ev);
    renderEntries22();
    const fin = e22Track.querySelector('.e23-fin');
    e22Scroll.scrollTo({ top: e22Scroll.scrollTop + fin.getBoundingClientRect().top - 140, behavior: 'smooth' });
  }
});

// счётчик снежинок закрепляется в шапке, когда шестигранник уехал под неё
const e22Appbar = e22Scroll.querySelector('.v2-appbar');
e22Scroll.addEventListener('scroll', () => {
  const hex = e22Track.querySelector('.e23-hex');
  const on = !!(hex && e22Current && isNy23(e22Current) && hex.getBoundingClientRect().bottom < e22Appbar.getBoundingClientRect().bottom);
  e22Appbar.classList.toggle('is-snow', on);
}, { passive: true });

e23Preview.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-tab]');
  if (!btn) return;
  closeEvent22();
  showScreen('tasks');
  tasksTabs.select(btn.dataset.tab);
});

/* ---------- 2.2: вкладки «Задания» / «Награды» ---------- */

const e22TasksPanel = document.getElementById('e22TasksPanel');
const e22RewardsDot = document.getElementById('e22RewardsDot');
const e22RewardsChip = document.querySelector('#e22SegRow [data-tab="rewards"]');

const e22Tabs = createChipTabs(document.getElementById('e22SegRow'), document.getElementById('e22TabTrack'), (tab) => {
  // трек едет к новым наградам, когда открываешь вкладку «Награды»
  if (tab === 'rewards' && e22Current) setTimeout(() => animateTrack22(e22Current), 480);
});

function renderNyTasks22() {
  const tasks = EVENTS22.nyTasks;
  const active = tasks.filter((t) => t.state !== 'done');
  active.sort((a, b) => (b.state === 'claimable') - (a.state === 'claimable'));
  const done = tasks.filter((t) => t.state === 'done');
  e22TasksPanel.innerHTML = `
    <div class="tasks-list" data-list="active">${active.map((t) => TASKS22.taskHTML(t)).join('')}</div>
    <h2 class="tasks-done-title"${done.length ? '' : ' hidden'}>Выполненные</h2>
    <div class="tasks-list" data-list="done">${done.map((t) => TASKS22.taskHTML(t)).join('')}</div>`;
}

function updateRewardsDot22() {
  const ev = EVENTS22.list.ny;
  // точка — пока есть уровни, до которых трек ещё не доехал или что забрать
  const n = EVENTS22.claimable(ev) + Math.max(0, EVENTS22.reached(ev) - ev.shown);
  const appeared = n && e22RewardsDot.hidden;
  e22RewardsDot.hidden = !n;
  if (appeared) e22RewardsDot.animate([{ transform: 'scale(0)' }, { transform: 'scale(1.8)' }, { transform: 'scale(1)' }], { duration: 420, easing: 'ease-out' });
}

// «Забрать» в задании события: снежинки улетают во вкладку «Награды»
let e22TaskBusy = false;
e22TasksPanel.addEventListener('click', async (e) => {
  const btn = e.target.closest('.task-claim');
  if (!btn || e22TaskBusy) return;
  const row = btn.closest('.task');
  const task = EVENTS22.nyTasks.find((t) => t.id === row.dataset.task);
  if (!task || task.state !== 'claimable') return;
  e22TaskBusy = true;
  btn.disabled = true;
  const tile = row.querySelector('.task-reward');
  tile.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.86)' }, { transform: 'scale(1.06)' }, { transform: 'scale(1)' }], { duration: 360, easing: 'ease-out' });
  const from = centerOf(row.querySelector('.t22-reward img'));
  const to = centerOf(e22RewardsChip);
  const flights = [];
  for (let i = 0; i < 5; i++) {
    flights.push(TASKS22.flyIcon(CURRENCY_ICONS.snow, from, to, i * 70).then(() => {
      e22RewardsChip.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.12)' }, { transform: 'scale(1)' }], { duration: 240, easing: 'ease-out' });
      burstAt(to);
    }));
  }
  task.state = 'done';
  task.status = 'Выполнено';
  setTimeout(async () => {
    await collapse(row);
    e22TasksPanel.querySelector('.tasks-done-title').hidden = false;
    const doneList = e22TasksPanel.querySelector('[data-list="done"]');
    doneList.insertAdjacentHTML('afterbegin', TASKS22.taskHTML(task));
    expandIn(doneList.firstElementChild);
  }, 260);
  await Promise.all(flights);
  task.rewards.forEach(([cur, n]) => EVENTS22.addCurrency(cur, n));
  updateRewardsDot22();
  e22TaskBusy = false;
});

let e22ClaimBusy = false;
e22Track.addEventListener('click', async (e) => {
  const btn = e.target.closest('.ev-card-claim');
  const ev = e22Current;
  if (!btn || !ev || e22ClaimBusy || e22Animating) return;
  e22ClaimBusy = true;
  const level = Number(btn.dataset.level);
  const card = btn.closest('.ev-card');
  await card.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.92)' }, { transform: 'scale(1.06)' }, { transform: 'scale(1)' }], { duration: 320, easing: 'ease-out' }).finished;
  const counter = document.getElementById('e22Tickets');
  const isTicket = ev.rewards[level - 1] === 'ticket' && ev.tickets !== undefined && counter.offsetParent;
  if (isTicket) {
    // билет без экрана подарка: несколько билетиков улетают прямо в счётчик в шапке
    const from = centerOf(card.querySelector('.ev-card-item'));
    const to = centerOf(counter.querySelector('img'));
    const flights = [];
    for (let i = 0; i < 4; i++) {
      flights.push(TASKS22.flyIcon('assets/v2-ticket-icon.png', from, to, i * 90).then(() => {
        counter.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.2)' }, { transform: 'scale(1)' }], { duration: 260, easing: 'ease-out' });
        burstAt(to);
      }));
    }
    await Promise.all(flights);
    ev.tickets += 1;
    document.getElementById('e22TicketCount').textContent = ev.tickets;
  } else {
    // сундук — как раньше, через экран подарка
    await openGiftOverlay();
  }
  ev.claimed.add(level);
  const levelEl = e22Track.querySelector(`.ev-level[data-level="${level}"]`);
  levelEl.outerHTML = e22LevelHTML(ev, level);
  e22Track.querySelector(`.ev-level[data-level="${level}"] .ev-card`).classList.add('is-pop');
  if (isAppVersion('2.2')) updateRewardsDot22();
  e22ClaimBusy = false;
});

e22Entries.addEventListener('click', (e) => {
  const entry = e.target.closest('[data-event]');
  if (!entry) return;
  entry.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.95)' }, { transform: 'scale(1)' }], { duration: 220, easing: 'ease-out' });
  openEvent22(entry.dataset.event);
});

document.getElementById('e22Back').addEventListener('click', closeEvent22);
document.getElementById('e22Info').addEventListener('click', () => {});
// 2.1: правила розыгрыша — по кнопке «О розыгрыше»
document.getElementById('e22About').addEventListener('click', () => openNyIntro());

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
if (INITIAL_HASH === 'event') openNyFromHome();
syncEventFab23(currentScreen);
