// Раздел «Карты»: колода из 8 карт и вся коллекция. Логика — как в
// collection.js версии 1, колода хранится в том же localStorage и
// сохраняется сразу при каждом изменении (кнопки «Сохранить» нет).
(() => {
  const deckGridEl = document.getElementById('cardsDeckGrid');
  const collectionEl = document.getElementById('cardsCollectionGrid');
  const countEl = document.getElementById('cardsDeckCount');
  const hintEl = document.getElementById('cardsDeckHint');
  const sheet = document.getElementById('cardSheet');
  const backdrop = document.getElementById('cardSheetBackdrop');
  const sheetTitle = document.getElementById('cardSheetTitle');
  const sheetCard = document.getElementById('cardSheetCard');
  const sheetBtn = document.getElementById('cardSheetBtn');
  const sheetHint = document.getElementById('cardSheetHint');

  let deck = getSavedDeckNames().filter((name) => CARD_ROSTER.some((c) => c.name === name));
  let sheetAction = null;

  const byName = (name) => CARD_ROSTER.find((c) => c.name === name);
  const LOCK_SVG = '<svg width="20" height="24" viewBox="0 0 20 24" fill="none"><path d="M5 10V7a5 5 0 0 1 10 0v3" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/><rect x="1.5" y="10" width="17" height="12.5" rx="3.5" fill="#fff"/><circle cx="10" cy="15.5" r="1.8" fill="#1c1c1e"/><path d="M10 16.5v2.5" stroke="#1c1c1e" stroke-width="1.8" stroke-linecap="round"/></svg>';

  function cardEl(card, extra = '') {
    const el = document.createElement('div');
    el.className = `card owner-you${extra}`;
    el.innerHTML = cardInnerHTML(card);
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
    countEl.textContent = `${deck.length} / ${DECK_SIZE}`;
    countEl.classList.toggle('is-full', deck.length === DECK_SIZE);
    hintEl.hidden = deck.length === DECK_SIZE;

    // неоткрытые карты — в самом конце, затемнены, с замком; тап — подсказка, как получить
    collectionEl.innerHTML = '';
    const owned = ownedCardNames();
    const sorted = [...CARD_ROSTER].sort((a, b) => owned.has(b.name) - owned.has(a.name));
    sorted.forEach((card) => {
      if (!owned.has(card.name)) {
        const el = cardEl(card, ' is-locked');
        el.insertAdjacentHTML('beforeend', `<span class="card-lock" aria-hidden="true">${LOCK_SVG}</span>`);
        el.setAttribute('aria-label', `${card.name} — карта не открыта`);
        el.addEventListener('click', () => Tooltip24.show(el, {
          title: 'Карта не открыта',
          text: `${RARITIES[cardRarity(card)].name} карта выпадает из ${cardRarity(card) === 'purple' ? 'эпического' : cardRarity(card) === 'blue' ? 'редкого' : 'обычного'} сундука в «Магазине».`,
        }));
        collectionEl.appendChild(el);
        return;
      }
      const el = cardEl(card, deck.includes(card.name) ? ' in-deck' : '');
      el.addEventListener('click', () => openCard(card));
      collectionEl.appendChild(el);
    });
  }

  function openCard(card) {
    sheetTitle.textContent = card.name;
    sheetCard.innerHTML = cardInnerHTML(card);
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
      sheetHint.textContent = 'Уберите карту из колоды, чтобы добавить новую';
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
