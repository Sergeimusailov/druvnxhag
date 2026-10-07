// Новогодний ивент: баннер на главной → раздел с вкладками «Задания» и «Награды».
// Очки за задания двигают трек наград, как в батл-пассе: 1 очко = 1 уровень.
// Данные демо и хранятся в памяти — после перезагрузки всё начинается заново.

const EVENT_INTRO_KEY = 'v2.eventIntroSeen';

const EVENT = {
  points: 2,
  claimed: new Set([1]),
  tasks: [
    { id: 'e-play5', title: 'Сыграйте ещё 5 матчей', reward: 1, state: 'claimable' },
    { id: 'e-win3', title: 'Выиграйте 3 матча', reward: 1, state: 'claimable' },
    { id: 'e-play5b', title: 'Сыграйте ещё 5 матчей', reward: 1, progress: [2, 5], progressLabel: 'Ещё 3 матча' },
    { id: 'e-capture', title: 'Захватите 10 карт соперника', reward: 1, progress: [4, 10], progressLabel: 'Ещё 6 карт' },
    { id: 'e-combo', title: 'Сделайте прострел в матче', reward: 1, progress: [0, 1], progressLabel: 'Ещё 1 прострел' },
    { id: 'e-deck', title: 'Соберите новую колоду', reward: 1, progress: [0, 1], progressLabel: 'Ещё 1 колода' },
    { id: 'e-first', title: 'Сыграйте первый матч ивента', reward: 1, state: 'done' },
  ],
  rewards: ['chest', 'chest', 'ticket', 'chest', 'ticket', 'chest', 'ticket', 'chest', 'ticket', 'chest'],
};

// в ивенте у награды за задание всегда «+N», как в макете
EVENT.tasks.forEach((t) => (t.showPlus = true));

const REWARD_ITEMS = {
  chest: { src: 'assets/v2-event-chest.png', alt: 'Сундук ×1' },
  ticket: { src: 'assets/v2-event-ticket.png', alt: 'Билет на розыгрыш ×1' },
};

// геометрия трека из макета: молния 72px сверху, первый ромб на 154px,
// шаг 90px, карточка 140px; «клюв» шапки заходит в панель на 105px
const TRACK_FIRST = 154;
const TRACK_STEP = 90;
// линия начинается от кончика «клюва», чтобы не лежать поверх фиолетовой шапки
const TRACK_LINE_TOP = 105;
const HEAD_V_HEIGHT = 370;
const HEAD_V_TIP = 105;

const eventEl = document.getElementById('eventScreen');
const eventScrollEl = document.getElementById('eventScroll');
const eventSheetEl = document.getElementById('eventSheet');
const eventTasksPanel = document.getElementById('eventTasksPanel');
const eventRewardsPanel = document.getElementById('eventRewardsPanel');
const eventRewardsDot = document.getElementById('eventRewardsDot');

const CHECK_ICON = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8.5L6.5 12L13 4.5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

/* ---------- Задания ---------- */

function renderEventTasks() {
  const active = EVENT.tasks.filter((t) => t.state !== 'done');
  active.sort((a, b) => (b.state === 'claimable') - (a.state === 'claimable'));
  const done = EVENT.tasks.filter((t) => t.state === 'done');
  eventTasksPanel.innerHTML = `
    <div class="ev-tasks">
      <div class="tasks-list" data-list="active">${active.map(taskHTML).join('')}</div>
      <h2 class="tasks-done-title"${done.length ? '' : ' hidden'}>Выполненные</h2>
      <div class="tasks-list" data-list="done">${done.map(taskHTML).join('')}</div>
    </div>
  `;
}

/* ---------- Трек наград ---------- */

function levelCenter(level) {
  return TRACK_FIRST + (level - 1) * TRACK_STEP;
}

function renderEventTrack(popLevel) {
  const n = EVENT.rewards.length;
  const height = levelCenter(n) + 70 + 40;
  const reached = Math.min(EVENT.points, n);
  const fillTo = reached ? levelCenter(reached) : TRACK_LINE_TOP;

  const levels = EVENT.rewards.map((type, i) => {
    const level = i + 1;
    const isReached = EVENT.points >= level;
    const isTaken = EVENT.claimed.has(level);
    const side = level % 2 ? 'is-left' : 'is-right';
    const state = !isReached ? 'is-locked' : isTaken ? 'is-taken' : 'is-claimable';
    const item = REWARD_ITEMS[type];
    let action = '';
    if (isTaken) action = `<span class="ev-card-taken" aria-label="Получено">${CHECK_ICON}</span>`;
    else if (isReached) action = `<button class="ev-card-claim" data-level="${level}">Забрать</button>`;
    return `<div class="ev-level ${side} ${state}${isReached ? ' is-reached' : ''}" style="top:${levelCenter(level) - 70}px">
      <span class="ev-link"></span>
      <span class="ev-node">${level}</span>
      <div class="ev-card${level === popLevel ? ' is-pop' : ''}">
        <img class="ev-card-hex" src="assets/${isReached ? 'v2-event-hex-active.svg' : 'v2-event-hex.svg'}" alt="">
        <img class="ev-card-item" src="${item.src}" alt="${item.alt}">
        ${action}
      </div>
    </div>`;
  }).join('');

  eventRewardsPanel.innerHTML = `
    <div class="ev-track" style="height:${height}px">
      <span class="ev-track-line" style="top:${TRACK_LINE_TOP}px;height:${height - TRACK_LINE_TOP - 20}px"></span>
      <span class="ev-track-fill" style="top:${TRACK_LINE_TOP}px;height:${fillTo - TRACK_LINE_TOP}px"></span>
      <img class="ev-track-start" src="assets/v2-event-bolt.png" alt="">
      ${levels}
    </div>
  `;
  updateEventDot();
  document.getElementById('eventWidgetFill').style.width = `${(reached / n) * 100}%`;
}

function updateEventDot() {
  const n = Math.min(EVENT.points, EVENT.rewards.length);
  let claimable = false;
  for (let level = 1; level <= n; level++) if (!EVENT.claimed.has(level)) claimable = true;
  const appeared = claimable && eventRewardsDot.hidden;
  eventRewardsDot.hidden = !claimable;
  if (appeared) {
    eventRewardsDot.animate(
      [{ transform: 'scale(0)' }, { transform: 'scale(1.8)' }, { transform: 'scale(1)' }],
      { duration: 420, easing: 'ease-out' }
    );
  }
}

/* ---------- Шторка с описанием ---------- */

function introSeen() {
  try {
    return localStorage.getItem(EVENT_INTRO_KEY) === '1';
  } catch (e) {
    return false;
  }
}

function openEventSheet() {
  eventSheetEl.classList.add('is-open');
}

function closeEventSheet() {
  eventSheetEl.classList.remove('is-open');
  try {
    localStorage.setItem(EVENT_INTRO_KEY, '1');
  } catch (e) {
    /* без хранилища шторка просто покажется снова */
  }
}

/* ---------- Открытие / закрытие раздела ---------- */

function setInstant(el, fn) {
  el.style.transition = 'none';
  fn();
  el.getBoundingClientRect();
  el.style.transition = '';
}

function openEvent(animate = true) {
  const show = () => eventEl.classList.add('is-open');
  if (animate) show();
  else setInstant(eventEl, show);
  eventEl.setAttribute('aria-hidden', 'false');
  history.replaceState(null, '', '#event');
  if (!introSeen() && !eventSheetEl.classList.contains('is-open')) {
    if (animate) setTimeout(openEventSheet, 300);
    else setInstant(eventSheetEl, openEventSheet);
  }
}

function closeEvent() {
  eventEl.classList.remove('is-open');
  eventEl.setAttribute('aria-hidden', 'true');
  history.replaceState(null, '', currentScreen === 'game' ? location.pathname : `#${currentScreen}`);
}

/* ---------- События ---------- */

const eventTabs = createChipTabs(document.getElementById('eventSegRow'), document.getElementById('eventTabTrack'), (tab) => {
  eventEl.classList.toggle('is-tab-tasks', tab === 'tasks');
});

// «клюв» шапки смотрит в молнию трека: его кончик на 105px ниже верха панелей
const headVEl = document.getElementById('eventHeadV');
const eventTabsContentEl = document.getElementById('eventTabTrack').parentElement;
function placeHeadV() {
  const panelsTop = eventTabsContentEl.offsetTop;
  headVEl.style.top = `${panelsTop + HEAD_V_TIP - HEAD_V_HEIGHT}px`;
}
window.addEventListener('resize', placeHeadV);
window.addEventListener('load', placeHeadV);

const bannerEl = document.getElementById('eventBanner');
bannerEl.addEventListener('click', () => openEvent());
bannerEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    openEvent();
  }
});

document.getElementById('eventCloseBtn').addEventListener('click', closeEvent);
document.getElementById('eventInfoBtn').addEventListener('click', () => {
  if (eventSheetEl.classList.contains('is-open')) closeEventSheet();
  else openEventSheet();
});
document.getElementById('eventSheetClose').addEventListener('click', closeEventSheet);
document.getElementById('eventSheetCta').addEventListener('click', () => {
  closeEventSheet();
  eventTabs.select('tasks');
});

eventScrollEl.addEventListener('scroll', () => {
  eventScrollEl.classList.toggle('is-scrolled', eventScrollEl.scrollTop > 2);
}, { passive: true });

// «Забрать» в задании: молнии улетают во вкладку «Награды» — трек сдвигается,
// на вкладке загорается точка
let eventClaimBusy = false;

async function claimEventTask(taskId) {
  const task = EVENT.tasks.find((t) => t.id === taskId);
  if (!task || task.state !== 'claimable' || eventClaimBusy) return;
  eventClaimBusy = true;
  const row = eventTasksPanel.querySelector(`[data-task="${taskId}"]`);
  row.querySelector('.task-claim').disabled = true;

  const rewardTile = row.querySelector('.task-reward');
  const rewardsChip = document.querySelector('#eventSegRow [data-tab="rewards"]');
  const from = centerOf(rewardTile.querySelector('img'));
  const to = centerOf(rewardsChip);
  rewardTile.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.86)' }, { transform: 'scale(1.06)' }, { transform: 'scale(1)' }], { duration: 360, easing: 'ease-out' });

  const flights = [];
  for (let i = 0; i < 5; i++) {
    flights.push(
      flyBolt(from, to, i * 70, () => {
        rewardsChip.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.12)' }, { transform: 'scale(1)' }], { duration: 240, easing: 'ease-out' });
        burstAt(to);
      })
    );
  }

  // пока молнии летят, задание уезжает в «Выполненные»
  task.state = 'done';
  setTimeout(async () => {
    await collapse(row);
    eventTasksPanel.querySelector('.tasks-done-title').hidden = false;
    const doneList = eventTasksPanel.querySelector('[data-list="done"]');
    doneList.insertAdjacentHTML('afterbegin', taskHTML(task));
    expandIn(doneList.firstElementChild);
  }, 260);

  await Promise.all(flights);
  EVENT.points += task.reward;
  renderEventTrack();
  eventClaimBusy = false;
}

eventTasksPanel.addEventListener('click', (e) => {
  const btn = e.target.closest('.task-claim');
  if (btn) claimEventTask(btn.closest('.task').dataset.task);
});

// «Забрать» на треке: экран открытия подарка (как в «Заданиях»), после него —
// снова трек, у награды галочка
async function claimEventReward(level) {
  if (eventClaimBusy || EVENT.claimed.has(level) || EVENT.points < level) return;
  eventClaimBusy = true;
  const card = eventRewardsPanel.querySelector(`.ev-card-claim[data-level="${level}"]`).closest('.ev-card');
  await card.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.92)' }, { transform: 'scale(1.06)' }, { transform: 'scale(1)' }], { duration: 320, easing: 'ease-out' }).finished;
  await openGiftOverlay();
  EVENT.claimed.add(level);
  renderEventTrack(level);
  eventClaimBusy = false;
}

eventRewardsPanel.addEventListener('click', (e) => {
  const btn = e.target.closest('.ev-card-claim');
  if (btn) claimEventReward(Number(btn.dataset.level));
});

renderEventTasks();
renderEventTrack();
placeHeadV();
if (INITIAL_HASH === 'event') openEvent(false);
