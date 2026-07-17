const TURN_SECONDS = 20;
const RING_CIRCUMFERENCE = 213.6;
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
  refreshSpotlightTarget();
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
  applyHandActiveState();
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

/* ---------------- Onboarding script engine ---------------- */

const onbBlockerEl = document.getElementById('onbBlocker');
const onbScrimEl = document.getElementById('onbScrim');
const spotlightEl = document.getElementById('spotlight');
const tooltipEl = document.getElementById('tooltip');
const tooltipTailEl = document.getElementById('tooltipTail');
const tooltipStepEl = document.getElementById('tooltipStep');
const tooltipTextEl = document.getElementById('tooltipText');
const tooltipHintEl = document.getElementById('tooltipHint');
const tooltipBtnEl = document.getElementById('tooltipBtn');

let scriptMode = true;
let currentStep = -1;
let expectedDrag = null; // { instanceId, index }
let spotlightTarget = null; // element currently spotlighted

function findCard(name) {
  return CARD_ROSTER.find((c) => c.name === name);
}

function applyHandActiveState() {
  const cards = handEl.querySelectorAll('.card.in-hand');
  cards.forEach((cardEl) => {
    if (scriptMode && expectedDrag && cardEl.dataset.id !== expectedDrag.instanceId) {
      cardEl.classList.add('onb-inactive');
      cardEl.classList.remove('onb-active-card');
    } else {
      cardEl.classList.remove('onb-inactive');
      cardEl.classList.toggle('onb-active-card', scriptMode && !!expectedDrag && cardEl.dataset.id === expectedDrag.instanceId);
    }
  });
}

function canStartDrag(card) {
  if (!scriptMode) return true;
  return !!expectedDrag && card.instanceId === expectedDrag.instanceId;
}

function canDropAt(card, index) {
  if (!scriptMode) return true;
  return !!expectedDrag && card.instanceId === expectedDrag.instanceId && index === expectedDrag.index;
}

function makeDraggable(cardEl, card) {
  cardEl.addEventListener('pointerdown', (e) => {
    if (state.turn !== 'you' || state.gameOver) return;
    if (!canStartDrag(card)) return;
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
      if (cell && cell.dataset.filled !== 'true' && canDropAt(card, parseInt(cell.dataset.index, 10))) {
        cell.classList.add('drag-over');
      }
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
        const index = parseInt(cell.dataset.index, 10);
        if (scriptMode) {
          if (canDropAt(card, index)) handleScriptedDrop(card, index);
        } else {
          playerPlaceCard(card, index);
        }
      }
    }

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  });
}

async function handleScriptedDrop(card, index) {
  expectedDrag = null;
  stopDragHint();
  hideSpotlight();
  hideTooltip();
  commitPlacement(card, index, 'you');
  await wait(POST_MOVE_DELAY);
  advanceStep();
}

function resolveRect(target) {
  if (!target) return null;
  const els = (Array.isArray(target) ? target : [target]).filter(Boolean);
  if (!els.length) return null;
  const rects = els.map((el) => el.getBoundingClientRect());
  const left = Math.min(...rects.map((r) => r.left));
  const top = Math.min(...rects.map((r) => r.top));
  const right = Math.max(...rects.map((r) => r.right));
  const bottom = Math.max(...rects.map((r) => r.bottom));
  return { left, top, right, bottom, width: right - left, height: bottom - top };
}

function isTargetConnected(target) {
  if (!target) return false;
  const els = Array.isArray(target) ? target : [target];
  return els.length > 0 && els.every((el) => el && el.isConnected);
}

function positionSpotlight(target) {
  spotlightTarget = target || null;
  const r = resolveRect(target);
  if (!r) {
    spotlightEl.classList.remove('visible', 'pulse');
    return;
  }
  const pad = 6;
  spotlightEl.style.left = `${r.left - pad}px`;
  spotlightEl.style.top = `${r.top - pad}px`;
  spotlightEl.style.width = `${r.width + pad * 2}px`;
  spotlightEl.style.height = `${r.height + pad * 2}px`;
  spotlightEl.classList.add('visible');
}

function refreshSpotlightTarget() {
  if (isTargetConnected(spotlightTarget)) {
    positionSpotlight(spotlightTarget);
  }
}

function hideSpotlight() {
  spotlightEl.classList.remove('visible', 'pulse');
  spotlightTarget = null;
}

let numHighlightEls = [];

function clearNumberHighlights() {
  numHighlightEls.forEach((el) => el.classList.remove('onb-num-highlight'));
  numHighlightEls = [];
}

function applyNumberHighlights(compare) {
  if (!compare) return;
  compare.forEach(({ index, side }) => {
    const el = boardEl.querySelector(`.cell[data-index="${index}"] .num-${side}`);
    if (el) {
      el.classList.add('onb-num-highlight');
      numHighlightEls.push(el);
    }
  });
}

let tooltipTarget = null; // element the tooltip is currently anchored to (null = centered fallback)

function positionTooltip(target) {
  tooltipTarget = target || null;
  const margin = 16;
  const gap = 14;
  const maxWidth = 320;
  const width = Math.min(maxWidth, window.innerWidth - margin * 2);
  tooltipEl.style.width = `${width}px`;

  const r = resolveRect(target);
  if (!r) {
    tooltipTailEl.style.display = 'none';
    tooltipEl.classList.remove('tooltip-above');
    tooltipEl.classList.add('tooltip-centered');
    tooltipEl.style.left = `${(window.innerWidth - width) / 2}px`;
    tooltipEl.style.top = '50%';
    onbScrimEl.classList.add('active');
    return;
  }

  onbScrimEl.classList.remove('active');
  tooltipEl.classList.remove('tooltip-centered');
  tooltipTailEl.style.display = '';
  const targetCenterX = r.left + r.width / 2;

  let left = targetCenterX - width / 2;
  left = Math.max(margin, Math.min(left, window.innerWidth - margin - width));
  tooltipEl.style.left = `${left}px`;

  const tailWidth = 24;
  let tailLeft = targetCenterX - left - tailWidth / 2;
  tailLeft = Math.max(12, Math.min(tailLeft, width - 12 - tailWidth));
  tooltipTailEl.style.left = `${tailLeft}px`;

  const spaceBelow = window.innerHeight - r.bottom;
  const spaceAbove = r.top;
  if (spaceBelow >= spaceAbove) {
    tooltipEl.classList.remove('tooltip-above');
    tooltipEl.style.top = `${r.bottom + gap}px`;
  } else {
    tooltipEl.classList.add('tooltip-above');
    const bubbleHeight = tooltipEl.offsetHeight;
    tooltipEl.style.top = `${r.top - gap - bubbleHeight}px`;
  }
}

function refreshTooltipTarget() {
  if (tooltipEl.classList.contains('visible')) {
    positionTooltip(isTargetConnected(tooltipTarget) ? tooltipTarget : null);
  }
}

function showTooltip(stepDef, stepNumber, targetEl) {
  tooltipStepEl.textContent = `Шаг ${stepNumber} из ${STEPS.length}`;
  tooltipTextEl.textContent = stepDef.text;
  if (stepDef.kind === 'drag') {
    tooltipHintEl.textContent = 'Перетащите карту, чтобы продолжить';
    tooltipHintEl.classList.add('visible');
    tooltipBtnEl.classList.add('hidden');
  } else {
    tooltipHintEl.classList.remove('visible');
    tooltipBtnEl.classList.remove('hidden');
    tooltipBtnEl.textContent = stepDef.kind === 'final' ? 'Начать игру' : 'Продолжить';
  }
  positionTooltip(targetEl);
  tooltipEl.classList.add('visible');
}

function hideTooltip() {
  tooltipEl.classList.remove('visible');
  onbBlockerEl.classList.remove('active');
  onbScrimEl.classList.remove('active');
  tooltipTarget = null;
}

window.addEventListener('resize', () => {
  refreshSpotlightTarget();
  refreshTooltipTarget();
});

let dragHintCancel = null;

function startDragHint(cardEl, cellEl) {
  stopDragHint();
  const trailEl = document.createElement('div');
  trailEl.className = 'drag-trail';
  document.body.appendChild(trailEl);

  let cancelled = false;
  dragHintCancel = () => {
    cancelled = true;
    trailEl.remove();
  };

  const size = 24;

  async function loop() {
    while (!cancelled) {
      if (!cardEl.isConnected || !cellEl.isConnected) break;
      const cardRect = cardEl.getBoundingClientRect();
      const cellRect = cellEl.getBoundingClientRect();
      const from = { x: cardRect.left + cardRect.width / 2, y: cardRect.top + cardRect.height / 2 };
      const to = { x: cellRect.left + cellRect.width / 2, y: cellRect.top + cellRect.height / 2 };
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const distance = Math.hypot(dx, dy);
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

      trailEl.style.top = `${to.y - size / 2}px`;
      trailEl.style.height = `${size}px`;
      trailEl.style.transformOrigin = '100% 50%';
      trailEl.style.transform = `rotate(${angle}deg)`;
      trailEl.style.opacity = '1';
      trailEl.style.width = `${distance}px`;
      trailEl.style.left = `${to.x - distance}px`;

      const obj = { len: distance };
      await new Promise((resolve) => {
        anime({
          targets: obj,
          len: size,
          duration: 650,
          easing: 'easeInOutQuad',
          update: () => {
            trailEl.style.width = `${obj.len}px`;
            trailEl.style.left = `${to.x - obj.len}px`;
          },
          complete: resolve,
        });
      });
      if (cancelled) break;

      trailEl.classList.add('drag-trail-pulse');
      await wait(700);
      if (cancelled) break;
      trailEl.classList.remove('drag-trail-pulse');
      trailEl.style.opacity = '0';
      await wait(300);
    }
  }

  loop();
}

function stopDragHint() {
  if (dragHintCancel) {
    dragHintCancel();
    dragHintCancel = null;
  }
}

const STEPS = [
  { kind: 'info', text: 'Добро пожаловать в Арену Карт! Покажем, как проходит матч.' },
  { kind: 'info', text: 'Вы играете против ИИ-соперника — Константина. У него тоже есть своя колода карт.', target: '.player-opponent' },
  { kind: 'info', text: 'На каждый ход даётся 20 секунд — следите за таймером.', target: '.timer-wrap' },
  { kind: 'info', text: 'Поле состоит из 9 клеток. Цель — занять клеток больше, чем соперник.', target: '#board' },
  { kind: 'info', text: 'Это ваша рука. У каждой карты четыре числа — её сила с каждой стороны.', target: '#hand' },
  { kind: 'drag', text: 'Перетащите первую карту в центральную клетку поля.', cardName: 'Росток', targetIndex: 4 },
  { kind: 'info', text: 'Отлично! Карта расставлена. Теперь ход соперника.', target: '#board' },
  { kind: 'auto-opp-move', cardName: 'Лейка', index: 5 },
  { kind: 'info', text: 'Соперник поставил карту рядом, но не смог захватить вашу: его 0 меньше вашей 4.', targets: ['.cell[data-index="4"]', '.cell[data-index="5"]'], compare: [{ index: 5, side: 'left' }, { index: 4, side: 'right' }] },
  { kind: 'info', text: 'Теперь ваш шанс на захват! Числа соседних карт сравниваются — большее побеждает и переворачивает клетку.', target: '#hand' },
  { kind: 'drag', text: 'Перетащите карту в клетку сверху от карты соперника, чтобы захватить её.', cardName: 'Ромашка', targetIndex: 2 },
  { kind: 'info', text: 'Захват! Ваша нижняя сторона сильнее — клетка соперника перешла к вам.', targets: ['.cell[data-index="2"]', '.cell[data-index="5"]'], compare: [{ index: 2, side: 'bottom' }, { index: 5, side: 'top' }] },
  { kind: 'info', text: 'Здесь виден счёт: сколько клеток занято вами и соперником.', target: '.score-panel' },
  { kind: 'info', text: 'Когда в руке останется меньше 3 карт, она пополнится из вашей колоды.', target: '#deckYou' },
  { kind: 'auto-opp-move', cardName: 'Подсолнух', index: 0 },
  { kind: 'final', text: 'Вы знаете основы! Доиграйте матч самостоятельно — дальше игра идёт в реальном времени.' },
];

async function runStep(i) {
  currentStep = i;
  if (i >= STEPS.length) return;
  const step = STEPS[i];
  clearNumberHighlights();

  if (step.kind === 'info') {
    stopDragHint();
    onbBlockerEl.classList.add('active');
    const targetEl = step.targets
      ? step.targets.map((sel) => document.querySelector(sel)).filter(Boolean)
      : step.target
        ? document.querySelector(step.target)
        : null;
    positionSpotlight(targetEl);
    showTooltip(step, i + 1, targetEl);
    applyNumberHighlights(step.compare);
    tooltipBtnEl.onclick = () => advanceStep();
  } else if (step.kind === 'drag') {
    onbBlockerEl.classList.remove('active');
    hideSpotlight();
    const card = state.yourHand.find((c) => c.name === step.cardName);
    expectedDrag = card ? { instanceId: card.instanceId, index: step.targetIndex } : null;
    applyHandActiveState();
    const cellEl = boardEl.querySelector(`.cell[data-index="${step.targetIndex}"]`);
    const cardEl = card ? handEl.querySelector(`.card[data-id="${card.instanceId}"]`) : null;
    if (cardEl && cellEl) startDragHint(cardEl, cellEl);
    showTooltip(step, i + 1, cellEl);
  } else if (step.kind === 'auto-opp-move') {
    stopDragHint();
    hideTooltip();
    hideSpotlight();
    const card = state.oppHand.find((c) => c.name === step.cardName);
    await performScriptedOppMove(card, step.index);
    advanceStep();
  } else if (step.kind === 'final') {
    stopDragHint();
    onbBlockerEl.classList.add('active');
    positionSpotlight(null);
    showTooltip(step, i + 1, null);
    tooltipBtnEl.onclick = finishScript;
  }
}

function advanceStep() {
  applyHandActiveState();
  runStep(currentStep + 1);
}

async function performScriptedOppMove(card, index) {
  if (!card) {
    advanceStep();
    return;
  }
  const stopThinking = startOppThinkingStatus();
  await wait(1400);
  stopThinking();
  await flyFromDeckToCell('opp', index);
  commitPlacement(card, index, 'opp', { faceDown: true });
  await wait(450);
  const cardEl = boardEl.querySelector(`.cell[data-index="${index}"] .card`);
  await flipCardToFront(cardEl, card);
  await wait(POST_MOVE_DELAY);
}

function finishScript() {
  scriptMode = false;
  expectedDrag = null;
  hideTooltip();
  hideSpotlight();
  applyHandActiveState();
  turnTransition('opp');
}

function initGame() {
  const yourNames = ['Росток', 'Ромашка', 'Кувшинка'];
  const yourDeckNames = ['Гроза', 'Молния', 'Тайфун', 'Туман', 'Солнце'];
  const oppNames = ['Лейка', 'Подсолнух', 'Шип'];
  const oppDeckNames = ['Луч', 'Жемчужина', 'Медуза', 'Спираль', 'Коралл'];

  state.yourHand = withInstanceIds(yourNames.map(findCard), 'you');
  state.yourDeck = withInstanceIds(yourDeckNames.map(findCard), 'you-deck');
  state.oppHand = withInstanceIds(oppNames.map(findCard), 'opp');
  state.oppDeck = withInstanceIds(oppDeckNames.map(findCard), 'opp-deck');

  renderBoard();
  renderHand();
  renderScore();
  renderDecks();
  turnStatusEl.textContent = 'Обучение';

  runStep(0);
}

document.getElementById('infoBtn').addEventListener('click', () => {});

initGame();
