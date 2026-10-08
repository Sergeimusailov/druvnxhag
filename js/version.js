// Версии прототипа v2: переключатель в профиле. Версия хранится в
// localStorage и ставится на <html data-version="…"> до отрисовки страницы,
// чтобы ветки фич можно было разводить и в CSS ([data-version="2.2"] …),
// и в JS (isAppVersion('2.2')).
const APP_VERSIONS = [
  { id: '2.1', title: 'Текущая версия' },
  { id: '2.2', title: 'Новые ивенты и задания' },
];
const APP_VERSION_KEY = 'v2.appVersion';
const APP_VERSION_DEFAULT = '2.1';

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
