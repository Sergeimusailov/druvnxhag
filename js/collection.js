const deckGridEl = document.getElementById('deckGrid');
const collectionGridEl = document.getElementById('collectionGrid');
const deckWarningEl = document.getElementById('deckWarning');
const saveBtnEl = document.getElementById('saveBtn');
const savedBannerEl = document.getElementById('savedBanner');

const sheetBackdropEl = document.getElementById('sheetBackdrop');
const sheetEl = document.getElementById('cardSheet');
const sheetCloseEl = document.getElementById('sheetClose');
const sheetCardEl = document.getElementById('sheetCard');
const sheetDescEl = document.getElementById('sheetDesc');
const sheetActionBtnEl = document.getElementById('sheetActionBtn');
const sheetHelperEl = document.getElementById('sheetHelper');

let deckNames = getSavedDeckNames().filter((name) => CARD_ROSTER.some((c) => c.name === name));
let savedDeckNames = [...deckNames];

function isInDeck(name) {
  return deckNames.includes(name);
}

function isDeckDirty() {
  if (deckNames.length !== savedDeckNames.length) return true;
  const a = [...deckNames].sort();
  const b = [...savedDeckNames].sort();
  return a.some((name, i) => name !== b[i]);
}

function removeFromDeck(name) {
  deckNames = deckNames.filter((n) => n !== name);
  renderAll();
}

function addToDeck(name) {
  if (deckNames.length >= DECK_SIZE || isInDeck(name)) return;
  deckNames.push(name);
  renderAll();
}

function renderDeck() {
  deckGridEl.innerHTML = '';
  for (let i = 0; i < DECK_SIZE; i++) {
    const slotEl = document.createElement('div');
    const name = deckNames[i];
    if (name) {
      const card = CARD_ROSTER.find((c) => c.name === name);
      slotEl.className = 'deck-slot card';
      slotEl.innerHTML = cardInnerHTML(card);
      slotEl.addEventListener('click', () => openSheet(card, 'remove'));
    } else {
      slotEl.className = 'deck-slot empty';
    }
    deckGridEl.appendChild(slotEl);
  }

  deckWarningEl.classList.toggle('hidden', deckNames.length >= DECK_SIZE);
  saveBtnEl.classList.toggle('visible', deckNames.length === DECK_SIZE && isDeckDirty());
}

function renderCollection() {
  collectionGridEl.innerHTML = '';
  CARD_ROSTER.forEach((card) => {
    const slotEl = document.createElement('div');
    slotEl.className = `collection-slot card${isInDeck(card.name) ? ' in-deck' : ''}`;
    slotEl.innerHTML = cardInnerHTML(card);
    slotEl.addEventListener('click', () => {
      openSheet(card, isInDeck(card.name) ? 'remove' : 'add');
    });
    collectionGridEl.appendChild(slotEl);
  });
}

function renderAll() {
  renderDeck();
  renderCollection();
}

function openSheet(card, mode) {
  sheetCardEl.innerHTML = cardInnerHTML(card);
  sheetDescEl.textContent = card.name;

  if (mode === 'remove') {
    sheetActionBtnEl.textContent = 'Удалить из колоды';
    sheetActionBtnEl.className = 'sheet-btn remove';
    sheetHelperEl.classList.remove('visible');
    sheetActionBtnEl.onclick = () => {
      removeFromDeck(card.name);
      closeSheet();
    };
  } else if (deckNames.length >= DECK_SIZE) {
    sheetActionBtnEl.textContent = 'Добавить в колоду';
    sheetActionBtnEl.className = 'sheet-btn disabled';
    sheetActionBtnEl.onclick = null;
    sheetHelperEl.textContent = 'Удалите карту из колоды, чтобы добавить новую';
    sheetHelperEl.classList.add('visible');
  } else {
    sheetActionBtnEl.textContent = 'Добавить в колоду';
    sheetActionBtnEl.className = 'sheet-btn add';
    sheetHelperEl.classList.remove('visible');
    sheetActionBtnEl.onclick = () => {
      addToDeck(card.name);
      closeSheet();
    };
  }

  sheetBackdropEl.classList.add('visible');
  sheetEl.classList.add('visible');
}

function closeSheet() {
  sheetBackdropEl.classList.remove('visible');
  sheetEl.classList.remove('visible');
}

sheetCloseEl.addEventListener('click', closeSheet);
sheetBackdropEl.addEventListener('click', closeSheet);

saveBtnEl.addEventListener('click', () => {
  if (deckNames.length !== DECK_SIZE) return;
  saveDeckNames(deckNames);
  savedDeckNames = [...deckNames];
  renderAll();
  savedBannerEl.classList.add('visible');
  setTimeout(() => {
    savedBannerEl.classList.remove('visible');
  }, 2200);
});

renderAll();
