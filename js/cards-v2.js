// Раздел «Карты»: колода из 8 карт и вся коллекция. Логика — как в
// collection.js версии 1, колода хранится в том же localStorage.
(() => {
  const deckGridEl = document.getElementById('cardsDeckGrid');
  const collectionEl = document.getElementById('cardsCollectionGrid');
  const countEl = document.getElementById('cardsDeckCount');
  const hintEl = document.getElementById('cardsDeckHint');
  const saveBtn = document.getElementById('cardsSaveBtn');
  const toastEl = document.getElementById('cardsToast');
  const sheet = document.getElementById('cardSheet');
  const backdrop = document.getElementById('cardSheetBackdrop');
  const sheetTitle = document.getElementById('cardSheetTitle');
  const sheetCard = document.getElementById('cardSheetCard');
  const sheetBtn = document.getElementById('cardSheetBtn');
  const sheetHint = document.getElementById('cardSheetHint');

  let deck = getSavedDeckNames().filter((name) => CARD_ROSTER.some((c) => c.name === name));
  let saved = [...deck];
  let sheetAction = null;

  const byName = (name) => CARD_ROSTER.find((c) => c.name === name);
  const isDirty = () => deck.length !== saved.length || [...deck].sort().some((n, i) => n !== [...saved].sort()[i]);

  function cardEl(card, extra = '') {
    const el = document.createElement('div');
    el.className = `card owner-you${extra}`;
    el.innerHTML = cardInnerHTML(card);
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

    collectionEl.innerHTML = '';
    CARD_ROSTER.forEach((card) => {
      const el = cardEl(card, deck.includes(card.name) ? ' in-deck' : '');
      el.addEventListener('click', () => openCard(card));
      collectionEl.appendChild(el);
    });

    saveBtn.classList.toggle('is-visible', deck.length === DECK_SIZE && isDirty());
  }

  function openCard(card) {
    sheetTitle.textContent = card.name;
    sheetCard.innerHTML = cardInnerHTML(card);
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
    closeCard();
    render();
  });
  document.getElementById('cardSheetClose').addEventListener('click', closeCard);
  backdrop.addEventListener('click', closeCard);

  saveBtn.addEventListener('click', () => {
    if (deck.length !== DECK_SIZE) return;
    saveDeckNames(deck);
    saved = [...deck];
    render();
    // любимая колода в профиле — это сохранённая колода
    if (typeof renderFavoriteDeck === 'function') renderFavoriteDeck();
    toastEl.classList.add('is-visible');
    setTimeout(() => toastEl.classList.remove('is-visible'), 2000);
  });

  render();
})();
