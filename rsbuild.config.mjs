// Сборка прототипа на Rsbuild (https://rsbuild.rs).
//   npm run dev     — дев-сервер с автообновлением
//   npm run build   — сборка в dist/ (её публикует GitHub Actions на Pages)
//   npm run preview — посмотреть собранную dist/ локально
//
// Каждая HTML-страница в корне — шаблон, её точка входа — src/pages/<имя>.js
// (стили в прежнем порядке + скрипты страницы одним модулем, см.
// build/legacy-scripts-loader.cjs). Имена собранных файлов с хэшем, поэтому
// ручной кэш-параметр ?v= больше не нужен.
import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from '@rsbuild/core';

// встраиваемый в <head> скрипт: «</» → «<\/» (для JS то же самое), иначе
// строка вида '</head>' внутри кода сбила бы и HTML, и вставку тегов сборщиком
const inlineScript = (file) => fs.readFileSync(file, 'utf8').replace(/<\//g, '<\\/');

const PAGES = ['index', 'v1', 'v2', 'match', 'match-result', 'animations', 'collection', 'onboarding', 'profile'];

export default defineConfig({
  source: {
    entry: Object.fromEntries(PAGES.map((p) => [p, `./src/pages/${p}.js`])),
  },
  html: {
    template: ({ entryName }) => `./${entryName}.html`,
    // эти два скрипта должны выполниться до отрисовки страницы (мокап
    // телефона на десктопе, data-version на <html>) — встраиваем их прямо в <head>
    templateParameters: {
      deviceFrame: inlineScript('js/device-frame.js'),
      appVersion: inlineScript('js/version.js'),
    },
    // мета-теги уже есть в шаблонах
    meta: {},
    inject: 'head',
    scriptLoading: 'defer',
  },
  output: {
    // относительные пути (и в HTML, и в CSS от самого CSS-файла) — сайт
    // работает и из подпапки GitHub Pages
    assetPrefix: 'auto',
    // картинки, на которые ссылаются HTML и JS по строке ('assets/…'), — как есть
    copy: [{ from: 'assets', to: 'assets' }],
    legalComments: 'none',
  },
  performance: {
    // один CSS и один JS на страницу — порядок стилей как в исходных <link>
    chunkSplit: { strategy: 'all-in-one' },
  },
  server: {
    publicDir: false,
  },
  tools: {
    rspack: {
      module: {
        rules: [
          {
            test: /\.scripts\.json$/,
            type: 'javascript/auto',
            use: [{ loader: path.resolve('build/legacy-scripts-loader.cjs') }],
          },
        ],
      },
    },
  },
});
