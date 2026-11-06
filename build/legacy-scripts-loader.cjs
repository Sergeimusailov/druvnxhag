// Загрузчик «старых» скриптов страницы для Rsbuild.
// На вход — JSON-список файлов (src/pages/<страница>.scripts.json), на выход —
// один модуль, где файлы идут подряд в том же порядке, что были <script> на
// странице. Так у них, как и раньше, общие функции и переменные (одна область
// видимости на страницу), и код переписывать не нужно. В модуле нет import /
// export, поэтому сборщик не включает строгий режим — поведение как у обычных
// <script>. Библиотеки из js/vendor/ (UMD) оборачиваются так, чтобы они, как
// раньше, положили себя в глобальную переменную (window.anime), а не в module.
// В конце модуля имена верхнего уровня копируются в window — для консоли и тестов.
const fs = require('node:fs');
const path = require('node:path');

// Имена верхнего уровня (функции, const / let / var / class в начале строки).
const TOP_LEVEL = /^(?:async\s+)?(?:function\*?|const|let|var|class)\s+([A-Za-z_$][\w$]*)/gm;

module.exports = function legacyScriptsLoader(source) {
  const files = JSON.parse(source);
  const names = new Set();
  const body = files.map((rel) => {
    const file = path.resolve(this.rootContext, rel);
    this.addDependency(file);
    let code = fs.readFileSync(file, 'utf8');
    if (!rel.includes('/vendor/')) {
      for (const m of code.matchAll(TOP_LEVEL)) names.add(m[1]);
    }
    if (rel.includes('/vendor/')) {
      code = `(function (module, exports, define) {\n${code}\n}).call(window);`;
    }
    return `/* ===== ${rel} ===== */\n${code}\n;`;
  }).join('\n');
  // как было без сборки: функции и переменные страницы видны из консоли
  // браузера и автотестов (window.getCoins и т. п.); встроенные свойства
  // window (name, status, top…) не трогаем
  const expose = [...names].map((n) => `try { if (!(${JSON.stringify(n)} in window)) window[${JSON.stringify(n)}] = ${n}; } catch (e) { /* нет такого имени */ }`).join('\n');
  return `${body}\n/* ===== доступ из консоли ===== */\n${expose}\n`;
};
