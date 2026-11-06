// Точка входа страницы animations.html (сборка Rsbuild, rsbuild.config.mjs).
// Стили — в том же порядке, что были <link> в <head>.
import '../../css/match.css';
import '../../css/animations.css';
// Скрипты страницы — одним общим скриптом в прежнем порядке (build/legacy-scripts-loader.cjs):
// у них общие функции и переменные, как у обычных <script> на странице.
import './animations.scripts.json';
