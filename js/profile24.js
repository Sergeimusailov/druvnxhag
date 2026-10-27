// Профиль версии 2 (Figma 15917:99965): шапка «‹ Профиль», аватар в рамке,
// статистика с процентом побед, уведомления с подсказкой и тостом.
// Настройки: аватарки / рамки / рубашки / статус — выбор копится, пока не
// нажали «Сохранить» (кнопка появляется, только если что-то поменяли);
// после сохранения — тост «Сохранено». Версию 3 не трогаем.

if (!isApp3()) {
  const P24_KEYS = { avatar: 'v2.profileAvatar', frame: 'v2.profileFrame', back: 'v2.profileBack', status: 'v2.profileStatus' };

  const P24_PHOTO = 'assets/v2-avatar-photo.svg';
  const P24_AVATARS = [P24_PHOTO, ...Array.from({ length: 16 }, (_, i) => `assets/avatars-sq/sq-${String(i + 1).padStart(2, '0')}.png`)];

  // рамки и рубашки — обычные и эпические (js/cosmetics24.js)
  const C24 = COSMETICS24;

  // статусы — те же, что в настройках версии 3
  const P24_STATUSES = Array.from(document.querySelectorAll('#psetStatuses .pset-status-item')).map((b) => b.dataset.status);

  const CHECK16 = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 8.3 6.8 11 12 5.5" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  const saved = {
    avatar: storageGet(P24_KEYS.avatar),
    frame: C24.frame(storageGet(P24_KEYS.frame) || 'white').id,
    back: C24.back(storageGet(P24_KEYS.back) || 'classic').id,
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
    C24.applyFrame(avatarBox, saved.frame);
    document.querySelectorAll('.pf-cardback24').forEach((el) => { el.innerHTML = C24.backHTML(saved.back); });
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
    // две категории: обычные и эпические (анимированные)
    const sections = (list, render, noun) => [false, true].map((epic) => `
      <div class="pset-sec24${epic ? ' is-epic' : ''}"><b>${epic ? 'Эпические' : 'Обычные'}</b><span>${epic ? 'С анимацией и эффектами' : `${list.filter((x) => !x.epic).length} ${noun}`}</span></div>
      <div class="pset-grid24">${list.filter((x) => !!x.epic === epic).map(render).join('')}</div>`).join('');
    const framesEl = document.getElementById('psetFrames24');
    framesEl.classList.add('pset-cat24');
    framesEl.innerHTML = sections(C24.FRAMES, (f) => tile('frame', f.id, '<span class="pset-frame24"></span>', `Рамка «${f.name}»`), 'вариантов');
    framesEl.querySelectorAll('[data-kind="frame"]').forEach((t) => C24.applyFrame(t.querySelector('.pset-frame24'), t.dataset.id));
    const backsEl = document.getElementById('psetBacks24');
    backsEl.classList.add('pset-cat24');
    backsEl.innerHTML = sections(C24.BACKS, (b) => tile('back', b.id, C24.backHTML(b.id), `Рубашка «${b.name}»`), 'вариантов');
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
