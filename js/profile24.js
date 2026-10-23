// Профиль версии 2 (Figma 15917:99965): шапка «‹ Профиль», аватар в рамке,
// статистика с процентом побед, уведомления с подсказкой и тостом.
// Настройки: аватарки / рамки / рубашки / статус — выбор копится, пока не
// нажали «Сохранить» (кнопка появляется, только если что-то поменяли);
// после сохранения — тост «Сохранено». Версию 3 не трогаем.

if (!isApp3()) {
  const P24_KEYS = { avatar: 'v2.profileAvatar', frame: 'v2.profileFrame', back: 'v2.profileBack', status: 'v2.profileStatus' };

  const P24_PHOTO = 'assets/v2-avatar-photo.svg';
  const P24_AVATARS = [P24_PHOTO, ...Array.from({ length: 16 }, (_, i) => `assets/avatars-sq/sq-${String(i + 1).padStart(2, '0')}.png`)];

  const P24_FRAMES = [
    { id: 'white', name: 'Белая', css: '#fff' },
    { id: 'gold', name: 'Золото', css: 'linear-gradient(135deg, #fff2a8, #f5b400 50%, #c27a00)' },
    { id: 'rainbow', name: 'Радуга', css: 'conic-gradient(from 0deg, #ff7ad9, #ffdd2d, #6ff0ff, #b36bff, #ff7ad9)' },
    { id: 'ice', name: 'Лёд', css: 'linear-gradient(135deg, #e6f6ff, #7fd4ff 50%, #3f8cff)' },
    { id: 'fire', name: 'Огонь', css: 'linear-gradient(135deg, #ffe066, #ff6a1a 55%, #c2161b)' },
    { id: 'violet', name: 'Фиолет', css: 'linear-gradient(135deg, #e3d4ff, #8c5cff 55%, #4b1fb0)' },
    { id: 'mint', name: 'Мята', css: 'linear-gradient(135deg, #d6ffef, #2fd18f 55%, #0f7a52)' },
    { id: 'dark', name: 'Тёмная', css: '#48484a' },
    { id: 'rose', name: 'Роза', css: 'linear-gradient(135deg, #ffe0ea, #ff5c8a 55%, #b0124a)' },
  ];

  const P24_BACKS = [
    { id: 'base', name: 'Классика', filter: '' },
    { id: 'blue', name: 'Синяя', filter: 'sepia(1) saturate(4) hue-rotate(180deg) brightness(0.9)' },
    { id: 'violet', name: 'Фиолетовая', filter: 'sepia(1) saturate(4) hue-rotate(220deg) brightness(0.9)' },
    { id: 'gold', name: 'Золотая', filter: 'sepia(1) saturate(5) hue-rotate(5deg) brightness(1.05)' },
    { id: 'green', name: 'Зелёная', filter: 'sepia(1) saturate(4) hue-rotate(80deg) brightness(0.9)' },
    { id: 'red', name: 'Красная', filter: 'sepia(1) saturate(5) hue-rotate(-30deg) brightness(0.85)' },
  ];

  // статусы — те же, что в настройках версии 3
  const P24_STATUSES = Array.from(document.querySelectorAll('#psetStatuses .pset-status-item')).map((b) => b.dataset.status);

  const CHECK16 = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 8.3 6.8 11 12 5.5" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  const saved = {
    avatar: storageGet(P24_KEYS.avatar),
    frame: storageGet(P24_KEYS.frame) || 'white',
    back: storageGet(P24_KEYS.back) || 'base',
    status: storageGet(P24_KEYS.status) || document.getElementById('profileStatus').textContent,
  };
  if (!P24_AVATARS.includes(saved.avatar)) saved.avatar = P24_PHOTO;
  let pending = { ...saved };

  /* ---------- Профиль ---------- */

  const avatarBox = document.querySelector('.pf-avatar');
  const avatarImg = document.getElementById('profileAvatarImg');

  function applyProfile24() {
    avatarImg.src = saved.avatar;
    avatarBox.classList.remove('is-round');
    avatarBox.style.setProperty('--pf-frame', P24_FRAMES.find((f) => f.id === saved.frame).css);
    const back = P24_BACKS.find((b) => b.id === saved.back);
    document.querySelectorAll('.pf-cardback').forEach((img) => { img.style.filter = back.filter; });
    document.getElementById('profileStatus').textContent = saved.status;
  }

  // в профиле нет нижней навигации — он открывается поверх разделов
  const appEl24 = document.querySelector('.v2-app');
  document.addEventListener('v2:screen', (e) => appEl24.classList.toggle('is-profile24', e.detail.screen === 'profile'));

  /* ---------- Тост ---------- */

  const toast24 = document.getElementById('pfToast24');
  function showToast24(text) {
    document.getElementById('pfToast24Text').textContent = text;
    toast24.classList.add('is-visible');
    clearTimeout(showToast24.timer);
    showToast24.timer = setTimeout(() => toast24.classList.remove('is-visible'), 1800);
  }
  // «Поделиться» без системного шера копирует ссылку — тост в новом стиле
  showProfileToast = showToast24;

  /* ---------- Уведомления: подсказка и тост ---------- */

  const tip = document.getElementById('profileNotifyTip');
  document.getElementById('profileNotifyHint').addEventListener('click', (e) => {
    e.stopPropagation();
    tip.classList.toggle('is-open');
  });
  document.addEventListener('click', () => tip.classList.remove('is-open'));
  document.addEventListener('v2:screen', () => tip.classList.remove('is-open'));

  document.getElementById('profileNotifySwitch').addEventListener('change', (e) => {
    if (e.target.checked) showToast24('Уведомления подключены');
  });

  /* ---------- Настройки ---------- */

  const settingsEl = document.getElementById('profileSettings');
  const saveBar = document.getElementById('psetSave24');

  // шапка вне прокрутки: контент обрезается под ней, чипы едут поверх контента
  const settingsBar = settingsEl.querySelector('.pset-scroll > .v2-appbar');
  settingsEl.insertBefore(settingsBar, settingsEl.firstChild);
  settingsBar.classList.add('pset-bar24');

  const tile = (kind, id, inner, label) => `<button class="pset-tile24" data-kind="${kind}" data-id="${id}" aria-label="${label}">${inner}</button>`;

  function renderSettings24() {
    document.getElementById('psetAvatars').innerHTML = P24_AVATARS.map((src, i) => tile('avatar', src, `<img src="${src}" alt="">`, i ? `Аватар ${i}` : 'Своё фото')).join('');
    document.getElementById('psetFrames24').innerHTML = P24_FRAMES.map((f) => tile('frame', f.id, `<span class="pset-frame24" style="--pf-frame:${f.css}"></span>`, `Рамка «${f.name}»`)).join('');
    document.getElementById('psetBacks24').innerHTML = P24_BACKS.map((b) => tile('back', b.id, `<img src="assets/v2-profile-cardback.png" alt="" style="filter:${b.filter}">`, `Рубашка «${b.name}»`)).join('');
    document.getElementById('psetStatus24').innerHTML = P24_STATUSES.map((s) => `<button class="pset-status24-item" data-kind="status" data-id="${s}"><span>${s}</span><i>${CHECK16}</i></button>`).join('');
    markSelection24();
  }

  function markSelection24() {
    settingsEl.querySelectorAll('[data-kind]').forEach((el) => el.classList.toggle('is-selected', pending[el.dataset.kind] === el.dataset.id));
    const changed = Object.keys(pending).some((k) => pending[k] !== saved[k]);
    saveBar.classList.toggle('is-visible', changed);
  }

  settingsEl.addEventListener('click', (e) => {
    const el = e.target.closest('[data-kind]');
    if (!el) return;
    pending[el.dataset.kind] = el.dataset.id;
    markSelection24();
  });

  document.getElementById('psetSave24Btn').addEventListener('click', () => {
    Object.keys(pending).forEach((k) => {
      saved[k] = pending[k];
      storageSet(P24_KEYS[k], saved[k]);
    });
    applyProfile24();
    markSelection24();
    showToast24('Сохранено');
  });

  // открыли настройки — начинаем с сохранённого; ушли без «Сохранить» — выбор сбрасывается
  document.getElementById('profileSettingsBtn').addEventListener('click', () => {
    pending = { ...saved };
    markSelection24();
    settingsEl.querySelector('.pset-scroll').scrollTop = 0;
  });

  renderSettings24();
  applyProfile24();
}
