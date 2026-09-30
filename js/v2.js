const SCREENS = ['game', 'tasks', 'gifts', 'leagues', 'profile'];
const tabHighlightEl = document.getElementById('v2TabHighlight');
const tabEls = Array.from(document.querySelectorAll('.v2-tab'));
let currentScreen = null;

function moveTabHighlight(tabEl, animate) {
  if (!animate) tabHighlightEl.style.transition = 'none';
  // highlight is 4px wider than the tab on each side, as in the tui-tab-bar spec
  tabHighlightEl.style.width = `${tabEl.offsetWidth + 8}px`;
  tabHighlightEl.style.transform = `translateX(${tabEl.offsetLeft - 4}px)`;
  if (!animate) {
    tabHighlightEl.getBoundingClientRect();
    tabHighlightEl.style.transition = '';
  }
}

const screenEls = Object.fromEntries(
  Array.from(document.querySelectorAll('.v2-screen')).map((el) => [el.dataset.screen, el])
);
let slideCleanupTimer = null;

function showScreen(screen, animate = true) {
  if (!SCREENS.includes(screen)) screen = 'game';
  if (screen === currentScreen) return;
  const prev = currentScreen;
  currentScreen = screen;

  const tabEl = tabEls.find((t) => t.dataset.nav === screen);
  tabEls.forEach((t) => t.classList.toggle('v2-tab-active', t === tabEl));
  moveTabHighlight(tabEl, animate);

  const toEl = screenEls[screen];
  const fromEl = prev ? screenEls[prev] : null;
  clearTimeout(slideCleanupTimer);
  Object.values(screenEls).forEach((el) => {
    if (el !== toEl && el !== fromEl) {
      el.classList.remove('is-sliding');
      el.style.visibility = 'hidden';
    }
  });

  if (!animate || !fromEl) {
    toEl.classList.remove('is-sliding');
    toEl.style.transform = 'translateX(0)';
    toEl.style.visibility = 'visible';
    if (fromEl) fromEl.style.visibility = 'hidden';
  } else {
    const dir = SCREENS.indexOf(screen) > SCREENS.indexOf(prev) ? 1 : -1;
    // a screen that is still sliding out (quick back-and-forth taps) keeps its
    // current offset and just reverses, instead of jumping to the edge first
    const inFlight = toEl.style.visibility === 'visible';
    if (!inFlight) {
      toEl.classList.remove('is-sliding');
      toEl.style.transform = `translateX(${dir * 100}%)`;
      toEl.style.visibility = 'visible';
      toEl.getBoundingClientRect();
    }
    toEl.classList.add('is-sliding');
    fromEl.classList.add('is-sliding');
    toEl.style.transform = 'translateX(0)';
    fromEl.style.transform = `translateX(${-dir * 100}%)`;
    slideCleanupTimer = setTimeout(() => {
      fromEl.style.visibility = 'hidden';
      fromEl.classList.remove('is-sliding');
      toEl.classList.remove('is-sliding');
    }, 480);
  }

  history.replaceState(null, '', screen === 'game' ? location.pathname : `#${screen}`);
}

document.querySelectorAll('[data-nav]').forEach((el) => {
  el.addEventListener('click', () => showScreen(el.dataset.nav));
});

document.getElementById('v2HelpBtn').addEventListener('click', () => {});

showScreen(location.hash.slice(1), false);
window.addEventListener('load', () => moveTabHighlight(tabEls.find((t) => t.dataset.nav === currentScreen), false));
window.addEventListener('resize', () => moveTabHighlight(tabEls.find((t) => t.dataset.nav === currentScreen), false));
