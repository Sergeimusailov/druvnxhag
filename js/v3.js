// Версия 3 (v2.html?app=3): лиги и календарь наград.
// Точки входа — круглые кнопки сверху слева (лиги) и справа (календарь) на
// главной; у каждой красная точка-счётчик, как у «Новогоднего события».
// Экраны — полноэкранные, как экран события (.ev): шапка «назад / ?».
// В версии 2 всё это скрыто ([data-app="3"] .v3-only в css/v3.css).

const V3_ICONS = {
  coins: 'assets/v2-coin.png',
  bolt: 'assets/v2-bolt.png',
  ticket: 'assets/v2-ticket-icon.png',
  gift: 'assets/v2-gift.png',
  shard: 'assets/v3-shard.svg',
};

/* ---------- Лиги ---------- */

const V3_LEAGUES = [
  { id: 'bronze', title: 'Бронзовая лига', short: 'Бронзовой', icon: 'assets/v3-league-bronze.svg' },
  { id: 'silver', title: 'Серебряная лига', short: 'Серебряной', icon: 'assets/v3-league-silver.svg' },
  { id: 'gold', title: 'Золотая лига', short: 'Золотой', icon: 'assets/v3-league-gold.svg' },
  { id: 'diamond', title: 'Алмазная лига', short: 'Алмазной', icon: 'assets/v3-league-locked.svg' },
];

// игрок начинает в бронзе; топ-5 недели переходят в следующую лигу
const V3_LEAGUE = {
  current: 0,
  promote: 5,
  me: 'Вы',
  players: [
    ['Виктория Ф.', 1890], ['Евгения Л.', 1645], ['Артём Н.', 1420], ['Вы', 1310], ['Владислав В.', 1275],
    ['Яна Г.', 1120], ['Виктор К.', 980], ['Марина С.', 940], ['Олег П.', 815], ['Дарья М.', 760],
    ['Игорь Т.', 640], ['Алина Р.', 590], ['Степан Б.', 420], ['Ксения Д.', 310], ['Роман Е.', 180],
  ],
};

let v3LeagueView = V3_LEAGUE.current;

function v3WeekLeft() {
  const now = new Date();
  const ms = resetTimes(now).weekly - now;
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  return { d, h, ms };
}

function v3MyPlace() {
  return V3_LEAGUE.players.findIndex(([name]) => name === V3_LEAGUE.me) + 1;
}

function v3RowHTML([name, score], i) {
  const place = i + 1;
  const promo = place <= V3_LEAGUE.promote;
  const me = name === V3_LEAGUE.me;
  return `<div class="v3-row${promo ? ' is-promo' : ''}${me ? ' is-me' : ''}">
      <span class="v3-row-place">${place}</span>
      <span class="v3-row-name">${name}</span>
      <span class="v3-row-score">${score.toLocaleString('ru-RU')}</span>
      <img class="v3-row-shard" src="${V3_ICONS.shard}" alt="">
    </div>`;
}

function renderLeague3() {
  const cur = V3_LEAGUE.current;
  document.getElementById('v3Shields').innerHTML = V3_LEAGUES.map((l, i) => {
    const locked = i > cur;
    return `<button class="v3-shield${i === v3LeagueView ? ' is-active' : ''}${locked ? ' is-locked' : ''}" data-league="${i}" aria-label="${l.title}">
        <img src="${l.icon}" alt="">
      </button>`;
  }).join('');
  const league = V3_LEAGUES[v3LeagueView];
  document.getElementById('v3LeagueTitle').textContent = league.title;
  const body = document.getElementById('v3LeagueBody');

  if (v3LeagueView > cur) {
    // недоступная лига: что нужно сделать, чтобы в неё попасть
    const prev = V3_LEAGUES[v3LeagueView - 1];
    body.innerHTML = `<div class="v3-locked">
        <img src="assets/v3-league-locked.svg" alt="">
        <p class="v3-locked-title">Лига пока закрыта</p>
        <p class="v3-locked-text">Займите топ-${V3_LEAGUE.promote} в ${prev.short} лиге, чтобы попасть в эту</p>
      </div>`;
    return;
  }
  if (v3LeagueView < cur) {
    body.innerHTML = '<div class="v3-locked"><p class="v3-locked-text">Эту лигу вы уже прошли</p></div>';
    return;
  }
  const rows = V3_LEAGUE.players.map(v3RowHTML);
  body.innerHTML = `
    <div class="v3-zone is-promo"><span>Места на повышение</span><img src="${V3_ICONS.gift}" alt=""></div>
    ${rows.slice(0, V3_LEAGUE.promote).join('')}
    <div class="v3-zone"><span>Места без изменений</span></div>
    ${rows.slice(V3_LEAGUE.promote).join('')}`;
}

function renderLeagueEntry3() {
  const { d, h } = v3WeekLeft();
  document.getElementById('v3LeagueTimer').textContent = `${d}д ${h}ч`;
  document.getElementById('v3LeagueRank').textContent = v3MyPlace();
  const week = document.getElementById('v3LeagueWeek');
  if (week) week.textContent = `Итоги недели через ${d}д ${h}ч`;
  // красная точка: игрок в зоне повышения — есть повод заглянуть
  const badge = document.getElementById('v3LeagueBadge');
  badge.hidden = v3MyPlace() > V3_LEAGUE.promote;
  badge.textContent = '!';
}

/* ---------- Календарь наград ---------- */

// дни: награды (до трёх), ширина в сетке из 12 колонок, «жирные» — с оранжевой
// рамкой и искрами
const V3_CAL = {
  today: 3,
  claimed: new Set([1, 2]),
  days: [
    { day: 1, span: 12, rewards: [['gift', 1], ['ticket', 1], ['bolt', 6]] },
    { day: 2, span: 3, rewards: [['ticket', 1]] },
    { day: 3, span: 3, rewards: [['gift', 1]] },
    { day: 4, span: 3, rewards: [['coins', 10]] },
    { day: 5, span: 3, rewards: [['bolt', 6]] },
    { day: 6, span: 4, rewards: [['bolt', 6]] },
    { day: 7, span: 8, fat: true, rewards: [['bolt', 6], ['cards', 2], ['coins', 10]] },
    { day: 8, span: 4, rewards: [['ticket', 6]] },
    { day: 9, span: 4, rewards: [['coins', 10]] },
    { day: 10, span: 4, rewards: [['coins', 10]] },
    { day: 11, span: 4, rewards: [['bolt', 6]] },
    { day: 12, span: 4, rewards: [['coins', 10]] },
    { day: 13, span: 4, rewards: [['ticket', 2]] },
    { day: 14, span: 12, fat: true, rewards: [['bolt', 6], ['cards', 2], ['coins', 10]] },
    { day: 15, span: 4, rewards: [['coins', 10]] },
    { day: 16, span: 4, rewards: [['ticket', 6]] },
    { day: 17, span: 4, rewards: [['coins', 10]] },
    { day: 18, span: 3, rewards: [['bolt', 6]] },
    { day: 19, span: 3, rewards: [['coins', 10]] },
    { day: 20, span: 6, rewards: [['ticket', 2], ['coins', 10]] },
    { day: 21, span: 12, fat: true, rewards: [['gift', 1], ['cards', 2], ['coins', 20]] },
  ],
};

function v3CalState(d) {
  if (V3_CAL.claimed.has(d.day)) return 'is-got';
  if (d.day <= V3_CAL.today) return 'is-ready';
  if (d.day === V3_CAL.today + 1) return 'is-next';
  return '';
}

function v3RewardHTML([type, n]) {
  // пачка карт — две карты веером, остальное — иконка из общих ассетов
  const icon = type === 'cards'
    ? '<span class="v3-pack"><img src="assets/beckcard.svg" alt=""><img src="assets/card-pic__05.png" alt=""></span>'
    : `<img src="${V3_ICONS[type]}" alt="">`;
  const label = type === 'gift' || type === 'ticket' && n === 1 ? `+${n}` : n;
  return `<span class="v3-rw">${icon}<b>${label}</b></span>`;
}

function v3SparksHTML() {
  // искры вокруг «жирной» награды: разлетаются от центра и гаснут
  return Array.from({ length: 14 }, (_, i) => {
    const a = (i / 14) * Math.PI * 2;
    const r = 60 + (i % 3) * 22;
    return `<i style="--x:${Math.cos(a) * r}px;--y:${Math.sin(a) * r * 0.55}px;--d:${(i * 0.23) % 2.4}s"></i>`;
  }).join('');
}

function renderCalendar3() {
  const now = new Date();
  const left = formatLeft(resetTimes(now).daily - now);
  document.getElementById('v3CalGrid').innerHTML = V3_CAL.days.map((d) => {
    const state = v3CalState(d);
    const top = state === 'is-got'
      ? `<span class="v3-day-check">${CHECK_ICON}</span>`
      : state === 'is-next' ? `<span class="v3-day-timer">${CLOCK_SVG}<span data-v3-cal-timer>${left}</span></span>` : '';
    const label = state === 'is-got' ? 'Получено' : `День ${d.day}`;
    return `<button class="v3-day ${state}${d.fat ? ' is-fat' : ''}" style="grid-column: span ${d.span}" data-day="${d.day}"${state === 'is-ready' ? '' : ' tabindex="-1"'}>
        ${d.fat ? `<span class="v3-day-glow"></span><span class="v3-sparks">${v3SparksHTML()}</span>` : ''}
        ${top}
        <span class="v3-day-rewards">${d.rewards.map(v3RewardHTML).join('')}</span>
        <span class="v3-day-label">${label}</span>
      </button>`;
  }).join('');
}

function v3CalReady() {
  return V3_CAL.days.filter((d) => v3CalState(d) === 'is-ready').length;
}

function renderCalendarEntry3() {
  const n = v3CalReady();
  document.getElementById('v3CalendarLabel').textContent = n ? 'Забрать' : `День ${V3_CAL.today}`;
  document.getElementById('v3CalendarEntry').classList.toggle('is-ready', !!n);
  const badge = document.getElementById('v3CalendarBadge');
  badge.hidden = !n;
  badge.textContent = n;
}

let v3Claiming = false;
async function claimCalendarDay3(day) {
  if (v3Claiming) return;
  const d = V3_CAL.days.find((x) => x.day === day);
  if (!d || v3CalState(d) !== 'is-ready') return;
  v3Claiming = true;
  const el = document.querySelector(`.v3-day[data-day="${day}"]`);
  await el.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.94)' }, { transform: 'scale(1.04)' }, { transform: 'scale(1)' }], { duration: 300, easing: 'ease-out' }).finished;
  // экран получения — тот же, что у сундуков в заданиях
  await openGiftOverlay({ chest: !!d.fat });
  V3_CAL.claimed.add(day);
  renderCalendar3();
  const fresh = document.querySelector(`.v3-day[data-day="${day}"]`);
  fresh.animate([{ transform: 'scale(0.9)' }, { transform: 'scale(1.05)' }, { transform: 'scale(1)' }], { duration: 380, easing: 'cubic-bezier(0.34, 1.32, 0.42, 1)' });
  renderCalendarEntry3();
  v3Claiming = false;
}

/* ---------- Уровень игрока ---------- */

// опыт до следующего уровня — пока ровно 1000 на каждый уровень
const V3_LEVEL = { level: 1, xp: 640, per: 1000 };

function renderLevel3() {
  const { level, xp, per } = V3_LEVEL;
  document.getElementById('v3LevelFill').style.width = `${Math.min(1, xp / per) * 100}%`;
  document.getElementById('v3LevelText').textContent = `${xp}/${per}`;
  document.getElementById('v3LevelNext').textContent = level + 1;
}

/* ---------- Открытие экранов ---------- */

function openScreen3(el) {
  el.querySelector('.ev-scroll').scrollTop = 0;
  el.classList.add('is-open');
  el.setAttribute('aria-hidden', 'false');
}

function closeScreen3(el) {
  el.classList.remove('is-open');
  el.setAttribute('aria-hidden', 'true');
}

if (isApp3()) {
  const leagueScreen = document.getElementById('v3LeagueScreen');
  const calScreen = document.getElementById('v3CalendarScreen');

  document.getElementById('v3LeagueEntry').addEventListener('click', () => {
    v3LeagueView = V3_LEAGUE.current;
    renderLeague3();
    openScreen3(leagueScreen);
  });
  document.getElementById('v3CalendarEntry').addEventListener('click', () => {
    renderCalendar3();
    openScreen3(calScreen);
  });
  document.querySelectorAll('.v3-screen [data-back]').forEach((b) => b.addEventListener('click', () => closeScreen3(b.closest('.v3-screen'))));

  document.getElementById('v3Shields').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-league]');
    if (!btn) return;
    v3LeagueView = Number(btn.dataset.league);
    renderLeague3();
  });

  document.getElementById('v3CalGrid').addEventListener('click', (e) => {
    const day = e.target.closest('.v3-day.is-ready');
    if (day) claimCalendarDay3(Number(day.dataset.day));
  });
  document.getElementById('v3CalDemo').addEventListener('click', () => {
    V3_CAL.today = Math.min(V3_CAL.today + 1, V3_CAL.days.length);
    renderCalendar3();
    renderCalendarEntry3();
  });

  // прокрутка экранов — тот же эффект шапки, что у остальных
  document.querySelectorAll('.v3-screen .ev-scroll').forEach((sc) => sc.addEventListener('scroll', () => sc.classList.toggle('is-scrolled', sc.scrollTop > 2), { passive: true }));

  leagueScreen.querySelector('.v3-clock').outerHTML = CLOCK_SVG;
  renderLevel3();
  renderLeagueEntry3();
  renderCalendarEntry3();
  setInterval(() => {
    renderLeagueEntry3();
    if (calScreen.classList.contains('is-open')) {
      const now = new Date();
      calScreen.querySelectorAll('[data-v3-cal-timer]').forEach((t) => { t.textContent = formatLeft(resetTimes(now).daily - now); });
    }
  }, 1000);
}
