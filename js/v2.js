// profile — без таба: открывается иконкой в шапке главной
const SCREENS = ['game', 'tasks', 'cards', 'shop', 'gifts', 'profile'];
// showScreen() перезаписывает хэш — запоминаем исходный (например, #event)
const INITIAL_HASH = location.hash.slice(1);

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Чипсы-вкладки внутри раздела: пилюля перетекает к нажатому чипсу, панели
// едут треком, а высота контейнера подстраивается под активную панель —
// иначе экран скроллился бы на высоту самой длинной из них.
function createChipTabs(rowEl, trackEl, onChange) {
  const chips = Array.from(rowEl.querySelectorAll('.v2-chip'));
  const indicator = rowEl.querySelector('.v2-chip-indicator');
  const contentEl = trackEl.parentElement;
  const panels = Array.from(trackEl.children);
  let index = Math.max(0, chips.findIndex((c) => c.classList.contains('v2-chip-active')));
  let switchTimer = null;

  function placeIndicator(animate) {
    const chip = chips[index];
    if (!animate) indicator.style.transition = 'none';
    indicator.style.width = `${chip.offsetWidth}px`;
    indicator.style.transform = `translate(${chip.offsetLeft}px, ${chip.offsetTop}px)`;
    if (!animate) {
      indicator.getBoundingClientRect();
      indicator.style.transition = '';
    }
  }

  function fitHeight() {
    contentEl.style.height = `${panels[index].offsetHeight}px`;
  }

  function select(i, animate = true) {
    if (i < 0 || (i === index && animate)) return;
    index = i;
    chips.forEach((c, j) => c.classList.toggle('v2-chip-active', j === i));
    placeIndicator(animate);
    if (animate) {
      // height animates only during a switch; content changes inside a panel
      // (a task collapsing, say) resize the container instantly
      contentEl.classList.add('is-switching');
      clearTimeout(switchTimer);
      switchTimer = setTimeout(() => contentEl.classList.remove('is-switching'), 420);
    } else {
      trackEl.style.transition = 'none';
    }
    trackEl.style.transform = `translateX(-${i * 100}%)`;
    fitHeight();
    if (!animate) {
      trackEl.getBoundingClientRect();
      trackEl.style.transition = '';
    }
    if (onChange) onChange(chips[i].dataset.tab);
  }

  chips.forEach((c, i) => c.addEventListener('click', () => select(i)));
  const observer = new ResizeObserver(fitHeight);
  panels.forEach((p) => observer.observe(p));
  const resync = () => {
    placeIndicator(false);
    fitHeight();
  };
  window.addEventListener('load', resync);
  window.addEventListener('resize', resync);
  select(index, false);

  return {
    select: (tab) => select(chips.findIndex((c) => c.dataset.tab === tab)),
    get tab() {
      return chips[index].dataset.tab;
    },
  };
}
const tabHighlightEl = document.getElementById('v2TabHighlight');
const tabEls = Array.from(document.querySelectorAll('.v2-tab'));
let currentScreen = null;

// у профиля нет своего таба — он открывается с главной, поэтому подсвечена «Игра»
function tabForScreen(screen) {
  return tabEls.find((t) => t.dataset.nav === screen) || tabEls.find((t) => t.dataset.nav === 'game');
}

function moveTabHighlight(tabEl, animate) {
  // у раздела без таба (профиль) подсветка гаснет на месте
  tabHighlightEl.classList.toggle('is-hidden', !tabEl);
  if (!tabEl) return;
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

  const tabEl = tabForScreen(screen);
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
  document.dispatchEvent(new CustomEvent('v2:screen', { detail: { screen, animate } }));
}

// эффект под закреплённой шапкой включается, как только контент уехал под неё
Object.values(screenEls).forEach((el) => {
  el.addEventListener('scroll', () => el.classList.toggle('is-scrolled', el.scrollTop > 2), { passive: true });
});

document.querySelectorAll('[data-nav]').forEach((el) => {
  el.addEventListener('click', () => showScreen(el.dataset.nav));
});


showScreen(location.hash.slice(1), false);
window.addEventListener('load', () => moveTabHighlight(tabForScreen(currentScreen), false));
window.addEventListener('resize', () => moveTabHighlight(tabForScreen(currentScreen), false));
