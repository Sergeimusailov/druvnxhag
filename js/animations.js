const FLIGHT_DURATION = 900;
const CAPTURE_HL_MS = 900;
const CAPTURE_SWEEP_MS = 900;
const NO_HIGHLIGHT_PAUSE_MS = 500; // keeps pacing even when the highlight step is skipped

// Attacker lands on the left and always beats the defender's left side —
// guaranteed capture, direction is always "right" (attacker -> defender).
const ATTACKER = { name: 'Ракушка', top: 5, left: 1, right: 7, bottom: 3, pic: 'assets/card-pic__02.png' };
const DEFENDER = { name: 'Спираль', top: 4, left: 3, right: 6, bottom: 2, pic: 'assets/card-pic__08.png' };

const cellAEl = document.getElementById('animCellA');
const cellBEl = document.getElementById('animCellB');
const deckBadgeEl = document.getElementById('animDeckBadge');
const repeatBtnEl = document.getElementById('animRepeatBtn');
const toggleGroupEl = document.getElementById('animToggleGroup');
const toggleBtnEls = Array.from(document.querySelectorAll('.anim-toggle'));

let currentMode = 'sweep'; // 'no-sweep' | 'sweep' | 'no-highlight'
let running = false;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

    // animate real layout size, not transform: scale — scaling would stretch
    // the tiled card-back pattern along with the element
    anime.animate(ghost, {
      left: `${toRect.left}px`,
      top: `${toRect.top}px`,
      width: `${toRect.width}px`,
      height: `${toRect.height}px`,
      duration: FLIGHT_DURATION,
      ease: 'cubicBezier(.32,.72,.35,1)',
      onComplete: () => {
        ghost.remove();
        resolve();
      },
    });
  });
}

function highlightPair() {
  const els = [
    cellAEl.querySelector('.card .num-right'),
    cellBEl.querySelector('.card .num-left'),
  ].filter(Boolean);
  els.forEach((el) => el.classList.add('num-capture-hl'));
  return els;
}

function clearHighlight(els) {
  els.forEach((el) => el.classList.remove('num-capture-hl'));
}

// directional clip-path wipe of a same-card overlay in the new owner colour,
// so the colour "floods" the defending card from the attacking edge
function sweepRecolor() {
  return new Promise((resolve) => {
    const cardEl = cellBEl.querySelector('.card');
    const overlay = document.createElement('div');
    overlay.className = 'card owner-you capture-sweep';
    overlay.innerHTML = cardInnerHTML(DEFENDER);
    cardEl.appendChild(overlay);
    const clipAt = (p) => `inset(0 ${p}% 0 0)`;
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
        cardEl.className = 'card owner-you';
        overlay.remove();
        resolve();
      },
    });
  });
}

function instantRecolor() {
  const cardEl = cellBEl.querySelector('.card');
  cardEl.classList.remove('owner-opp');
  cardEl.classList.add('owner-you');
}

function resetStage() {
  cellAEl.innerHTML = '';
  cellAEl.dataset.filled = 'false';
  cellBEl.innerHTML = '';
  cellBEl.dataset.filled = 'true';
  const defenderEl = document.createElement('div');
  defenderEl.className = 'card owner-opp';
  defenderEl.innerHTML = cardInnerHTML(DEFENDER);
  cellBEl.appendChild(defenderEl);
}

function setControlsDisabled(disabled) {
  repeatBtnEl.disabled = disabled;
  toggleGroupEl.classList.toggle('disabled', disabled);
}

async function runDemo() {
  if (running) return;
  running = true;
  setControlsDisabled(true);
  resetStage();

  await flyGhost(deckBadgeEl.getBoundingClientRect(), cellAEl.getBoundingClientRect(), '', true);

  const attackerEl = document.createElement('div');
  attackerEl.className = 'card owner-you face-back';
  cellAEl.appendChild(attackerEl);
  cellAEl.dataset.filled = 'true';
  playLandAnimation(attackerEl);
  await wait(450);
  await flipCardToFront(attackerEl, ATTACKER);

  if (currentMode === 'no-highlight') {
    await wait(NO_HIGHLIGHT_PAUSE_MS);
  } else {
    const hlEls = highlightPair();
    await wait(CAPTURE_HL_MS);
    clearHighlight(hlEls);
  }

  if (currentMode === 'no-sweep') {
    instantRecolor();
  } else {
    await sweepRecolor();
  }
  spawnParticles(cellBEl, 'you');

  running = false;
  setControlsDisabled(false);
}

function setMode(mode) {
  currentMode = mode;
  toggleBtnEls.forEach((btn) => btn.classList.toggle('active', btn.dataset.mode === mode));
}

toggleBtnEls.forEach((btn) => {
  btn.addEventListener('click', () => {
    setMode(btn.dataset.mode);
    runDemo();
  });
});

repeatBtnEl.addEventListener('click', () => runDemo());

setMode(currentMode);
runDemo();
