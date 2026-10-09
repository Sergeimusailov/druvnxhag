// Версии прототипа v2: переключатель в профиле. Версия хранится в
// localStorage и ставится на <html data-version="…"> до отрисовки страницы,
// чтобы ветки фич можно было разводить и в CSS ([data-version="2.2"] …),
// и в JS (isAppVersion('2.2')).
// пока в работе только 2.3 — остальные ветки скрыты (код сохранён:
// 2.1 — задания со снежинками без превью, 2.2 — задания внутри события)
const APP_VERSIONS = [
  { id: '2.3', title: 'Текущая версия' },
];
const APP_VERSION_KEY = 'v2.appVersion';
const APP_VERSION_DEFAULT = '2.3';

function getAppVersion() {
  try {
    const v = localStorage.getItem(APP_VERSION_KEY);
    return APP_VERSIONS.some((x) => x.id === v) ? v : APP_VERSION_DEFAULT;
  } catch (e) {
    return APP_VERSION_DEFAULT;
  }
}

function setAppVersion(v) {
  try {
    localStorage.setItem(APP_VERSION_KEY, v);
  } catch (e) {
    /* без хранилища переключение не запомнится */
  }
}

function isAppVersion(v) {
  return getAppVersion() === v;
}

document.documentElement.dataset.version = getAppVersion();
