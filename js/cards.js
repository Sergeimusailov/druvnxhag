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
  { name: 'Ветер', top: 3, left: 6, right: 4, bottom: 5 },
  { name: 'Дождь', top: 2, left: 3, right: 5, bottom: 1 },
  { name: 'Роса', top: 1, left: 2, right: 3, bottom: 2 },
  { name: 'Снег', top: 4, left: 5, right: 3, bottom: 6 },
  { name: 'Иней', top: 5, left: 3, right: 6, bottom: 2 },
  { name: 'Пепел', top: 6, left: 4, right: 2, bottom: 5 },
  { name: 'Дым', top: 2, left: 4, right: 1, bottom: 3 },
  { name: 'Пламя', top: 7, left: 3, right: 6, bottom: 4 },
  { name: 'Искра', top: 4, left: 6, right: 3, bottom: 5 },
  { name: 'Гром', top: 8, left: 4, right: 5, bottom: 3 },
  { name: 'Радуга', top: 5, left: 5, right: 6, bottom: 4 },
  { name: 'Закат', top: 6, left: 3, right: 5, bottom: 4 },
  { name: 'Рассвет', top: 4, left: 5, right: 4, bottom: 5 },
  { name: 'Прилив', top: 5, left: 6, right: 4, bottom: 7 },
  { name: 'Отлив', top: 3, left: 4, right: 3, bottom: 4 },
  { name: 'Бриз', top: 2, left: 3, right: 4, bottom: 3 },
  { name: 'Шторм', top: 6, left: 6, right: 5, bottom: 7 },
  { name: 'Вихрь', top: 5, left: 7, right: 4, bottom: 6 },
  { name: 'Пыльца', top: 1, left: 3, right: 2, bottom: 4 },
  { name: 'Стебель', top: 3, left: 2, right: 4, bottom: 3 },
  { name: 'Корень', top: 4, left: 3, right: 5, bottom: 2 },
  { name: 'Побег', top: 2, left: 4, right: 3, bottom: 5 },
  { name: 'Цветок', top: 4, left: 5, right: 4, bottom: 3 },
  { name: 'Пыльник', top: 3, left: 4, right: 2, bottom: 5 },
  { name: 'Нектар', top: 5, left: 4, right: 6, bottom: 3 },
  { name: 'Соцветие', top: 6, left: 5, right: 7, bottom: 4 },
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

const DECK_SIZE = 8;
const DECK_STORAGE_KEY = 'arena-cards-deck-v1';

function getSavedDeckNames() {
  try {
    const raw = localStorage.getItem(DECK_STORAGE_KEY);
    if (!raw) return [];
    const names = JSON.parse(raw);
    return Array.isArray(names) ? names : [];
  } catch (e) {
    return [];
  }
}

function saveDeckNames(names) {
  localStorage.setItem(DECK_STORAGE_KEY, JSON.stringify(names));
}

function getSavedDeckCards() {
  const names = getSavedDeckNames();
  return names
    .map((name) => CARD_ROSTER.find((c) => c.name === name))
    .filter(Boolean);
}

function drawSavedPlayerSet() {
  const saved = getSavedDeckCards();
  if (saved.length === DECK_SIZE) return shuffle(saved);
  return drawPlayerSet();
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
