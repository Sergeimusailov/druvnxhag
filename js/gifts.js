const giftsOffersEl = document.querySelector('#giftsScreen .offers');
// лесенка только для первых карточек, иначе нижние ждали бы слишком долго
Array.from(giftsOffersEl.children).forEach((el, i) => el.style.setProperty('--i', Math.min(i, 6)));

let offersEnterTimer = null;

// при входе в раздел карточки подъезжают снизу из фейда по очереди
function playOffersEnter() {
  giftsOffersEl.classList.remove('is-entering');
  giftsOffersEl.getBoundingClientRect();
  giftsOffersEl.classList.add('is-entering');
  clearTimeout(offersEnterTimer);
  offersEnterTimer = setTimeout(() => giftsOffersEl.classList.remove('is-entering'), 1200);
}

createChipTabs(document.getElementById('giftsSegRow'), document.getElementById('giftsTabTrack'));

document.addEventListener('v2:screen', (e) => {
  if (e.detail.screen === 'gifts') playOffersEnter();
});

document.getElementById('giftsHelpBtn').addEventListener('click', () => {});

// v2.js показал стартовый экран раньше, чем подписались на событие
if (currentScreen === 'gifts') playOffersEnter();
