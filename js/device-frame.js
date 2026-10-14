// Десктоп: игра открывается в минималистичном мокапе iPhone (для презентаций).
// Страница грузится заново внутри iframe размером с самый большой телефон —
// максимум 430×960, на невысоких экранах ниже. Внутри iframe игра видит
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
      background: radial-gradient(120% 90% at 50% 0%, #ffffff 0%, #ececf1 55%, #dcdce3 100%);
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif;
    }
    .df-phone {
      position: relative;
      width: 430px;
      height: min(960px, calc(100vh - 64px));
      padding: 12px;
      border-radius: 64px;
      background: #0d0d0f;
      box-shadow:
        inset 0 0 0 2px #2c2c30,
        0 0 0 1.5px #b9b9c2,
        0 40px 80px -20px rgba(20, 20, 40, 0.35),
        0 20px 40px -20px rgba(20, 20, 40, 0.25);
      box-sizing: content-box;
    }
    .df-screen {
      display: block;
      width: 100%;
      height: 100%;
      border: 0;
      border-radius: 52px;
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
