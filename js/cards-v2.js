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

  function render() {
    deckGridEl.innerHTML = '';
    for (let i = 0; i < DECK_SIZE; i++) {
      const name = deck[i];
      if (name) {
        const el = cardEl(byName(name));
        el.addEventListener('click', () => openCard(byName(name)));
        deckGridEl.appendChild(el);
      } else {
        const empty = document.createElement('div');
        empty.className = 'cards-slot-empty';
        deckGridEl.appendChild(empty);
      }
    }
    badgeEl.hidden = deck.length === DECK_SIZE;

    // коллекции: заголовок и «открыто N из M», карты от эпических к обычным,
    // неоткрытые — в конце коллекции, затемнены, с замком; тап — подсказка, как получить, и кнопка
    // перехода в нужный раздел
    const owned = ownedCardNames();
    COLLECTION_IDS.forEach((id, i) => {
      const grid = collectionEls[i];
      const cards = CARD_ROSTER.filter((c) => c.col === id)
        .sort((a, b) => (owned.has(b.name) - owned.has(a.name))
          || RARITY_ORDER.indexOf(cardRarity(a)) - RARITY_ORDER.indexOf(cardRarity(b)));
      grid.parentElement.querySelector('[data-count]').textContent = `открыто ${cards.filter((c) => owned.has(c.name)).length} из ${cards.length}`;
      grid.innerHTML = '';
      cards.forEach((card) => {
        if (!owned.has(card.name)) {
          const el = cardEl(card, ' is-locked');
          el.insertAdjacentHTML('beforeend', `<span class="card-lock" aria-hidden="true">${LOCK_SVG}</span>`);
          el.setAttribute('aria-label', `${card.name} — карта не открыта`);
          el.addEventListener('click', () => Tooltip24.show(el, lockedTip(card)));
          grid.appendChild(el);
          return;
        }
        const el = cardEl(card, deck.includes(card.name) ? ' in-deck' : '');
        el.addEventListener('click', () => openCard(card));
        grid.appendChild(el);
      });
    });
  }

  function openCard(card) {
    sheetTitle.textContent = card.name;
    sheetCard.innerHTML = card24HTML(card);
    if (typeof applyCardCustom === 'function') applyCardCustom(sheetCard, card.name);
    sheetCard.dataset.card = card.name;
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

  function closeCard() {
    sheet.classList.remove('is-open');
    backdrop.classList.remove('is-open');
  }

  sheetBtn.addEventListener('click', () => {
    if (!sheetAction) return;
    sheetAction();
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
      if (card) openCardCustom(card, render);
    });
  }

  // карты открываются в магазине — перерисовываем коллекцию при входе в раздел
  document.addEventListener('v2:screen', (e) => { if (e.detail.screen === 'cards') render(); });

  render();
})();
