// Десктоп: игра открывается в минималистичном мокапе iPhone (для презентаций).
// Страница грузится заново внутри iframe размером с экран макетов — 393×852,
// на невысоких экранах ниже. Внутри iframe игра видит
// обычный «телефонный» вьюпорт, поэтому вёрстку и скрипты страниц трогать
// не нужно. На телефонах (узкое окно) и внутри iframe скрипт ничего не делает.
// Подключается первым в <head>, до остальных стилей и скриптов.
(function () {
  if (window.self !== window.top) return;
  if (!window.matchMedia('(min-width: 600px)').matches) return;

  // останавливаем загрузку «внешней» страницы: её скрипты не должны
  // выполняться дважды (таймеры, сохранения и т. п.)
  window.stop();

  const style = `
    html, body { margin: 0; height: 100%; }
    body {
      display: flex;
      align-items: center;
      justify-content: center;
      /* тёмный фон, чуть светлее корпуса — не слепит, как белый */
      background: radial-gradient(120% 90% at 50% 0%, #34343a 0%, #26262b 55%, #1d1d21 100%);
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif;
    }
    /* экран 393 — ширина макетов (iPhone 15/16), высота 852; от интерфейса
       до внешнего края корпуса — 16px */
    .df-phone {
      position: relative;
      width: 393px;
      height: min(852px, calc(100vh - 80px));
      padding: 14px;
      border-radius: 62px;
      background: #0d0d0f;
      box-shadow:
        inset 0 0 0 1.5px #3a3a40,
        0 0 0 2px #4a4a52,
        0 40px 80px -20px rgba(0, 0, 0, 0.6),
        0 20px 40px -20px rgba(0, 0, 0, 0.5);
      box-sizing: content-box;
    }
    .df-screen {
      display: block;
      width: 100%;
      height: 100%;
      border: 0;
      border-radius: 48px;
      background: #000;
    }
  `;
  const html = document.documentElement;
  html.innerHTML = `<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${document.title || 'Арена Карт'}</title><style>${style}</style></head>
    <body><div class="df-phone"><iframe class="df-screen" title="Арена Карт" src="${location.href}"></iframe></div></body>`;

  // адрес и заголовок вкладки следуют за тем, что открыто в «телефоне»,
  // чтобы перезагрузка и ссылка вели на тот же экран
  const frame = html.querySelector('iframe');
  const sync = () => {
    try {
      const w = frame.contentWindow;
      const url = w.location.href;
      if (url && url !== 'about:blank' && url !== location.href) history.replaceState(null, '', url);
      if (w.document.title) document.title = w.document.title;
    } catch (e) { /* другой источник — не синхронизируем */ }
  };
  frame.addEventListener('load', () => {
    sync();
    try {
      const w = frame.contentWindow;
      w.addEventListener('hashchange', sync);
      // экраны v2 меняют адрес через history.replaceState
      const orig = w.history.replaceState.bind(w.history);
      w.history.replaceState = (...args) => { orig(...args); sync(); };
    } catch (e) { /* ignore */ }
  });
})();
