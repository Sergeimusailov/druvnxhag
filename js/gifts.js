const giftsOffersEl = document.querySelector('#giftsScreen .offers');
Array.from(giftsOffersEl.children).forEach((el, i) => el.style.setProperty('--i', i));

// карточки «выезжают» лесенкой каждый раз, когда список становится видимым
let offersEnterTimer = null;
function playOffersEnter() {
  giftsOffersEl.classList.remove('is-entering');
  giftsOffersEl.getBoundingClientRect();
  giftsOffersEl.classList.add('is-entering');
  clearTimeout(offersEnterTimer);
  offersEnterTimer = setTimeout(() => giftsOffersEl.classList.remove('is-entering'), 1200);
}

const giftsTabs = createChipTabs(
  document.getElementById('giftsSegRow'),
  document.getElementById('giftsTabTrack'),
  (tab) => {
    if (tab === 'owned') playOffersEnter();
  }
);

document.addEventListener('v2:screen', (e) => {
  if (e.detail.screen === 'gifts' && giftsTabs.tab === 'owned') playOffersEnter();
});

document.getElementById('giftsHelpBtn').addEventListener('click', () => {});
