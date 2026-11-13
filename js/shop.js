// Магазин v2 (прототип): лутбоксы трёх редкостей за монеты. В каждом
// 2–4 предмета: первый — гарантированно карта цвета бокса, остальные
// разыгрываются по таблице шансов (карты, рамки, бустеры, монеты).
// Открытие — экран как у подарка в «Заданиях»: бокс падает, трясётся,
// крышка слетает, предметы вылетают рубашкой вверх и переворачиваются.

// 2.3 (витрина, карточка и открытие сундука по макету Figma 16908:29698): три
// сундука — обычный (зелёный) и редкий (синий) за монеты, эпический
// (фиолетовый) за ключи (вторая софт-валюта). Состав по макету «Состав
// сундуков» (17359:51278 / 51565 / 51852): награды без chance выпадают всегда,
// бонус от партнёров — с шансом.
//   эпический — карта редкая или эпическая, монеты 100–500, оформление, бонус 50%;
//   редкий    — карта обычная или редкая, ключи 10–50, оформление, бонус 50%;
//   обычный   — карта обычная, ключи 10–50, бонус 50%.
// card.alt — карта цвета сундука или (с шансом altChance) на ступень ниже.
// Ключи выпадают из обычного и редкого сундуков и даются за сундуки-вехи в
// «Заданиях». У каждого сундука суточный лимит покупок.
const LOOTBOXES = [
  {
    id: 'green',
    name: 'Обычный сундук',
    short: 'Обычный',
    price: 500,
    currency: 'coins',
    limit: 3,
    colors: ['#8ff07a', '#2e9e3f', '#1d5e27'],
    table: [
      { kind: 'card', rarity: 'green' },
      { kind: 'tokens', min: 10, max: 50 },
      { kind: 'bonus', chance: 50 },
    ],
  },
  {
    id: 'blue',
    name: 'Редкий сундук',
    short: 'Редкий',
    price: 700,
    currency: 'coins',
    limit: 3,
    colors: ['#8cc8ff', '#2f6fe0', '#1a3c8c'],
    table: [
      { kind: 'card', rarity: 'blue', alt: 'green', altChance: 50 },
      { kind: 'tokens', min: 10, max: 50 },
      { kind: 'frame' },
      { kind: 'bonus', chance: 50 },
    ],
  },
  {
    id: 'purple',
    name: 'Эпический сундук',
    short: 'Эпический',
    price: 50,
    currency: 'tokens',
    limit: 1,
    colors: ['#d7a6ff', '#7b34e0', '#3f1683'],
    table: [
      { kind: 'card', rarity: 'purple', alt: 'blue', altChance: 50 },
      { kind: 'coins', min: 100, max: 500 },
      { kind: 'frame' },
      { kind: 'bonus', chance: 50 },
    ],
  },
];

/* ---------- Ключи и суточные лимиты ---------- */

const TOKENS_KEY = 'v2.tokens';
const TOKENS_START = 20;
const SHOP_LIMITS_KEY = 'v2.shopLimits';
const CURRENCY = {
  coins: { icon: 'assets/shop-coin.png', one: 'монета', few: 'монеты', many: 'монет' },
  tokens: { icon: 'assets/shop-key-192.png', one: 'ключ', few: 'ключа', many: 'ключей' },
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

const BONUS_NAMES = ['SOKOLOV Beauty: скидка 15%', 'Кешбэк 5% в кафе', 'Скидка 10% в кино'];
const INVENTORY_KEY = 'v2.inventory';

const shopCoinsEl = document.getElementById('shopCoins');
const shopTokensEl = document.getElementById('shopTokens');
const shopBoxesEl = document.getElementById('shopBoxes');
const lbOverlayEl = document.getElementById('lbOverlay');
const lbStageEl = document.getElementById('lbStage');
const lbBoxEl = document.getElementById('lbBox');
const lbFlashEl = lbStageEl.querySelector('.lb-flash');
const lbCloseEl = document.getElementById('lbClose');
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

// taken — имена карт, уже выпавших в этом боксе: внутри одного бокса без повторов
// дубль карты распыляется в монеты (прототип, экономика — позже)
const DUP_COINS = { green: 20, blue: 50, purple: 100 };
const DUP_TIP_KEY = 'v2.dupTipSeen';

// «Забрать»: из каждой карты-дубля монетки улетают в счётчик монет магазина,
// счётчик подпрыгивает на каждую и в конце докручивается до нового значения
// награда с экрана наград: копия встаёт ровно на место оригинала (оригинал
// прячется), поэтому, пока фон и ячейки гаснут, награда остаётся на экране
let lbScale = 1;

function liftReward(art, dup) {
  const app = document.querySelector('.v2-app');
  const a = app.getBoundingClientRect();
  const rect = art.getBoundingClientRect();
  const wrap = document.createElement('div');
  wrap.className = `lb-fly-item${dup ? ' is-dup' : ''}`;
  wrap.style.left = `${rect.left - a.left}px`;
  wrap.style.top = `${rect.top - a.top}px`;
  wrap.style.width = `${rect.width}px`;
  wrap.style.height = `${rect.height}px`;
  const clone = art.cloneNode(true);
  if (lbScale < 1) clone.style.transform = `scale(${lbScale})`;
  wrap.appendChild(clone);
  app.appendChild(wrap);
  art.style.visibility = 'hidden';
  return { wrap, rect };
}

// награда приподнимается и, уменьшаясь, улетает в свою цель (счётчик или
// иконку таба); цель подпрыгивает и вспыхивает
function flyReward({ wrap, rect }, target, delay = 0) {
  if (!target) {
    return anime.animate(wrap, { opacity: [1, 0], duration: 300, delay }).then(() => wrap.remove());
  }
  const t = (target.querySelector('img, .v2-tab-icon') || target).getBoundingClientRect();
  const dx = t.left + t.width / 2 - (rect.left + rect.width / 2);
  const dy = t.top + t.height / 2 - (rect.top + rect.height / 2);
  const k = Math.min(1, 24 / Math.max(rect.width, rect.height));
  return anime.animate(wrap, {
    keyframes: {
      '0%': { x: 0, y: 0, scale: 1, opacity: 1 },
      '20%': { x: 0, y: -14, scale: 1.06, opacity: 1 },
      '90%': { x: dx, y: dy, scale: k, opacity: 1 },
      '100%': { x: dx, y: dy, scale: k * 0.5, opacity: 0 },
    },
    duration: 950,
    delay,
    ease: 'cubicBezier(0.5, 0, 0.3, 1)',
  }).then(() => {
    wrap.remove();
    A24.play(target, {
      keyframes: [
        { scale: 1.25, filter: 'drop-shadow(0 0 8px #ffdd2d)' },
        { scale: 1, filter: 'drop-shadow(0 0 0px #ffdd2d)' },
      ],
      duration: 420,
      ease: A24.EASE.out,
    });
  });
}

function makeReward(entry, taken = new Set()) {
  if (entry.kind === 'card') {
    // прототип: эпическая карта — всегда новая (пока есть неоткрытые),
    // остальные — дубль уже открытой карты
    const rarity = entry.alt && Math.random() * 100 < entry.altChance ? entry.alt : entry.rarity;
    const all = CARD_ROSTER.filter((c) => cardRarity(c) === rarity && !taken.has(c.name));
    const owned = ownedCardNames();
    const fresh = all.filter((c) => !owned.has(c.name));
    const pool = rarity === 'purple' ? fresh : all.filter((c) => owned.has(c.name));
    const card = pick(pool.length ? pool : all);
    taken.add(card.name);
    const dup = owned.has(card.name);
    return { kind: 'card', rarity, card, dup, dupCoins: dup ? DUP_COINS[rarity] : 0 };
  }
  if (entry.kind === 'coins') {
    const amount = Math.round((entry.min + Math.random() * (entry.max - entry.min)) / 10) * 10;
    return { kind: 'coins', amount };
  }
  if (entry.kind === 'tokens') {
    return { kind: 'tokens', amount: Math.round(entry.min + Math.random() * (entry.max - entry.min)) };
  }
  if (entry.kind === 'frame') {
    // косметика — рамка аватара (js/catalog/frames.js) или рубашка колоды (js/cosmetics24.js)
    const isBack = Math.random() < 0.5;
    // любая из каталога (сейчас там только обычные — js/catalog/)
    const item = pick(isBack ? COSMETICS24.BACKS : COSMETICS24.FRAMES);
    return { kind: 'frame', back: isBack, id: item.id, name: `${isBack ? 'Рубашка' : 'Рамка'} «${item.name}»` };
  }
  return { kind: 'bonus', name: pick(BONUS_NAMES) };
}

// награды без chance выпадают всегда, бонус — со своим шансом
function rollBox(box) {
  const taken = new Set();
  return box.table.filter((e) => !e.chance || Math.random() * 100 < e.chance).map((e) => makeReward(e, taken));
}

/* ---------- Отрисовка магазина ---------- */

// картинка сундука из макета (компонент «Сундуки XL», Figma 17424:170016):
// закрытый — для витрины, карточки и начала открытия, открытый со свечением —
// после вспышки. Класс lb-svg — общие стили и анимации
const chestSrc = (id, open) => `assets/chest24-${id}${open ? '-open' : ''}.webp`;
function chestArt(box) {
  return `<img class="lb-svg lb-chest-img" src="${chestSrc(box.id)}" alt="">`;
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
      <span class="shop-tile-glow"></span>
      <div class="shop-tile-art">${chestArt(box)}</div>
      <h2 class="shop-tile-name">${box.short}</h2>
      <span class="shop-tile-badge">${badge}</span>
      <span class="shop-tile-btn${limit ? ' is-off' : ''}"><span>${hero ? 'Открыть за ' : ''}${box.price}</span><img src="${CURRENCY[box.currency].icon}" alt=""></span>
    </article>`;
}

// сундук левитирует: вверх на 8px с покачиванием ±1.5°, цикл 3200 (туда-обратно);
// phase — сдвиг по фазе в мс, чтобы соседние сундуки не двигались синхронно
function levitate(el, phase = 0) {
  const anim = A24.loop(el, { y: [0, -8], rotate: [-1.5, 1.5], duration: 1600, alternate: true, ease: A24.EASE.inOut });
  if (anim && phase) anim.seek(phase);
}

function renderShop() {
  shopCoinsEl.textContent = getCoins();
  shopTokensEl.textContent = getTokens();
  // первым и крупнее всех — эпический сундук: на него копят ключи
  const hero = LOOTBOXES.find((b) => b.currency === 'tokens');
  const rest = LOOTBOXES.filter((b) => b !== hero).reverse();
  shopBoxesEl.innerHTML = tileHTML(hero, true) + `<div class="shop-row">${rest.map((b) => tileHTML(b, false)).join('')}</div>`;
  // сундуки на плитках левитируют, по фазе вразнобой
  shopBoxesEl.querySelectorAll('.shop-tile-art .lb-svg').forEach((img, i) => levitate(img, i * 1100));
  if (shopDetailBox) renderDetail(shopDetailBox);
}

/* ---------- Подсказки у балансов: что это и как получить ---------- */

const BALANCE_TIPS = {
  coins: ['Монеты', 'Основная валюта игры. Даются за задания и выпадают из сундуков. За монеты открываются обычный и редкий сундуки.'],
  tokens: ['Ключи', 'Открывают эпический сундук. Выпадают из каждого сундука и даются за сундуки на шкале в «Заданиях».'],
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



// награда — карточка 128×148 в две колонки (Figma 17359:51278 / 51565 / 51852):
// картинка из макета на всю карточку (у карт своя на каждый сундук — Figma
// 17214:21966 «Раздел награды»), внизу название 13/600 и подпись #9299a2
// (11/400 у карты и оформления, 12/400 у количества и шанса)
const PRIZE_ART = { coins: 'coins', tokens: 'keys', bonus: 'bonus', frame: 'styles' };
const CARD_PRIZE_SUB = { purple: 'Редкая или эпическая', blue: 'Обычная или редкая', green: 'Обычная' };
function prizeText(e) {
  if (e.kind === 'card') return ['Карта', CARD_PRIZE_SUB[e.rarity], 'is-text'];
  if (e.kind === 'coins') return ['Монеты', `${e.min} — ${e.max} шт.`];
  if (e.kind === 'tokens') return ['Ключи', `${e.min} — ${e.max} шт.`];
  if (e.kind === 'frame') return ['Оформление', 'Рамки, рубашки, профиль', 'is-text'];
  return ['Бонус', `Шанс выпадения ${e.chance}%`];
}
function rewardPreview(e) {
  const key = e.kind === 'card' ? `card-${e.rarity}` : e.kind;
  const [title, sub, cls] = prizeText(e);
  return `<li class="shop-prize shop-prize-${key}" data-prize-tip="${key}" role="button" tabindex="0">
    <img class="shop-prize-img" src="assets/shop-prize2-${e.kind === 'card' ? key : PRIZE_ART[e.kind]}.png" alt="">
    <span class="shop-prize-title">${title}</span><span class="shop-prize-sub ${cls || ''}">${sub}</span>
  </li>`;
}

// подсказка по тапу на награду — общий тултип над карточкой, как в макете
// (Figma 16908:29698 «Подсказка в наградам»)
function prizeTip(key) {
  return {
    'card-green': 'Обычная карта. Если такая уже есть, дубль превратится в монеты',
    'card-blue': 'Обычная или редкая карта. Если такая уже есть, дубль превратится в монеты',
    'card-purple': 'Редкая или эпическая карта',
    coins: 'Монеты, за которые открываются обычный и редкий сундуки',
    tokens: 'Ключи, которые открывают эпический сундук',
    frame: 'Рамка аватара, рубашка колоды или оформление профиля',
    bonus: 'Скидка или кешбэк от партнёров — появится в «Бонусах»',
  }[key];
}

// свечение сверху шторки — цвета сундука (у эпического из макета #5d25b0)
const SHEET_GLOW = { purple: '#5d25b0', blue: '#1f4fae', green: '#0f7a50' };

// Недоступно (Figma 17249:23559 — закончились, 17249:23846 — не хватает валюты):
// кнопка та же «Открыть за N», но неактивная, под ней жёлтая подсказка 17/400
// «Будет доступен через ЧЧ:ММ:СС» или «Не хватает N ключей/монет»; бейдж
// у закончившегося сундука — «Закончились»
function renderDetail(box) {
  const st = boxState(box);
  const icon = `<img src="${CURRENCY[box.currency].icon}" alt="">`;
  let note = '';
  if (st.reason === 'limit') note = `Будет доступен через <span data-shop-timer>${limitTimer()}</span>`;
  else if (st.reason === 'money') note = `Не хватает ${st.need} ${plural(st.need, CURRENCY[box.currency])}`;
  const btn = `<button class="bs-cta shop-open"${st.can ? ` data-open="${box.id}"` : ' disabled'}>Открыть за ${box.price}${icon}</button>`
    + (note ? `<p class="shop-open-note">${note}</p>` : '');
  // бейдж «Осталось сундуков: N» (Figma 17359:51278), у закончившегося — «Закончились»
  const badge = st.reason === 'limit' ? 'Закончились' : `Осталось сундуков: ${st.left}`;
  shopDetailEl.style.setProperty('--glow', SHEET_GLOW[box.id]);
  shopDetailBody.innerHTML = `
    <span class="shop-detail-star" aria-hidden="true"></span>
    <span class="shop-tile-badge shop-detail-badge">${badge}</span>
    <div class="shop-detail-art">${chestArt(box)}</div>
    <h2 class="shop-detail-title">Награды в сундуке</h2>
    <ul class="shop-prizes">${box.table.map(rewardPreview).join('')}</ul>`;
  shopDetailEl.setAttribute('aria-label', box.name);
  shopDetailFoot.innerHTML = btn;
  levitate(shopDetailBody.querySelector('.shop-detail-art .lb-svg'));
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
    Tooltip24.show(prize, { text: prizeTip(prize.dataset.prizeTip), above: true });
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
  const bonus = LOOTBOXES.map((box) => `${box.short.toLowerCase()} — ${box.table.find((e) => e.kind === 'bonus').chance}%`).join(', ');
  const ranges = LOOTBOXES.map((box) => {
    const t = box.table.find((e) => e.kind === 'tokens');
    const c = box.table.find((e) => e.kind === 'coins');
    return `${box.name}: ключи ${t.min}–${t.max}, монеты ${c.min}–${c.max}.`;
  }).join('<br>');
  const limits = LOOTBOXES.map((box) => `${box.short.toLowerCase()} — ${box.limit}`).join(', ');
  return [
    ['Как получить новые карты?', 'Карты не продаются напрямую — они выпадают только из сундуков. Чем дороже сундук, тем реже карта внутри.'],
    ['Чем отличаются сундуки?', 'Обычный и редкий открываются за монеты, эпический — за ключи. Из обычного выпадает обычная карта, из редкого — редкая или обычная, из эпического — эпическая или редкая.'],
    ['Что выпадет из сундука?', `Четыре награды гарантированно: карта, ключи, монеты и стиль — рамка аватара или рубашка колоды. Пятая — бонус от партнёров — выпадает с шансом: ${bonus}.`],
    ['Сколько ключей и монет внутри?', ranges],
    ['Где взять ключи?', 'Они выпадают из каждого сундука и даются за сундуки на шкале в разделе «Задания».'],
    ['Сколько сундуков можно открыть за день?', `У каждого сундука свой лимит: ${limits}. Он обновляется каждый день в полночь — до обновления на сундуке виден таймер.`],
    ['Куда попадают награды?', 'Карты — в коллекцию в разделе «Карты», монеты и ключи — в баланс, бонусы — в раздел «Бонусы», стили — в настройки профиля.'],
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
  animateBalance(shopCoinsEl, from, to);
}

function animateBalance(el, from, to) {
  const start = performance.now();
  const dur = 600;
  function frame(now) {
    const t = Math.min(1, (now - start) / dur);
    el.textContent = Math.round(from + (to - from) * (1 - (1 - t) ** 3));
    if (t < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  A24.pulse(el.parentElement, 1.12, 360);
}

/* ---------- Открытие (Figma 16908:29698, секция «Открытие сундука» 17056:193993) ---------- */
// Шаги: закрытый сундук на свечении в свой цвет → в синий и зелёный сверху в
// прорезь падают монетки (иконка монет из счётчика), в фиолетовый в замочную
// скважину влетает ключ и поворачивается → сундук трясётся от 1 до 3 с, всё
// сильнее → вспышка, сундук открыт и светится → из него вылетают подарки и
// встают в сетку наград («Награды», бонус широкой плиткой сверху, остальные
// 128×148 по две в ряд) → «Забрать». Тот же лейаут потом берём в «Задания»
// (с другими картинками сундуков). В эпическом сундуке карта и бонус
// приземляются «легендарно» — со вспышкой и конфетти.

const CARD_RARITY_NAME = { green: 'Обычная', blue: 'Редкая', purple: 'Эпическая' };
// свечение ячеек наград (у эпического #bb00ff из макета)
// сундуки заданий: дейли — зелёный, викли — фиолетовый (Figma 16423:42940)
const LB_GLOW = { purple: '#bb00ff', blue: '#3d8aff', green: '#1eca85', daily: '#4acf16', weekly: '#bb00ff' };
// подсветка за сундуком (Figma «Подсветка»): 15-лучевая звезда 513×317 с
// размытием 42 и 6-лучевая 597×369 с размытием 24, цвета из макета
const LB_STARS = {
  blue: ['#2c74d9', '#3d89a9'],
  purple: ['#7338b1', '#c286bf'],
  green: ['#408a67', '#51902e'],
  daily: ['#46a70a', '#219645'],
  weekly: ['#ae5be8', '#8850eb'],
};
// где сундук стоит в блоке 540×540 (компонент «Сундуки XL», Figma 17424:170016):
// [x, y, ширина, высота] закрытого и открытого, прорезь для монет / скважина
const LB_XL = {
  blue: { closed: [128, 142, 269, 274], open: [30, -33, 480, 480], slot: [262, 194], mouth: [270, 250] },
  green: { closed: [115, 126, 294, 303], open: [32, -29, 477, 477], slot: [262, 199], mouth: [270, 250] },
  purple: { closed: [129, 153, 266, 266], open: [44, -19, 448, 448], hole: [209, 310], mouth: [262, 250] },
  daily: { closed: [125, 83, 290, 360], open: [63, -38, 414, 514], mouth: [270, 250] },
  weekly: { closed: [125, 83, 290, 360], open: [63, -38, 414, 514], mouth: [270, 250] },
};
// порядок как в макете: бонус сверху во всю ширину, дальше карта, монеты/ключи, оформление
const LB_ORDER = ['bonus', 'card', 'coins', 'tokens', 'frame'];
const CONFETTI_COLORS = ['#ffdd2d', '#ff5c8a', '#42cf9b', '#3d8aff', '#b36bff', '#ffffff'];

function starPoints(n, rx, ry, inner) {
  const pts = [];
  for (let k = 0; k < n * 2; k++) {
    const r = k % 2 ? inner : 1;
    const a = (Math.PI * k) / n - Math.PI / 2;
    pts.push(`${(rx + rx * r * Math.cos(a)).toFixed(1)},${(ry + ry * r * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(' ');
}

function chestStageHTML(box) {
  const [c1, c2] = LB_STARS[box.id];
  const g = LB_XL[box.id];
  const pos = ([x, y, w, h]) => `left:${x}px;top:${y}px;width:${w}px;height:${h}px`;
  return `
    <div class="lb-glow" aria-hidden="true">
      <svg class="lb-star lb-star-a" viewBox="0 0 597 369"><polygon points="${starPoints(6, 298.5, 184.5, 0.162)}" fill="${c2}"/></svg>
      <svg class="lb-star lb-star-b" viewBox="0 0 513 317"><polygon points="${starPoints(15, 256.5, 158.5, 0.382)}" fill="${c1}"/></svg>
    </div>
    <img class="lb-chest lb-chest-closed" src="${chestSrc(box.id)}" alt="" style="${pos(g.closed)}">
    <img class="lb-chest lb-chest-open" src="${chestSrc(box.id, true)}" alt="" style="${pos(g.open)}">
    <div class="lb-fx"></div>`;
}

// низкий экран: если сетка наград не помещается до кнопки «Забрать»,
// уменьшаем её целиком (пропорции ячеек как в макете); затем ставим
// заголовок и сетку по центру свободного места
function fitRewards() {
  lbScale = 1;
  lbTitleEl.style.marginTop = '';
  lbRewardsEl.style.transform = '';
  lbRewardsEl.style.marginBottom = '';
  const h = lbRewardsEl.offsetHeight;
  const avail = lbClaimEl.offsetTop - lbRewardsEl.offsetTop - 16;
  if (h > avail && h) {
    lbScale = Math.max(0.6, avail / h);
    lbRewardsEl.style.transform = `scale(${lbScale})`;
    lbRewardsEl.style.marginBottom = `${-h * (1 - lbScale)}px`;
  }
  // заголовок «Награды» и сетка — по центру между крестиком и «Забрать»
  const top = lbCloseEl.offsetTop + lbCloseEl.offsetHeight + 8;
  const bottom = lbClaimEl.offsetTop - 16;
  const content = lbRewardsEl.offsetTop + h * lbScale - lbTitleEl.offsetTop;
  const free = bottom - top - content;
  if (free > 0) lbTitleEl.style.marginTop = `${Math.round(top + free / 2)}px`;
}

// ячейка награды (Figma 17056:193930): 128×148, картинка на всю ячейку,
// внизу название 13/600 и подпись 11/400 #9299a2; бонус — 268×124, текст
// 17/600 слева, подарок 120×90 справа внизу; дубль — «Уже есть / + N монет»
function rewardCellHTML(r) {
  if (r.kind === 'bonus') {
    return `<div class="lb-cell is-bonus"><p class="lb-bonus-title">${r.name}</p><img class="lb-bonus-img" src="assets/v2-prize-gift.png" alt=""></div>`;
  }
  let title;
  let sub;
  let art;
  if (r.kind === 'card') {
    title = r.dup ? 'Уже есть' : 'Карта';
    sub = r.dup ? `+ ${r.dupCoins} ${plural(r.dupCoins, CURRENCY.coins)}` : CARD_RARITY_NAME[r.rarity];
    art = `<div class="card24 lb-card">${card24HTML(r.card)}</div>`;
  } else if (r.kind === 'coins') {
    title = 'Монеты';
    sub = `${r.amount} шт.`;
    art = '<img class="lb-cell-img" src="assets/shop-prize2-coins.png" alt="">';
  } else if (r.kind === 'tokens') {
    title = 'Ключи';
    sub = `${r.amount} шт.`;
    art = '<img class="lb-cell-img" src="assets/shop-prize2-keys.png" alt="">';
  } else {
    title = 'Оформление';
    sub = r.back ? 'Рубашка карты' : 'Рамка аватара';
    art = '<img class="lb-cell-img" src="assets/shop-prize2-styles.png" alt="">';
  }
  return `<div class="lb-cell lb-cell-${r.kind}${r.dup ? ' is-dup' : ''}"><div class="lb-cell-art">${art}</div><p class="lb-cell-title">${title}</p><span class="lb-cell-sub">${sub}</span></div>`;
}

let lbBusy = false;
let lbSkip = false;
let lbTimeline = null;

// элемент, центрированный по точке: сдвиг на половину размера — CSS-свойством
// translate, а движение (x, y, scale, rotate) пишет anime.js в transform
function lbCentered(el, x, y) {
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.style.translate = '-50% -50%';
  return el;
}

// конфетти из центра ячейки: разлетаются вверх и в стороны и осыпаются
function confettiFrom(cell) {
  const a = lbOverlayEl.getBoundingClientRect();
  const r = cell.getBoundingClientRect();
  const cx = r.left + r.width / 2 - a.left;
  const cy = r.top + r.height / 2 - a.top;
  for (let i = 0; i < 46; i++) {
    const c = lbCentered(document.createElement('span'), cx, cy);
    c.className = 'lb-confetti';
    c.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    lbOverlayEl.appendChild(c);
    const vx = (Math.random() - 0.5) * 340;
    const vy = -140 - Math.random() * 200;
    const rot = (Math.random() - 0.5) * 900;
    anime.animate(c, {
      keyframes: {
        '0%': { x: 0, y: 0, rotate: 0, scale: 0.4, opacity: 1 },
        '35%': { x: vx * 0.8, y: vy, rotate: rot * 0.5, scale: 1, opacity: 1 },
        '100%': { x: vx, y: vy + 320, rotate: rot, scale: 0.9, opacity: 0 },
      },
      duration: 1300 + Math.random() * 500,
      ease: 'cubicBezier(0.2, 0.6, 0.4, 1)',
      onComplete: () => c.remove(),
    });
  }
}

// блик в точке блока 540×540 (прорезь, скважина)
function lbGlint(x, y, size = 46) {
  if (lbSkip) return;
  const g = lbCentered(document.createElement('span'), x, y);
  g.className = 'lb-glint';
  g.style.width = g.style.height = `${size}px`;
  lbBoxEl.querySelector('.lb-fx').appendChild(g);
  anime.animate(g, {
    keyframes: { '0%': { scale: 0.2, opacity: 0 }, '35%': { scale: 1, opacity: 1 }, '100%': { scale: 1.6, opacity: 0 } },
    duration: 420,
    ease: A24.EASE.out,
    onComplete: () => g.remove(),
  });
}

// сундук коротко «принимает» монету или ключ — чуть оседает
function lbBump() {
  if (lbSkip) return;
  A24.play(lbBoxEl.querySelector('.lb-chest-closed'), {
    keyframes: [{ y: 5, scaleX: 1.02, scaleY: 0.97 }, { y: 0, scaleX: 1, scaleY: 1 }],
    duration: 220,
    ease: A24.EASE.out,
  });
}

// вспышка из центра сундука
function lbFlash(peak, end, peakOpacity, duration) {
  if (lbSkip) return;
  anime.animate(lbFlashEl, {
    keyframes: { '0%': { scale: 0.3, opacity: 0 }, '25%': { scale: peak, opacity: peakOpacity }, '100%': { scale: end, opacity: 0 } },
    duration,
    ease: A24.EASE.out,
  });
}

// --- шаги открытия: каждый добавляет свои анимации в таймлайн с момента t
//     и возвращает момент, когда шаг закончился ---

// 1. закрытый сундук падает на свечение своего цвета
function lbIntro(tl, t) {
  tl.add(lbBoxEl.querySelector('.lb-glow'), { scale: [0.5, 1], opacity: [0, 1], duration: 500, ease: A24.EASE.out }, t);
  tl.add(lbBoxEl.querySelector('.lb-chest-closed'), {
    keyframes: { '0%': { y: -50, scale: 0.7, opacity: 0 }, '70%': { y: 6, scale: 1.03, opacity: 1 }, '100%': { y: 0, scale: 1, opacity: 1 } },
    duration: 480,
    ease: 'cubicBezier(0.2, 0.8, 0.3, 1)',
  }, t);
  return t + 480 + 350;
}

// 2а. синий и зелёный: монетки по одной падают в прорезь и исчезают в ней
// (монета в окне, нижний край которого — прорезь)
function lbCoins(tl, t, box) {
  const [sx, sy] = LB_XL[box.id].slot;
  const fx = lbBoxEl.querySelector('.lb-fx');
  let last = t;
  for (let i = 0; i < 4; i++) {
    const win = document.createElement('div');
    win.className = 'lb-coin-win';
    win.style.left = `${sx}px`;
    win.style.top = `${sy}px`;
    win.innerHTML = `<img class="lb-coin" src="${CURRENCY.coins.icon}" alt="" style="opacity:0">`;
    fx.appendChild(win);
    const drift = (i % 2 ? 1 : -1) * (6 + Math.random() * 10);
    const at = t + i * 260;
    tl.add(win.firstChild, {
      keyframes: {
        '0%': { x: drift, y: -330, rotate: drift * 2, scaleX: 1, opacity: 0 },
        '55%': { x: drift * 0.3, y: -150, rotate: drift, scaleX: 0.8, opacity: 1 },
        '80%': { x: 0, y: -100, rotate: 0, scaleX: 0.5, opacity: 1 },
        '100%': { x: 0, y: 12, rotate: 0, scaleX: 0.5, opacity: 1 },
      },
      duration: 620,
      ease: 'cubicBezier(0.45, 0, 0.9, 0.6)',
    }, at);
    tl.call(() => { win.remove(); lbGlint(sx, sy, 54); lbBump(); }, at + 620);
    last = at + 620;
  }
  return last + 200;
}

// 2б. эпический: ключ влетает по дуге в скважину, поворачивается и тает
function lbKey(tl, t, box) {
  const [hx, hy] = LB_XL[box.id].hole;
  const key = lbCentered(document.createElement('img'), hx, hy);
  key.className = 'lb-key';
  key.src = CURRENCY.tokens.icon;
  key.alt = '';
  key.style.opacity = '0';
  lbBoxEl.querySelector('.lb-fx').appendChild(key);
  tl.add(key, {
    keyframes: {
      '0%': { x: -170, y: -300, rotate: -70, scale: 1.3, opacity: 0 },
      '50%': { x: -150, y: -90, rotate: -30, scale: 1.15, opacity: 1 },
      '100%': { x: 0, y: 0, rotate: 0, scale: 0.8, opacity: 1 },
    },
    duration: 700,
    ease: 'cubicBezier(0.3, 0, 0.3, 1)',
  }, t);
  tl.call(lbBump, t + 700);
  // поворот ключа в замке — щелчок
  tl.add(key, { keyframes: { '0%': { rotate: 0 }, '70%': { rotate: 100 }, '100%': { rotate: 90 } }, duration: 380, ease: 'cubicBezier(0.3, 0, 0.3, 1.4)' }, t + 700);
  tl.call(() => lbGlint(hx, hy, 70), t + 1080);
  tl.add(key, { scale: 0.3, opacity: 0, duration: 260, ease: A24.EASE.in }, t + 1080);
  tl.call(() => key.remove(), t + 1340);
  return t + 1340 + 150;
}

// 3. тряска 1–3 с, всё сильнее; подсветка разгорается
function lbShake(tl, t) {
  const dur = 1000 + Math.random() * 2000;
  const steps = Math.max(10, Math.round(dur / 70));
  const keyframes = [];
  for (let i = 1; i <= steps; i++) {
    const k = i / steps;
    const s = i % 2 ? 1 : -1;
    const amp = 1 + 7 * k * k;
    keyframes.push({ x: s * amp * 0.8, y: -amp * 0.3 * Math.random(), rotate: s * amp * 0.9, scale: 1 + 0.08 * k, duration: dur / steps });
  }
  tl.add(lbBoxEl.querySelector('.lb-chest-closed'), { keyframes, ease: 'linear' }, t);
  tl.add(lbBoxEl.querySelector('.lb-glow'), { scale: 1.3, rotate: 25, filter: ['brightness(1)', 'brightness(1.6)'], duration: dur, ease: A24.EASE.in }, t);
  return t + dur;
}

// 4. вспышка: закрытый сундук сменяется открытым со свечением
function lbOpen(tl, t) {
  const closed = lbBoxEl.querySelector('.lb-chest-closed');
  const open = lbBoxEl.querySelector('.lb-chest-open');
  tl.call(() => lbFlash(9, 14, 1, 700), t);
  tl.set(closed, { opacity: 0 }, t + 150);
  tl.set(open, { opacity: 1 }, t + 150);
  tl.call(() => { if (!lbSkip && navigator.vibrate) navigator.vibrate(30); }, t + 150);
  tl.add(open, { keyframes: { '0%': { scale: 1.18 }, '60%': { scale: 0.96 }, '100%': { scale: 1 } }, duration: 520, ease: 'cubicBezier(0.3, 1.3, 0.5, 1)' }, t + 150);
  return t + 150 + 520 + 600;
}

// 5. подарки вылетают из открытого сундука и встают на свои места в сетке
function lbFlyOut(tl, t, box, rewards, cells) {
  const [mx, my] = LB_XL[box.id].mouth;
  const xl = lbBoxEl.getBoundingClientRect();
  const k = xl.width / 540;
  const ox = xl.left + mx * k;
  const oy = xl.top + my * k;
  tl.add(lbTitleEl, { y: [8, 0], opacity: [0, 1], duration: 300, ease: A24.EASE.ease }, t);
  // сундук и подсветка гаснут, пока подарки летят
  tl.add(lbBoxEl, { opacity: 0, scale: 0.9, duration: 500, ease: A24.EASE.in }, t + 250);
  const epic = box.id === 'purple' || box.id === 'weekly';
  let last = t;
  cells.forEach((cell, i) => {
    const r = cell.getBoundingClientRect();
    const dx = (ox - (r.left + r.width / 2)) / lbScale;
    const dy = (oy - (r.top + r.height / 2)) / lbScale;
    const at = t + 120 + i * 170;
    tl.add(cell, {
      keyframes: {
        '0%': { x: dx, y: dy, scale: 0.15, opacity: 0 },
        '55%': { x: dx * 0.45, y: dy * 0.45 - 90, scale: 0.75, opacity: 1 },
        '85%': { x: 0, y: -6, scale: 1.04, opacity: 1 },
        '100%': { x: 0, y: 0, scale: 1, opacity: 1 },
      },
      duration: 720,
      ease: 'cubicBezier(0.25, 0.8, 0.35, 1)',
    }, at);
    // «легендарные» (эпическая карта, бонус) приземляются со вспышкой и конфетти
    if (epic && (rewards[i].kind === 'card' || rewards[i].kind === 'bonus')) {
      tl.call(() => {
        if (lbSkip) return;
        lbFlash(4, 7, 0.6, 600);
        confettiFrom(cell);
      }, at + 720);
    }
    last = at + 720;
  });
  return last + 300;
}

// кнопка «Забрать» выезжает снизу; по окончании — состояние из CSS (.is-visible)
function lbShowClaim() {
  anime.animate(lbClaimEl, {
    y: [20, 0],
    opacity: [0, 1],
    duration: 300,
    ease: A24.EASE.spring,
    onComplete: () => {
      lbClaimEl.classList.add('is-visible');
      A24.clear(lbClaimEl, { y: 0, opacity: 0 });
    },
  });
}

async function openLootbox(box) {
  if (lbBusy || !boxState(box).can) return;
  lbBusy = true;
  lbSkip = false;
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
  box.insert = box.currency === 'tokens' ? 'key' : 'coins';
  await playLootbox(box, rewards);
}

// экран открытия сундука — общий для магазина и сундуков заданий
// (box.id — цвет: green/blue/purple/daily/weekly; box.insert — 'coins',
// 'key' или ничего). Вся последовательность — один таймлайн anime.js;
// «Закрыть» во время него — timeline.complete(), всё встаёт в конечное
// состояние. Возвращается, когда награды разлетелись и экран закрылся
async function playLootbox(box, list) {
  lbBusy = true;
  lbSkip = false;
  const order = box.order || LB_ORDER;
  const rewards = list.slice().sort((x, y) => order.indexOf(x.kind) - order.indexOf(y.kind));

  anime.remove(lbOverlayEl.querySelectorAll('*'));
  lbOverlayEl.querySelectorAll('.lb-confetti').forEach((c) => c.remove());
  lbOverlayEl.style.setProperty('--lb-glow', LB_GLOW[box.id]);
  lbBoxEl.innerHTML = chestStageHTML(box);
  lbBoxEl.removeAttribute('style');
  lbTitleEl.removeAttribute('style');
  lbClaimEl.removeAttribute('style');
  lbTitleEl.classList.remove('is-visible');
  lbClaimEl.classList.remove('is-visible');
  lbOverlayEl.style.opacity = '';
  // сетка наград рисуется сразу (невидимой) — пути вылета считаются от неё
  lbRewardsEl.innerHTML = rewards.map(rewardCellHTML).join('');
  const cells = Array.from(lbRewardsEl.children);
  cells.forEach((c) => { c.style.opacity = '0'; });
  lbOverlayEl.classList.add('is-open');
  lbOverlayEl.setAttribute('aria-hidden', 'false');
  fitRewards();
  startChestGlow();

  const tl = anime.createTimeline({ autoplay: true });
  lbTimeline = tl;
  let t = lbIntro(tl, 0);
  if (box.insert === 'key') t = lbKey(tl, t, box);
  else if (box.insert === 'coins') t = lbCoins(tl, t, box);
  t = lbShake(tl, t);
  t = lbOpen(tl, t);
  t = lbFlyOut(tl, t, box, rewards, cells);
  tl.call(() => {}, t);
  await tl;
  lbTimeline = null;
  lbTitleEl.classList.add('is-visible');

  // первый дубль в жизни — объясняем механику тултипом над ячейкой
  const dupCell = cells.find((c) => c.classList.contains('is-dup'));
  if (dupCell && !storageGet(DUP_TIP_KEY)) {
    storageSet(DUP_TIP_KEY, '1');
    Tooltip24.show(dupCell, {
      title: 'Дубль превращается в монеты',
      text: 'Такая карта у вас уже есть, поэтому вместо неё вы получаете монеты.',
      width: 260,
    });
  }

  applyRewards(rewards);
  lbShowClaim();
  await new Promise((resolve) => {
    const done = () => { lbClaimEl.removeEventListener('click', done); lbCloseEl.removeEventListener('click', done); resolve(); };
    lbClaimEl.addEventListener('click', done);
    lbCloseEl.addEventListener('click', done);
  });
  Tooltip24.hide();
  // каждая награда прямо с экрана улетает в свой раздел: монеты, ключи и
  // дубль (он стал монетами) — в счётчики, карта — в «Карты», оформление —
  // в «Игру» (профиль), бонус — в «Призы». Фон, ячейки и кнопка гаснут
  // вокруг наград, сами награды остаются на месте до вылета
  const tab = (nav) => document.querySelector(`.v2-tab[data-nav="${nav}"] .v2-tab-icon`);
  // счётчики магазина; если открываем не из магазина — летим в таб «Магазин»
  const visible = (el) => (el && el.offsetParent ? el : null);
  const coinsBox = visible(document.querySelector('.shop-balance[data-balance="coins"]')) || tab('shop');
  const tokensBox = visible(document.querySelector('.shop-balance[data-balance="tokens"]')) || tab('shop');
  // у дубля улетают только монеты «+ N монет», карта гаснет вместе с экраном
  const artOf = (cell, r) => cell.querySelector(r.kind === 'bonus' ? '.lb-bonus-img' : r.dup ? '.lb-cell-sub' : '.lb-cell-art');
  const lifted = cells.map((cell, i) => liftReward(artOf(cell, rewards[i]), rewards[i].dup));
  renderShop();
  const fade = anime.animate(lbOverlayEl, { opacity: [1, 0], duration: 300, ease: A24.EASE.in }).then(() => {
    lbOverlayEl.classList.remove('is-open');
    lbOverlayEl.setAttribute('aria-hidden', 'true');
    anime.remove(lbOverlayEl.querySelectorAll('*'));
    lbOverlayEl.querySelectorAll('.lb-confetti').forEach((c) => c.remove());
    lbRewardsEl.innerHTML = '';
    lbBoxEl.innerHTML = '';
    lbBusy = false;
  });
  await Promise.all([fade, ...rewards.map((r, i) => {
    const delay = 250 + i * 200;
    if (r.kind === 'coins' || (r.kind === 'card' && r.dup)) {
      const amount = r.kind === 'coins' ? r.amount : r.dupCoins;
      return flyReward(lifted[i], coinsBox, delay).then(() => {
        const before = getCoins();
        addCoins(amount);
        animateCoins(before, before + amount);
      });
    }
    if (r.kind === 'tokens') {
      return flyReward(lifted[i], tokensBox, delay).then(() => {
        const before = getTokens();
        addTokens(r.amount);
        animateBalance(shopTokensEl, before, before + r.amount);
      });
    }
    return flyReward(lifted[i], tab(r.kind === 'card' ? 'cards' : r.kind === 'bonus' ? 'gifts' : 'game'), delay);
  })]);
}

// подсветка за сундуком живёт всё время, пока открыт экран: большая звезда
// покачивается ±12° и «дышит», малая — навстречу и мерцает. Анимации на самих
// звёздах — не мешают появлению и разгоранию (они на контейнере .lb-glow)
function startChestGlow() {
  A24.loop(lbBoxEl.querySelector('.lb-star-a'), {
    rotate: [-12, 12], scale: [0.96, 1.12], opacity: [0.8, 1],
    duration: 2500, alternate: true, ease: A24.EASE.inOut,
  });
  A24.loop(lbBoxEl.querySelector('.lb-star-b'), {
    rotate: [10, -14], scale: [1.06, 0.9], opacity: [1, 0.6],
    duration: 1800, alternate: true, ease: A24.EASE.inOut,
  });
}

// «Закрыть» во время открытия — пропустить анимацию и сразу показать награды
lbCloseEl.addEventListener('click', () => {
  if (!lbTimeline) return;
  lbSkip = true;
  lbTimeline.complete();
});

function applyRewards(rewards) {
  const inv = loadInventory();
  rewards.forEach((r) => {
    // монеты, ключи и монеты за дубль начисляются, когда долетают до счётчика
    if (r.kind === 'card' && r.dup) { /* см. openLootbox */ }
    else if (r.kind === 'card') { inv.cards += 1; unlockCard(r.card.name); }
    else if (r.kind === 'frame') inv.frames += 1;
    else if (r.kind === 'bonus') inv.bonuses = (inv.bonuses || 0) + 1;
  });
  saveInventory(inv);
}

/* ---------- События ---------- */

shopBoxesEl.addEventListener('click', (e) => {
  const tile = e.target.closest('.shop-tile');
  if (!tile) return;
  const box = LOOTBOXES.find((b) => tile.classList.contains(`shop-box-${b.id}`));
  A24.pulse(tile, 0.96, 220);
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
