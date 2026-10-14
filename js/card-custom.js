// Версия 3: кастомизация карты (Figma 15959:36357). Вход — кнопка-карандаш в
// шторке карты в разделе «Карты». Экран устроен как настройки профиля:
// превью карты, вкладки «Покупки / Вариации / Рамки / Эффекты», внизу
// «Сохранить» и сброс. Сохранённый вид применяется к карте в колоде и
// коллекции. В версии 2 экран и кнопка скрыты (.v3-only), а applyCardCustom
// ничего не делает.

const CC_KEY = 'v3.cardCustom';

// вариации — та же иллюстрация в другом цвете (пока без отдельных артов)
const CC_VARIANTS = [
  { id: 'base', name: 'Обычная', filter: '' },
  { id: 'night', name: 'Ночная', filter: 'hue-rotate(200deg) saturate(1.2) brightness(0.85)' },
  { id: 'ice', name: 'Ледяная', filter: 'hue-rotate(150deg) saturate(0.7) brightness(1.1)' },
  { id: 'fire', name: 'Огненная', filter: 'hue-rotate(-40deg) saturate(1.6)' },
  { id: 'gold', name: 'Золотая', filter: 'sepia(0.8) saturate(1.8) hue-rotate(-10deg)' },
  { id: 'noir', name: 'Нуар', filter: 'grayscale(1) contrast(1.2)' },
];

// рамки — цвет обводки карты
const CC_FRAMES = [
  { id: 'base', name: 'Обычная', color: '' },
  { id: 'dark', name: 'Тёмная', color: '#252525' },
  { id: 'gold', name: 'Золото', color: '#f5b400' },
  { id: 'mint', name: 'Мята', color: '#2fd18f' },
  { id: 'rose', name: 'Роза', color: '#ff5c8a' },
  { id: 'violet', name: 'Фиолет', color: '#8c5cff' },
  { id: 'ice', name: 'Лёд', color: '#7fd4ff' },
  { id: 'fire', name: 'Огонь', color: '#ff6a1a' },
  { id: 'white', name: 'Белая', color: '#f2f2f2' },
];

const CC_EFFECTS = [
  { id: 'none', name: 'Без эффекта' },
  { id: 'glow', name: 'Сияние' },
  { id: 'sparks', name: 'Искры' },
  { id: 'snow', name: 'Снег' },
  { id: 'shine', name: 'Блик' },
  { id: 'pulse', name: 'Пульс' },
];

// «Покупки»: наборы, которые открывают вариации/рамки/эффекты за монеты
const CC_SHOP = [
  { id: 'v-night', kind: 'variants', item: 'night', price: 5 },
  { id: 'v-fire', kind: 'variants', item: 'fire', price: 5 },
  { id: 'f-gold', kind: 'frames', item: 'gold', price: 5 },
  { id: 'f-rose', kind: 'frames', item: 'rose', price: 5 },
  { id: 'e-sparks', kind: 'effects', item: 'sparks', price: 5 },
  { id: 'e-snow', kind: 'effects', item: 'snow', price: 5 },
];

// изначально открыто по паре вариантов в каждой вкладке
const CC_FREE = { variants: ['base', 'ice', 'noir'], frames: ['base', 'dark', 'mint', 'white'], effects: ['none', 'glow', 'shine'] };

function ccLoad() {
  try {
    const raw = JSON.parse(localStorage.getItem(CC_KEY) || '{}');
    return { cards: raw.cards || {}, owned: raw.owned || {} };
  } catch (e) {
    return { cards: {}, owned: {} };
  }
}

function ccSave(data) {
  try {
    localStorage.setItem(CC_KEY, JSON.stringify(data));
  } catch (e) { /* без хранилища — до перезагрузки */ }
}

let ccData = ccLoad();

function ccOwned(kind, id) {
  return CC_FREE[kind].includes(id) || (ccData.owned[kind] || []).includes(id);
}

// применить вид к элементу карты (.card)
function ccApply(el, look) {
  const v = CC_VARIANTS.find((x) => x.id === look.variant);
  const f = CC_FRAMES.find((x) => x.id === look.frame);
  const pic = el.querySelector('.card-pic');
  if (pic) pic.style.filter = v ? v.filter : '';
  el.style.color = f && f.color ? f.color : '';
  el.querySelectorAll('.cc-fx').forEach((x) => x.remove());
  el.classList.remove(...CC_EFFECTS.map((x) => `cc-fx-${x.id}`));
  if (look.effect && look.effect !== 'none') {
    el.classList.add(`cc-fx-${look.effect}`);
    const fx = document.createElement('span');
    fx.className = 'cc-fx';
    if (look.effect === 'sparks' || look.effect === 'snow') {
      fx.innerHTML = Array.from({ length: 10 }, (_, i) => `<i style="left:${(i * 37) % 100}%;--d:${(i * 0.31) % 2.4}s;--s:${0.6 + (i % 3) * 0.3}"></i>`).join('');
    }
    el.appendChild(fx);
  }
}

function applyCardCustom(el, name) {
  if (!isApp3()) return;
  const look = ccData.cards[name];
  if (look) ccApply(el, look);
}

/* ---------- Экран ---------- */

let ccCard = null;
let ccLook = null;
let ccOnSave = null;
let ccTabs = null;

function ccItemHTML(kind, item, extra = '') {
  const owned = ccOwned(kind, item.id);
  const selected = ccLook[kind === 'variants' ? 'variant' : kind === 'frames' ? 'frame' : 'effect'] === item.id;
  return `<button class="cc-item cc-${kind}-item${selected ? ' is-selected' : ''}${owned ? '' : ' is-locked'}" data-kind="${kind}" data-id="${item.id}" aria-label="${item.name}">${extra}<span class="cc-item-name">${owned ? item.name : '🔒 ' + item.name}</span></button>`;
}

function ccMiniCard(look) {
  const el = document.createElement('div');
  el.className = 'card owner-you';
  el.innerHTML = cardInnerHTML(ccCard);
  ccApply(el, { variant: 'base', frame: 'base', effect: 'none', ...look });
  return el.outerHTML;
}

function ccRender() {
  const preview = document.getElementById('ccCard');
  preview.innerHTML = cardInnerHTML(ccCard);
  ccApply(preview, ccLook);

  document.getElementById('ccShop').innerHTML = CC_SHOP.map((s) => {
    const list = s.kind === 'variants' ? CC_VARIANTS : s.kind === 'frames' ? CC_FRAMES : CC_EFFECTS;
    const item = list.find((x) => x.id === s.item);
    const key = s.kind === 'variants' ? 'variant' : s.kind === 'frames' ? 'frame' : 'effect';
    const owned = ccOwned(s.kind, s.item);
    return `<div class="cc-offer">
        <div class="cc-offer-circle">${ccMiniCard({ [key]: s.item })}</div>
        <p class="cc-offer-name">${item.name}</p>
        <button class="cc-buy${owned ? ' is-owned' : ''}" data-buy="${s.id}"${owned ? ' disabled' : ''}>${owned ? 'Куплено' : `Купить за ${s.price} монет`}</button>
      </div>`;
  }).join('');
  document.getElementById('ccVariants').innerHTML = CC_VARIANTS.map((v) => ccItemHTML('variants', v, ccMiniCard({ variant: v.id }))).join('');
  document.getElementById('ccFrames').innerHTML = CC_FRAMES.map((f) => ccItemHTML('frames', f, `<span class="cc-frame-swatch" style="--c:${f.color || '#2265d3'}"></span>`)).join('');
  document.getElementById('ccEffects').innerHTML = CC_EFFECTS.map((x) => ccItemHTML('effects', x, `<span class="cc-fx-swatch">${ccMiniCard({ effect: x.id })}</span>`)).join('');
}

function ccToast(text) {
  const t = document.getElementById('profileToast');
  if (!t) return;
  t.textContent = text;
  t.classList.add('is-visible');
  clearTimeout(ccToast.timer);
  ccToast.timer = setTimeout(() => t.classList.remove('is-visible'), 1600);
}

function openCardCustom(card, onSave) {
  ccCard = card;
  ccOnSave = onSave;
  ccLook = { variant: 'base', frame: 'base', effect: 'none', ...(ccData.cards[card.name] || {}) };
  document.getElementById('ccTitle').textContent = card.name;
  ccRender();
  const screen = document.getElementById('cardCustom');
  screen.querySelector('.pset-scroll').scrollTop = 0;
  screen.classList.add('is-open');
  screen.setAttribute('aria-hidden', 'false');
  if (ccTabs) ccTabs.select('shop');
}

function closeCardCustom() {
  const screen = document.getElementById('cardCustom');
  screen.classList.remove('is-open');
  screen.setAttribute('aria-hidden', 'true');
}

if (isApp3()) {
  ccTabs = createChipTabs(document.getElementById('ccChipRow'), document.getElementById('ccTabTrack'));
  document.getElementById('ccBack').addEventListener('click', closeCardCustom);

  document.getElementById('cardCustom').addEventListener('click', (e) => {
    const buy = e.target.closest('[data-buy]');
    if (buy) {
      const offer = CC_SHOP.find((s) => s.id === buy.dataset.buy);
      if (getCoins() < offer.price) {
        ccToast('Не хватает монет');
        return;
      }
      addCoins(-offer.price);
      (ccData.owned[offer.kind] = ccData.owned[offer.kind] || []).push(offer.item);
      ccSave(ccData);
      // купленное сразу примеряем на превью
      ccLook[offer.kind === 'variants' ? 'variant' : offer.kind === 'frames' ? 'frame' : 'effect'] = offer.item;
      ccRender();
      ccToast('Куплено — не забудьте сохранить');
      return;
    }
    const item = e.target.closest('.cc-item');
    if (!item) return;
    const { kind, id } = item.dataset;
    if (!ccOwned(kind, id)) {
      // закрытое — ведём во вкладку «Покупки»
      ccTabs.select('shop');
      ccToast('Откройте в «Покупках»');
      return;
    }
    ccLook[kind === 'variants' ? 'variant' : kind === 'frames' ? 'frame' : 'effect'] = id;
    ccRender();
    const preview = document.getElementById('ccCard');
    preview.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.05)' }, { transform: 'scale(1)' }], { duration: 260, easing: 'ease-out' });
  });

  document.getElementById('ccSave').addEventListener('click', () => {
    ccData.cards[ccCard.name] = { ...ccLook };
    ccSave(ccData);
    if (ccOnSave) ccOnSave();
    ccToast('Сохранено');
    closeCardCustom();
  });

  document.getElementById('ccReset').addEventListener('click', () => {
    ccLook = { variant: 'base', frame: 'base', effect: 'none' };
    ccRender();
  });

  document.querySelector('#cardCustom .pset-scroll').addEventListener('scroll', (e) => e.target.classList.toggle('is-scrolled', e.target.scrollTop > 2), { passive: true });
}
