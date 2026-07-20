const { CARDS } = require('./roster.js');

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
function vulnerability(board, index, card) {
  const n = neighborsOf(index);
  let v = 0;
  const sides = [['up', card.top], ['down', card.bottom], ['left', card.left], ['right', card.right]];
  for (const [dir, val] of sides) if (n[dir] !== undefined && !board[n[dir]]) v += Math.max(0, 6 - val);
  return v;
}
function shuffle(a) {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function cmp(a, b) { for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] - b[i]; return 0; }
function chooseMove(board, hand, owner) {
  let best = null;
  for (const card of hand) for (let i = 0; i < 9; i++) {
    if (board[i]) continue;
    const gain = capturesFor(board, i, card, owner).length;
    const vul = vulnerability(board, i, card);
    const key = [gain, -vul, -i];
    if (!best || cmp(key, best.key) > 0) best = { card, index: i, key };
  }
  return best;
}
function place(board, index, card, owner) {
  const cap = capturesFor(board, index, card, owner);
  board[index] = { card, owner };
  cap.forEach((i) => (board[i].owner = owner));
}

const CELLTYPE = ['corner','edge','corner','edge','center','edge','corner','edge','corner'];

// ---------- Analysis A: observational win-rate by card & cell type ----------
function randomDeck() { return shuffle(CARDS).slice(0, 8); }

const stat = {}; // name -> {corner:{w,g},edge,center}
CARDS.forEach((c) => (stat[c.name] = { corner: { w: 0, g: 0 }, edge: { w: 0, g: 0 }, center: { w: 0, g: 0 }, rarity: c.rarity, arch: c.arch }));

function playTracked(deckA, deckB, aFirst) {
  const board = new Array(9).fill(null);
  const you = { hand: [], draw: [] }, opp = { hand: [], draw: [] };
  const da = shuffle(deckA), db = shuffle(deckB);
  you.hand = da.slice(0, 3); you.draw = da.slice(3);
  opp.hand = db.slice(0, 3); opp.draw = db.slice(3);
  const P = { you, opp };
  const placements = []; // {name, cell, owner}
  let turn = aFirst ? 'you' : 'opp', placed = 0;
  while (placed < 9) {
    const me = P[turn];
    const mv = chooseMove(board, me.hand, turn);
    if (!mv) break;
    place(board, mv.index, mv.card, turn);
    me.hand = me.hand.filter((c) => c !== mv.card);
    if (me.draw.length) me.hand.push(me.draw.shift());
    placements.push({ name: mv.card.name, cell: mv.index, owner: turn });
    placed++; turn = turn === 'you' ? 'opp' : 'you';
  }
  let a = 0, b = 0; for (const cell of board) if (cell) (cell.owner === 'you' ? a++ : b++);
  const winner = a > b ? 'you' : a < b ? 'opp' : 'draw';
  for (const p of placements) {
    const win = winner === 'draw' ? 0.5 : winner === p.owner ? 1 : 0;
    const t = CELLTYPE[p.cell];
    stat[p.name][t].w += win; stat[p.name][t].g++;
  }
}

const G = 60000;
for (let i = 0; i < G; i++) playTracked(randomDeck(), randomDeck(), i % 2 === 0);

console.log('=== A) Винрейт карты в зависимости от типа клетки (угол / край / центр) ===');
console.log('(показаны эпики и топ-редкие; g = число размещений)');
const labels = { uni: 'Универс', ram: 'Таран', cor: 'Углов', lin: 'Линия', bait: 'Приманка' };
function pct(o) { return o.g < 200 ? '  —  ' : (o.w / o.g * 100).toFixed(0).padStart(3) + '%'; }
function line(c) {
  const s = stat[c.name];
  return `${c.name.padEnd(11)} ${labels[c.arch].padEnd(9)} ${c.rarity.padEnd(7)}  угол ${pct(s.corner)}  край ${pct(s.edge)}  центр ${pct(s.center)}`;
}
CARDS.filter((c) => c.rarity === 'epic').forEach((c) => console.log('  ' + line(c)));
console.log('  ---- сильнейшие редкие ----');
CARDS.filter((c) => c.rarity === 'rare' && ['cor','ram','bait'].includes(c.arch)).forEach((c) => console.log('  ' + line(c)));

// find any (card, celltype) outlier > 62%
console.log('\n-- Выбросы (карта в типе клетки с винрейтом > 62%, g>=400) --');
let any = false;
for (const c of CARDS) {
  for (const t of ['corner', 'edge', 'center']) {
    const o = stat[c.name][t];
    if (o.g >= 400 && o.w / o.g > 0.62) { console.log(`  ${c.name} (${c.rarity}) в ${t}: ${(o.w/o.g*100).toFixed(1)}%  (g=${o.g})`); any = true; }
  }
}
if (!any) console.log('  нет — ни одна карта не даёт >62% с конкретного типа клетки');

// ---------- Analysis B: forced epic opening into each cell ----------
console.log('\n=== B) Форсированное открытие: 1-й игрок ставит эпик в клетку X, дальше все жадно ===');
function playForcedOpen(openCard, openCell, N) {
  let w = 0;
  for (let k = 0; k < N; k++) {
    const rest = shuffle(CARDS.filter((c) => c.name !== openCard.name)).slice(0, 7);
    const deckA = shuffle([openCard, ...rest]);
    const deckB = randomDeck();
    const board = new Array(9).fill(null);
    const you = { hand: deckA.slice(0, 3), draw: deckA.slice(3) };
    const opp = { hand: deckB.slice(0, 3), draw: deckB.slice(3) };
    // ensure openCard is available to place first (put it in hand)
    if (!you.hand.includes(openCard)) { you.hand[0] = openCard; }
    place(board, openCell, openCard, 'you');
    you.hand = you.hand.filter((c) => c !== openCard);
    if (you.draw.length) you.hand.push(you.draw.shift());
    let turn = 'opp', placed = 1;
    const P = { you, opp };
    while (placed < 9) {
      const me = P[turn];
      const mv = chooseMove(board, me.hand, turn);
      if (!mv) break;
      place(board, mv.index, mv.card, turn);
      me.hand = me.hand.filter((c) => c !== mv.card);
      if (me.draw.length) me.hand.push(me.draw.shift());
      placed++; turn = turn === 'you' ? 'opp' : 'you';
    }
    let a = 0, b = 0; for (const cell of board) if (cell) (cell.owner === 'you' ? a++ : b++);
    w += a > b ? 1 : a < b ? 0 : 0.5;
  }
  return w / N;
}

// baseline: first player opens a RANDOM card into cell X
const baseline = new Array(9).fill(0);
{
  const N = 4000;
  for (let cell = 0; cell < 9; cell++) {
    let w = 0;
    for (let k = 0; k < N; k++) {
      const openCard = CARDS[(Math.random() * CARDS.length) | 0];
      w += playForcedOpen(openCard, cell, 1);
    }
    baseline[cell] = w / N;
  }
}
console.log('Базлайн (случайная карта в открытие) по клеткам, % победы 1-го игрока:');
console.log('  ' + [0,1,2].map(i=>(baseline[i]*100).toFixed(0).padStart(4)).join(' '));
console.log('  ' + [3,4,5].map(i=>(baseline[i]*100).toFixed(0).padStart(4)).join(' '));
console.log('  ' + [6,7,8].map(i=>(baseline[i]*100).toFixed(0).padStart(4)).join(' '));

console.log('\nПо каждому эпику: лучшая клетка открытия и винрейт (и превышение над базлайном):');
const N2 = 2500;
for (const c of CARDS.filter((c) => c.rarity === 'epic')) {
  let best = { cell: 0, wr: 0 };
  const perCell = [];
  for (let cell = 0; cell < 9; cell++) {
    const wr = playForcedOpen(c, cell, N2);
    perCell.push(wr);
    if (wr > best.wr) best = { cell, wr };
  }
  const centerWr = perCell[4];
  console.log(`  ${c.name.padEnd(11)} ${labels[c.arch].padEnd(8)}: лучшая клетка ${best.cell} = ${(best.wr*100).toFixed(1)}%  (базлайн ${(baseline[best.cell]*100).toFixed(0)}%, +${((best.wr-baseline[best.cell])*100).toFixed(1)})   центр=${(centerWr*100).toFixed(0)}%`);
}
