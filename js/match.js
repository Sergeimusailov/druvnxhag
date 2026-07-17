const TURN_SECONDS = 20;
const RING_CIRCUMFERENCE = 213.6;
const POST_MOVE_DELAY = 2000;
const OVERLAY_DURATION = 3000;
const FLIGHT_DURATION = 900;

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

const CARD_MASK_FRAME_PATH =
  'M105 1C111.627 1 117 6.37258 117 13V105C117 111.627 111.627 117 105 117H13C6.37258 117 1 111.627 1 105V13C1 6.37258 6.37258 1 13 1H105ZM13 9C10.7909 9 9 10.7909 9 13V45.664C9 45.8502 9.14978 46.0017 9.33594 46.0039C16.3604 46.1821 22 51.9326 22 59C22 65.5022 17.2264 70.8894 10.9926 71.8483C9.90082 72.0162 9 72.8954 9 74V105C9 107.209 10.7909 109 13 109H44C45.1046 109 45.9838 108.099 46.1517 107.007C47.1106 100.774 52.4978 96 59 96C65.5022 96 70.8894 100.774 71.8483 107.007C72.0162 108.099 72.8954 109 74 109H105C107.209 109 109 107.209 109 105V74C109 72.8954 108.099 72.0162 107.007 71.8483C100.774 70.8894 96 65.5022 96 59C96 52.4978 100.774 47.1106 107.007 46.1517C108.099 45.9838 109 45.1046 109 44V13C109 10.7909 107.209 9 105 9H72.336C72.1498 9 71.9983 9.14978 71.9961 9.33594C71.8179 16.3604 66.0674 22 59 22C51.9326 22 46.1821 16.3604 46.0039 9.33594C46.0017 9.14978 45.8502 9 45.664 9H13Z';

const CARD_MASK_BEVEL_PATH =
  'M9 13L8 13V13H9ZM9.33594 46.0039L9.3613 45.0041L9.34756 45.004L9.33594 46.0039ZM13 109L13 110H13V109ZM109 105H110V105H109ZM105 9V8V8V9ZM71.9961 9.33594L72.9959 9.3613L72.996 9.34756L71.9961 9.33594ZM46.0039 9.33594L45.0039 9.34757L45.0042 9.36129L46.0039 9.33594ZM107.007 71.8483L107.159 70.8599L107.007 71.8483ZM46.1517 107.007L47.1401 107.159L46.1517 107.007ZM71.8483 107.007L72.8366 106.855L71.8483 107.007ZM10.9926 71.8483L10.8405 70.8599L10.9926 71.8483ZM105 1V2C111.075 2 116 6.92487 116 13H117H118C118 5.8203 112.18 0 105 0V1ZM117 13H116V105H117H118V13H117ZM117 105H116C116 111.075 111.075 116 105 116V117V118C112.18 118 118 112.18 118 105H117ZM105 117V116H13V117V118H105V117ZM13 117V116C6.92487 116 2 111.075 2 105H1H0C0 112.18 5.8203 118 13 118V117ZM1 105H2V13H1H0V105H1ZM1 13H2C2 6.92487 6.92487 2 13 2V1V0C5.8203 0 0 5.8203 0 13H1ZM13 1V2H105V1V0H13V1ZM13 9V8C10.2386 8 8 10.2386 8 13L9 13L10 13C10 11.3431 11.3431 10 13 10V9ZM9 13H8V45.664H9H10V13H9ZM9.33594 46.0039L9.31058 47.0036C15.7941 47.168 21 52.4764 21 59H22H23C23 51.3889 16.9266 45.1961 9.36129 45.0042L9.33594 46.0039ZM22 59H21C21 65.0011 16.594 69.9749 10.8405 70.8599L10.9926 71.8483L11.1446 72.8366C17.8588 71.8039 23 66.0033 23 59H22ZM9 74H8V105H9H10V74H9ZM9 105H8C8 107.761 10.2386 110 13 110L13 109L13 108C11.3431 108 10 106.657 10 105H9ZM13 109V110H44V109V108H13V109ZM46.1517 107.007L47.1401 107.159C48.0251 101.406 52.9989 97 59 97V96V95C51.9968 95 46.1961 100.141 45.1634 106.855L46.1517 107.007ZM59 96V97C65.0011 97 69.9749 101.406 70.8599 107.159L71.8483 107.007L72.8366 106.855C71.8039 100.141 66.0033 95 59 95V96ZM74 109V110H105V109V108H74V109ZM105 109V110C107.761 110 110 107.761 110 105H109H108C108 106.657 106.657 108 105 108V109ZM109 105H110V74H109H108V105H109ZM107.007 71.8483L107.159 70.8599C101.406 69.9749 97 65.0011 97 59H96H95C95 66.0033 100.141 71.8039 106.855 72.8366L107.007 71.8483ZM96 59H97C97 52.9989 101.406 48.0251 107.159 47.1401L107.007 46.1517L106.855 45.1634C100.141 46.1961 95 51.9968 95 59H96ZM109 44H110V13H109H108V44H109ZM109 13H110C110 10.2386 107.761 8 105 8V9V10C106.657 10 108 11.3431 108 13H109ZM105 9V8H72.336V9V10H105V9ZM71.9961 9.33594L70.9964 9.31058C70.832 15.7941 65.5236 21 59 21V22V23C66.6111 23 72.8039 16.9266 72.9958 9.36129L71.9961 9.33594ZM59 22V21C52.4764 21 47.168 15.7941 47.0036 9.31058L46.0039 9.33594L45.0042 9.36129C45.1961 16.9266 51.3889 23 59 23V22ZM45.664 9V8H13V9V10H45.664V9ZM46.0039 9.33594L47.0038 9.32431C46.9953 8.59044 46.398 8 45.664 8V9V10C45.3025 10 45.0082 9.70912 45.004 9.34756L46.0039 9.33594ZM72.336 9V8C71.602 8 71.0047 8.59044 70.9962 9.32431L71.9961 9.33594L72.996 9.34756C72.9918 9.70911 72.6975 10 72.336 10V9ZM107.007 46.1517L107.159 47.1401C108.644 46.9118 110 45.6885 110 44H109H108C108 44.5207 107.554 45.0559 106.855 45.1634L107.007 46.1517ZM9 45.664H8C8 46.398 8.59044 46.9953 9.32431 47.0038L9.33594 46.0039L9.34756 45.004C9.70911 45.0082 10 45.3025 10 45.664H9ZM109 74H110C110 72.3115 108.644 71.0882 107.159 70.8599L107.007 71.8483L106.855 72.8366C107.554 72.9441 108 73.4793 108 74H109ZM44 109V110C45.6885 110 46.9118 108.644 47.1401 107.159L46.1517 107.007L45.1634 106.855C45.0559 107.554 44.5207 108 44 108V109ZM71.8483 107.007L70.8599 107.159C71.0882 108.644 72.3115 110 74 110V109V108C73.4793 108 72.9441 107.554 72.8366 106.855L71.8483 107.007ZM10.9926 71.8483L10.8405 70.8599C9.35593 71.0882 8 72.3115 8 74H9H10C10 73.4793 10.4457 72.9441 11.1446 72.8366L10.9926 71.8483Z';

function cardInnerHTML(card) {
  const pic = card.pic ? `<img class="card-pic" src="${card.pic}" alt="">` : '';
  return `
    ${pic}
    <svg class="card-mask" viewBox="0 0 118 118" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path class="card-mask-frame" d="${CARD_MASK_FRAME_PATH}" fill="currentColor"/>
      <path d="${CARD_MASK_BEVEL_PATH}" fill="white" fill-opacity="0.7" mask="url(#card-mask-def)"/>
    </svg>
    <span class="num num-top">${card.top}</span>
    <span class="num num-left">${card.left}</span>
    <span class="num num-right">${card.right}</span>
    <span class="num num-bottom">${card.bottom}</span>
  `;
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
  timerProgressEl.style.strokeDashoffset = 0;
  timerAnim = anime({
    targets: timerProgressEl,
    strokeDashoffset: RING_CIRCUMFERENCE,
    duration: TURN_SECONDS * 1000,
    easing: 'linear',
    update: (anim) => {
      const remaining = 1 - anim.progress / 100;
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
      transformOrigin: 'top left',
    });
    document.body.appendChild(ghost);

    const dx = toRect.left - fromRect.left;
    const dy = toRect.top - fromRect.top;
    const sx = toRect.width / fromRect.width;
    const sy = toRect.height / fromRect.height;

    anime({
      targets: ghost,
      translateX: dx,
      translateY: dy,
      scaleX: sx,
      scaleY: sy,
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

async function runOpponentTurn() {
  drawCardForOwner('opp');
  renderDecks();
  await wait(700);
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
    runOpponentTurn();
  } else {
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
  const yourSet = withInstanceIds(drawPlayerSet(), 'you');
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
