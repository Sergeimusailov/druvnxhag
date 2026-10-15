// t-ads — рекламный баннер-компонент (Figma 16397:17602, «CardAds2»).
// Вставляется в любой раздел: el.innerHTML = tAdsHTML();
// Баннер — картинка из макета как есть (345×100, скругление 24), текст
// дублируется в alt. Можно передать свою картинку и ссылку:
//   tAdsHTML({ image, alt, href })
// Пока используется в шторке эффекта клетки в матче (версия 3).
function tAdsHTML(opts = {}) {
  const o = {
    image: 'assets/t-ads-banner.png',
    alt: 'Реклама. Острая пицца в подарок. Съешь этих мягких французских булок, да выпей чаю',
    href: '#',
    ...opts,
  };
  return `<a class="t-ads" href="${o.href}" target="_blank" rel="noopener"><img src="${o.image}" alt="${o.alt}"></a>`;
}
