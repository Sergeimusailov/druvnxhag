// Профиль v2: шапка с аватаром, статистика, уведомления.
// «Настроить» открывает экран настроек: выбор аватарки (сохраняется в
// localStorage), остальные вкладки — заглушки.

const AVATAR_KEY = 'v2.profileAvatar';
const profileAvatarEl = document.getElementById('profileAvatarImg');
const profileSettingsEl = document.getElementById('profileSettings');
const profileToastEl = document.getElementById('profileToast');

function storageGet(key) {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    return null;
  }
}

function storageSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    /* без хранилища выбор живёт до перезагрузки */
  }
}

function applyAvatar(src) {
  if (!src) return;
  profileAvatarEl.src = src;
  profileAvatarEl.parentElement.classList.add('is-round');
  document.querySelectorAll('.pset-avatar').forEach((b) => b.classList.toggle('is-selected', b.dataset.avatar === src));
}

function showProfileToast(text) {
  profileToastEl.textContent = text;
  profileToastEl.classList.add('is-visible');
  clearTimeout(showProfileToast.timer);
  showProfileToast.timer = setTimeout(() => profileToastEl.classList.remove('is-visible'), 1800);
}

const psetTabs = createChipTabs(document.getElementById('psetChipRow'), document.getElementById('psetTabTrack'));

document.getElementById('profileSettingsBtn').addEventListener('click', () => {
  profileSettingsEl.classList.add('is-open');
  profileSettingsEl.setAttribute('aria-hidden', 'false');
  psetTabs.select('avatars');
});

document.getElementById('profileSettingsBack').addEventListener('click', () => {
  profileSettingsEl.classList.remove('is-open');
  profileSettingsEl.setAttribute('aria-hidden', 'true');
});

document.getElementById('psetAvatars').addEventListener('click', (e) => {
  const btn = e.target.closest('.pset-avatar');
  if (!btn) return;
  applyAvatar(btn.dataset.avatar);
  storageSet(AVATAR_KEY, btn.dataset.avatar);
  btn.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.1)' }, { transform: 'scale(1)' }], { duration: 300, easing: 'ease-out' });
});

const notifySwitch = document.getElementById('profileNotifySwitch');
notifySwitch.checked = storageGet('v2.notifications') === '1';
notifySwitch.addEventListener('change', () => storageSet('v2.notifications', notifySwitch.checked ? '1' : '0'));

document.getElementById('profileShareBtn').addEventListener('click', () => {
  const data = { title: 'Арена Карт', url: 'https://tvizy.tinkoff.ru' };
  if (navigator.share) navigator.share(data).catch(() => {});
  else {
    if (navigator.clipboard) navigator.clipboard.writeText(data.url).catch(() => {});
    showProfileToast('Ссылка скопирована');
  }
});

applyAvatar(storageGet(AVATAR_KEY));
