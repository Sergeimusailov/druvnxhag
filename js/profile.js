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
const TAB_ORDER = ['achievements', 'stats', 'deck'];
const indicatorEl = document.getElementById('profileChipIndicator');
const trackEl = document.getElementById('profileTabTrack');
let currentTab = 'achievements';

function moveIndicatorTo(chipEl, animate) {
  if (!animate) indicatorEl.style.transition = 'none';
  indicatorEl.style.width = `${chipEl.offsetWidth}px`;
  indicatorEl.style.transform = `translateX(${chipEl.offsetLeft}px)`;
  if (!animate) {
    // force a reflow so the next transition re-enables cleanly, without
    // animating this initial (non-interactive) placement
    indicatorEl.getBoundingClientRect();
    indicatorEl.style.transition = '';
  }
}

function setTab(tab) {
  if (tab === currentTab) return;
  const chipEl = chipEls.find((chip) => chip.dataset.tab === tab);
  currentTab = tab;
  chipEls.forEach((chip) => chip.classList.toggle('profile-chip-active', chip.dataset.tab === tab));
  moveIndicatorTo(chipEl, true);
  const index = TAB_ORDER.indexOf(tab);
  trackEl.style.transform = `translateX(-${index * (100 / TAB_ORDER.length)}%)`;
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
moveIndicatorTo(chipEls[0], false);
