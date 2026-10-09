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
  const height = e22LevelCenter(n) + 70 + 40;
  e22Track.innerHTML = `
    <div class="ev-track e22-track" style="height:${height}px">
      <img class="e22-pin" src="assets/v2-event-pin-blue.svg" alt="">
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
  renderTrack22(ev);
  // 2.1 — только трек; 2.2 — сначала вкладка «Задания» события
  const tabbed = isAppVersion('2.2') && ev.id === 'ny';
  if (tabbed) renderNyTasks22();
  e22Tabs.select(tabbed ? 'tasks' : 'rewards');
  if (tabbed) updateRewardsDot22();
  if (isAppVersion('2.3') && ev.id === 'ny') renderPreview23();
  e22Scroll.scrollTop = 0;
  e22Screen.classList.add('is-open');
  e22Screen.setAttribute('aria-hidden', 'false');
  if (!tabbed) setTimeout(() => animateTrack22(ev), 520);
}

function closeEvent22() {
  e22Current = null;
  e22Screen.classList.remove('is-open');
  e22Screen.setAttribute('aria-hidden', 'true');
  renderEntries22();
}

/* ---------- 2.3: превью заданий со снежинками ---------- */

const e23Preview = document.getElementById('e23Preview');

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

  // игровая цепочка из ромбов: закрашенные — выполненные, пустые — доступные;
  // линия между ними заполняется до последнего выполненного
  const nodes = pack.map((_, i) => {
    const state = i < done ? 'is-done' : i < completed ? 'is-ready' : '';
    const inner = i < completed ? CHECK_ICON : `<span>${i + 1}</span>`;
    return `<span class="e23-gem ${state}" style="--i:${i}"><span class="e23-gem-in">${inner}</span></span>`;
  }).join('');
  const fill = total > 1 ? (Math.max(0, completed - 1) / (total - 1)) * 100 : 0;

  const timer = `<span class="tasks-timer-badge">${CLOCK_SVG}<span>Обновятся через <span data-e23-timer>${packTimer23()}</span></span></span>`;
  const caption = finished
    ? '<p class="e23-count is-finished">Все задания на сегодня выполнены</p>'
    : `<p class="e23-count">Выполнено <b>${completed}</b> из ${total}</p>`;
  const cta = ready ? `Забрать награды · ${ready}` : 'К заданиям';

  e23Preview.classList.toggle('is-finished', !!finished);
  e23Preview.innerHTML = `
    <div class="e23-head"><span class="e23-title">Новогодние задания</span></div>
    <div class="e23-sub">${timer}</div>
    <div class="e23-chain">
      <span class="e23-chain-line"><span style="width:${fill}%"></span></span>
      ${nodes}
    </div>
    ${caption}
    <button class="e23-all${finished ? ' is-ghost' : ''}" data-tab="daily">${cta}</button>
    <button class="e23-demo" id="e23Demo">${finished ? 'Демо: вернуть начало дня' : 'Демо: выполнить все'}</button>`;
}

// таймер до новой пачки тикает, пока превью на экране
setInterval(() => {
  if (!e22Current || !isAppVersion('2.3')) return;
  e23Preview.querySelectorAll('[data-e23-timer]').forEach((el) => { el.textContent = packTimer23(); });
}, 1000);

let e23Saved = null;

e23Preview.addEventListener('click', (e) => {
  if (e.target.closest('#e23Demo')) {
    // демо: закрываем дневную пачку, чтобы увидеть состояние «завтра»; повторно — откат
    const pack = snowPack23();
    if (e23Saved) {
      pack.forEach(({ task, snow }) => {
        const was = e23Saved.get(task.id);
        if (was.state !== 'done') EVENTS22.list.ny.points -= snow;
        Object.assign(task, was);
      });
      e23Saved = null;
      renderPreview23();
      TASKS22_RERENDER();
      renderTrack22(EVENTS22.list.ny);
      return;
    }
    e23Saved = new Map(pack.map(({ task }) => [task.id, { state: task.state, status: task.status }]));
    pack.forEach(({ task, snow }) => {
      if (task.state !== 'done') EVENTS22.addCurrency('snow', snow);
      task.state = 'done';
      task.status = 'Выполнено сегодня';
    });
    renderPreview23();
    TASKS22_RERENDER();
    setTimeout(() => animateTrack22(EVENTS22.list.ny), 300);
    return;
  }
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
