// Превью каталога для документации: node build/catalog-previews.cjs
//
// Рисует каждую рамку и рубашку каталога (80×80 @2x, как в макете) в
// docs/catalog/frames/<id>.png и docs/catalog/backs/<id>.png и пересобирает
// таблицы «Рамки» и «Рубашки» в начале docs/catalog.md (между метками
// <!-- catalog:… -->). Картинки — только для документации, в игре всё на CSS/SVG.
// Нужен Playwright с Chromium (в облачной среде он уже установлен).
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const OUT = path.join(ROOT, 'docs/catalog/backs');
const OUT_FR = path.join(ROOT, 'docs/catalog/frames');

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(OUT_FR, { recursive: true });
  const css = read('css/cosmetics24.css');
  const js = ['js/catalog/snowflake.js', 'js/catalog/motifs.js', 'js/catalog/fx-emitter.js',
    'js/catalog/frames.generated.js', 'js/catalog/frames.figma.data.js', 'js/catalog/frames.figma.js', 'js/catalog/frames.js',
    'js/catalog/backs.generated.js', 'js/catalog/backs.figma.js', 'js/catalog/backs.js'].map(read).join('\n;\n');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 200, height: 200 }, deviceScaleFactor: 2 });
  await page.setContent(`<!doctype html><meta charset="utf-8"><style>${css} body{margin:0;background:transparent} #t{position:relative;width:80px;height:80px} #f{position:relative;width:80px;height:80px;border-radius:16px} #f i{position:absolute;inset:8px;border-radius:12px;background:#000}</style><div id="t"></div><div id="f"><i></i></div><script>${js}</script>`);
  const { backs, frames } = await page.evaluate(() => ({
    backs: BACK_CATALOG.list.map((b) => ({ id: b.id, name: b.name, node: b.node })),
    frames: FRAME_CATALOG.list.map((f) => ({ id: f.id, name: f.name, node: f.node })),
  }));
  for (const b of backs) {
    await page.evaluate((id) => { document.getElementById('t').innerHTML = BACK_CATALOG.html(id); }, b.id);
    await page.locator('#t').screenshot({ path: path.join(OUT, `${b.id}.png`), omitBackground: true });
  }
  for (const f of frames) {
    await page.evaluate((id) => { document.getElementById('f').style.background = FRAME_CATALOG.get(id).css; }, f.id);
    await page.locator('#f').screenshot({ path: path.join(OUT_FR, `${f.id}.png`), omitBackground: true });
  }
  await browser.close();

  const row = (id, name, img, node) => `| \`${id}\` | ${name} | <img src="${img}" width="56" height="56" alt="${name}"> | ${node || ''} |`;
  const table = (items) => ['| id | Название | Вид | Узел Figma |', '|---|---|---|---|', ...items].join('\n');
  const framesMd = table(frames.map((f) => row(f.id, f.name, `catalog/frames/${f.id}.png`, f.node)));
  const backsMd = table(backs.map((b) => row(b.id, b.name, `catalog/backs/${b.id}.png`, b.node)));

  const docPath = path.join(ROOT, 'docs/catalog.md');
  let doc = fs.readFileSync(docPath, 'utf8');
  const put = (key, body) => {
    const re = new RegExp(`<!-- catalog:${key} -->[\\s\\S]*?<!-- /catalog:${key} -->`);
    doc = doc.replace(re, `<!-- catalog:${key} -->\n${body}\n<!-- /catalog:${key} -->`);
  };
  put('frames', framesMd);
  put('backs', backsMd);
  fs.writeFileSync(docPath, doc);
  console.log(`превью: ${backs.length} рубашек, ${frames.length} рамок → docs/catalog.md`);
})();
