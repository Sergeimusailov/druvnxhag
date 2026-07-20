// 72-card roster. Fields: name, rarity, arch, top, left, right, bottom
// arch: uni | ram | cor | lin | bait   (cor orientation encoded by which two sides are high)
// Budget bands: common 9-15, rare 16-21, epic 22-27

const CARDS = [
  // ===== COMMONS (44), budget 9-15 =====
  // Универсал (10) — ровные
  { name: 'Роса',      rarity: 'common', arch: 'uni', top: 3, left: 3, right: 3, bottom: 3 },
  { name: 'Пыльца',    rarity: 'common', arch: 'uni', top: 3, left: 3, right: 3, bottom: 2 },
  { name: 'Клевер',    rarity: 'common', arch: 'uni', top: 3, left: 2, right: 3, bottom: 3 },
  { name: 'Мох',       rarity: 'common', arch: 'uni', top: 4, left: 3, right: 3, bottom: 3 },
  { name: 'Лист',      rarity: 'common', arch: 'uni', top: 3, left: 4, right: 3, bottom: 3 },
  { name: 'Бутон',     rarity: 'common', arch: 'uni', top: 3, left: 3, right: 4, bottom: 4 },
  { name: 'Побег',     rarity: 'common', arch: 'uni', top: 4, left: 4, right: 3, bottom: 3 },
  { name: 'Стебель',   rarity: 'common', arch: 'uni', top: 4, left: 3, right: 4, bottom: 3 },
  { name: 'Дым',       rarity: 'common', arch: 'uni', top: 3, left: 4, right: 2, bottom: 3 },
  { name: 'Пена',      rarity: 'common', arch: 'uni', top: 3, left: 2, right: 3, bottom: 3 },
  // Таран (8) — одна доминанта
  { name: 'Искра',     rarity: 'common', arch: 'ram', top: 7, left: 2, right: 2, bottom: 1 },
  { name: 'Луч',       rarity: 'common', arch: 'ram', top: 2, left: 1, right: 7, bottom: 2 },
  { name: 'Шип',       rarity: 'common', arch: 'ram', top: 2, left: 7, right: 1, bottom: 2 },
  { name: 'Уголь',     rarity: 'common', arch: 'ram', top: 1, left: 2, right: 2, bottom: 7 },
  { name: 'Факел',     rarity: 'common', arch: 'ram', top: 8, left: 2, right: 1, bottom: 2 },
  { name: 'Град',      rarity: 'common', arch: 'ram', top: 2, left: 2, right: 8, bottom: 1 },
  { name: 'Клык',      rarity: 'common', arch: 'ram', top: 1, left: 8, right: 2, bottom: 2 },
  { name: 'Жало',      rarity: 'common', arch: 'ram', top: 2, left: 1, right: 2, bottom: 8 },
  // Угловой (12) — 3 на каждый угол (высокие = стороны в поле)
  // TL: high right+bottom
  { name: 'Ракушка',   rarity: 'common', arch: 'cor', top: 2, left: 1, right: 5, bottom: 4 },
  { name: 'Риф',       rarity: 'common', arch: 'cor', top: 1, left: 2, right: 5, bottom: 5 },
  { name: 'Краб',      rarity: 'common', arch: 'cor', top: 2, left: 2, right: 6, bottom: 4 },
  // TR: high left+bottom
  { name: 'Коралл',    rarity: 'common', arch: 'cor', top: 2, left: 5, right: 1, bottom: 4 },
  { name: 'Якорь',     rarity: 'common', arch: 'cor', top: 1, left: 5, right: 2, bottom: 5 },
  { name: 'Ил',        rarity: 'common', arch: 'cor', top: 2, left: 6, right: 2, bottom: 4 },
  // BL: high top+right
  { name: 'Лоза',      rarity: 'common', arch: 'cor', top: 5, left: 1, right: 4, bottom: 2 },
  { name: 'Кактус',    rarity: 'common', arch: 'cor', top: 5, left: 2, right: 5, bottom: 1 },
  { name: 'Колючка',   rarity: 'common', arch: 'cor', top: 6, left: 2, right: 4, bottom: 2 },
  // BR: high top+left
  { name: 'Плющ',      rarity: 'common', arch: 'cor', top: 4, left: 5, right: 1, bottom: 2 },
  { name: 'Гранит',    rarity: 'common', arch: 'cor', top: 5, left: 5, right: 2, bottom: 1 },
  { name: 'Кремень',   rarity: 'common', arch: 'cor', top: 4, left: 6, right: 2, bottom: 2 },
  // Линия (8) — две противоположные высокие
  // горизонт (лево+право)
  { name: 'Ветер',     rarity: 'common', arch: 'lin', top: 2, left: 5, right: 4, bottom: 1 },
  { name: 'Течение',   rarity: 'common', arch: 'lin', top: 1, left: 5, right: 5, bottom: 2 },
  { name: 'Мостик',    rarity: 'common', arch: 'lin', top: 2, left: 6, right: 4, bottom: 2 },
  { name: 'Радуга',    rarity: 'common', arch: 'lin', top: 3, left: 5, right: 5, bottom: 1 },
  // вертикаль (верх+низ)
  { name: 'Дождь',     rarity: 'common', arch: 'lin', top: 5, left: 2, right: 1, bottom: 4 },
  { name: 'Струя',     rarity: 'common', arch: 'lin', top: 5, left: 1, right: 2, bottom: 5 },
  { name: 'Сосулька',  rarity: 'common', arch: 'lin', top: 6, left: 2, right: 2, bottom: 4 },
  { name: 'Водопад',   rarity: 'common', arch: 'lin', top: 4, left: 1, right: 2, bottom: 6 },
  // Приманка-0 (6)
  { name: 'Мираж',     rarity: 'common', arch: 'bait', top: 6, left: 4, right: 2, bottom: 0 },
  { name: 'Тень',      rarity: 'common', arch: 'bait', top: 5, left: 5, right: 2, bottom: 0 },
  { name: 'Эхо',       rarity: 'common', arch: 'bait', top: 6, left: 3, right: 3, bottom: 0 },
  { name: 'Морок',     rarity: 'common', arch: 'bait', top: 4, left: 6, right: 3, bottom: 0 },
  { name: 'Обман',     rarity: 'common', arch: 'bait', top: 7, left: 4, right: 2, bottom: 0 },
  { name: 'Пузырь',    rarity: 'common', arch: 'bait', top: 5, left: 4, right: 4, bottom: 0 },

  // ===== RARES (20), budget 16-21 =====
  // Универсал (5)
  { name: 'Кувшинка',  rarity: 'rare', arch: 'uni', top: 5, left: 5, right: 5, bottom: 5 },
  { name: 'Заводь',    rarity: 'rare', arch: 'uni', top: 4, left: 4, right: 5, bottom: 4 },
  { name: 'Поляна',    rarity: 'rare', arch: 'uni', top: 4, left: 5, right: 4, bottom: 5 },
  { name: 'Роща',      rarity: 'rare', arch: 'uni', top: 5, left: 4, right: 5, bottom: 5 },
  { name: 'Дюна',      rarity: 'rare', arch: 'uni', top: 5, left: 5, right: 4, bottom: 4 },
  // Таран (4)
  { name: 'Молния',    rarity: 'rare', arch: 'ram', top: 9, left: 4, right: 4, bottom: 3 },
  { name: 'Пик',       rarity: 'rare', arch: 'ram', top: 3, left: 9, right: 4, bottom: 4 },
  { name: 'Копьё',     rarity: 'rare', arch: 'ram', top: 4, left: 3, right: 9, bottom: 4 },
  { name: 'Обрыв',     rarity: 'rare', arch: 'ram', top: 4, left: 4, right: 3, bottom: 9 },
  // Угловой (4) — по одному на угол
  { name: 'Прибой',    rarity: 'rare', arch: 'cor', top: 3, left: 3, right: 7, bottom: 7 }, // TL
  { name: 'Волна',     rarity: 'rare', arch: 'cor', top: 3, left: 7, right: 3, bottom: 7 }, // TR
  { name: 'Утёс',      rarity: 'rare', arch: 'cor', top: 7, left: 3, right: 7, bottom: 3 }, // BL
  { name: 'Скала',     rarity: 'rare', arch: 'cor', top: 7, left: 7, right: 3, bottom: 3 }, // BR
  // Линия (4)
  { name: 'Пролив',    rarity: 'rare', arch: 'lin', top: 3, left: 7, right: 7, bottom: 3 },
  { name: 'Русло',     rarity: 'rare', arch: 'lin', top: 2, left: 8, right: 7, bottom: 3 },
  { name: 'Гейзер',    rarity: 'rare', arch: 'lin', top: 7, left: 3, right: 2, bottom: 8 },
  { name: 'Ливень',    rarity: 'rare', arch: 'lin', top: 8, left: 3, right: 3, bottom: 6 },
  // Приманка-0 (3)
  { name: 'Бездна',    rarity: 'rare', arch: 'bait', top: 7, left: 6, right: 4, bottom: 0 },
  { name: 'Воронка',   rarity: 'rare', arch: 'bait', top: 8, left: 5, right: 4, bottom: 0 },
  { name: 'Пропасть',  rarity: 'rare', arch: 'bait', top: 6, left: 7, right: 5, bottom: 0 },

  // ===== EPICS (8), budget 20-24 — экстремальная форма: большой пик + яма <=2 =====
  { name: 'Ледник',    rarity: 'epic', arch: 'uni',  top: 7, left: 7, right: 2, bottom: 7 }, // soft right
  { name: 'Твердыня',  rarity: 'epic', arch: 'uni',  top: 7, left: 2, right: 7, bottom: 7 }, // soft left
  { name: 'Вулкан',    rarity: 'epic', arch: 'ram',  top: 9, left: 6, right: 5, bottom: 1 }, // valley bottom
  { name: 'Лавина',    rarity: 'epic', arch: 'ram',  top: 1, left: 5, right: 6, bottom: 9 }, // valley top
  { name: 'Айсберг',   rarity: 'epic', arch: 'cor',  top: 8, left: 9, right: 2, bottom: 1 }, // BR
  { name: 'Цунами',    rarity: 'epic', arch: 'cor',  top: 1, left: 2, right: 9, bottom: 8 }, // TL
  { name: 'Шторм',     rarity: 'epic', arch: 'lin',  top: 3, left: 9, right: 9, bottom: 2 },
  { name: 'Затмение',  rarity: 'epic', arch: 'bait', top: 9, left: 8, right: 6, bottom: 0 },
];

module.exports = { CARDS };
