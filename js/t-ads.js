// t-ads — рекламный баннер-компонент. Вставляется в любой раздел:
//   el.innerHTML = tAdsHTML({ title, text, cta, image, href });
// Пока используется в шторке эффекта клетки в матче (версия 3); позже
// добавим в другие разделы.
function tAdsHTML(opts = {}) {
  const o = {
    title: 'Монеты за покупки',
    text: 'Получайте до 500 монет в игре за оплату картой партнёра',
    cta: 'Подробнее',
    image: 'assets/v2-coin.png',
    href: '#',
    ...opts,
  };
  return `<a class="t-ads" href="${o.href}" target="_blank" rel="noopener">
      <span class="t-ads-label">Реклама</span>
      <span class="t-ads-body">
        <span class="t-ads-title">${o.title}</span>
        <span class="t-ads-text">${o.text}</span>
        <span class="t-ads-cta">${o.cta}</span>
      </span>
      <img class="t-ads-img" src="${o.image}" alt="">
    </a>`;
}
