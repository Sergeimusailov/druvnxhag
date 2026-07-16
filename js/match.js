const TURN_SECONDS = 20;
const RING_CIRCUMFERENCE = 213.6;

function withInstanceIds(cards, prefix) {
  return cards.map((card, i) => ({ ...card, instanceId: `${prefix}-${i}` }));
}

const state = {
  board: new Array(9).fill(null),
  yourHand: [],
  yourDeck: [],
  oppHand: [],
  oppDeck: [],
  scoreYou: 0,
  scoreOpp: 0,
  turn: 'you',
  timeLeft: TURN_SECONDS,
  timerInterval: null,
  gameOver: false,
};

const boardEl = document.getElementById('board');
const handEl = document.getElementById('hand');
const scoreYouEl = document.getElementById('scoreYou');
const scoreOppEl = document.getElementById('scoreOpp');
const scoreBarEl = document.getElementById('scoreBar');
const turnStatusEl = document.getElementById('turnStatus');
const deckYouEl = document.getElementById('deckYou');
const deckOppEl = document.getElementById('deckOpp');
const turnOverlayEl = document.getElementById('turnOverlay');
const turnOverlayTextEl = document.getElementById('turnOverlayText');
const timerProgressEl = document.querySelector('.timer-progress');

function neighborsOf(index) {
  const row = Math.floor(index / 3);
  const col = index % 3;
  const result = {};
  if (row > 0) result.up = index - 3;
  if (row < 2) result.down = index + 3;
  if (col > 0) result.left = index - 1;
  if (col < 2) result.right = index + 1;
  return result;
}

function capturesForPlacement(board, index, card, owner) {
  const n = neighborsOf(index);
  const captured = [];
  if (n.up !== undefined && board[n.up] && board[n.up].owner !== owner && card.top > board[n.up].card.bottom) {
    captured.push(n.up);
  }
  if (n.down !== undefined && board[n.down] && board[n.down].owner !== owner && card.bottom > board[n.down].card.top) {
    captured.push(n.down);
  }
  if (n.left !== undefined && board[n.left] && board[n.left].owner !== owner && card.left > board[n.left].card.right) {
    captured.push(n.left);
  }
  if (n.right !== undefined && board[n.right] && board[n.right].owner !== owner && card.right > board[n.right].card.left) {
    captured.push(n.right);
  }
  return captured;
}

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
  state.board.forEach((cell, index) => {
    const cellEl = document.createElement('div');
    cellEl.className = 'cell';
    cellEl.dataset.index = index;
    if (cell) {
      cellEl.dataset.filled = 'true';
      const cardEl = document.createElement('div');
      cardEl.className = `card owner-${cell.owner === 'you' ? 'you' : 'opp'}`;
      cardEl.innerHTML = cardInnerHTML(cell.card);
      cellEl.appendChild(cardEl);
    }
    boardEl.appendChild(cellEl);
  });
}

function renderHand() {
  handEl.innerHTML = '';
  state.yourHand.forEach((card) => {
    const cardEl = document.createElement('div');
    cardEl.className = 'card in-hand';
    cardEl.dataset.id = card.instanceId;
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

function renderDecks() {
  deckYouEl.textContent = state.yourDeck.length;
  deckOppEl.textContent = state.oppDeck.length;
}

function recomputeScore() {
  let you = 0;
  let opp = 0;
  state.board.forEach((cell) => {
    if (cell && cell.owner === 'you') you++;
    if (cell && cell.owner === 'opp') opp++;
  });
  state.scoreYou = you;
  state.scoreOpp = opp;
}

function renderAll() {
  renderBoard();
  renderHand();
  renderScore();
  renderDecks();
}

function setTimerRing(fraction) {
  const offset = RING_CIRCUMFERENCE * (1 - fraction);
  timerProgressEl.style.strokeDashoffset = offset;
  timerProgressEl.classList.remove('timer-warn', 'timer-danger');
  if (fraction <= 0.15) timerProgressEl.classList.add('timer-danger');
  else if (fraction <= 0.4) timerProgressEl.classList.add('timer-warn');
}

function stopTimer() {
  if (state.timerInterval) {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
  }
}

function startTimer() {
  stopTimer();
  state.timeLeft = TURN_SECONDS;
  setTimerRing(1);
  state.timerInterval = setInterval(() => {
    state.timeLeft--;
    setTimerRing(Math.max(state.timeLeft, 0) / TURN_SECONDS);
    if (state.timeLeft <= 0) {
      stopTimer();
      onYourTimeout();
    }
  }, 1000);
}

function onYourTimeout() {
  if (state.gameOver || state.turn !== 'you' || state.yourHand.length === 0) return;
  const card = state.yourHand[Math.floor(Math.random() * state.yourHand.length)];
  const emptyCells = state.board.map((c, i) => (c ? null : i)).filter((i) => i !== null);
  const index = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  placeCard(card, index, 'you');
}

function showTurnOverlay(text, ms) {
  return new Promise((resolve) => {
    turnOverlayTextEl.textContent = text;
    turnOverlayEl.classList.add('visible');
    setTimeout(() => {
      turnOverlayEl.classList.remove('visible');
      resolve();
    }, ms);
  });
}

function drawCardForOwner(owner) {
  if (owner === 'you' && state.yourHand.length < 3 && state.yourDeck.length > 0) {
    state.yourHand.push(state.yourDeck.shift());
  }
  if (owner === 'opp' && state.oppHand.length < 3 && state.oppDeck.length > 0) {
    state.oppHand.push(state.oppDeck.shift());
  }
}

function placeCard(card, index, owner) {
  if (state.gameOver || state.board[index]) return;
  const captured = capturesForPlacement(state.board, index, card, owner);
  state.board[index] = { card, owner };
  captured.forEach((i) => {
    state.board[i].owner = owner;
  });

  if (owner === 'you') {
    state.yourHand = state.yourHand.filter((c) => c.instanceId !== card.instanceId);
  } else {
    state.oppHand = state.oppHand.filter((c) => c.instanceId !== card.instanceId);
  }

  recomputeScore();
  renderAll();

  const filledCount = state.board.filter(Boolean).length;
  if (filledCount >= 9) {
    endGame();
    return;
  }

  advanceTurn(owner);
}

function advanceTurn(justMovedOwner) {
  stopTimer();
  const nextOwner = justMovedOwner === 'you' ? 'opp' : 'you';
  drawCardForOwner(justMovedOwner);
  renderHand();
  renderDecks();

  turnStatusEl.textContent = nextOwner === 'you' ? 'Ваш ход' : 'Ход соперника';
  showTurnOverlay(nextOwner === 'you' ? 'Ваш ход' : 'Ход соперника', 900).then(() => {
    if (state.gameOver) return;
    state.turn = nextOwner;
    if (nextOwner === 'opp') {
      runOpponentTurn();
    } else {
      startTimer();
    }
  });
}

function chooseOpponentMove() {
  let best = null;
  state.oppHand.forEach((card) => {
    state.board.forEach((cell, index) => {
      if (cell) return;
      const gain = capturesForPlacement(state.board, index, card, 'opp').length;
      if (!best || gain > best.gain || (gain === best.gain && Math.random() < 0.3)) {
        best = { card, index, gain };
      }
    });
  });
  return best;
}

function runOpponentTurn() {
  setTimeout(() => {
    if (state.gameOver) return;
    const move = chooseOpponentMove();
    if (move) {
      placeCard(move.card, move.index, 'opp');
    }
  }, 1000);
}

function endGame() {
  state.gameOver = true;
  stopTimer();
  let text = 'Ничья';
  if (state.scoreYou > state.scoreOpp) text = 'Победа!';
  else if (state.scoreOpp > state.scoreYou) text = 'Поражение';
  turnStatusEl.textContent = 'Матч завершён';
  turnOverlayTextEl.textContent = `${text}\n${state.scoreYou} : ${state.scoreOpp}`;
  turnOverlayTextEl.style.whiteSpace = 'pre-line';
  turnOverlayEl.classList.add('visible');
}

function makeDraggable(cardEl, card) {
  cardEl.addEventListener('pointerdown', (e) => {
    if (state.turn !== 'you' || state.gameOver) return;
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
        placeCard(card, parseInt(cell.dataset.index, 10), 'you');
      }
    }

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  });
}

function initGame() {
  const yourSet = withInstanceIds(drawPlayerSet(), 'you');
  const oppSet = withInstanceIds(drawPlayerSet(), 'opp');

  state.yourHand = yourSet.slice(0, 3);
  state.yourDeck = yourSet.slice(3);
  state.oppHand = oppSet.slice(0, 3);
  state.oppDeck = oppSet.slice(3);

  renderAll();
  turnStatusEl.textContent = 'Ваш ход';
  startTimer();
}

document.getElementById('infoBtn').addEventListener('click', () => {});

initGame();
