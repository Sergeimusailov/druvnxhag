// Версия 3: клетка с эффектом на поле матча. На клетке иконка эффекта и
// цифры по сторонам — на сколько вырастет каждая сторона карты с подходящим
// эффектом (сами карты пока не меняются). Тап по пустой клетке — шторка
// снизу с описанием эффекта и рекламным баннером t-ads.

(() => {
  if (!isApp3()) return;

  const EFFECT = {
    index: 2,
    bonus: 2,
    icon: 'assets/v2-bolt.png',
    title: 'Грозовая клетка',
    text: 'Карты стихии «Погода» — Гроза, Молния, Тайфун, Солнце, Туман и другие — на этой клетке становятся сильнее.',
    gain: 'Каждая сторона такой карты получает +2. Цифры на клетке показывают эту прибавку.',
  };

  function decorate() {
    const cellEl = boardEl.querySelector(`.cell[data-index="${EFFECT.index}"]`);
    if (!cellEl) return;
    cellEl.classList.add('cell-fx');
    if (cellEl.dataset.filled === 'true') return;
    const b = `+${EFFECT.bonus}`;
    cellEl.insertAdjacentHTML('beforeend', `<div class="cell-fx-deco">
        <img class="cell-fx-icon" src="${EFFECT.icon}" alt="">
        <span class="cell-fx-num is-top">${b}</span><span class="cell-fx-num is-left">${b}</span>
        <span class="cell-fx-num is-right">${b}</span><span class="cell-fx-num is-bottom">${b}</span>
      </div>`);
  }

  // поле перерисовывается после каждого хода — украшаем клетку заново
  const origRender = renderBoard;
  // eslint-disable-next-line no-global-assign
  renderBoard = function renderBoardFx(...args) {
    origRender.apply(this, args);
    decorate();
  };
  decorate();

  /* ---------- Шторка ---------- */

  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <div class="fx-backdrop" id="fxBackdrop"></div>
    <div class="fx-sheet" id="fxSheet" role="dialog" aria-label="${EFFECT.title}">
      <div class="fx-grab"><span></span></div>
      <button class="fx-close" id="fxClose" aria-label="Закрыть">✕</button>
      <div class="fx-cell"><img src="${EFFECT.icon}" alt=""><b>+${EFFECT.bonus}</b></div>
      <h2 class="fx-title">${EFFECT.title}</h2>
      <p class="fx-text">${EFFECT.text}</p>
      <p class="fx-gain">${EFFECT.gain}</p>
      <div class="fx-ads">${tAdsHTML()}</div>
    </div>`;
  document.querySelector('.match').append(...wrap.children);

  const sheet = document.getElementById('fxSheet');
  const backdrop = document.getElementById('fxBackdrop');
  const open = () => { sheet.classList.add('is-open'); backdrop.classList.add('is-open'); };
  const close = () => { sheet.classList.remove('is-open'); backdrop.classList.remove('is-open'); };
  document.getElementById('fxClose').addEventListener('click', close);
  backdrop.addEventListener('click', close);

  boardEl.addEventListener('click', (e) => {
    const cell = e.target.closest('.cell-fx');
    if (cell && cell.dataset.filled !== 'true') open();
  });
})();
