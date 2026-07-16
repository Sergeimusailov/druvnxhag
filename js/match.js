const HAND_START = [
  { top: 3, left: 9, right: 7, bottom: 0 },
  { top: 5, left: 0, right: 3, bottom: 8 },
  { top: 3, left: 3, right: 7, bottom: 2 },
];

const state = {
  board: new Array(9).fill(null),
  hand: HAND_START.map((c, i) => ({ ...c, id: i })),
  nextId: HAND_START.length,
  scoreYou: 0,
  scoreOpp: 0,
  yourTurn: true,
};

const boardEl = document.getElementById('board');
const handEl = document.getElementById('hand');
const scoreYouEl = document.getElementById('scoreYou');
const scoreOppEl = document.getElementById('scoreOpp');
const scoreBarEl = document.getElementById('scoreBar');
const turnStatusEl = document.getElementById('turnStatus');

function cardInnerHTML(card) {
  return `
    <span class="num num-top">${card.top}</span>
    <span class="num num-left">${card.left}</span>
    <span class="num num-right">${card.right}</span>
    <span class="num num-bottom">${card.bottom}</span>
  `;
}

function renderBoard() {
  boardEl.innerHTML = '';
  state.board.forEach((card, index) => {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.dataset.index = index;
    if (card) {
      cell.dataset.filled = 'true';
      const cardEl = document.createElement('div');
      cardEl.className = 'card owner-you';
      cardEl.innerHTML = cardInnerHTML(card);
      cell.appendChild(cardEl);
    }
    boardEl.appendChild(cell);
  });
}

function renderHand() {
  handEl.innerHTML = '';
  state.hand.forEach((card) => {
    const cardEl = document.createElement('div');
    cardEl.className = 'card in-hand';
    cardEl.dataset.id = card.id;
    cardEl.innerHTML = cardInnerHTML(card);
    makeDraggable(cardEl, card);
    handEl.appendChild(cardEl);
  });
}

function renderScore() {
  scoreYouEl.textContent = state.scoreYou;
  scoreOppEl.textContent = state.scoreOpp;
  scoreBarEl.innerHTML = '';
  for (let i = 0; i < 9; i++) {
    const seg = document.createElement('div');
    seg.className = 'score-seg';
    if (i < state.scoreYou) seg.classList.add('filled-you');
    else if (i >= 9 - state.scoreOpp) seg.classList.add('filled-opp');
    scoreBarEl.appendChild(seg);
  }
}

function renderAll() {
  renderBoard();
  renderHand();
  renderScore();
}

function placeCard(card, index) {
  if (!state.yourTurn || state.board[index]) return;
  state.board[index] = card;
  state.hand = state.hand.filter((c) => c.id !== card.id);
  state.scoreYou++;
  state.yourTurn = false;
  renderAll();
  turnStatusEl.textContent = 'Ход соперника';
  setTimeout(() => {
    state.yourTurn = true;
    turnStatusEl.textContent = 'Ваш ход';
  }, 900);
}

function makeDraggable(cardEl, card) {
  cardEl.addEventListener('pointerdown', (e) => {
    if (!state.yourTurn) return;
    e.preventDefault();

    const rect = cardEl.getBoundingClientRect();
    const ghost = cardEl.cloneNode(true);
    ghost.classList.add('drag-ghost');
    ghost.style.width = rect.width + 'px';
    document.body.appendChild(ghost);
    cardEl.classList.add('dragging');

    function positionGhost(x, y) {
      ghost.style.left = x - rect.width / 2 + 'px';
      ghost.style.top = y - rect.height / 2 + 'px';
    }
    positionGhost(e.clientX, e.clientY);

    function clearDragOver() {
      document.querySelectorAll('.cell.drag-over').forEach((c) => c.classList.remove('drag-over'));
    }

    function onMove(ev) {
      positionGhost(ev.clientX, ev.clientY);
      clearDragOver();
      const el = document.elementFromPoint(ev.clientX, ev.clientY);
      const cell = el && el.closest('.cell');
      if (cell && cell.dataset.filled !== 'true') cell.classList.add('drag-over');
    }

    function onUp(ev) {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      ghost.remove();
      cardEl.classList.remove('dragging');
      clearDragOver();
      const el = document.elementFromPoint(ev.clientX, ev.clientY);
      const cell = el && el.closest('.cell');
      if (cell && cell.dataset.filled !== 'true') {
        placeCard(card, parseInt(cell.dataset.index, 10));
      }
    }

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  });
}

document.getElementById('infoBtn').addEventListener('click', () => {});

renderAll();
