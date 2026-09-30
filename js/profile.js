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

const chipEls = Array.from(document.querySelectorAll('.profile-chip'));
const panels = {
  achievements: document.getElementById('tabAchievements'),
  stats: document.getElementById('tabStats'),
  deck: document.getElementById('tabDeck'),
};

function setTab(tab) {
  chipEls.forEach((chip) => chip.classList.toggle('profile-chip-active', chip.dataset.tab === tab));
  Object.entries(panels).forEach(([key, panel]) => {
    panel.classList.toggle('profile-tab-panel-active', key === tab);
  });
}

chipEls.forEach((chip) => {
  chip.addEventListener('click', () => setTab(chip.dataset.tab));
});

document.getElementById('profileSettingsBtn').addEventListener('click', () => {});
document.getElementById('v2TasksBtn').addEventListener('click', () => {});
document.getElementById('v2GiftsBtn').addEventListener('click', () => {});
document.getElementById('v2LeaguesBtn').addEventListener('click', () => {});

renderAchievements();
renderFavoriteDeck();
