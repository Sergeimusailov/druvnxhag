// Точка входа страницы collection.html (сборка Rsbuild, rsbuild.config.mjs).
// Стили — в том же порядке, что были <link> в <head>.
import '../../css/collection.css';
// Скрипты страницы — одним общим скриптом в прежнем порядке (build/legacy-scripts-loader.cjs):
// у них общие функции и переменные, как у обычных <script> на странице.
import './collection.scripts.json';
