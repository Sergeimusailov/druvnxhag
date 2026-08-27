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

// [attacking edge of the card facing dir, defending edge of the neighbor]
const CAPTURE_EDGE = {
  up: ['top', 'bottom'],
  down: ['bottom', 'top'],
  left: ['left', 'right'],
  right: ['right', 'left'],
};

// Returns capture events { index, dir, chain, attackerIndex }. A direct win can
// "прострелить" one cell further along the same line: the captured card's far
// edge is compared against the enemy card right behind it.
function capturesForPlacement(board, index, card, owner) {
  const events = [];
  const n = neighborsOf(index);
  for (const dir of ['up', 'down', 'left', 'right']) {
    const ni = n[dir];
    if (ni === undefined || !board[ni] || board[ni].owner === owner) continue;
    const [atk, def] = CAPTURE_EDGE[dir];
    if (card[atk] <= board[ni].card[def]) continue;
    events.push({ index: ni, dir, chain: false, attackerIndex: index });
    const ci = neighborsOf(ni)[dir];
    if (ci !== undefined && board[ci] && board[ci].owner !== owner && board[ni].card[atk] > board[ci].card[def]) {
      events.push({ index: ci, dir, chain: true, attackerIndex: ni });
    }
  }
  return events;
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
    anime.animate(p, {
      translateX: Math.cos(angle) * dist,
      translateY: Math.sin(angle) * dist,
      scale: [1, 0.3],
      opacity: [1, 0],
      duration: 500,
      ease: 'outQuad',
      onComplete: () => p.remove(),
    });
  }
}

function playLandAnimation(cardEl) {
  anime.animate(cardEl, {
    scaleX: [0.5, 1.15, 0.92, 1.03, 1],
    scaleY: [0.5, 0.85, 1.08, 0.98, 1],
    opacity: [0, 1],
    duration: 420,
    ease: 'outElastic(1, 0.6)',
  });
}

function flipCardToFront(cardEl, card) {
  return new Promise((resolve) => {
    anime.animate(cardEl, {
      scaleX: [1, 0],
      duration: 150,
      ease: 'inQuad',
      onComplete: () => {
        cardEl.classList.remove('face-back');
        cardEl.innerHTML = cardInnerHTML(card);
        anime.animate(cardEl, {
          scaleX: [0, 1],
          duration: 150,
          ease: 'outQuad',
          onComplete: resolve,
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
  const prog = { len: RING_ARC };
  timerProgressEl.style.strokeDasharray = `${RING_ARC} ${RING_C}`;
  timerAnim = anime.animate(prog, {
    len: 0,
    duration: TURN_SECONDS * 1000,
    ease: 'linear',
    onUpdate: () => {
      timerProgressEl.style.strokeDasharray = `${prog.len} ${RING_C}`;
      const remaining = prog.len / RING_ARC;
      if (remaining <= 0.15) {
        timerProgressEl.classList.add('timer-danger');
        timerProgressEl.classList.remove('timer-warn');
      } else if (remaining <= 0.4) {
        timerProgressEl.classList.add('timer-warn');
      }
    },
    onComplete: onYourTimeout,
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
    anime.animate(turnOverlayEl, {
      opacity: [0, 1],
      duration: 250,
      ease: 'outQuad',
    });
    setTimeout(() => {
      anime.animate(turnOverlayEl, {
        opacity: [1, 0],
        duration: 250,
        ease: 'inQuad',
        onComplete: resolve,
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

// Places the card and returns the captured neighbor indices WITHOUT flipping
// their owner yet — resolveCaptures() animates and finalizes the flips.
function commitPlacement(card, index, owner, options = {}) {
  const captured = capturesForPlacement(state.board, index, card, owner);
  state.board[index] = { card, owner };

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
  return captured;
}

const CAPTURE_HL_MS = 900;
const CAPTURE_SWEEP_MS = 900;
let captureHlEls = [];

function highlightCaptureNumbers(events) {
  captureHlEls = [];
  events.forEach((ev) => {
    const [atk, def] = CAPTURE_EDGE[ev.dir];
    const aEl = boardEl.querySelector(`.cell[data-index="${ev.attackerIndex}"] .card .num-${atk}`);
    const dEl = boardEl.querySelector(`.cell[data-index="${ev.index}"] .card .num-${def}`);
    [aEl, dEl].forEach((el) => {
      if (el) {
        el.classList.add('num-capture-hl');
        captureHlEls.push(el);
      }
    });
  });
}

function clearCaptureHighlights() {
  captureHlEls.forEach((el) => el.classList.remove('num-capture-hl'));
  captureHlEls = [];
}

function sweepRecolor(ni, dir, owner) {
  return new Promise((resolve) => {
    const cardEl = boardEl.querySelector(`.cell[data-index="${ni}"] .card`);
    if (!cardEl || !state.board[ni]) {
      resolve();
      return;
    }
    const overlay = document.createElement('div');
    overlay.className = `card owner-${owner} capture-sweep`;
    overlay.innerHTML = cardInnerHTML(state.board[ni].card);
    cardEl.appendChild(overlay);
    const clipAt = {
      up: (p) => `inset(${p}% 0 0 0)`,
      down: (p) => `inset(0 0 ${p}% 0)`,
      left: (p) => `inset(0 0 0 ${p}%)`,
      right: (p) => `inset(0 ${p}% 0 0)`,
    }[dir] || ((p) => `inset(0 0 ${p}% 0)`);
    const proxy = { p: 100 };
    overlay.style.clipPath = clipAt(100);
    anime.animate(proxy, {
      p: 0,
      duration: CAPTURE_SWEEP_MS,
      ease: 'cubicBezier(0.55, 0.06, 0.68, 0.19)',
      onUpdate: () => {
        overlay.style.clipPath = clipAt(proxy.p);
      },
      onComplete: () => {
        cardEl.className = `card owner-${owner}`;
        overlay.remove();
        resolve();
      },
    });
  });
}

async function resolveCaptures(index, card, events, owner) {
  if (!events || !events.length) return;
  highlightCaptureNumbers(events);
  await wait(CAPTURE_HL_MS);
  clearCaptureHighlights();
  // directions run in parallel; within a direction the прострел sweep follows
  // the direct one so the colour visibly travels down the line
  await Promise.all(
    events
      .filter((ev) => !ev.chain)
      .map(async (ev) => {
        await sweepRecolor(ev.index, ev.dir, owner);
        if (state.board[ev.index]) state.board[ev.index].owner = owner;
        const chain = events.find((c) => c.chain && c.attackerIndex === ev.index);
        if (chain) {
          await sweepRecolor(chain.index, chain.dir, owner);
          if (state.board[chain.index]) state.board[chain.index].owner = owner;
        }
      })
  );
  recomputeScore();
  renderScore();
  events.forEach((ev) => {
    const cellEl = boardEl.querySelector(`.cell[data-index="${ev.index}"]`);
    if (cellEl) spawnParticles(cellEl, owner);
  });
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

    anime.animate(ghost, {
      translateX: dx,
      translateY: dy,
      scaleX: sx,
      scaleY: sy,
      duration: FLIGHT_DURATION,
      ease: 'cubicBezier(.32,.72,.35,1)',
      onComplete: () => {
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
  handEl.classList.add('disabled');
  stopTimer();
  const captured = commitPlacement(card, index, 'you');
  await resolveCaptures(index, card, captured, 'you');
  await wait(captured.length ? 300 : POST_MOVE_DELAY);
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
  let captured = [];
  if (move) {
    await flyFromDeckToCell('opp', move.index);
    captured = commitPlacement(move.card, move.index, 'opp', { faceDown: true });
    await wait(450);
    const cardEl = boardEl.querySelector(`.cell[data-index="${move.index}"] .card`);
    await flipCardToFront(cardEl, move.card);
    await resolveCaptures(move.index, move.card, captured, 'opp');
  }
  await wait(captured.length ? 300 : POST_MOVE_DELAY);
  if (isBoardFull()) {
    endGame();
    return;
  }
  await turnTransition('opp');
}

async function turnTransition(justMovedOwner) {
  const nextOwner = justMovedOwner === 'you' ? 'opp' : 'you';
  // keep the hand disabled while the "whose turn" overlay is showing so no
  // stray move slips through during the switch
  handEl.classList.add('disabled');
  await showTurnOverlay(nextOwner === 'you' ? 'Ваш ход' : 'Ход соперника', OVERLAY_DURATION);
  if (state.gameOver) return;
  state.turn = nextOwner;
  turnStatusEl.textContent = nextOwner === 'you' ? 'Ваш ход' : 'Ход соперника';
  if (nextOwner === 'opp') {
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
  anime.animate(turnOverlayEl, {
    opacity: [0, 1],
    duration: 400,
    ease: 'outQuad',
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
  const captured = commitPlacement(card, index, 'you');
  await resolveCaptures(index, card, captured, 'you');
  await wait(captured.length ? 300 : POST_MOVE_DELAY);
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

function handCardElByName(name) {
  const card = state.yourHand.find((c) => c.name === name);
  return card ? handEl.querySelector(`.card[data-id="${card.instanceId}"]`) : null;
}

// compare entries: { index, side } for a board cell, { hand: 'Имя', side } for a hand card
function applyNumberHighlights(compare) {
  if (!compare) return;
  compare.forEach((spec) => {
    let el = null;
    if (spec.hand) {
      const cardEl = handCardElByName(spec.hand);
      el = cardEl && cardEl.querySelector(`.num-${spec.side}`);
    } else {
      el = boardEl.querySelector(`.cell[data-index="${spec.index}"] .num-${spec.side}`);
    }
    if (el) {
      el.classList.add('onb-num-highlight');
      numHighlightEls.push(el);
    }
  });
}

let tooltipTarget = null; // element the tooltip is currently anchored to (null = centered fallback)
let tooltipForceAbove = false; // step can pin the bubble above its target

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
  if (!tooltipForceAbove && spaceBelow >= spaceAbove) {
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
  tooltipForceAbove = !!stepDef.tooltipAbove;
  positionTooltip(targetEl);
  tooltipEl.classList.add('visible');
}

function hideTooltip() {
  tooltipEl.classList.remove('visible');
  onbBlockerEl.classList.remove('active');
  onbScrimEl.classList.remove('active');
  tooltipTarget = null;
  tooltipForceAbove = false;
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
        anime.animate(obj, {
          len: size,
          duration: 650,
          ease: 'inOutQuad',
          onUpdate: () => {
            trailEl.style.width = `${obj.len}px`;
            trailEl.style.left = `${to.x - obj.len}px`;
          },
          onComplete: resolve,
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
  { kind: 'info', text: 'Вы играете против соперника. Цель матча: занять больше клеток в поле чем соперник.', target: '.player-opponent' },
  { kind: 'info', text: 'На каждый ход даётся 20 секунд.', target: '.timer-wrap' },
  { kind: 'info', text: 'Поле состоит из 9 клеток. Цель: занять больше клеток, чем соперник.', target: '#board' },
  { kind: 'drag', text: 'Сделайте первый ход.', cardName: 'Кувшинка', targetIndex: 4 },
  { kind: 'auto-opp-move', cardName: 'Лейка', index: 8 },
  { kind: 'drag', text: 'Чтобы захватить карту соперника, перетащите карту сюда.', cardName: 'Ромашка', targetIndex: 7, avoidIndexes: [8], compare: [{ hand: 'Ромашка', side: 'right' }, { index: 8, side: 'left' }] },
  { kind: 'info', text: 'Вы захватили карту соперника. Ваша сторона больше стороны соперника.', targets: ['.cell[data-index="7"]', '.cell[data-index="8"]'], compare: [{ index: 7, side: 'right' }, { index: 8, side: 'left' }] },
  { kind: 'auto-opp-move', cardName: 'Шип', index: 5 },
  { kind: 'info', text: 'Соперник захватил сразу две карты! Каждая выигравшая сторона забирает свою клетку.', targets: ['.cell[data-index="4"]', '.cell[data-index="5"]', '.cell[data-index="8"]'], compare: [{ index: 5, side: 'left' }, { index: 4, side: 'right' }, { index: 5, side: 'bottom' }, { index: 8, side: 'top' }] },
  { kind: 'drag', text: 'Ещё можно захватить сразу 2 карты соперника. Перетащите карту сюда.', cardName: 'Цунами', targetIndex: 2, tooltipAbove: true, compare: [{ hand: 'Цунами', side: 'bottom' }, { index: 5, side: 'top' }, { index: 5, side: 'bottom' }, { index: 8, side: 'top' }] },
  { kind: 'info', text: 'Это прострел. Он работает только по 1 линии: вертикальной или горизонтальной.', targets: ['.cell[data-index="2"]', '.cell[data-index="5"]', '.cell[data-index="8"]'], compare: [{ index: 2, side: 'bottom' }, { index: 5, side: 'top' }, { index: 5, side: 'bottom' }, { index: 8, side: 'top' }] },
  { kind: 'auto-opp-move', cardName: 'Подсолнух', index: 3 },
  { kind: 'final', text: 'Теперь вы знаете основы! Доиграйте матч до конца чтобы получить вашу первую награду.' },
];

async function runStep(i) {
  currentStep = i;
  if (i >= STEPS.length) return;
  const step = STEPS[i];
  clearNumberHighlights();

  if (step.kind === 'info') {
    stopDragHint();
    onbBlockerEl.classList.add('active');
    let targetEl = null;
    if (step.targets) {
      targetEl = step.targets.map((sel) => document.querySelector(sel)).filter(Boolean);
      if (step.targetHand) {
        const handCardEl = handCardElByName(step.targetHand);
        if (handCardEl) targetEl.push(handCardEl);
      }
    } else if (step.target) {
      targetEl = document.querySelector(step.target);
    }
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
    const anchorEls = [
      cellEl,
      ...(step.avoidIndexes || []).map((idx) => boardEl.querySelector(`.cell[data-index="${idx}"]`)),
    ].filter(Boolean);
    showTooltip(step, i + 1, anchorEls.length > 1 ? anchorEls : cellEl);
    applyNumberHighlights(step.compare);
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
  drawCardForOwner('opp');
  renderDecks();
  const stopThinking = startOppThinkingStatus();
  await wait(1400);
  stopThinking();
  await flyFromDeckToCell('opp', index);
  const captured = commitPlacement(card, index, 'opp', { faceDown: true });
  await wait(450);
  const cardEl = boardEl.querySelector(`.cell[data-index="${index}"] .card`);
  await flipCardToFront(cardEl, card);
  await resolveCaptures(index, card, captured, 'opp');
  await wait(captured.length ? 300 : POST_MOVE_DELAY);
  await refillYourHandWithFlight();
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
  const yourNames = ['Кувшинка', 'Ромашка', 'Цунами'];
  const yourDeckNames = ['Гроза', 'Молния', 'Тайфун', 'Туман', 'Солнце'];
  const oppNames = ['Лейка', 'Шип', 'Подсолнух'];
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
