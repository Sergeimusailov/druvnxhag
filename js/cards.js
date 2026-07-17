const CARD_ROSTER = [
  { name: 'Росток', top: 2, left: 1, right: 4, bottom: 3, pic: 'assets/card-pic__06.png' },
  { name: 'Лейка', top: 1, left: 0, right: 3, bottom: 2, pic: 'assets/card-pic__04.png' },
  { name: 'Ромашка', top: 4, left: 2, right: 5, bottom: 3, pic: 'assets/card-pic__05.png' },
  { name: 'Кувшинка', top: 3, left: 5, right: 2, bottom: 4 },
  { name: 'Подсолнух', top: 5, left: 3, right: 6, bottom: 4, pic: 'assets/card-pic__01.png' },
  { name: 'Шип', top: 6, left: 7, right: 2, bottom: 3 },
  { name: 'Гроза', top: 6, left: 7, right: 4, bottom: 5, pic: 'assets/card-pic__07.png' },
  { name: 'Молния', top: 8, left: 3, right: 6, bottom: 4 },
  { name: 'Тайфун', top: 5, left: 6, right: 7, bottom: 4 },
  { name: 'Туман', top: 3, left: 4, right: 3, bottom: 4 },
  { name: 'Солнце', top: 6, left: 4, right: 7, bottom: 5, pic: 'assets/card-pic__03.png' },
  { name: 'Луч', top: 4, left: 6, right: 3, bottom: 5 },
  { name: 'Ракушка', top: 3, left: 5, right: 4, bottom: 2, pic: 'assets/card-pic__02.png' },
  { name: 'Жемчужина', top: 7, left: 4, right: 6, bottom: 5 },
  { name: 'Медуза', top: 5, left: 2, right: 6, bottom: 3, pic: 'assets/card-pic__09.png' },
  { name: 'Спираль', top: 4, left: 8, right: 3, bottom: 6, pic: 'assets/card-pic__08.png' },
  { name: 'Коралл', top: 5, left: 5, right: 5, bottom: 5 },
  { name: 'Кристалл', top: 8, left: 2, right: 7, bottom: 3 },
  { name: 'Айсберг', top: 6, left: 6, right: 2, bottom: 5 },
  { name: 'Вулкан', top: 9, left: 3, right: 8, bottom: 2 },
  { name: 'Ледник', top: 3, left: 9, right: 2, bottom: 7 },
  { name: 'Цунами', top: 4, left: 7, right: 5, bottom: 8 },
];

const CARD_PIC_POOL = [
  'assets/card-pic__01.png',
  'assets/card-pic__02.png',
  'assets/card-pic__03.png',
  'assets/card-pic__04.png',
  'assets/card-pic__05.png',
  'assets/card-pic__06.png',
  'assets/card-pic__07.png',
  'assets/card-pic__08.png',
  'assets/card-pic__09.png',
];

CARD_ROSTER.forEach((card) => {
  if (!card.pic) {
    card.pic = CARD_PIC_POOL[Math.floor(Math.random() * CARD_PIC_POOL.length)];
  }
});

function shuffle(input) {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function drawPlayerSet() {
  return shuffle(CARD_ROSTER).slice(0, 8);
}
