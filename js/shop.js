// Магазин v2 (прототип): лутбоксы трёх редкостей за монеты. В каждом
// 2–4 предмета: первый — гарантированно карта цвета бокса, остальные
// разыгрываются по таблице шансов (карты, рамки, бустеры, монеты).
// Открытие — экран как у подарка в «Заданиях»: бокс падает, трясётся,
// крышка слетает, предметы вылетают рубашкой вверх и переворачиваются.

const LOOTBOXES = [
  {
    id: 'green',
    name: 'Зелёный бокс',
    price: 100,
    items: 2,
    colors: ['#8ff07a', '#2e9e3f', '#1d5e27'],
    table: [
      { kind: 'card', rarity: 'green', weight: 70 },
      { kind: 'coins', min: 20, max: 60, weight: 20 },
      { kind: 'booster', weight: 10 },
    ],
  },
  {
    id: 'blue',
    name: 'Синий бокс',
    price: 250,
    items: 3,
    colors: ['#8cc8ff', '#2f6fe0', '#1a3c8c'],
    table: [
      { kind: 'card', rarity: 'blue', weight: 50 },
      { kind: 'card', rarity: 'green', weight: 20 },
      { kind: 'frame', weight: 10 },
      { kind: 'booster', weight: 10 },
      { kind: 'coins', min: 60, max: 150, weight: 10 },
    ],
  },
  {
    id: 'purple',
    name: 'Фиолетовый бокс',
    price: 500,
    items: 4,
    colors: ['#d7a6ff', '#7b34e0', '#3f1683'],
    table: [
      { kind: 'card', rarity: 'purple', weight: 45 },
      { kind: 'card', rarity: 'blue', weight: 20 },
      { kind: 'frame', weight: 15 },
      { kind: 'booster', weight: 10 },
      { kind: 'coins', min: 150, max: 300, weight: 10 },
    ],
  },
];

const FRAME_NAMES = ['Неон', 'Золото', 'Северное сияние', 'Лава', 'Кристалл'];
const BOOSTER_NAMES = ['Перезапуск', 'Заморозка', 'Блок', 'Энергия'];
const INVENTORY_KEY = 'v2.inventory';

const shopCoinsEl = document.getElementById('shopCoins');
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
    return { cards: 0, frames: 0, boosters: 0, ...JSON.parse(localStorage.getItem(INVENTORY_KEY) || '{}') };
  } catch (e) {
    return { cards: 0, frames: 0, boosters: 0 };
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
  if (entry.kind === 'frame') return { kind: 'frame', name: pick(FRAME_NAMES) };
  return { kind: 'booster', name: pick(BOOSTER_NAMES) };
}

function rollBox(box) {
  const taken = new Set();
  const rewards = [makeReward({ kind: 'card', rarity: box.id }, taken)];
  for (let i = 1; i < box.items; i++) rewards.push(makeReward(rollEntry(box.table), taken));
  return rewards;
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

function chanceRows(box) {
  const total = box.table.reduce((s, e) => s + e.weight, 0);
  const label = (e) => {
    if (e.kind === 'card') return `${RARITIES[e.rarity].name} карта`;
    if (e.kind === 'coins') return `Монеты ${e.min}–${e.max}`;
    if (e.kind === 'frame') return 'Рамка профиля';
    return 'Бустер';
  };
  const dot = (e) => (e.kind === 'card' ? RARITIES[e.rarity].color : e.kind === 'coins' ? '#ffcf3d' : e.kind === 'frame' ? '#ff7ad9' : '#9b8cff');
  return box.table
    .map((e) => `<li><span class="shop-dot" style="background:${dot(e)}"></span>${label(e)}<b>${Math.round((e.weight / total) * 100)}%</b></li>`)
    .join('');
}

function renderShop() {
  const coins = getCoins();
  shopCoinsEl.textContent = coins;
  shopBoxesEl.innerHTML = LOOTBOXES.map((box) => `
    <article class="shop-box shop-box-${box.id}" style="--lb-color:${box.colors[1]};--lb-light:${box.colors[0]}">
      <div class="shop-box-art">${boxSVG(box, `shop-${box.id}`)}</div>
      <div class="shop-box-info">
        <h2 class="shop-box-name">${box.name}</h2>
        <p class="shop-box-count">${box.items} предмета · гарантированно ${RARITIES[box.id].name.toLowerCase()} карта</p>
        <ul class="shop-chances">${chanceRows(box)}</ul>
        <button class="shop-buy" data-box="${box.id}"${coins < box.price ? ' disabled' : ''}>
          <img src="assets/v2-coin.png" alt="" width="20" height="20">${box.price}
        </button>
      </div>
    </article>`).join('');
  const inv = loadInventory();
  shopInventoryEl.innerHTML = `
    <span>Карт из боксов: <b>${inv.cards}</b></span>
    <span>Рамок: <b>${inv.frames}</b></span>
    <span>Бустеров: <b>${inv.boosters}</b></span>`;
}

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
  if (r.kind === 'frame') {
    return `<div class="lb-frame"><span></span></div><p class="lb-reward-name">${r.name}</p><p class="lb-reward-sub">Рамка профиля</p>`;
  }
  return `<img class="lb-reward-img" src="assets/v2-reward-energy.png" alt=""><p class="lb-reward-name">${r.name}</p><p class="lb-reward-sub">Бустер</p>`;
}

function rewardColor(r) {
  if (r.kind === 'card') return RARITIES[r.rarity].color;
  if (r.kind === 'coins') return '#ffcf3d';
  if (r.kind === 'frame') return '#ff7ad9';
  return '#9b8cff';
}

let lbBusy = false;

async function openLootbox(box) {
  if (lbBusy) return;
  const coins = getCoins();
  if (coins < box.price) return;
  lbBusy = true;
  setCoins(coins - box.price);
  animateCoins(coins, coins - box.price);
  const rewards = rollBox(box);

  lbOverlayEl.style.setProperty('--lb-color', box.colors[1]);
  lbOverlayEl.style.setProperty('--lb-light', box.colors[0]);
  lbBoxEl.innerHTML = boxSVG(box, 'lb-open');
  lbBoxEl.style.opacity = '';
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
  lbOverlayEl.getAnimations().forEach((a) => a.cancel());
  lbBusy = false;
  renderShop();
}

function applyRewards(rewards) {
  const inv = loadInventory();
  let coinsWon = 0;
  rewards.forEach((r) => {
    if (r.kind === 'card') inv.cards += 1;
    else if (r.kind === 'frame') inv.frames += 1;
    else if (r.kind === 'booster') inv.boosters += 1;
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
  const btn = e.target.closest('.shop-buy');
  if (!btn || btn.disabled) return;
  const box = LOOTBOXES.find((b) => b.id === btn.dataset.box);
  btn.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.9)' }, { transform: 'scale(1)' }], { duration: 220, easing: 'ease-out' });
  openLootbox(box);
});

document.getElementById('shopDemoCoins').addEventListener('click', () => {
  const before = getCoins();
  addCoins(500);
  renderShop();
  animateCoins(before, before + 500);
});

// баланс мог измениться в матче — обновляем при каждом входе в магазин
document.addEventListener('v2:screen', (e) => {
  if (e.detail.screen === 'shop') renderShop();
});

renderShop();
