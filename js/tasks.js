// Раздел «Задания»: две вкладки (дейлики / еженедельные), у каждой свой
// таймер, своя шкала очков до 100 с подарками-вехами и список заданий.
// Состояние в памяти — после перезагрузки демо начинается заново.

const MILESTONES = [20, 40, 60, 80, 100];

// Задания — единый источник наград: энергия (молнии) двигает шкалу
// дейликов/недели, снежинки уходят в «Новогоднее событие», монеты — в магазин
const TASK_TABS = {
  daily: {
    title: 'Ежедневные награды',
    points: 34,
    claimed: new Set([20]),
    tasks: [
      // демо: первым можно забрать задание со снежинками — видно, как энергия
      // летит в шкалу, а снежинки — в таб «Игра» к «Новогоднему событию»
      { id: 'd-play5', title: 'Сыграйте 5 матчей за день', status: 'Заберите до 31 ноября', state: 'claimable', rewards: [['snow', 20], ['bolt', 6]] },
      { id: 'd-win3', title: 'Выиграйте 3 матча подряд', status: 'До 26 ноября', rewards: [['coins', 10], ['bolt', 6]] },
      { id: 'd-capture', title: 'Захватите 20 карт соперника', status: 'До 26 ноября', progress: [10, 20], rewards: [['snow', 20], ['bolt', 6]] },
      { id: 'd-combo', title: 'Сделайте 20 прострелов', status: 'До 26 ноября', progress: [10, 20], rewards: [['bolt', 6]] },
      { id: 'd-first', title: 'Сыграйте первый матч дня', status: 'Выполнено сегодня', state: 'done', rewards: [['bolt', 6]] },
      { id: 'd-deck', title: 'Соберите колоду из 8 карт', status: 'Выполнено сегодня', state: 'done', rewards: [['bolt', 6]] },
    ],
  },
  weekly: {
    title: 'Еженедельные награды',
    points: 14,
    claimed: new Set(),
    tasks: [
      { id: 'w-boxes', title: 'Откройте 2 лутбокса в магазине', status: 'Заберите до 30 ноября', state: 'claimable', rewards: [['snow', 20], ['bolt', 6]] },
      { id: 'w-wins', title: 'Одержите 15 побед за неделю', status: 'До 30 ноября', progress: [6, 15], rewards: [['snow', 20], ['bolt', 6]] },
      { id: 'w-streak', title: 'Победите 5 матчей подряд', status: 'До 30 ноября', progress: [2, 5], rewards: [['bolt', 10]] },
      { id: 'w-play10', title: 'Сыграйте 10 матчей', status: 'До 30 ноября', progress: [4, 10], rewards: [['bolt', 6]] },
      { id: 'w-done', title: 'Захватите все клетки поля в одном матче', status: 'Выполнено 22 ноября', state: 'done', rewards: [['bolt', 6]] },
    ],
  },
};

// версия 2.2: снежинки зарабатываются в заданиях внутри «Новогоднего
// события», поэтому в обычных заданиях остаётся только энергия
if (isAppVersion('2.2')) {
  Object.values(TASK_TABS).forEach((tab) => tab.tasks.forEach((t) => {
    if (t.rewards) t.rewards = t.rewards.filter(([cur]) => cur === 'bolt');
  }));
}

// версия 2.3: снежинки — только из дневной пачки: ровно 5 новогодних заданий
// по 20 снежинок (100 в день), обновляется раз в сутки, плюс обычные задания
// без снежинок. В задании не больше двух наград. Выполнять все не обязательно,
// но кто закрывает все 5, быстрее доходит до финала трека (1600 из 2200)
if (isAppVersion('2.3')) {
  TASK_TABS.weekly.tasks.forEach((t) => {
    if (t.rewards) t.rewards = t.rewards.filter(([cur]) => cur !== 'snow');
  });
  TASK_TABS.daily.tasks = [
    // новогодние: снежинки + энергия
    { id: 'd-play5', title: 'Сыграйте 5 матчей за день', status: 'Заберите до 31 ноября', state: 'claimable', rewards: [['snow', 20], ['bolt', 6]] },
    { id: 'd-capture', title: 'Захватите 20 карт соперника', status: 'До 26 ноября', progress: [10, 20], rewards: [['snow', 20], ['bolt', 6]] },
    { id: 'd-combo', title: 'Сделайте 20 прострелов', status: 'До 26 ноября', progress: [10, 20], rewards: [['snow', 20], ['bolt', 6]] },
    { id: 'd-win3', title: 'Выиграйте 3 матча подряд', status: 'До 26 ноября', progress: [1, 3], rewards: [['snow', 20], ['bolt', 6]] },
    { id: 'd-first', title: 'Сыграйте первый матч дня', status: 'Выполнено сегодня', state: 'done', rewards: [['snow', 20], ['bolt', 6]] },
    // обычные: энергия и монеты
    { id: 'd-box', title: 'Откройте лутбокс в магазине', status: 'До 26 ноября', progress: [0, 1], rewards: [['coins', 10], ['bolt', 6]] },
    { id: 'd-hard', title: 'Победите на сложном уровне', status: 'До 26 ноября', progress: [0, 1], rewards: [['bolt', 10]] },
    { id: 'd-deck', title: 'Соберите колоду из 8 карт', status: 'Выполнено сегодня', state: 'done', rewards: [['bolt', 6]] },
  ];
}

const CLOCK_SVG = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path opacity="0.85" fill-rule="evenodd" clip-rule="evenodd" d="M6 11.25C8.8995 11.25 11.25 8.8995 11.25 6C11.25 3.10051 8.8995 0.75 6 0.75C3.10051 0.75 0.75 3.10051 0.75 6C0.75 8.8995 3.10051 11.25 6 11.25ZM5.625 2.98027H5.25L5.25054 6.75L7.99411 8.06583L8.15245 7.72627C8.41503 7.16317 8.1714 6.49381 7.6083 6.23123L6.75 5.79451V4.10527C6.75 3.48395 6.24632 2.98027 5.625 2.98027Z" fill="currentColor"/></svg>';

const appEl = document.querySelector('.v2-app');
const fxLayerEl = document.getElementById('v2FxLayer');
const tasksScreenEl = document.getElementById('tasksScreen');
const panelEls = Object.fromEntries(
  Array.from(document.querySelectorAll('.tasks-panel')).map((el) => [el.dataset.panel, el])
);
let claimInProgress = false;

/* ---------- Шкала ---------- */

// Шкала (Figma 16047:43609): дорожка 313px внутри карточки 361px, сундуки
// на 20/40/…/100 очков стоят над ней; доля дорожки = (12.5 + 2.875·очки) / 313
function pointsToFraction(points) {
  return Math.min(1, (12.5 + 2.875 * Math.max(0, points)) / 313);
}

// три состояния сундука: закрыт (статичен), готов к выдаче (свет + подпрыгивает),
// открыт (уже получен)
function milestoneState(tab, i) {
  const data = TASK_TABS[tab];
  if (data.claimed.has(MILESTONES[i])) return 'is-open';
  return data.points >= MILESTONES[i] ? 'is-ready' : 'is-locked';
}

function milestoneHTML(tab, i) {
  const state = milestoneState(tab, i);
  const left = `${pointsToFraction(MILESTONES[i]) * 100}%`;
  const src = state === 'is-open' ? 'assets/v2-chest-open.png' : 'assets/v2-chest-closed.png';
  return `<button class="tchest ${state}" data-milestone="${i}" style="left:${left}" aria-label="Сундук за ${MILESTONES[i]} очков"${state === 'is-ready' ? '' : ' tabindex="-1"'}>
    <img class="tchest-glow" src="assets/v2-chest-glow.svg" alt="">
    <img class="tchest-img" src="${src}" alt="">
    <span class="tchest-label">${MILESTONES[i]}</span>
  </button>`;
}

function taskHTML(task) {
  // карточка с несколькими наградами (валюты) — общая с версией 2.2
  if (task.rewards) return TASKS22.taskHTML(task);
  const claimable = task.state === 'claimable';
  const done = task.state === 'done';
  let extra = '';
  if (claimable) {
    extra = '<button class="task-claim">Забрать</button>';
  } else if (done) {
    extra = '<p class="task-status">Выполнено</p>';
  } else if (task.progress) {
    const [cur, total] = task.progress;
    extra = `<div class="task-progress">
      <div class="task-progress-track"><div class="task-progress-fill" style="width:${(cur / total) * 100}%"></div></div>
      <p class="task-progress-label">${task.progressLabel || `${cur} / ${total}`}</p>
    </div>`;
  }
  return `<div class="task${claimable ? ' is-claimable' : ''}" data-task="${task.id}">
    <div class="task-body"><p class="task-title">${task.title}</p>${extra}</div>
    <div class="task-reward"><img src="assets/v2-bolt.png" alt="Очки"><span>${claimable || task.showPlus ? '+' : ''}${task.reward}</span></div>
  </div>`;
}

function renderPanel(tab) {
  const data = TASK_TABS[tab];
  const active = data.tasks.filter((t) => t.state !== 'done');
  const hasSnow = (t) => (t.rewards || []).some(([cur]) => cur === 'snow');
  // 2.3: после готовых к получению — задания со снежинками для события
  active.sort((a, b) => (b.state === 'claimable') - (a.state === 'claimable') || (isAppVersion('2.3') ? hasSnow(b) - hasSnow(a) : 0));
  const done = data.tasks.filter((t) => t.state === 'done');
  const fraction = pointsToFraction(data.points);
  panelEls[tab].innerHTML = `
    <div class="tasks-timer"><span class="tasks-timer-badge">${CLOCK_SVG}<span data-timer="${tab}"></span></span></div>
    <div class="tprog">
      <div class="tprog-area">
        <div class="tprog-track"><div class="tasks-fill" style="width:${fraction * 100}%"></div></div>
        ${MILESTONES.map((_, i) => milestoneHTML(tab, i)).join('')}
      </div>
      <div class="tprog-tag tasks-progress-tag"><img src="assets/v2-progress-bolt-tag.png" alt=""><span class="tasks-points">${data.points}</span></div>
    </div>
    <div class="tasks-list" data-list="active">${active.map(taskHTML).join('')}</div>
    <h2 class="tasks-done-title"${done.length ? '' : ' hidden'}>Выполненные</h2>
    <div class="tasks-list" data-list="done">${done.map(taskHTML).join('')}</div>
  `;
  updateTimers();
}

/* ---------- Таймеры ---------- */

function pad2(n) {
  return String(n).padStart(2, '0');
}

function pluralDays(n) {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return 'день';
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 'дня';
  return 'дней';
}

function formatLeft(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86400);
  const clock = `${pad2(Math.floor((total % 86400) / 3600))}:${pad2(Math.floor((total % 3600) / 60))}:${pad2(total % 60)}`;
  return days > 0 ? `${days} ${pluralDays(days)} ${clock}` : clock;
}

// неделе точное время не нужно — только дни; в последний день тикают часы
function formatWeeklyLeft(ms) {
  const days = Math.floor(Math.max(0, ms) / 86400000);
  return days > 0 ? `${days} ${pluralDays(days)}` : formatLeft(ms);
}

function resetTimes(now) {
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  // следующий понедельник 00:00
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() + (((8 - monday.getDay()) % 7) || 7));
  return { daily: midnight, weekly: monday };
}

function updateTimers() {
  const now = new Date();
  const ends = resetTimes(now);
  document.querySelectorAll('[data-timer]').forEach((el) => {
    const left = ends[el.dataset.timer] - now;
    el.textContent = `${el.dataset.timerLabel || 'Обновим через'} ${el.dataset.timer === 'weekly' ? formatWeeklyLeft(left) : formatLeft(left)}`;
  });
}

/* ---------- Эффекты ---------- */

function centerOf(el) {
  const a = appEl.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2 - a.left, y: r.top + r.height / 2 - a.top };
}

function burstAt(point) {
  const ring = document.createElement('span');
  ring.className = 'fx-ring';
  ring.style.left = `${point.x}px`;
  ring.style.top = `${point.y}px`;
  fxLayerEl.appendChild(ring);
  ring.animate(
    [{ transform: 'scale(0.3)', opacity: 1 }, { transform: 'scale(1.6)', opacity: 0 }],
    { duration: 380, easing: 'ease-out' }
  ).finished.then(() => ring.remove());
  for (let i = 0; i < 6; i++) {
    const spark = document.createElement('span');
    spark.className = 'fx-spark';
    spark.style.left = `${point.x}px`;
    spark.style.top = `${point.y}px`;
    fxLayerEl.appendChild(spark);
    const angle = (Math.PI * 2 * i) / 6 + Math.random() * 0.6;
    const dist = 20 + Math.random() * 14;
    spark.animate(
      [
        { transform: 'translate(0, 0) scale(1)', opacity: 1 },
        { transform: `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px) scale(0.2)`, opacity: 0 },
      ],
      { duration: 420, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
    ).finished.then(() => spark.remove());
  }
}

// молния выпрыгивает из плитки награды, затем по дуге с ускорением летит в
// бирку шкалы
function flyBolt(from, to, delay, onArrive) {
  const el = document.createElement('img');
  el.src = 'assets/v2-bolt.png';
  el.className = 'fx-bolt';
  fxLayerEl.appendChild(el);
  const angle = Math.random() * Math.PI * 2;
  const pop = { x: from.x + Math.cos(angle) * (16 + Math.random() * 22), y: from.y + Math.sin(angle) * (16 + Math.random() * 22) };
  const ctrl = {
    x: (pop.x + to.x) / 2 + (Math.random() - 0.5) * 140,
    y: Math.min(pop.y, to.y) - 40 - Math.random() * 80,
  };
  const spin = (Math.random() - 0.5) * 60;
  const frames = [
    { transform: `translate(${from.x}px, ${from.y}px) scale(0.3) rotate(0deg)`, opacity: 0, offset: 0 },
    { transform: `translate(${pop.x}px, ${pop.y}px) scale(1.15) rotate(${spin}deg)`, opacity: 1, offset: 0.24 },
  ];
  const steps = 12;
  for (let k = 1; k <= steps; k++) {
    const t = (k / steps) ** 2;
    const x = (1 - t) ** 2 * pop.x + 2 * (1 - t) * t * ctrl.x + t * t * to.x;
    const y = (1 - t) ** 2 * pop.y + 2 * (1 - t) * t * ctrl.y + t * t * to.y;
    frames.push({
      transform: `translate(${x}px, ${y}px) scale(${1.15 - 0.6 * t}) rotate(${spin * (1 - t)}deg)`,
      opacity: 1,
      offset: 0.24 + 0.76 * (k / steps),
    });
  }
  return el
    .animate(frames, { duration: 820, delay, fill: 'both' })
    .finished.then(() => {
      el.remove();
      onArrive();
    });
}

function easeOutCubic(t) {
  return 1 - (1 - t) ** 3;
}

// шкала заполняется в rAF-цикле, чтобы ширина, счётчик и «зажигание» точек
// были синхронны
function fillProgress(panel, tab, fromPoints, toPoints) {
  const fill = panel.querySelector('.tasks-fill');
  const counter = panel.querySelector('.tasks-points');
  const fromF = pointsToFraction(fromPoints);
  const toF = pointsToFraction(toPoints);
  const duration = 900;
  fill.classList.remove('is-filling');
  fill.getBoundingClientRect();
  fill.classList.add('is-filling');
  return new Promise((resolve) => {
    const start = performance.now();
    function frame(now) {
      const t = Math.min(1, (now - start) / duration);
      const e = easeOutCubic(t);
      const pts = fromPoints + (toPoints - fromPoints) * e;
      fill.style.width = `${(fromF + (toF - fromF) * e) * 100}%`;
      counter.textContent = Math.round(pts);
      // полоска дошла до сундука — он «просыпается»: свет и подпрыгивание
      MILESTONES.forEach((m, i) => {
        const el = panel.querySelector(`.tchest[data-milestone="${i}"]`);
        if (el && el.classList.contains('is-locked') && pts >= m) {
          el.classList.replace('is-locked', 'is-ready');
          el.removeAttribute('tabindex');
          el.animate([{ transform: 'translateX(-50%) scale(1)' }, { transform: 'translateX(-50%) scale(1.35)' }, { transform: 'translateX(-50%) scale(1)' }], { duration: 420, easing: 'cubic-bezier(0.34, 1.32, 0.42, 1)' });
        }
      });
      if (t < 1) requestAnimationFrame(frame);
      else {
        fill.classList.remove('is-filling');
        resolve();
      }
    }
    requestAnimationFrame(frame);
  });
}

function collapse(el) {
  const h = el.offsetHeight;
  el.style.overflow = 'hidden';
  return el
    .animate(
      [
        { height: `${h}px`, opacity: 1, marginBottom: '16px', transform: 'scale(1)' },
        { height: '0px', opacity: 0, marginBottom: '0px', transform: 'scale(0.92)' },
      ],
      { duration: 320, easing: 'cubic-bezier(0.32, 0.72, 0.35, 1)' }
    )
    .finished.then(() => el.remove());
}

function expandIn(el) {
  const h = el.offsetHeight;
  el.style.overflow = 'hidden';
  el.animate(
    [
      { height: '0px', opacity: 0, marginBottom: '0px', transform: 'scale(0.92)' },
      { height: `${h}px`, opacity: 1, marginBottom: '16px', transform: 'scale(1)' },
    ],
    { duration: 380, easing: 'cubic-bezier(0.32, 0.72, 0.35, 1)' }
  ).finished.then(() => {
    el.style.overflow = '';
  });
}

/* ---------- Забрать награду за задание ---------- */

async function claimTask(tab, taskId) {
  if (claimInProgress) return;
  claimInProgress = true;
  const data = TASK_TABS[tab];
  const task = data.tasks.find((t) => t.id === taskId);
  const panel = panelEls[tab];
  const row = panel.querySelector(`[data-task="${taskId}"]`);
  row.querySelector('.task-claim').disabled = true;

  // шкала должна быть видна, чтобы молнии летели в неё на экране
  const card = panel.querySelector('.tprog');
  const screenRect = tasksScreenEl.getBoundingClientRect();
  const cardRect = card.getBoundingClientRect();
  if (cardRect.top < screenRect.top + 100 || cardRect.bottom > screenRect.bottom - 90) {
    tasksScreenEl.scrollTo({ top: tasksScreenEl.scrollTop + cardRect.top - screenRect.top - 110, behavior: 'smooth' });
    await wait(420);
  }

  const rewardTile = row.querySelector('.task-reward');
  const tag = panel.querySelector('.tasks-progress-tag');
  const rewards = task.rewards || [['bolt', task.reward]];
  const boltAmount = rewards.filter(([c]) => c === 'bolt').reduce((sum, [, n]) => sum + n, 0);
  const boltImg = row.querySelector('.t22-reward[data-cur="bolt"] img') || rewardTile.querySelector('img');
  const from = centerOf(boltImg);
  const to = centerOf(tag.querySelector('img'));
  rewardTile.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.86)' }, { transform: 'scale(1.06)' }, { transform: 'scale(1)' }], { duration: 360, easing: 'ease-out' });

  const count = boltAmount ? Math.max(5, Math.min(10, Math.round(boltAmount / 2))) : 0;
  const flights = [];
  // снежинки улетают в таб «Игра» — там «Новогоднее событие»
  const gameIcon = document.querySelector('.v2-tab[data-nav="game"] .v2-tab-icon');
  rewards.forEach(([cur], ri) => {
    if (cur !== 'snow') return;
    const snowFrom = centerOf(row.querySelector('.t22-reward[data-cur="snow"] img'));
    const gameTo = centerOf(gameIcon);
    for (let i = 0; i < 4; i++) {
      // как в 2.2: на каждую долетевшую снежинку таб «Игра» подпрыгивает и искрит
      flights.push(TASKS22.flyIcon(CURRENCY_ICONS.snow, snowFrom, gameTo, 150 + ri * 100 + i * 70).then(() => {
        gameIcon.parentElement.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.18)' }, { transform: 'scale(1)' }], { duration: 300, easing: 'ease-out' });
        burstAt(gameTo);
      }));
    }
  });
  for (let i = 0; i < count; i++) {
    flights.push(
      flyBolt(from, to, i * 65, () => {
        tag.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.25)' }, { transform: 'scale(1)' }], { duration: 240, easing: 'ease-out' });
        burstAt(to);
      })
    );
  }

  // пока молнии летят, задание уезжает в «Выполненные»
  task.state = 'done';
  setTimeout(async () => {
    await collapse(row);
    const doneList = panel.querySelector('[data-list="done"]');
    panel.querySelector('.tasks-done-title').hidden = false;
    doneList.insertAdjacentHTML('afterbegin', taskHTML(task));
    expandIn(doneList.firstElementChild);
  }, 260);

  task.status = 'Выполнено сегодня';
  await Promise.all(flights);
  rewards.forEach(([cur, n]) => {
    if (cur === 'coins') addCoins(n);
    if (cur === 'snow') EVENTS22.addCurrency('snow', n);
  });

  const fromPoints = data.points;
  data.points = Math.min(100, data.points + boltAmount);
  await fillProgress(panel, tab, fromPoints, data.points);

  // открытие — по тапу на подсвеченный сундук
  claimInProgress = false;
  showChestTip();
}

/* ---------- Подсказка к первому готовому сундуку ---------- */

// анимацию «проснувшегося» сундука легко пропустить, поэтому в первый раз
// рядом с ним появляется белый тултип; показываем один раз — до тапа
const CHEST_TIP_KEY = 'v2.chestTipSeen';
let chestTipEl = null;

function chestTipSeen() {
  try { return localStorage.getItem(CHEST_TIP_KEY) === '1'; } catch { return false; }
}

function hideChestTip(remember) {
  if (chestTipEl) {
    const el = chestTipEl;
    chestTipEl = null;
    el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160 }).finished.then(() => el.remove());
  }
  if (remember) {
    try { localStorage.setItem(CHEST_TIP_KEY, '1'); } catch { /* приватный режим */ }
  }
}

function showChestTip() {
  if (chestTipEl || chestTipSeen() || currentScreen !== 'tasks' || e22Current) return;
  // готовый сундук на видимой сейчас вкладке
  const box = tasksScreenEl.getBoundingClientRect();
  const chest = Array.from(tasksScreenEl.querySelectorAll('.tchest.is-ready')).find((c) => {
    const r = c.getBoundingClientRect();
    return r.left >= box.left && r.right <= box.right;
  });
  if (!chest) return;
  const card = chest.closest('.tprog');
  chestTipEl = document.createElement('div');
  chestTipEl.className = 'tchest-tip';
  chestTipEl.innerHTML = '<b>Вам доступен приз</b>Нажмите на сундук, чтобы открыть';
  card.appendChild(chestTipEl);
  // по горизонтали — под сундуком, но не вылезая за карточку; хвостик — на сундук
  const cardRect = card.getBoundingClientRect();
  const chestX = centerOf(chest.querySelector('.tchest-img')).x - cardRect.left;
  const w = chestTipEl.offsetWidth;
  const left = Math.max(0, Math.min(cardRect.width - w, chestX - w / 2));
  chestTipEl.style.left = `${left}px`;
  chestTipEl.style.setProperty('--arrow', `${chestX - left}px`);
  chestTipEl.animate(
    [{ opacity: 0, transform: 'translateY(-6px) scale(0.92)' }, { opacity: 1, transform: 'none' }],
    { duration: 260, easing: 'cubic-bezier(0.34, 1.32, 0.42, 1)' }
  );
}

document.addEventListener('v2:screen', (e) => {
  if (e.detail.screen === 'tasks') setTimeout(showChestTip, 450);
  else hideChestTip(false);
});

/* ---------- Экран открытия подарка ---------- */

const giftOverlayEl = document.getElementById('giftOverlay');
const giftStageEl = document.getElementById('giftStage');
const giftEl = document.getElementById('giftOverlayGift');
const giftFlashEl = giftStageEl.querySelector('.gift-flash');
const giftHintEl = document.getElementById('giftOverlayHint');
const giftTitleEl = document.getElementById('giftOverlayTitle');
const giftRewardEls = Array.from(document.querySelectorAll('#giftRewards img'));
const giftClaimBtn = document.getElementById('giftClaimBtn');
const giftCloseBtn = document.getElementById('giftOverlayClose');

function once(el, type) {
  return new Promise((resolve) => el.addEventListener(type, resolve, { once: true }));
}

// opts.chest — вместо подарка сундук: падает закрытым, после тряски
// открывается, и уже из открытого сундука вылетают призы
async function openGiftOverlay(opts = {}) {
  giftEl.getAnimations().forEach((a) => a.cancel());
  giftEl.style.opacity = '';
  giftEl.src = opts.chest ? 'assets/v2-chest-closed.png' : 'assets/v2-gift-big.png';
  giftEl.classList.toggle('is-chest', !!opts.chest);
  giftRewardEls.forEach((r) => {
    r.getAnimations().forEach((a) => a.cancel());
    r.style.opacity = '0';
  });
  giftTitleEl.classList.remove('is-visible');
  giftClaimBtn.classList.remove('is-visible');
  giftOverlayEl.style.opacity = '';
  giftOverlayEl.classList.add('is-open');
  giftOverlayEl.setAttribute('aria-hidden', 'false');

  // подарок «падает» на экран с пружинкой
  await giftEl.animate(
    [
      { transform: 'translateY(-60px) scale(0.2)', opacity: 0 },
      { transform: 'translateY(10px) scale(1.12)', opacity: 1, offset: 0.55 },
      { transform: 'translateY(-4px) scale(0.95)', offset: 0.78 },
      { transform: 'translateY(0) scale(1)', opacity: 1 },
    ],
    { duration: 720, easing: 'ease-out' }
  ).finished;
  giftEl.classList.add('is-idle');
  giftHintEl.classList.add('is-visible');

  // открываем по тапу или сами через пару секунд
  await Promise.race([wait(2400), once(giftStageEl, 'click')]);
  giftHintEl.classList.remove('is-visible');
  giftEl.classList.remove('is-idle');

  await giftEl.animate(
    [
      { transform: 'rotate(0deg) scale(1)' },
      { transform: 'rotate(-9deg) scale(1.04)' },
      { transform: 'rotate(9deg) scale(1.08)' },
      { transform: 'rotate(-11deg) scale(1.12)' },
      { transform: 'rotate(11deg) scale(1.16)' },
      { transform: 'rotate(0deg) scale(1.2)' },
    ],
    { duration: 520, easing: 'ease-in' }
  ).finished;

  giftFlashEl.animate(
    [
      { transform: 'scale(0.2)', opacity: 0 },
      { transform: 'scale(7)', opacity: 1, offset: 0.3 },
      { transform: 'scale(12)', opacity: 0 },
    ],
    { duration: 800, easing: 'ease-out' }
  );
  if (opts.chest) {
    // крышка откинута: показываем открытый сундук, и только потом — призы
    giftEl.src = 'assets/v2-chest-open.png';
    await giftEl.animate(
      [
        { transform: 'scale(1.2)' },
        { transform: 'scale(0.92, 1.08) translateY(-10px)', offset: 0.4 },
        { transform: 'scale(1)' },
      ],
      { duration: 420, easing: 'cubic-bezier(0.34, 1.32, 0.42, 1)' }
    ).finished;
    await wait(250);
    giftEl.animate(
      [
        { transform: 'scale(1)', opacity: 1 },
        { transform: 'scale(0.9) translateY(30px)', opacity: 0.12 },
      ],
      { duration: 600, delay: 250, easing: 'ease-in-out', fill: 'forwards' }
    );
  } else {
    giftEl.animate(
      [
        { transform: 'scale(1.2)', opacity: 1 },
        { transform: 'scale(1.6)', opacity: 0 },
      ],
      { duration: 300, easing: 'ease-in', fill: 'forwards' }
    );
  }

  // награды вылетают из центра подарка на свои места
  const giftCenter = centerOf(giftStageEl);
  giftTitleEl.classList.add('is-visible');
  await Promise.all(
    giftRewardEls.map((r, i) => {
      const c = centerOf(r);
      const dx = giftCenter.x - c.x;
      const dy = giftCenter.y - c.y;
      const spin = (Math.random() - 0.5) * 50;
      return r.animate(
        [
          { transform: `translate(${dx}px, ${dy}px) scale(0.2) rotate(${spin}deg)`, opacity: 0 },
          { transform: `translate(${dx * 0.15}px, ${dy * 0.15 - 20}px) scale(1.15) rotate(${-spin / 3}deg)`, opacity: 1, offset: 0.7 },
          { transform: 'translate(0, 0) scale(1) rotate(0deg)', opacity: 1 },
        ],
        { duration: 700, delay: 120 + i * 90, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' }
      ).finished;
    })
  );
  giftClaimBtn.classList.add('is-visible');

  await Promise.race([once(giftClaimBtn, 'click'), once(giftCloseBtn, 'click')]);
  await giftOverlayEl.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, easing: 'ease-in', fill: 'forwards' }).finished;
  giftOverlayEl.classList.remove('is-open');
  giftOverlayEl.setAttribute('aria-hidden', 'true');
  giftOverlayEl.getAnimations().forEach((a) => a.cancel());
}

/* ---------- Шторка «что внутри подарка» ---------- */

const sheetEl = document.getElementById('rewardsSheet');
const sheetBackdropEl = document.getElementById('rewardsSheetBackdrop');

function openSheet() {
  sheetEl.style.transform = '';
  sheetEl.classList.add('is-open');
  sheetBackdropEl.classList.add('is-open');
}

function closeSheet() {
  sheetEl.style.transform = '';
  sheetEl.classList.remove('is-open');
  sheetBackdropEl.classList.remove('is-open');
}

document.getElementById('rewardsSheetClose').addEventListener('click', closeSheet);
sheetBackdropEl.addEventListener('click', closeSheet);

// смахивание шторки вниз
let dragStartY = null;
sheetEl.addEventListener('pointerdown', (e) => {
  if (e.target.closest('.v2-sheet-close')) return;
  dragStartY = e.clientY;
  sheetEl.classList.add('is-dragging');
  sheetEl.setPointerCapture(e.pointerId);
});
sheetEl.addEventListener('pointermove', (e) => {
  if (dragStartY === null) return;
  const dy = Math.max(0, e.clientY - dragStartY);
  sheetEl.style.transform = `translateY(${dy}px)`;
});
function endDrag(e) {
  if (dragStartY === null) return;
  const dy = e.clientY - dragStartY;
  dragStartY = null;
  sheetEl.classList.remove('is-dragging');
  if (dy > 90) closeSheet();
  else sheetEl.style.transform = '';
}
sheetEl.addEventListener('pointerup', endDrag);
sheetEl.addEventListener('pointercancel', endDrag);

/* ---------- Запуск ---------- */

Object.keys(TASK_TABS).forEach(renderPanel);
// перерисовка панелей заданий снаружи (демо в превью события 2.3)
function TASKS22_RERENDER() {
  hideChestTip(false);
  Object.keys(TASK_TABS).forEach(renderPanel);
}

const tasksTabs = createChipTabs(document.getElementById('tasksSegRow'), document.getElementById('tasksTabTrack'), () => {
  hideChestTip(false);
  setTimeout(showChestTip, 380);
});
setInterval(updateTimers, 1000);

tasksScreenEl.addEventListener('click', (e) => {
  // любой тап прячет подсказку к сундуку; тап по сундуку — ещё и открывает
  if (chestTipEl && !e.target.closest('.task-claim')) hideChestTip(true);
  const claimBtn = e.target.closest('.task-claim');
  if (claimBtn) {
    const panel = claimBtn.closest('.tasks-panel');
    claimTask(panel.dataset.panel, claimBtn.closest('.task').dataset.task);
    return;
  }
  const info = e.target.closest('.tasks-progress-info');
  tasksScreenEl.querySelectorAll('.tasks-progress.is-tip-open').forEach((c) => {
    if (!info || c !== info.parentElement) c.classList.remove('is-tip-open');
  });
  if (info) {
    info.parentElement.classList.toggle('is-tip-open');
    return;
  }
  const chest = e.target.closest('.tchest');
  if (chest) openChest(chest);
});

let chestOpening = false;
async function openChest(chestEl) {
  if (!chestEl.classList.contains('is-ready')) {
    openSheet();
    return;
  }
  if (chestOpening || claimInProgress) return;
  chestOpening = true;
  const tab = chestEl.closest('.tasks-panel').dataset.panel;
  const i = Number(chestEl.dataset.milestone);
  await openGiftOverlay({ chest: true });
  TASK_TABS[tab].claimed.add(MILESTONES[i]);
  chestEl.outerHTML = milestoneHTML(tab, i);
  const fresh = panelEls[tab].querySelector(`.tchest[data-milestone="${i}"]`);
  fresh.animate([{ transform: 'translateX(-50%) scale(0.6)' }, { transform: 'translateX(-50%) scale(1.15)' }, { transform: 'translateX(-50%) scale(1)' }], { duration: 420, easing: 'cubic-bezier(0.34, 1.32, 0.42, 1)' });
  chestOpening = false;
}

document.getElementById('tasksHelpBtn').addEventListener('click', () => {});
