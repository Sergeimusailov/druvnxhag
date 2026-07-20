const TURN_SECONDS = 20;
const RING_C = 213.63; // circumference (2*pi*34)
const RING_ARC = 178.02; // visible arc (~300deg), gap at bottom
const POST_MOVE_DELAY = 1000;
const OVERLAY_DURATION = 3000;
const FLIGHT_DURATION = 900;
const OPP_THINK_MIN = 3000;
const OPP_THINK_MAX = 6000;
const OPP_THINKING_MESSAGES = ['Думает', 'Перебирает карты', 'Сравнивает числа'];

function withInstanceIds(cards, prefix) {
  return cards.map((card, i) => ({ ...card, instanceId: `${prefix}-${i}` }));
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
  gameOver: false,
  lastPlacedIndex: null,
  lastPlacedFaceDown: false,
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
const oppStatusEl = document.getElementById('oppStatus');
const oppStatusTextEl = document.getElementById('oppStatusText');

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

function spawnParticles(cellEl, owner) {
  const color = owner === 'you' ? '#2265d3' : '#e32d2d';
  const count = 10;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('span');
    p.className = 'particle';
    p.style.background = color;
    cellEl.appendChild(p);

    const angle = (Math.PI * 2 * i) / count + (Math.random() * 0.5 - 0.25);
    const dist = 26 + Math.random() * 20;
    anime({
      targets: p,
      translateX: Math.cos(angle) * dist,
      translateY: Math.sin(angle) * dist,
      scale: [1, 0.3],
      opacity: [1, 0],
      duration: 500,
      easing: 'easeOutQuad',
      complete: () => p.remove(),
    });
  }
}

function playLandAnimation(cardEl) {
  anime({
    targets: cardEl,
    scaleX: [0.5, 1.15, 0.92, 1.03, 1],
    scaleY: [0.5, 0.85, 1.08, 0.98, 1],
    opacity: [0, 1],
    duration: 420,
    easing: 'easeOutElastic(1, 0.6)',
  });
}

function flipCardToFront(cardEl, card) {
  return new Promise((resolve) => {
    anime({
      targets: cardEl,
      scaleX: [1, 0],
      duration: 150,
      easing: 'easeInQuad',
      complete: () => {
        cardEl.classList.remove('face-back');
        cardEl.innerHTML = cardInnerHTML(card);
        anime({
          targets: cardEl,
          scaleX: [0, 1],
          duration: 150,
          easing: 'easeOutQuad',
          complete: resolve,
        });
      },
    });
  });
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
      const isFaceDown = index === state.lastPlacedIndex && state.lastPlacedFaceDown;
      cardEl.className = `card owner-${cell.owner}${isFaceDown ? ' face-back' : ''}`;
      cardEl.innerHTML = isFaceDown ? '' : cardInnerHTML(cell.card);
      cellEl.appendChild(cardEl);
      if (index === state.lastPlacedIndex) playLandAnimation(cardEl);
    }
    boardEl.appendChild(cellEl);
  });
  if (state.lastPlacedIndex !== null) {
    const landedCell = boardEl.querySelector(`.cell[data-index="${state.lastPlacedIndex}"]`);
    spawnParticles(landedCell, state.board[state.lastPlacedIndex].owner);
  }
}

function renderHand(hideIndex, faceBackIndex) {
  handEl.innerHTML = '';
  for (let slot = 0; slot < 3; slot++) {
    const slotEl = document.createElement('div');
    slotEl.className = 'hand-slot';
    slotEl.dataset.slot = slot;
    const card = state.yourHand[slot];
    if (card) {
      const cardEl = document.createElement('div');
      const isFaceBack = slot === faceBackIndex;
      cardEl.className = `card in-hand${isFaceBack ? ' face-back' : ''}`;
      cardEl.dataset.id = card.instanceId;
      cardEl.innerHTML = isFaceBack ? '' : cardInnerHTML(card);
      if (slot === hideIndex) cardEl.classList.add('hand-card-hidden');
      makeDraggable(cardEl, card);
      slotEl.appendChild(cardEl);
    }
    handEl.appendChild(slotEl);
  }
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

let timerAnim = null;

function stopTimer() {
  if (timerAnim) {
    timerAnim.pause();
    timerAnim = null;
  }
}

function startTimer() {
  stopTimer();
  timerProgressEl.classList.remove('timer-warn', 'timer-danger');
  const prog = { len: RING_ARC };
  timerProgressEl.style.strokeDasharray = `${RING_ARC} ${RING_C}`;
  timerAnim = anime({
    targets: prog,
    len: 0,
    duration: TURN_SECONDS * 1000,
    easing: 'linear',
    update: () => {
      timerProgressEl.style.strokeDasharray = `${prog.len} ${RING_C}`;
      const remaining = prog.len / RING_ARC;
      if (remaining <= 0.15) {
        timerProgressEl.classList.add('timer-danger');
        timerProgressEl.classList.remove('timer-warn');
      } else if (remaining <= 0.4) {
        timerProgressEl.classList.add('timer-warn');
      }
    },
    complete: onYourTimeout,
  });
}

function onYourTimeout() {
  if (state.gameOver || state.turn !== 'you' || state.yourHand.length === 0) return;
  const card = state.yourHand[Math.floor(Math.random() * state.yourHand.length)];
  const emptyCells = state.board.map((c, i) => (c ? null : i)).filter((i) => i !== null);
  const index = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  playerPlaceCard(card, index);
}

function showTurnOverlay(text, ms) {
  turnOverlayTextEl.textContent = text;
  return new Promise((resolve) => {
    anime({
      targets: turnOverlayEl,
      opacity: [0, 1],
      duration: 250,
      easing: 'easeOutQuad',
    });
    setTimeout(() => {
      anime({
        targets: turnOverlayEl,
        opacity: [1, 0],
        duration: 250,
        easing: 'easeInQuad',
        complete: resolve,
      });
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

function isBoardFull() {
  return state.board.every(Boolean);
}

function commitPlacement(card, index, owner, options = {}) {
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
  state.lastPlacedIndex = index;
  state.lastPlacedFaceDown = !!options.faceDown;
  renderBoard();
  renderHand();
  renderScore();
  renderDecks();
}

function flyGhost(fromRect, toRect, innerHTML, faceDown) {
  return new Promise((resolve) => {
    const ghost = document.createElement('div');
    ghost.className = `card drag-ghost${faceDown ? ' face-back' : ''}`;
    ghost.innerHTML = innerHTML || '';
    Object.assign(ghost.style, {
      position: 'fixed',
      left: `${fromRect.left}px`,
      top: `${fromRect.top}px`,
      width: `${fromRect.width}px`,
      height: `${fromRect.height}px`,
      margin: '0',
      zIndex: '200',
      borderRadius: '16%',
    });
    document.body.appendChild(ghost);

    anime({
      targets: ghost,
      left: `${toRect.left}px`,
      top: `${toRect.top}px`,
      width: `${toRect.width}px`,
      height: `${toRect.height}px`,
      duration: FLIGHT_DURATION,
      easing: 'cubicBezier(.32,.72,.35,1)',
      complete: () => {
        ghost.remove();
        resolve();
      },
    });
  });
}

async function flyFromDeckToCell(owner, index) {
  const badgeEl = owner === 'you' ? deckYouEl : deckOppEl;
  const cellEl = boardEl.querySelector(`.cell[data-index="${index}"]`);
  await flyGhost(badgeEl.getBoundingClientRect(), cellEl.getBoundingClientRect(), '', true);
}

async function refillYourHandWithFlight() {
  if (state.yourHand.length >= 3 || state.yourDeck.length === 0) return;
  const card = state.yourDeck.shift();
  const slotIndex = state.yourHand.length;
  state.yourHand.push(card);
  renderDecks();
  renderHand(slotIndex);
  const slotEl = handEl.querySelector(`.hand-slot[data-slot="${slotIndex}"]`);
  const badgeRect = deckYouEl.getBoundingClientRect();
  const slotRect = slotEl.getBoundingClientRect();
  await flyGhost(badgeRect, slotRect, '', true);
  renderHand(undefined, slotIndex);
  const cardEl = handEl.querySelector(`.hand-slot[data-slot="${slotIndex}"] .card`);
  await flipCardToFront(cardEl, card);
}

async function playerPlaceCard(card, index) {
  if (state.turn !== 'you' || state.gameOver || state.board[index]) return;
  state.turn = 'locked';
  stopTimer();
  commitPlacement(card, index, 'you');
  await wait(POST_MOVE_DELAY);
  if (isBoardFull()) {
    endGame();
    return;
  }
  await turnTransition('you');
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

function startOppThinkingStatus() {
  let i = 0;
  oppStatusTextEl.textContent = OPP_THINKING_MESSAGES[i];
  oppStatusEl.classList.add('visible');
  const interval = setInterval(() => {
    i = (i + 1) % OPP_THINKING_MESSAGES.length;
    oppStatusTextEl.textContent = OPP_THINKING_MESSAGES[i];
  }, 1300);
  return () => {
    clearInterval(interval);
    oppStatusEl.classList.remove('visible');
  };
}

async function runOpponentTurn() {
  drawCardForOwner('opp');
  renderDecks();
  const stopThinking = startOppThinkingStatus();
  const thinkTime = OPP_THINK_MIN + Math.random() * (OPP_THINK_MAX - OPP_THINK_MIN);
  await wait(thinkTime);
  stopThinking();
  if (state.gameOver) return;
  const move = chooseOpponentMove();
  if (move) {
    await flyFromDeckToCell('opp', move.index);
    commitPlacement(move.card, move.index, 'opp', { faceDown: true });
    await wait(450);
    const cardEl = boardEl.querySelector(`.cell[data-index="${move.index}"] .card`);
    await flipCardToFront(cardEl, move.card);
  }
  await wait(POST_MOVE_DELAY);
  if (isBoardFull()) {
    endGame();
    return;
  }
  await turnTransition('opp');
}

async function turnTransition(justMovedOwner) {
  const nextOwner = justMovedOwner === 'you' ? 'opp' : 'you';
  await showTurnOverlay(nextOwner === 'you' ? 'Ваш ход' : 'Ход соперника', OVERLAY_DURATION);
  if (state.gameOver) return;
  state.turn = nextOwner;
  turnStatusEl.textContent = nextOwner === 'you' ? 'Ваш ход' : 'Ход соперника';
  if (nextOwner === 'opp') {
    handEl.classList.add('disabled');
    runOpponentTurn();
  } else {
    handEl.classList.remove('disabled');
    refillYourHandWithFlight();
    startTimer();
  }
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
  anime({
    targets: turnOverlayEl,
    opacity: [0, 1],
    duration: 400,
    easing: 'easeOutQuad',
  });
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
        playerPlaceCard(card, parseInt(cell.dataset.index, 10));
      }
    }

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  });
}

function initGame() {
  const yourSet = withInstanceIds(drawSavedPlayerSet(), 'you');
  const oppSet = withInstanceIds(drawPlayerSet(), 'opp');

  state.yourHand = yourSet.slice(0, 3);
  state.yourDeck = yourSet.slice(3);
  state.oppHand = oppSet.slice(0, 3);
  state.oppDeck = oppSet.slice(3);

  renderBoard();
  renderHand();
  renderScore();
  renderDecks();
  turnStatusEl.textContent = 'Ваш ход';
  startTimer();
}

document.getElementById('infoBtn').addEventListener('click', () => {});

initGame();
