const { CARDS } = require('./roster.js');

// ---------- core game logic (mirrors match.js) ----------
function neighborsOf(index) {
  const row = Math.floor(index / 3), col = index % 3;
  const r = {};
  if (row > 0) r.up = index - 3;
  if (row < 2) r.down = index + 3;
  if (col > 0) r.left = index - 1;
  if (col < 2) r.right = index + 1;
  return r;
}
function capturesFor(board, index, card, owner) {
  const n = neighborsOf(index), cap = [];
  if (n.up !== undefined && board[n.up] && board[n.up].owner !== owner && card.top > board[n.up].card.bottom) cap.push(n.up);
  if (n.down !== undefined && board[n.down] && board[n.down].owner !== owner && card.bottom > board[n.down].card.top) cap.push(n.down);
  if (n.left !== undefined && board[n.left] && board[n.left].owner !== owner && card.left > board[n.left].card.right) cap.push(n.left);
  if (n.right !== undefined && board[n.right] && board[n.right].owner !== owner && card.right > board[n.right].card.left) cap.push(n.right);
  return cap;
}
// how flippable this card is once placed at index (lower = safer): sum over sides
// facing an EMPTY neighbor of how easily an avg enemy (~6) beats that side
function vulnerability(board, index, card) {
  const n = neighborsOf(index);
  let v = 0;
  const sides = [['up', card.top], ['down', card.bottom], ['left', card.left], ['right', card.right]];
  for (const [dir, val] of sides) {
    if (n[dir] !== undefined && !board[n[dir]]) v += Math.max(0, 6 - val);
  }
  return v;
}

function shuffle(a) {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// greedy AI with safety tiebreak
function chooseMove(board, hand, owner) {
  let best = null;
  for (const card of hand) {
    for (let i = 0; i < 9; i++) {
      if (board[i]) continue;
      const gain = capturesFor(board, i, card, owner).length;
      const vul = vulnerability(board, i, card);
      const key = [gain, -vul, -i];
      if (!best || cmp(key, best.key) > 0) best = { card, index: i, key };
    }
  }
  return best;
}
function cmp(a, b) {
  for (let i = 0; i < a.length; i++) { if (a[i] !== b[i]) return a[i] - b[i]; }
  return 0;
}

// play one game; deckA/deckB are arrays of card objects (>=5 used). returns +1 A win, -1 B win, 0 draw
function playGame(deckA, deckB, aFirst) {
  const board = new Array(9).fill(null);
  const state = {
    you: { hand: [], draw: [] },
    opp: { hand: [], draw: [] },
  };
  const da = shuffle(deckA), db = shuffle(deckB);
  state.you.hand = da.slice(0, 3); state.you.draw = da.slice(3);
  state.opp.hand = db.slice(0, 3); state.opp.draw = db.slice(3);

  let turn = aFirst ? 'you' : 'opp';
  let placed = 0;
  while (placed < 9) {
    const me = state[turn];
    const move = chooseMove(board, me.hand, turn);
    if (!move) break;
    const cap = capturesFor(board, move.index, move.card, turn);
    board[move.index] = { card: move.card, owner: turn };
    cap.forEach((i) => { board[i].owner = turn; });
    me.hand = me.hand.filter((c) => c !== move.card);
    if (me.draw.length) me.hand.push(me.draw.shift());
    placed++;
    turn = turn === 'you' ? 'opp' : 'you';
  }
  let a = 0, b = 0;
  for (const cell of board) { if (cell) (cell.owner === 'you' ? a++ : b++); }
  return a > b ? 1 : a < b ? -1 : 0;
}

function matchup(deckA, deckB, n) {
  let w = 0, l = 0, d = 0;
  for (let i = 0; i < n; i++) {
    const r = playGame(deckA, deckB, i % 2 === 0);
    if (r > 0) w++; else if (r < 0) l++; else d++;
  }
  return { w, l, d, wr: (w + d * 0.5) / n };
}

// ---------- deck builders ----------
const byArch = (a) => CARDS.filter((c) => c.arch === a);
const rarityRank = { epic: 3, rare: 2, common: 1 };
function archDeck(a) {
  // strongest realistic build: epics+rares first, fill with commons, 8 unique
  const pool = byArch(a).slice().sort((x, y) => rarityRank[y.rarity] - rarityRank[x.rarity]);
  return pool.slice(0, 8);
}
const epicDeck = CARDS.filter((c) => c.rarity === 'epic'); // exactly 8
function randomDeck() { return shuffle(CARDS).slice(0, 8); }

// ---------- 1) archetype round-robin ----------
const archs = ['uni', 'ram', 'cor', 'lin', 'bait'];
const labels = { uni: 'Универсал', ram: 'Таран', cor: 'Угловой', lin: 'Линия', bait: 'Приманка', epic: 'Эпики' };
const decks = {};
archs.forEach((a) => { decks[a] = archDeck(a); });
decks.epic = epicDeck;
const deckKeys = [...archs, 'epic'];

const N = 3000;
console.log('=== 1) Круговой турнир архетипов (винрейт строки против столбца, %) ===');
const totals = {};
deckKeys.forEach((k) => (totals[k] = { w: 0, g: 0 }));
let header = 'колода'.padEnd(11);
deckKeys.forEach((k) => (header += labels[k].slice(0, 8).padStart(10)));
header += '   ИТОГО';
console.log(header);
for (const rk of deckKeys) {
  let line = labels[rk].padEnd(11);
  let sum = 0, cnt = 0;
  for (const ck of deckKeys) {
    if (rk === ck) { line += '     —    '; continue; }
    const m = matchup(decks[rk], decks[ck], N);
    line += (m.wr * 100).toFixed(0).padStart(9) + '%';
    totals[rk].w += m.w + m.d * 0.5; totals[rk].g += N;
    sum += m.wr; cnt++;
  }
  line += ('   ' + (totals[rk].w / totals[rk].g * 100).toFixed(1) + '%').padStart(9);
  console.log(line);
}

// ---------- 2) all-epic vs random field ----------
console.log('\n=== 2) Колода из 8 эпиков против случайного поля ===');
let ew = 0, eg = 0;
for (let f = 0; f < 400; f++) {
  const field = randomDeck();
  const m = matchup(epicDeck, field, 200);
  ew += m.w + m.d * 0.5; eg += 200;
}
console.log('Винрейт всеэпичной колоды против случайных колод: ' + (ew / eg * 100).toFixed(1) + '%');

// ---------- 3) per-card win correlation ----------
console.log('\n=== 3) Влияние отдельных карт (винрейт колод, где карта есть) ===');
const stat = {};
CARDS.forEach((c) => (stat[c.name] = { w: 0, g: 0, rarity: c.rarity, arch: c.arch }));
const GAMES = 40000;
for (let i = 0; i < GAMES; i++) {
  const A = randomDeck(), B = randomDeck();
  const r = playGame(A, B, i % 2 === 0);
  const aScore = r > 0 ? 1 : r < 0 ? 0 : 0.5;
  for (const c of A) { stat[c.name].w += aScore; stat[c.name].g++; }
  for (const c of B) { stat[c.name].w += 1 - aScore; stat[c.name].g++; }
}
const rows = CARDS.map((c) => ({ name: c.name, rarity: c.rarity, arch: c.arch, wr: stat[c.name].w / stat[c.name].g, g: stat[c.name].g }));
rows.sort((a, b) => b.wr - a.wr);
const fmt = (r) => `${r.name.padEnd(11)} ${labels[r.arch].slice(0,8).padEnd(9)} ${r.rarity.padEnd(7)} ${(r.wr*100).toFixed(1)}%  (n=${r.g})`;
console.log('-- ТОП-10 сильнейших по влиянию --');
rows.slice(0, 10).forEach((r) => console.log('  ' + fmt(r)));
console.log('-- ТОП-10 слабейших по влиянию --');
rows.slice(-10).reverse().forEach((r) => console.log('  ' + fmt(r)));

// avg winrate spread by rarity
console.log('\n-- Средний винрейт по редкости (должен расти, но плавно) --');
['common', 'rare', 'epic'].forEach((rar) => {
  const rs = rows.filter((r) => r.rarity === rar);
  const avg = rs.reduce((s, r) => s + r.wr, 0) / rs.length;
  console.log(`  ${rar.padEnd(7)}: ${(avg * 100).toFixed(1)}%  (${rs.length} карт)`);
});
console.log('\n-- Средний винрейт по архетипу --');
archs.forEach((a) => {
  const rs = rows.filter((r) => r.arch === a);
  const avg = rs.reduce((s, r) => s + r.wr, 0) / rs.length;
  console.log(`  ${labels[a].padEnd(10)}: ${(avg * 100).toFixed(1)}%`);
});
