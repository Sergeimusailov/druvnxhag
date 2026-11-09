const giftsOffersEl = document.querySelector('#giftsScreen .offers');
// картинка в пустом разделе покачивается: y 0 → −8, наклон ±3°, цикл 3000
A24.loop(document.querySelector('#giftsScreen .gifts-draft-img'), { y: [0, -8], rotate: [-3, 3], duration: 1500, alternate: true, ease: A24.EASE.inOut });

// при входе в раздел карточки подъезжают снизу из фейда по очереди:
// y 40 → 0 + opacity, 550, out-expo, задержка 120 + i × 70 (лесенка до 7-й)
function playOffersEnter() {
  const offers = Array.from(giftsOffersEl.children);
  anime.remove(offers);
  offers.forEach((el, i) => {
    anime.set(el, { opacity: 0, y: 40 });
    A24.play(el, { opacity: [0, 1], y: [40, 0], duration: 550, delay: 120 + Math.min(i, 6) * 70, ease: A24.EASE.outExpo });
  });
}

createChipTabs(document.getElementById('giftsSegRow'), document.getElementById('giftsTabTrack'));

document.addEventListener('v2:screen', (e) => {
  if (e.detail.screen === 'gifts') playOffersEnter();
});

document.getElementById('giftsHelpBtn').addEventListener('click', () => {});

// v2.js показал стартовый экран раньше, чем подписались на событие
if (currentScreen === 'gifts') playOffersEnter();
