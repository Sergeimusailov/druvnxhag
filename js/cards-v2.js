// Раздел «Карты»: колода из 8 карт и вся коллекция. Логика — как в
// collection.js версии 1, колода хранится в том же localStorage и
// сохраняется сразу при каждом изменении (кнопки «Сохранить» нет).
(() => {
  const deckGridEl = document.getElementById('cardsDeckGrid');
  const collectionEls = Array.from(document.querySelectorAll('#cardsScreen .cards-coll .cards-collection-grid'));
  const badgeEl = document.getElementById('cardsDeckBadge');
  const sheet = document.getElementById('cardSheet');
  const backdrop = document.getElementById('cardSheetBackdrop');
  const sheetTitle = document.getElementById('cardSheetTitle');
  const sheetCard = document.getElementById('cardSheetCard');
  const sheetBtn = document.getElementById('cardSheetBtn');
  const sheetHint = document.getElementById('cardSheetHint');
  const sheetLock = document.getElementById('cardSheetLock');

  let deck = getSavedDeckNames().filter((name) => CARD_ROSTER.some((c) => c.name === name));
  let sheetAction = null;

  const byName = (name) => CARD_ROSTER.find((c) => c.name === name);

  // коллекции: у каждой карты своя (card.col) — овощная, фруктовая,
  // новогодняя; идут подряд в этом порядке. Внутри — открытые от эпических
  // к обычным, неоткрытые в конце
  const COLLECTION_IDS = ['veg', 'fruit', 'ny'];
  const RARITY_ORDER = ['purple', 'blue', 'green'];
  // где получить закрытую карту: через одну — за задания или в сундуках магазина
  const unlockSource = (card) => (CARD_ROSTER.indexOf(card) % 2 ? 'shop' : 'tasks');

  function lockedTip(card) {
    const rarity = cardRarity(card);
    if (unlockSource(card) === 'tasks') {
      return {
        title: 'Карта не открыта',
        text: 'Её можно получить за выполнение заданий.',
        action: { label: 'К заданиям', onClick: () => showScreen('tasks') },
      };
    }
    return {
      title: 'Карта не открыта',
      text: `${RARITIES[rarity].name} карта выпадает из ${rarity === 'purple' ? 'эпического' : rarity === 'blue' ? 'редкого' : 'обычного'} сундука в «Магазине».`,
      action: { label: 'В магазин', onClick: () => showScreen('shop') },
    };
  }
  const LOCK_SVG = '<svg width="20" height="24" viewBox="0 0 20 24" fill="none"><path d="M5 10V7a5 5 0 0 1 10 0v3" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/><rect x="1.5" y="10" width="17" height="12.5" rx="3.5" fill="#fff"/><circle cx="10" cy="15.5" r="1.8" fill="#1c1c1e"/><path d="M10 16.5v2.5" stroke="#1c1c1e" stroke-width="1.8" stroke-linecap="round"/></svg>';

  function cardEl(card, extra = '') {
    const el = document.createElement('div');
    el.className = `card24${extra}`;
    el.innerHTML = card24HTML(card);
    // версия 3: сохранённая кастомизация (вариация, рамка, эффект)
    if (typeof applyCardCustom === 'function') applyCardCustom(el, card.name);
    return el;
  }

  // Долгое нажатие (0,45 с) на открытую карту — добавить в колоду или убрать
  // из неё, без шторки. Сдвиг пальца больше 8px или начало скролла отменяют
  // нажатие, поэтому листать коллекцию можно как обычно; клик после долгого
  // нажатия гасится. Системное меню, выделение и зум карты выключены в CSS.
  const LONG_MS = 450;
  let pressSkipClick = false;

  function onPress(el, onTap, onLong) {
    let timer = 0;
    let start = null;
    let moved = false;
    const cancel = () => {
      clearTimeout(timer);
      timer = 0;
      el.classList.remove('is-pressing');
    };
    el.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      start = { x: e.clientX, y: e.clientY };
      moved = false;
      el.classList.add('is-pressing');
      timer = setTimeout(() => {
        timer = 0;
        el.classList.remove('is-pressing');
        pressSkipClick = true;
        if (navigator.vibrate) navigator.vibrate(15);
        onLong();
      }, LONG_MS);
    });
    el.addEventListener('pointermove', (e) => {
      if (start && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 8) {
        moved = true;
        cancel();
      }
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach((t) => el.addEventListener(t, () => {
      cancel();
      if (t === 'pointercancel') moved = true;
    }));
    el.addEventListener('contextmenu', (e) => e.preventDefault());
    el.addEventListener('click', () => {
      if (pressSkipClick) { pressSkipClick = false; return; }
      if (moved) return;
      onTap();
    });
  }
  document.getElementById('cardsScreen').addEventListener('scroll', () => {
    document.querySelectorAll('#cardsScreen .card24.is-pressing').forEach((c) => c.classList.remove('is-pressing'));
  }, { passive: true, capture: true });

  // карта, которую только что добавили или убрали, «подпрыгивает» на новом месте
  let bumpName = null;

  function toggleDeck(card, el) {
    if (deck.includes(card.name)) {
      deck = deck.filter((n) => n !== card.name);
    } else if (deck.length >= DECK_SIZE) {
      Tooltip24.show(el, { title: 'Колода заполнена', text: 'Удалите карту из колоды, чтобы добавить новую.', timeout: 2500 });
      el.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(-3px)' }, { transform: 'translateX(0)' }], { duration: 320 });
      return;
    } else {
      deck.push(card.name);
    }
    saveDeckNames(deck);
    bumpName = card.name;
    render();
  }

  function bump(el) {
    el.animate([{ transform: 'scale(0.85)' }, { transform: 'scale(1.08)', offset: 0.6 }, { transform: 'scale(1)' }], { duration: 360, easing: 'ease-out' });
  }

  // Элементы карт создаются один раз и при перерисовке только переставляются
  // и меняют состояние: если пересоздавать их, на телефоне картинки заново
  // декодируются и раздел на миг мерцает. Ключ — место (колода / коллекция),
  // имя карты и открыта ли она.
  const elCache = new Map();

  function deckCardEl(card) {
    const key = `deck:${card.name}`;
    if (!elCache.has(key)) {
      const el = cardEl(card);
      onPress(el, () => openCard(card), () => toggleDeck(card, el));
      elCache.set(key, el);
    }
    return elCache.get(key);
  }

  function collCardEl(card, isOwned) {
    const key = `coll:${card.name}:${isOwned ? 'open' : 'locked'}`;
    if (!elCache.has(key)) {
      let el;
      if (isOwned) {
        el = cardEl(card);
        onPress(el, () => openCard(card), () => toggleDeck(card, el));
      } else {
        el = cardEl(card, ' is-locked');
        el.insertAdjacentHTML('beforeend', `<span class="card-lock" aria-hidden="true">${LOCK_SVG}</span>`);
        el.setAttribute('aria-label', `${card.name} — карта не открыта`);
        el.addEventListener('click', () => openLocked(card));
      }
      elCache.set(key, el);
    }
    return elCache.get(key);
  }

  function render() {
    const deckNodes = [];
    for (let i = 0; i < DECK_SIZE; i++) {
      const name = deck[i];
      if (name) {
        const el = deckCardEl(byName(name));
        deckNodes.push(el);
        if (bumpName === name) requestAnimationFrame(() => bump(el));
      } else {
        const empty = document.createElement('div');
        empty.className = 'cards-slot-empty';
        deckNodes.push(empty);
      }
    }
    deckGridEl.replaceChildren(...deckNodes);
    badgeEl.hidden = deck.length === DECK_SIZE;

    // коллекции: заголовок и «открыто N из M», карты от эпических к обычным,
    // неоткрытые — в конце коллекции, затемнены, с замком; тап — подсказка,
    // как получить, и кнопка перехода в нужный раздел
    const owned = ownedCardNames();
    COLLECTION_IDS.forEach((id, i) => {
      const grid = collectionEls[i];
      const cards = CARD_ROSTER.filter((c) => c.col === id)
        .sort((a, b) => (owned.has(b.name) - owned.has(a.name))
          || RARITY_ORDER.indexOf(cardRarity(a)) - RARITY_ORDER.indexOf(cardRarity(b)));
      grid.parentElement.querySelector('[data-count]').textContent = `открыто ${cards.filter((c) => owned.has(c.name)).length} из ${cards.length}`;
      grid.replaceChildren(...cards.map((card) => {
        const isOwned = owned.has(card.name);
        const el = collCardEl(card, isOwned);
        if (isOwned) {
          el.classList.toggle('in-deck', deck.includes(card.name));
          if (bumpName === card.name && !deck.includes(card.name)) requestAnimationFrame(() => bump(el));
        }
        return el;
      }));
    });
    bumpName = null;
  }

  function openCard(card) {
    sheetTitle.textContent = card.name;
    sheetCard.innerHTML = card24HTML(card);
    sheetCard.classList.remove('is-locked');
    if (typeof applyCardCustom === 'function') applyCardCustom(sheetCard, card.name);
    sheetCard.dataset.card = card.name;
    sheet.classList.remove('is-locked-card');
    sheetLock.hidden = true;
    sheetHint.textContent = '';
    sheetBtn.disabled = false;
    sheetBtn.classList.remove('is-remove');
    if (deck.includes(card.name)) {
      sheetBtn.textContent = 'Убрать из колоды';
      sheetBtn.classList.add('is-remove');
      sheetAction = () => { deck = deck.filter((n) => n !== card.name); };
    } else if (deck.length >= DECK_SIZE) {
      sheetBtn.textContent = 'Добавить в колоду';
      sheetBtn.disabled = true;
      sheetHint.textContent = 'Удалите карту из колоды, чтобы добавить новую';
      sheetAction = null;
    } else {
      sheetBtn.textContent = 'Добавить в колоду';
      sheetAction = () => { deck.push(card.name); };
    }
    sheet.classList.add('is-open');
    backdrop.classList.add('is-open');
  }

  // закрытая карта — та же шторка: карта с замком, заголовок и текст из
  // lockedTip(), большая кнопка во всю ширину ведёт в задания или магазин
  function openLocked(card) {
    const tip = lockedTip(card);
    sheetTitle.textContent = card.name;
    sheetCard.innerHTML = card24HTML(card) + `<span class="card-lock" aria-hidden="true">${LOCK_SVG}</span>`;
    sheetCard.classList.add('is-locked');
    sheetCard.dataset.card = card.name;
    sheet.classList.add('is-locked-card');
    sheetLock.hidden = false;
    document.getElementById('cardSheetLockTitle').textContent = tip.title;
    document.getElementById('cardSheetLockText').textContent = tip.text;
    sheetHint.textContent = '';
    sheetBtn.disabled = false;
    sheetBtn.classList.remove('is-remove');
    sheetBtn.textContent = tip.action.label;
    sheetAction = () => { closeCard(); tip.action.onClick(); return false; };
    sheet.classList.add('is-open');
    backdrop.classList.add('is-open');
  }

  function closeCard() {
    sheet.classList.remove('is-open');
    backdrop.classList.remove('is-open');
  }

  sheetBtn.addEventListener('click', () => {
    if (!sheetAction) return;
    if (sheetAction() === false) return;
    saveDeckNames(deck);
    closeCard();
    render();
  });
  document.getElementById('cardSheetClose').addEventListener('click', closeCard);
  attachSheetSwipe(sheet, closeCard);
  backdrop.addEventListener('click', closeCard);

  // версия 3: кнопка-карандаш в шторке ведёт в кастомизацию карты
  const editBtn = document.getElementById('cardSheetEdit');
  if (editBtn) {
    editBtn.addEventListener('click', () => {
      const card = byName(sheetCard.dataset.card);
      closeCard();
      if (card) openCardCustom(card, () => { elCache.clear(); render(); });
    });
  }

  // карты открываются в магазине — перерисовываем коллекцию при входе в раздел
  document.addEventListener('v2:screen', (e) => { if (e.detail.screen === 'cards') render(); });

  render();
})();
