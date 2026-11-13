// Косметика профиля версии 2 — прокси к общему каталогу, чтобы прежние
// вызовы COSMETICS24.* работали:
//  • рамки аватара — js/catalog/frames.js (FRAME_CATALOG);
//  • рубашки колоды — js/catalog/backs.js (BACK_CATALOG).
// Сейчас в игре только обычная редкость. Подробно — docs/catalog.md.

const COSMETICS24 = (() => {
  const FRAMES = FRAME_CATALOG.list;
  const BACKS = BACK_CATALOG.list;
  const frame = (id) => FRAME_CATALOG.get(id);
  const back = (id) => BACK_CATALOG.get(id);
  const applyFrame = (el, id) => FRAME_CATALOG.apply(el, id);
  const backHTML = (id) => BACK_CATALOG.html(id);
  return { FRAMES, BACKS, frame, back, applyFrame, backHTML };
})();
