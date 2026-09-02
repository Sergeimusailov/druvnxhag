// Итог матча: демо анимации подсчёта карт + экрана результата.
// Мок-состояние доски фиксировано на исход — здесь не разыгрывается сам матч.

const GLOW_MS = 700;
const AFTER_COUNT_PAUSE_MS = 400;

const OUTCOMES = {
  win: {
    owners: ['you', 'you', 'opp', 'you', 'opp', 'you', 'opp', 'you', 'opp'],
    winner: 'you',
    title: 'Победа!',
    subtitle: 'Вы захватили больше карт на поле',
    reward: 170,
    cards: true,
  },
  loss: {
    owners: ['opp', 'opp', 'you', 'opp', 'you', 'opp', 'you', 'opp', 'you'],
    winner: 'opp',
    title: 'Поражение',
    subtitle: 'Соперник оказался сильнее в этот раз',
    reward: 30,
    cards: false,
  },
};

const OWNER_COLOR = { you: '#2265d3', opp: '#e32d2d' };

const boardEl = document.getElementById('mrBoard');
const scoreYouEl = document.getElementById('mrScoreYou');
const scoreOppEl = document.getElementById('mrScoreOpp');
const scoreBarEl = document.getElementById('mrScoreBar');
const statusEl = document.getElementById('mrStatus');
const outcomeGroupEl = document.getElementById('mrOutcomeGroup');
const outcomeBtnEls = Array.from(outcomeGroupEl.querySelectorAll('.mr-sqbtn'));
const resultOverlayEl = document.getElementById('mrResultOverlay');
const resultTitleEl = document.getElementById('mrResultTitle');
const resultSubtitleEl = document.getElementById('mrResultSubtitle');
const cardsRowEl = document.getElementById('mrCardsRow');
const rewardValueEl = document.getElementById('mrRewardValue');
const claimBtnEl = document.getElementById('mrClaimBtn');

let currentOutcome = 'win';
let running = false;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function setControlsDisabled(disabled) {
  outcomeGroupEl.classList.toggle('disabled', disabled);
}

function renderBoard(owners) {
  boardEl.innerHTML = '';
  owners.forEach((owner, index) => {
    const cellEl = document.createElement('div');
    cellEl.className = 'cell';
    cellEl.dataset.index = index;
    if (owner) {
      const card = CARD_ROSTER[index];
      const cardEl = document.createElement('div');
      cardEl.className = `card owner-${owner}`;
      cardEl.innerHTML = cardInnerHTML(card);
      cellEl.appendChild(cardEl);
    }
    boardEl.appendChild(cellEl);
  });
}

function renderScore(owners) {
  const you = owners.filter((o) => o === 'you').length;
  const opp = owners.filter((o) => o === 'opp').length;
  scoreYouEl.textContent = you;
  scoreOppEl.textContent = opp;
  scoreBarEl.innerHTML = '';
  for (let i = 0; i < 9; i++) {
    const seg = document.createElement('div');
    seg.className = 'score-seg';
    if (i < you) seg.classList.add('filled-you');
    else if (i >= 9 - opp) seg.classList.add('filled-opp');
    scoreBarEl.appendChild(seg);
  }
}

function resetStage(owners) {
  renderBoard(owners);
  renderScore(owners);
  statusEl.textContent = 'Подсчёт карт';
  resultOverlayEl.classList.remove('visible', 'outcome-win', 'outcome-loss');
}

function cellsOf(owner, owners) {
  return owners
    .map((o, index) => (o === owner ? index : null))
    .filter((index) => index !== null);
}

function dimLoser(loserIndexes) {
  loserIndexes.forEach((index) => {
    const cardEl = boardEl.querySelector(`.cell[data-index="${index}"] .card`);
    if (cardEl) cardEl.classList.add('mr-dim');
  });
}

function glowCard(index, owner) {
  const cardEl = boardEl.querySelector(`.cell[data-index="${index}"] .card`);
  if (!cardEl) return;
  cardEl.style.setProperty('--mr-glow-color', OWNER_COLOR[owner]);
  cardEl.classList.add('mr-glow');
}

async function playCounting(outcome) {
  const owners = outcome.owners;
  const loserOwner = outcome.winner === 'you' ? 'opp' : 'you';
  dimLoser(cellsOf(loserOwner, owners));
  cellsOf(outcome.winner, owners).forEach((index) => glowCard(index, outcome.winner));
  await wait(GLOW_MS);
  await wait(AFTER_COUNT_PAUSE_MS);
}

function showResult(outcome) {
  statusEl.textContent = 'Матч завершён';
  resultOverlayEl.classList.add('visible', `outcome-${currentOutcome}`);
  resultTitleEl.textContent = outcome.title;
  resultSubtitleEl.textContent = outcome.subtitle;
  rewardValueEl.textContent = outcome.reward;
  cardsRowEl.innerHTML = '';
  if (outcome.cards) {
    [0, 1].forEach((i) => {
      const cardEl = document.createElement('div');
      cardEl.className = 'card owner-you';
      cardEl.innerHTML = cardInnerHTML(CARD_ROSTER[i]);
      cardsRowEl.appendChild(cardEl);
    });
  }
}

async function runDemo() {
  if (running) return;
  running = true;
  setControlsDisabled(true);
  const outcome = OUTCOMES[currentOutcome];
  resetStage(outcome.owners);
  await wait(200);
  await playCounting(outcome);
  showResult(outcome);
  running = false;
  setControlsDisabled(false);
}

function setOutcome(outcome) {
  currentOutcome = outcome;
  outcomeBtnEls.forEach((btn) => btn.classList.toggle('active', btn.dataset.outcome === outcome));
}

outcomeBtnEls.forEach((btn) => {
  btn.addEventListener('click', () => {
    setOutcome(btn.dataset.outcome);
    runDemo();
  });
});

claimBtnEl.addEventListener('click', () => {
  resultOverlayEl.classList.remove('visible');
  // возврат к полю: все карты видны как обычно, без затемнения/подсветки —
  // дизейбл и анимация подсчёта запускаются заново только по клику на кнопку
  renderBoard(OUTCOMES[currentOutcome].owners);
  statusEl.textContent = 'Матч завершён';
});

setOutcome(currentOutcome);
runDemo();
