// Магазин v2 (прототип): лутбоксы трёх редкостей за монеты. В каждом
// 2–4 предмета: первый — гарантированно карта цвета бокса, остальные
// разыгрываются по таблице шансов (карты, рамки, бустеры, монеты).
// Открытие — экран как у подарка в «Заданиях»: бокс падает, трясётся,
// крышка слетает, предметы вылетают рубашкой вверх и переворачиваются.

// 2.3 (описание магазина, витрина по макету Figma 16908:32749): три сундука — обычный (зелёный) и редкий (синий) за
// монеты, эпический (фиолетовый) за ключи (вторая
// софт-валюта). При открытии выпадает от 2 до 5 наград: каждая из пяти
// (карта, монеты, ключи, бонус, косметика) разыгрывается со своим шансом.
// Ключи выпадают из обычного и редкого сундуков и даются за сундуки-вехи в
// «Заданиях». У каждого сундука суточный лимит покупок. Состав и шансы
// и шансы — в шторке сундука (тап по плитке) и в «?».
const LOOTBOXES = [
  {
    id: 'green',
    name: 'Обычный сундук',
    short: 'Обычный',
    price: 100,
    currency: 'coins',
    limit: 5,
    colors: ['#8ff07a', '#2e9e3f', '#1d5e27'],
    table: [
      { kind: 'card', rarity: 'green', chance: 80 },
      { kind: 'coins', min: 20, max: 60, chance: 70 },
      { kind: 'tokens', min: 5, max: 10, chance: 30 },
      { kind: 'bonus', chance: 15 },
      { kind: 'frame', chance: 5 },
    ],
  },
  {
    id: 'blue',
    name: 'Редкий сундук',
    short: 'Редкий',
    price: 250,
    currency: 'coins',
    limit: 3,
    colors: ['#8cc8ff', '#2f6fe0', '#1a3c8c'],
    table: [
      { kind: 'card', rarity: 'blue', chance: 85 },
      { kind: 'coins', min: 60, max: 150, chance: 70 },
      { kind: 'tokens', min: 10, max: 20, chance: 40 },
      { kind: 'bonus', chance: 20 },
      { kind: 'frame', chance: 10 },
    ],
  },
  {
    id: 'purple',
    name: 'Эпический сундук',
    short: 'Эпический',
    price: 30,
    currency: 'tokens',
    limit: 1,
    colors: ['#d7a6ff', '#7b34e0', '#3f1683'],
    table: [
      { kind: 'card', rarity: 'purple', chance: 90 },
      { kind: 'coins', min: 150, max: 300, chance: 75 },
      { kind: 'tokens', min: 20, max: 40, chance: 40 },
      { kind: 'bonus', chance: 30 },
      { kind: 'frame', chance: 25 },
    ],
  },
];

/* ---------- Ключи и суточные лимиты ---------- */

const TOKENS_KEY = 'v2.tokens';
const TOKENS_START = 20;
const SHOP_LIMITS_KEY = 'v2.shopLimits';
const CURRENCY = {
  coins: { icon: 'assets/shop-coin.png', one: 'монета', few: 'монеты', many: 'монет' },
  tokens: { icon: 'assets/shop-key.png', one: 'ключ', few: 'ключа', many: 'ключей' },
};

function getTokens() {
  try {
    const raw = localStorage.getItem(TOKENS_KEY);
    return raw === null ? TOKENS_START : Math.max(0, parseInt(raw, 10) || 0);
  } catch (e) {
    return TOKENS_START;
  }
}

function addTokens(delta) {
  try {
    localStorage.setItem(TOKENS_KEY, String(Math.max(0, getTokens() + delta)));
  } catch (e) { /* без хранилища — до перезагрузки */ }
  return getTokens();
}

const balanceOf = (cur) => (cur === 'tokens' ? getTokens() : getCoins());

function plural(n, { one, few, many }) {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

// сколько раз сундук куплен сегодня; со сменой дня счётчики обнуляются
function boughtToday(id) {
  try {
    const data = JSON.parse(localStorage.getItem(SHOP_LIMITS_KEY) || '{}');
    return data.day === todayKey() ? data.counts[id] || 0 : 0;
  } catch (e) {
    return 0;
  }
}

function markBought(id) {
  let data = {};
  try { data = JSON.parse(localStorage.getItem(SHOP_LIMITS_KEY) || '{}'); } catch (e) { /* ignore */ }
  if (data.day !== todayKey()) data = { day: todayKey(), counts: {} };
  data.counts[id] = (data.counts[id] || 0) + 1;
  try { localStorage.setItem(SHOP_LIMITS_KEY, JSON.stringify(data)); } catch (e) { /* ignore */ }
}

const BONUS_NAMES = ['Кешбэк 5% в кафе', 'Скидка 10% в кино', 'Бесплатная доставка'];
const INVENTORY_KEY = 'v2.inventory';

const shopCoinsEl = document.getElementById('shopCoins');
const shopTokensEl = document.getElementById('shopTokens');
const shopBoxesEl = document.getElementById('shopBoxes');
const lbOverlayEl = document.getElementById('lbOverlay');
const lbStageEl = document.getElementById('lbStage');
const lbBoxEl = document.getElementById('lbBox');
const lbFlashEl = lbStageEl.querySelector('.lb-flash');
const lbHintEl = document.getElementById('lbHint');
const lbTitleEl = document.getElementById('lbTitle');
const lbRewardsEl = document.getElementById('lbRewards');
const lbClaimEl = document.getElementById('lbClaim');

/* ---------- Данные ---------- */

function loadInventory() {
  try {
    return { cards: 0, frames: 0, bonuses: 0, ...JSON.parse(localStorage.getItem(INVENTORY_KEY) || '{}') };
  } catch (e) {
    return { cards: 0, frames: 0, bonuses: 0 };
  }
}

function saveInventory(inv) {
  try {
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(inv));
  } catch (e) {
    /* прототип: без хранилища инвентарь живёт до перезагрузки */
  }
}

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// взвешенный выбор по шансам (добор до минимума наград)
function rollEntry(table) {
  const total = table.reduce((sum, e) => sum + e.chance, 0);
  let r = Math.random() * total;
  for (const e of table) {
    r -= e.chance;
    if (r < 0) return e;
  }
  return table[0];
}

// taken — имена карт, уже выпавших в этом боксе: внутри одного бокса без повторов
function makeReward(entry, taken = new Set()) {
  if (entry.kind === 'card') {
    const all = CARD_ROSTER.filter((c) => cardRarity(c) === entry.rarity);
    const fresh = all.filter((c) => !taken.has(c.name));
    const card = pick(fresh.length ? fresh : all);
    taken.add(card.name);
    return { kind: 'card', rarity: entry.rarity, card };
  }
  if (entry.kind === 'coins') {
    const amount = Math.round((entry.min + Math.random() * (entry.max - entry.min)) / 10) * 10;
    return { kind: 'coins', amount };
  }
  if (entry.kind === 'tokens') {
    return { kind: 'tokens', amount: Math.round(entry.min + Math.random() * (entry.max - entry.min)) };
  }
  if (entry.kind === 'frame') {
    // косметика — эпическая рамка аватара или рубашка колоды (js/cosmetics24.js)
    const isBack = Math.random() < 0.5;
    const item = pick((isBack ? COSMETICS24.BACKS : COSMETICS24.FRAMES).filter((x) => x.epic));
    return { kind: 'frame', back: isBack, id: item.id, name: `${isBack ? 'Рубашка' : 'Рамка'} «${item.name}»` };
  }
  return { kind: 'bonus', name: pick(BONUS_NAMES) };
}

// каждая награда разыгрывается со своим шансом; выпало меньше двух —
// добираем по шансам из оставшихся (максимум — все пять)
const MIN_REWARDS = 2;
function rollBox(box) {
  const got = box.table.filter((e) => Math.random() * 100 < e.chance);
  while (got.length < MIN_REWARDS) got.push(rollEntry(box.table.filter((e) => !got.includes(e))));
  const taken = new Set();
  return box.table.filter((e) => got.includes(e)).map((e) => makeReward(e, taken));
}

/* ---------- Отрисовка магазина ---------- */

// лутбокс — сундук в цветах редкости (SVG, чтобы перекрашивать без ассетов)
// картинка сундука из макета (Figma 16908:29024); класс lb-svg — общие стили и анимации
function chestArt(box) {
  return `<img class="lb-svg lb-chest-img" src="assets/shop-chest-${box.id}.png" alt="">`;
}

function boxSVG(box, uid) {
  const [light, mid, dark] = box.colors;
  return `<svg class="lb-svg" viewBox="0 0 140 130" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id="${uid}-body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${mid}"/><stop offset="1" stop-color="${dark}"/></linearGradient>
      <linearGradient id="${uid}-lid" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${light}"/><stop offset="1" stop-color="${mid}"/></linearGradient>
      <linearGradient id="${uid}-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe680"/><stop offset="1" stop-color="#e0a020"/></linearGradient>
    </defs>
    <ellipse cx="70" cy="122" rx="54" ry="7" fill="#000" opacity="0.35"/>
    <g class="lb-svg-body">
      <rect x="14" y="58" width="112" height="60" rx="12" fill="url(#${uid}-body)"/>
      <rect x="14" y="58" width="112" height="10" fill="#000" opacity="0.18"/>
      <rect x="61" y="58" width="18" height="60" fill="url(#${uid}-gold)"/>
      <rect x="22" y="64" width="6" height="46" rx="3" fill="#fff" opacity="0.18"/>
    </g>
    <g class="lb-svg-lid">
      <path d="M10 46C10 32.745 20.745 22 34 22H106C119.255 22 130 32.745 130 46V62H10V46Z" fill="url(#${uid}-lid)"/>
      <rect x="61" y="22" width="18" height="40" fill="url(#${uid}-gold)"/>
      <path d="M22 34C26 28 32 26 40 26H60" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity="0.35"/>
      <rect x="56" y="50" width="28" height="24" rx="7" fill="url(#${uid}-gold)" stroke="#a86b10" stroke-width="2"/>
      <circle cx="70" cy="60" r="3.5" fill="#7a4a08"/>
      <rect x="68.5" y="61" width="3" height="7" rx="1.5" fill="#7a4a08"/>
    </g>
  </svg>`;
}

const KIND_COLORS = { coins: '#ffcf3d', tokens: '#b36bff', frame: '#ff7ad9', bonus: '#42cf9b' };

function priceHTML(box) {
  return `<img src="${CURRENCY[box.currency].icon}" alt="" width="20" height="20">${box.price}`;
}

// время до полуночи — когда снова можно открывать сундуки
function limitTimer() {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const t = Math.max(0, Math.floor((next - now) / 1000));
  const p2 = (n) => String(n).padStart(2, '0');
  return `${p2(Math.floor(t / 3600))}:${p2(Math.floor((t % 3600) / 60))}:${p2(t % 60)}`;
}

// can — можно открыть; reason: 'limit' (исчерпан суточный лимит) или 'money' (не хватает валюты)
function boxState(box) {
  const left = box.limit - boughtToday(box.id);
  const balance = balanceOf(box.currency);
  if (left <= 0) return { can: false, left: 0, reason: 'limit' };
  if (balance < box.price) return { can: false, left, reason: 'money', need: box.price - balance };
  return { can: true, left };
}

const timerBadge = () => `<span class="shop-timer">${CLOCK_SVG}<span data-shop-timer>${limitTimer()}</span></span>`;


// 21-лучевая звезда из макета (фиолетовое свечение за эпическим сундуком)
const HERO_STAR = (() => {
  const pts = [];
  for (let k = 0; k < 42; k++) {
    const r = k % 2 ? 84 : 220;
    const a = (Math.PI * k) / 21 - Math.PI / 2;
    pts.push(`${(220 + r * Math.cos(a)).toFixed(1)},${(220 + r * Math.sin(a)).toFixed(1)}`);
  }
  return `<svg class="shop-tile-glow" viewBox="0 0 440 440" aria-hidden="true"><polygon points="${pts.join(' ')}" fill="#5d25b0"/></svg>`;
})();
const TILE_GLOW = { green: '#1eca85', blue: '#3d8aff' };

// бенто по макету (Figma 16908:32749 — доступны, 16966:62702 — закончились):
// название, под ним бейдж «Остался: N» (лимит исчерпан — часы и таймер до полуночи),
// сундук и кнопка-цена. Лимит — кнопка тёмная #333 с приглушённой ценой.
// Не хватает валюты — плитка обычная: «Не хватает N» видно уже внутри карточки.
// Карточка открывается всегда, в любом состоянии.
function tileHTML(box, hero) {
  const st = boxState(box);
  const limit = st.reason === 'limit';
  const word = hero ? plural(st.left, { one: 'Остался', few: 'Осталось', many: 'Осталось' }) : 'Осталось';
  const badge = limit ? timerBadge() : `${word}: ${st.left}`;
  return `
    <article class="shop-tile ${hero ? 'is-hero' : 'is-small'} shop-box-${box.id}${limit ? ' is-limit' : ''}" data-view="${box.id}" role="button" tabindex="0" aria-label="${box.name}, ${box.price} ${plural(box.price, CURRENCY[box.currency])}" style="--glow:${TILE_GLOW[box.id] || 'transparent'}">
      ${hero ? HERO_STAR : '<span class="shop-tile-glow"></span>'}
      <div class="shop-tile-art">${chestArt(box)}</div>
      <h2 class="shop-tile-name">${box.short}</h2>
      <span class="shop-tile-badge">${badge}</span>
      <span class="shop-tile-btn${hero ? ' is-big' : ''}${limit ? ' is-off' : ''}">${priceHTML(box)}</span>
    </article>`;
}

function renderShop() {
  shopCoinsEl.textContent = getCoins();
  shopTokensEl.textContent = getTokens();
  // первым и крупнее всех — эпический сундук: на него копят ключи
  const hero = LOOTBOXES.find((b) => b.currency === 'tokens');
  const rest = LOOTBOXES.filter((b) => b !== hero).reverse();
  shopBoxesEl.innerHTML = tileHTML(hero, true) + `<div class="shop-row">${rest.map((b) => tileHTML(b, false)).join('')}</div>`;
  if (shopDetailBox) renderDetail(shopDetailBox);
}

/* ---------- Подсказки у балансов: что это и как получить ---------- */

const BALANCE_TIPS = {
  coins: ['Монеты', 'Основная валюта игры. Даются за задания и выпадают из сундуков. За монеты открываются обычный и редкий сундуки.'],
  tokens: ['Ключи', 'Открывают эпический сундук с фиолетовыми картами. Выпадают из обычного и редкого сундуков и даются за сундуки на шкале в «Заданиях».'],
};
const shopHeadEl = document.querySelector('.shop-head');

shopHeadEl.addEventListener('click', (e) => {
  const pill = e.target.closest('[data-balance]');
  if (!pill) return;
  const [title, text] = BALANCE_TIPS[pill.dataset.balance];
  Tooltip24.show(pill, { title, text, width: 260 });
});

/* ---------- Шторка сундука: состав с шансами и «Открыть» ---------- */
// шторка на весь экран: картинка сундука, бейдж доступности, заголовок,
// текст про шансы, награды (название, картинка, шанс в %),
// кнопка и доступность на сегодня. Открывается тапом по плитке в любом состоянии.

const shopDetailEl = document.getElementById('shopDetail');
const shopDetailBody = shopDetailEl.querySelector('.shop-detail-body');
const shopDetailFoot = shopDetailEl.querySelector('.shop-detail-foot');
let shopDetailBox = null;
const shopDetailSheet = bottomSheet(shopDetailEl, document.getElementById('shopDetailBackdrop'), {
  onClose: () => {
    Tooltip24.hide();
    shopDetailBox = null;
  },
});



// награда — карточка 108×132: шанс 20/600, у монет и ключей под ним «до N»,
// картинка из макета на всю карточку. Карты зелёного и синего сундуков —
// та же рубашка, перекрашенная фильтром
const PRIZE_ART = { card: 'card', coins: 'coins', tokens: 'key', bonus: 'bonus', frame: 'cosmetic' };
// порядок карточек как в макете: карта, бонус, ключи, монеты, косметика
const PRIZE_ORDER = ['card', 'bonus', 'tokens', 'coins', 'frame'];
function rewardPreview(e) {
  const key = e.kind === 'card' ? `card-${e.rarity}` : e.kind;
  const sub = e.kind === 'coins' || e.kind === 'tokens' ? `<span class="shop-prize-sub">до ${e.max}</span>` : '';
  return `<li class="shop-prize shop-prize-${key}" data-prize-tip="${key}" role="button" tabindex="0">
    <img class="shop-prize-img" src="assets/shop-prize-${PRIZE_ART[e.kind]}.png" alt="">
    <span class="shop-prize-chance">${e.chance}%</span>${sub}
  </li>`;
}

// описание награды по тапу — общий тултип (js/tooltip24.js)
function prizeTip(key) {
  if (key.startsWith('card-')) {
    const r = RARITIES[key.slice(5)];
    return [`${r.name} карта`, `Случайная ${r.name.toLowerCase()} карта в вашу коллекцию. Если такая карта у вас уже есть, дубль распылится в монеты.`];
  }
  return {
    coins: ['Монеты', 'Основная валюта игры. За монеты открываются обычный и редкий сундуки.'],
    tokens: ['Ключи', 'Ключи открывают эпический сундук — в нём фиолетовые карты.'],
    frame: ['Косметика', 'Эпическая рамка аватара или рубашка колоды с анимацией. Появится в настройках профиля.'],
    bonus: ['Бонус', 'Предложение от партнёров: кешбэк, скидка или бесплатная доставка. Активируется в разделе «Бонусы».'],
  }[key];
}

// звезда за сундуком в шторке — цвета сундука (у эпического из макета #5d25b0)
const SHEET_GLOW = { purple: '#5d25b0', blue: '#1f4fae', green: '#0f7a50' };
const SHEET_STAR = HERO_STAR.replace('class="shop-tile-glow"', 'class="shop-detail-star" preserveAspectRatio="none"');

function renderDetail(box) {
  const st = boxState(box);
  const icon = `<img src="${CURRENCY[box.currency].icon}" alt="">`;
  let btn;
  if (st.can) btn = `<button class="bs-cta shop-open" data-open="${box.id}">${icon}Открыть за ${box.price}</button>`;
  else if (st.reason === 'limit') btn = `<button class="bs-cta shop-open" disabled>Будет доступен через <span data-shop-timer>${limitTimer()}</span></button>`;
  else btn = `<button class="bs-cta shop-open" disabled>Не хватает ${st.need} ${plural(st.need, CURRENCY[box.currency])}</button>`;
  // доступность — тот же бейдж, что на плитке: «Остался: N» или часы с таймером
  const badge = st.reason === 'limit'
    ? timerBadge()
    : `${plural(st.left, { one: 'Остался', few: 'Осталось', many: 'Осталось' })}: ${st.left}`;
  shopDetailEl.style.setProperty('--glow', SHEET_GLOW[box.id]);
  shopDetailBody.innerHTML = `
    ${SHEET_STAR}
    <div class="shop-detail-art">${chestArt(box)}</div>
    <span class="shop-tile-badge shop-detail-badge">${badge}</span>
    <h2 class="shop-detail-title">${box.name}</h2>
    <p class="shop-detail-sub">Шансы выпадения наград</p>
    <ul class="shop-prizes">${[...box.table].sort((x, y) => PRIZE_ORDER.indexOf(x.kind) - PRIZE_ORDER.indexOf(y.kind)).map(rewardPreview).join('')}</ul>`;
  shopDetailFoot.innerHTML = btn;
}

function openDetail(box) {
  shopDetailBox = box;
  renderDetail(box);
  shopDetailBody.scrollTop = 0;
  shopDetailSheet.open();
}

function closeDetail() {
  shopDetailSheet.close();
}

shopDetailEl.addEventListener('click', (e) => {
  const prize = e.target.closest('.shop-prize');
  if (prize) {
    const [title, text] = prizeTip(prize.dataset.prizeTip);
    Tooltip24.show(prize, { title, text });
    return;
  }
  const btn = e.target.closest('[data-open]');
  if (!btn) return;
  const box = LOOTBOXES.find((b) => b.id === btn.dataset.open);
  closeDetail();
  openLootbox(box);
});

// таймеры лимита тикают, пока магазин на экране
setInterval(() => {
  document.querySelectorAll('[data-shop-timer]').forEach((el) => { el.textContent = limitTimer(); });
}, 1000);

/* ---------- Ответы на вопросы (кнопка «?» в шапке) — как FAQ в ивенте ---------- */

const shopInfoSheet = bottomSheet(document.getElementById('shopInfoSheet'), document.getElementById('shopBsBackdrop'));
const SHOP_FAQ_CHEVRON = '<svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M1.5 1.5 6.5 7l-5 5.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function shopFaq() {
  const chances = LOOTBOXES.map((box) => {
    const name = (e) => (e.kind === 'card' ? 'карта' : e.kind === 'coins' ? 'монеты' : e.kind === 'tokens' ? 'ключи' : e.kind === 'frame' ? 'косметика' : 'бонус');
    return `${box.name}: ${box.table.map((e) => `${name(e)} ${e.chance}%`).join(', ')}.`;
  }).join('<br>');
  const limits = LOOTBOXES.map((box) => `${box.short.toLowerCase()} — ${box.limit}`).join(', ');
  return [
    ['Как получить новые карты?', 'Карты не продаются напрямую — они выпадают только из сундуков. Чем дороже сундук, тем реже карта внутри.'],
    ['Чем отличаются сундуки?', `Обычный и редкий открываются за монеты, эпический — за ключи. Из каждого выпадает карта своего цвета: зелёная, синяя или фиолетовая.`],
    ['Что выпадет из сундука?', 'От 2 до 5 наград: карта, монеты, ключи, бонус и косметика — рамка аватара или рубашка колоды. Каждая выпадает со своим шансом. Чтобы увидеть шансы, нажмите на сундук.'],
    ['С какими шансами выпадают награды?', chances],
    ['Где взять ключи?', 'Они выпадают из обычного и редкого сундуков и даются за сундуки на шкале в разделе «Задания».'],
    ['Сколько сундуков можно открыть за день?', `У каждого сундука свой лимит: ${limits}. Он обновляется каждый день в полночь — до обновления на сундуке виден таймер.`],
    ['Куда попадают награды?', 'Карты — в коллекцию в разделе «Карты», монеты и ключи — в баланс, бонусы — в раздел «Бонусы», косметика — в настройки профиля.'],
    ['Что такое бонус?', 'Предложение от партнёров: кешбэк, скидка или бесплатная доставка. Его можно активировать в разделе «Бонусы».'],
  ];
}

function openShopInfo() {
  document.getElementById('shopInfoList').innerHTML = shopFaq().map(([q, a]) => `
    <div class="bs-faq-item">
      <button class="bs-faq-q"><span>${q}</span>${SHOP_FAQ_CHEVRON}</button>
      <p class="bs-faq-a">${a}</p>
    </div>`).join('');
  document.querySelector('#shopInfoSheet .bs-scroll').scrollTop = 0;
  shopInfoSheet.open();
}

document.getElementById('shopHelpBtn').addEventListener('click', openShopInfo);
document.getElementById('shopInfoList').addEventListener('click', (e) => {
  const q = e.target.closest('.bs-faq-q');
  if (q) q.parentElement.classList.toggle('is-open');
});

// счётчик баланса «досчитывает» до нового значения
function animateCoins(from, to) {
  const start = performance.now();
  const dur = 600;
  function frame(now) {
    const t = Math.min(1, (now - start) / dur);
    shopCoinsEl.textContent = Math.round(from + (to - from) * (1 - (1 - t) ** 3));
    if (t < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  shopCoinsEl.parentElement.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.12)' }, { transform: 'scale(1)' }], { duration: 360, easing: 'ease-out' });
}

/* ---------- Открытие ---------- */

function rewardFaceHTML(r) {
  if (r.kind === 'card') {
    return `<div class="card owner-you lb-card">${cardInnerHTML(r.card)}</div>
      <p class="lb-reward-name">${r.card.name}</p><p class="lb-reward-sub" style="color:${RARITIES[r.rarity].color}">${RARITIES[r.rarity].name}</p>`;
  }
  if (r.kind === 'coins') {
    return `<img class="lb-reward-img" src="assets/v2-coin.png" alt=""><p class="lb-reward-name">+${r.amount}</p><p class="lb-reward-sub">Монеты</p>`;
  }
  if (r.kind === 'tokens') {
    return `<img class="lb-reward-img" src="${CURRENCY.tokens.icon}" alt=""><p class="lb-reward-name">+${r.amount}</p><p class="lb-reward-sub">Ключи</p>`;
  }
  if (r.kind === 'frame') {
    const art = r.back ? `<div class="lb-back">${COSMETICS24.backHTML(r.id)}</div>` : '<div class="lb-frame"><span></span></div>';
    return `${art}<p class="lb-reward-name">${r.name}</p><p class="lb-reward-sub">В профиль</p>`;
  }
  return `<img class="lb-reward-img" src="assets/v2-prize-gift.png" alt=""><p class="lb-reward-name">${r.name}</p><p class="lb-reward-sub">В «Бонусы»</p>`;
}

function rewardColor(r) {
  return r.kind === 'card' ? RARITIES[r.rarity].color : KIND_COLORS[r.kind];
}

let lbBusy = false;

async function openLootbox(box) {
  if (lbBusy || !boxState(box).can) return;
  lbBusy = true;
  markBought(box.id);
  if (box.currency === 'tokens') {
    addTokens(-box.price);
    renderShop();
  } else {
    const coins = getCoins();
    setCoins(coins - box.price);
    animateCoins(coins, coins - box.price);
  }
  const rewards = rollBox(box);

  lbOverlayEl.style.setProperty('--lb-color', box.colors[1]);
  lbOverlayEl.style.setProperty('--lb-light', box.colors[0]);
  lbBoxEl.innerHTML = chestArt(box);
  // анимации прошлого открытия (растворение сундука с fill: forwards) иначе
  // продолжают действовать и прячут новый сундук
  lbOverlayEl.getAnimations({ subtree: true }).forEach((an) => an.cancel());
  lbRewardsEl.innerHTML = '';
  lbRewardsEl.style.setProperty('--n', rewards.length);
  // 3–5 наград — плитки поменьше, чтобы все поместились на экране
  lbRewardsEl.classList.toggle('is-compact', rewards.length > 2);
  lbTitleEl.classList.remove('is-visible');
  lbClaimEl.classList.remove('is-visible');
  lbOverlayEl.style.opacity = '';
  lbOverlayEl.classList.add('is-open');
  lbOverlayEl.setAttribute('aria-hidden', 'false');

  // бокс падает с пружинкой и покачивается
  await lbBoxEl.animate(
    [
      { transform: 'translateY(-260px) scale(0.6)', opacity: 0 },
      { transform: 'translateY(12px) scale(1.06, 0.92)', opacity: 1, offset: 0.6 },
      { transform: 'translateY(-6px) scale(0.97, 1.04)', offset: 0.8 },
      { transform: 'translateY(0) scale(1)', opacity: 1 },
    ],
    { duration: 720, easing: 'ease-out' }
  ).finished;
  // без тапа «открыть»: сундук сам покачивается, затем нарастающие встряски —
  // медленно, чтобы сохранить интригу
  lbBoxEl.classList.add('is-idle');
  await wait(1100);
  lbBoxEl.classList.remove('is-idle');

  await lbBoxEl.animate(
    [
      { transform: 'rotate(0) scale(1)' },
      { transform: 'rotate(-4deg) scale(1.02)', offset: 0.12 },
      { transform: 'rotate(4deg) scale(1.03)', offset: 0.24 },
      { transform: 'rotate(0) scale(1.03)', offset: 0.36 },
      { transform: 'rotate(-7deg) scale(1.06)', offset: 0.48 },
      { transform: 'rotate(7deg) scale(1.08)', offset: 0.58 },
      { transform: 'rotate(0) scale(1.08)', offset: 0.66 },
      { transform: 'rotate(-10deg) scale(1.11)', offset: 0.74 },
      { transform: 'rotate(10deg) scale(1.14)', offset: 0.82 },
      { transform: 'rotate(-12deg) scale(1.16)', offset: 0.9 },
      { transform: 'rotate(0) scale(1.2)' },
    ],
    { duration: 1700, easing: 'ease-in' }
  ).finished;

  // крышка слетает, вспышка, сундук растворяется
  // у картинки сундука из макета нет отдельной крышки — тогда сундук просто
  // растворяется во вспышке
  const lid = lbBoxEl.querySelector('.lb-svg-lid');
  if (lid) lid.animate(
    [{ transform: 'translate(0, 0) rotate(0)' }, { transform: 'translate(40px, -160px) rotate(35deg)', opacity: 0 }],
    { duration: 520, easing: 'cubic-bezier(0.2, 0.8, 0.3, 1)', fill: 'forwards' }
  );
  lbFlashEl.animate(
    [
      { transform: 'scale(0.2)', opacity: 0 },
      { transform: 'scale(7)', opacity: 1, offset: 0.3 },
      { transform: 'scale(12)', opacity: 0 },
    ],
    { duration: 800, easing: 'ease-out' }
  );
  lbBoxEl.animate([{ opacity: 1, transform: 'scale(1.18)' }, { opacity: 0, transform: 'scale(1.5)' }], { duration: 420, delay: 160, easing: 'ease-in', fill: 'forwards' });

  // предметы вылетают из сундука рубашкой вверх и по очереди переворачиваются
  lbRewardsEl.innerHTML = rewards.map((r) => `
    <div class="lb-reward" style="--glow:${rewardColor(r)}">
      <div class="lb-reward-inner">
        <div class="lb-reward-back"></div>
        <div class="lb-reward-face">${rewardFaceHTML(r)}</div>
      </div>
    </div>`).join('');
  lbRewardsEl.querySelectorAll('.lb-frame').forEach((el, i) => {
    const r = rewards.filter((x) => x.kind === 'frame' && !x.back)[i];
    if (r) COSMETICS24.applyFrame(el, r.id);
  });
  lbTitleEl.classList.add('is-visible');
  const center = centerOf(lbStageEl);
  const els = Array.from(lbRewardsEl.children);
  await Promise.all(els.map((el, i) => {
    const c = centerOf(el);
    return el.animate(
      [
        { transform: `translate(${center.x - c.x}px, ${center.y - c.y}px) scale(0.2)`, opacity: 0 },
        { transform: 'translate(0, -16px) scale(1.08)', opacity: 1, offset: 0.7 },
        { transform: 'translate(0, 0) scale(1)', opacity: 1 },
      ],
      { duration: 620, delay: 200 + i * 110, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'backwards' }
    ).finished;
  }));
  for (const el of els) {
    el.classList.add('is-flipped');
    await wait(320);
  }

  applyRewards(rewards);
  lbClaimEl.classList.add('is-visible');
  await once(lbClaimEl, 'click');
  await lbOverlayEl.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, easing: 'ease-in', fill: 'forwards' }).finished;
  lbOverlayEl.classList.remove('is-open');
  lbOverlayEl.setAttribute('aria-hidden', 'true');
  lbOverlayEl.getAnimations({ subtree: true }).forEach((a) => a.cancel());
  lbBusy = false;
  renderShop();
}

function applyRewards(rewards) {
  const inv = loadInventory();
  let coinsWon = 0;
  rewards.forEach((r) => {
    if (r.kind === 'card') inv.cards += 1;
    else if (r.kind === 'frame') inv.frames += 1;
    else if (r.kind === 'bonus') inv.bonuses = (inv.bonuses || 0) + 1;
    else if (r.kind === 'tokens') addTokens(r.amount);
    else coinsWon += r.amount;
  });
  saveInventory(inv);
  if (coinsWon) {
    const before = getCoins();
    addCoins(coinsWon);
    animateCoins(before, before + coinsWon);
  }
}

/* ---------- События ---------- */

shopBoxesEl.addEventListener('click', (e) => {
  const tile = e.target.closest('.shop-tile');
  if (!tile) return;
  const box = LOOTBOXES.find((b) => tile.classList.contains(`shop-box-${b.id}`));
  tile.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.96)' }, { transform: 'scale(1)' }], { duration: 220, easing: 'ease-out' });
  openDetail(box);
});

// баланс мог измениться в матче — обновляем при каждом входе в магазин
document.addEventListener('v2:screen', (e) => {
  if (e.detail.screen === 'shop') renderShop();
});

document.getElementById('shopDemoCoins').addEventListener('click', () => {
  const before = getCoins();
  addCoins(500);
  addTokens(30);
  renderShop();
  animateCoins(before, before + 500);
});

// прототип: при каждом заходе все сундуки доступны — суточные лимиты сброшены,
// а монет и ключей хватает на каждый сундук; недоступность видна уже после покупок
function resetShopForDemo() {
  try { localStorage.removeItem(SHOP_LIMITS_KEY); } catch (e) { /* ignore */ }
  const need = (cur) => LOOTBOXES.filter((b) => b.currency === cur).reduce((sum, b) => sum + b.price, 0);
  if (getCoins() < need('coins')) setCoins(need('coins'));
  if (getTokens() < need('tokens')) addTokens(need('tokens') - getTokens());
}

resetShopForDemo();
renderShop();
