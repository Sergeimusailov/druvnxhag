const ACHIEVEMENTS = [
  { title: 'Тигры года', subtitle: 'Выиграл 100 матчей' },
  { title: 'Тигры года', subtitle: 'Выиграл 100 матчей' },
  { title: 'Тигры года', subtitle: 'Выиграл 100 матчей' },
  { title: 'Тигры года', subtitle: 'Выиграл 100 матчей' },
];

function renderAchievements() {
  const grid = document.getElementById('achievementsGrid');
  grid.innerHTML = '';
  ACHIEVEMENTS.forEach((a) => {
    const card = document.createElement('div');
    card.className = 'achievement-card';
    card.innerHTML = `
      <img class="achievement-badge" src="assets/v2-badge-tiger.png" alt="">
      <p class="achievement-title">${a.title}</p>
      <p class="achievement-subtitle">${a.subtitle}</p>
    `;
    grid.appendChild(card);
  });
}

function renderFavoriteDeck() {
  const grid = document.getElementById('favoriteDeckGrid');
  grid.innerHTML = '';
  const saved = getSavedDeckCards();
  const cards = saved.length === DECK_SIZE ? saved : CARD_ROSTER.slice(0, DECK_SIZE);
  cards.forEach((card) => {
    const cardEl = document.createElement('div');
    cardEl.className = 'card owner-you';
    cardEl.innerHTML = cardInnerHTML(card);
    grid.appendChild(cardEl);
  });
  document.getElementById('statsCollectedCount').textContent = getSavedDeckCards().length || cards.length;
}

document.getElementById('profileSettingsBtn').addEventListener('click', () => {});

renderAchievements();
renderFavoriteDeck();
createChipTabs(document.getElementById('profileChipRow'), document.getElementById('profileTabTrack'));
