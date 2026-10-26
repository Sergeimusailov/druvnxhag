// Магазин v2 (прототип): лутбоксы трёх редкостей за монеты. В каждом
// 2–4 предмета: первый — гарантированно карта цвета бокса, остальные
// разыгрываются по таблице шансов (карты, рамки, бустеры, монеты).
// Открытие — экран как у подарка в «Заданиях»: бокс падает, трясётся,
// крышка слетает, предметы вылетают рубашкой вверх и переворачиваются.

// 2.3 (описание магазина, без макета): три сундука — зелёный и синий за
// монеты, эпический (фиолетовый) за фиолетовые жетоны-ключи (вторая
// софт-валюта). При открытии выпадает ОДНА награда из состава сундука.
// Жетоны выпадают из зелёного и синего сундуков и даются за сундуки-вехи в
// «Заданиях». У каждого сундука суточный лимит покупок. Состав и шансы
// видны в карточке сундука по кнопке «Посмотреть», шансы — по «?».
const LOOTBOXES = [
  {
    id: 'green',
    name: 'Зелёный сундук',
    short: 'Зелёный',
    price: 100,
    currency: 'coins',
    limit: 5,
    colors: ['#8ff07a', '#2e9e3f', '#1d5e27'],
    table: [
      { kind: 'card', rarity: 'green', weight: 55 },
      { kind: 'coins', min: 20, max: 60, weight: 25 },
      { kind: 'tokens', min: 5, max: 10, weight: 15 },
      { kind: 'bonus', weight: 5 },
    ],
  },
  {
    id: 'blue',
    name: 'Синий сундук',
    short: 'Синий',
    price: 250,
    currency: 'coins',
    limit: 3,
    colors: ['#8cc8ff', '#2f6fe0', '#1a3c8c'],
    table: [
      { kind: 'card', rarity: 'blue', weight: 50 },
      { kind: 'coins', min: 60, max: 150, weight: 25 },
      { kind: 'tokens', min: 10, max: 20, weight: 20 },
      { kind: 'bonus', weight: 5 },
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
      { kind: 'card', rarity: 'purple', weight: 55 },
      { kind: 'coins', min: 150, max: 300, weight: 25 },
      { kind: 'tokens', min: 20, max: 40, weight: 10 },
      { kind: 'bonus', weight: 10 },
    ],
  },
];

/* ---------- Фиолетовые жетоны и суточные лимиты ---------- */

const TOKENS_KEY = 'v2.tokens';
const TOKENS_START = 20;
const SHOP_LIMITS_KEY = 'v2.shopLimits';
const CURRENCY = {
  coins: { icon: 'assets/v2-coin.png', one: 'монета', few: 'монеты', many: 'монет' },
  tokens: { icon: 'assets/v2-token-key.svg', one: 'жетон', few: 'жетона', many: 'жетонов' },
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

const FRAME_NAMES = ['Неон', 'Золото', 'Северное сияние', 'Лава', 'Кристалл'];
const BONUS_NAMES = ['Кешбэк 5% в кафе', 'Скидка 10% в кино', 'Бесплатная доставка'];
const INVENTORY_KEY = 'v2.inventory';

const shopCoinsEl = document.getElementById('shopCoins');
const shopTokensEl = document.getElementById('shopTokens');
const shopBoxesEl = document.getElementById('shopBoxes');
const shopInventoryEl = document.getElementById('shopInventory');
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

function rollEntry(table) {
  const total = table.reduce((s, e) => s + e.weight, 0);
  let r = Math.random() * total;
  for (const e of table) {
    r -= e.weight;
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
  if (entry.kind === 'frame') return { kind: 'frame', name: pick(FRAME_NAMES) };
  return { kind: 'bonus', name: pick(BONUS_NAMES) };
}

function rollBox(box) {
  return [makeReward(rollEntry(box.table))];
}

/* ---------- Отрисовка магазина ---------- */

// лутбокс — сундук в цветах редкости (SVG, чтобы перекрашивать без ассетов)
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

function chanceRows(box) {
  const total = box.table.reduce((s, e) => s + e.weight, 0);
  const label = (e) => {
    if (e.kind === 'card') return `${RARITIES[e.rarity].name} карта`;
    if (e.kind === 'coins') return `Монеты ${e.min}–${e.max}`;
    if (e.kind === 'tokens') return `Жетоны-ключи ${e.min}–${e.max}`;
    if (e.kind === 'frame') return 'Оформление профиля';
    return 'Бонус';
  };
  const dot = (e) => (e.kind === 'card' ? RARITIES[e.rarity].color : KIND_COLORS[e.kind]);
  return box.table
    .map((e) => `<li><span class="shop-dot" style="background:${dot(e)}"></span>${label(e)}<b>${Math.round((e.weight / total) * 100)}%</b></li>`)
    .join('');
}

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

function renderShop() {
  shopCoinsEl.textContent = getCoins();
  shopTokensEl.textContent = getTokens();
  shopBoxesEl.innerHTML = LOOTBOXES.map((box) => {
    const st = boxState(box);
    return `
    <article class="shop-tile shop-box-${box.id}${st.reason === 'limit' ? ' is-limit' : ''}" style="--lb-color:${box.colors[1]};--lb-light:${box.colors[0]}">
      <div class="shop-tile-art">${boxSVG(box, `shop-${box.id}`)}</div>
      <div class="shop-tile-info">
        <h2 class="shop-tile-name">${box.name}</h2>
        <p class="shop-tile-left">${st.reason === 'limit' ? `Откроется через ${timerBadge()}` : `Доступно сегодня: ${st.left}`}</p>
        <div class="shop-tile-row">
          <p class="shop-tile-price${st.reason === 'money' ? ' is-short' : ''}">${priceHTML(box)}</p>
          <button class="shop-tile-btn" data-view="${box.id}">Посмотреть</button>
        </div>
      </div>
    </article>`;
  }).join('');
  const inv = loadInventory();
  shopInventoryEl.innerHTML = `
    <span>Карт из сундуков: <b>${inv.cards}</b></span>
    <span>Оформлений: <b>${inv.frames}</b></span>
    <span>Бонусов: <b>${inv.bonuses || 0}</b></span>`;
  if (shopDetailBox) renderDetail(shopDetailBox);
}

/* ---------- Карточка сундука: состав и «Открыть» ---------- */

const shopDetailEl = document.getElementById('shopDetail');
let shopDetailBox = null;

// состав сундука — в ряд, как награды в ивенте: подпись, картинка без фона,
// под ней счётчик с тёмной обводкой
function rewardPreview(e) {
  const item = (label, color, art, qty) => `<li class="shop-prize" style="--c:${color}"><span class="shop-prize-label">${label}</span><span class="shop-prize-art">${art}</span><span class="shop-prize-qty">${qty}</span></li>`;
  if (e.kind === 'card') {
    const r = RARITIES[e.rarity];
    return item(r.name, r.color, '<span class="shop-prize-cards"><i></i><i></i></span>', '× 1');
  }
  if (e.kind === 'coins') return item('Монеты', '#ffcf3d', '<img src="assets/v2-ny-coins.png" alt="">', `× ${e.min}–${e.max}`);
  if (e.kind === 'tokens') return item('Жетоны', '#c9a6ff', `<img src="${CURRENCY.tokens.icon}" alt="">`, `× ${e.min}–${e.max}`);
  if (e.kind === 'frame') return item('Оформление', '#ff7ad9', '<span class="shop-prize-frame"></span>', '× 1');
  return item('Бонус', '#42cf9b', '<img src="assets/v2-prize-gift.png" alt="">', '× 1');
}

function renderDetail(box) {
  const st = boxState(box);
  let btn;
  if (st.can) btn = `<button class="shop-open" data-open="${box.id}">Открыть за ${priceHTML(box)}</button>`;
  else if (st.reason === 'limit') btn = `<button class="shop-open" disabled>Откроется через <span data-shop-timer>${limitTimer()}</span></button>`;
  else btn = `<button class="shop-open" disabled>Не хватает ${st.need} ${plural(st.need, CURRENCY[box.currency])}</button>`;
  shopDetailEl.querySelector('.shop-detail-card').innerHTML = `
    <button class="shop-detail-close" data-detail-close aria-label="Закрыть"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg></button>
    <div class="shop-detail-art" style="--lb-color:${box.colors[1]}">${boxSVG(box, `detail-${box.id}`)}</div>
    <h2 class="shop-detail-name">${box.name}</h2>
    <p class="shop-detail-desc">При открытии сундука вы получите <b>одну</b> из наград ниже</p>
    <ul class="shop-prizes">${box.table.map(rewardPreview).join('')}</ul>
    ${box.currency === 'tokens' ? '<p class="shop-detail-hint">Жетоны-ключи выпадают из зелёного и синего сундуков и даются за сундуки в «Заданиях»</p>' : ''}
    ${btn}
    <p class="shop-detail-left">${st.reason === 'limit' ? 'На сегодня сундуки закончились' : `Доступно сегодня: ${st.left}`}</p>`;
}

function openDetail(box) {
  shopDetailBox = box;
  renderDetail(box);
  shopDetailEl.classList.add('is-open');
  shopDetailEl.setAttribute('aria-hidden', 'false');
}

function closeDetail() {
  shopDetailBox = null;
  shopDetailEl.classList.remove('is-open');
  shopDetailEl.setAttribute('aria-hidden', 'true');
}

shopDetailEl.addEventListener('click', (e) => {
  if (e.target === shopDetailEl || e.target.closest('[data-detail-close]')) {
    closeDetail();
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
    const total = box.table.reduce((sum, e) => sum + e.weight, 0);
    const name = (e) => (e.kind === 'card' ? 'карта' : e.kind === 'coins' ? 'монеты' : e.kind === 'tokens' ? 'жетоны' : e.kind === 'frame' ? 'оформление' : 'бонус');
    return `${box.name}: ${box.table.map((e) => `${name(e)} ${Math.round((e.weight / total) * 100)}%`).join(', ')}.`;
  }).join('<br>');
  const limits = LOOTBOXES.map((box) => `${box.short.toLowerCase()} — ${box.limit}`).join(', ');
  return [
    ['Как получить новые карты?', 'Карты не продаются напрямую — они выпадают только из сундуков. Чем дороже сундук, тем реже карта внутри.'],
    ['Чем отличаются сундуки?', `Зелёный и синий открываются за монеты, эпический — за фиолетовые жетоны-ключи. Из каждого выпадает карта своего цвета: зелёная, синяя или фиолетовая.`],
    ['Что выпадет из сундука?', 'Одна награда из состава сундука: карта, монеты, жетоны-ключи или бонус. Состав виден по кнопке «Посмотреть».'],
    ['С какими шансами выпадают награды?', chances],
    ['Где взять фиолетовые жетоны-ключи?', 'Они выпадают из зелёного и синего сундуков и даются за сундуки на шкале в разделе «Задания».'],
    ['Сколько сундуков можно открыть за день?', `У каждого сундука свой лимит: ${limits}. Он обновляется каждый день в полночь — до обновления на сундуке виден таймер.`],
    ['Куда попадают награды?', 'Карты — в коллекцию в разделе «Карты», монеты и жетоны — в баланс, бонусы — в раздел «Бонусы».'],
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
    return `<img class="lb-reward-img" src="${CURRENCY.tokens.icon}" alt=""><p class="lb-reward-name">+${r.amount}</p><p class="lb-reward-sub">Жетоны-ключи</p>`;
  }
  if (r.kind === 'frame') {
    return `<div class="lb-frame"><span></span></div><p class="lb-reward-name">${r.name}</p><p class="lb-reward-sub">В профиль</p>`;
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
  lbBoxEl.innerHTML = boxSVG(box, 'lb-open');
  // анимации прошлого открытия (растворение сундука с fill: forwards) иначе
  // продолжают действовать и прячут новый сундук
  lbOverlayEl.getAnimations({ subtree: true }).forEach((an) => an.cancel());
  lbRewardsEl.innerHTML = '';
  lbRewardsEl.style.setProperty('--n', rewards.length);
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
  lbBoxEl.classList.add('is-idle');
  lbHintEl.classList.add('is-visible');

  await Promise.race([wait(2200), once(lbStageEl, 'click')]);
  lbHintEl.classList.remove('is-visible');
  lbBoxEl.classList.remove('is-idle');

  // три нарастающих встряски
  await lbBoxEl.animate(
    [
      { transform: 'rotate(0) scale(1)' },
      { transform: 'rotate(-7deg) scale(1.03)' },
      { transform: 'rotate(7deg) scale(1.06)' },
      { transform: 'rotate(-10deg) scale(1.09)' },
      { transform: 'rotate(10deg) scale(1.12)' },
      { transform: 'rotate(-12deg) scale(1.15)' },
      { transform: 'rotate(0) scale(1.18)' },
    ],
    { duration: 640, easing: 'ease-in' }
  ).finished;

  // крышка слетает, вспышка, сундук растворяется
  const lid = lbBoxEl.querySelector('.lb-svg-lid');
  lid.animate(
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

document.getElementById('shopDemoCoins').addEventListener('click', () => {
  const before = getCoins();
  addCoins(500);
  addTokens(30);
  renderShop();
  animateCoins(before, before + 500);
});

// баланс мог измениться в матче — обновляем при каждом входе в магазин
document.addEventListener('v2:screen', (e) => {
  if (e.detail.screen === 'shop') renderShop();
});

renderShop();
