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
  let heightAnim = null;

  // пилюля перетекает к чипсу: x / y / ширина, 380, пружина
  function placeIndicator(animate) {
    const chip = chips[index];
    const to = { x: chip.offsetLeft, y: chip.offsetTop, width: chip.offsetWidth };
    if (animate) anime.animate(indicator, { ...to, duration: 380, ease: A24.EASE.spring });
    else anime.set(indicator, to);
  }

  // высота анимируется только при переключении вкладки (400, ios); изменения
  // внутри панели (задание свернулось) меняют её сразу
  function fitHeight(animate = false) {
    const h = panels[index].offsetHeight;
    if (animate) {
      heightAnim = anime.animate(contentEl, { height: h, duration: 400, ease: A24.EASE.ios, onComplete: () => { heightAnim = null; } });
    } else if (!heightAnim) {
      contentEl.style.height = `${h}px`;
    }
  }

  function select(i, animate = true) {
    if (i < 0 || (i === index && animate)) return;
    index = i;
    chips.forEach((c, j) => c.classList.toggle('v2-chip-active', j === i));
    placeIndicator(animate);
    // панели вкладок сменяются фейдом (250), без горизонтального сдвига
    trackEl.style.transform = `translateX(-${i * 100}%)`;
    if (animate) A24.play(panels[i], { opacity: [0, 1], duration: 250, ease: A24.EASE.out });
    fitHeight(animate);
    if (onChange) onChange(chips[i].dataset.tab);
  }

  chips.forEach((c, i) => c.addEventListener('click', () => select(i)));
  const observer = new ResizeObserver(() => fitHeight());
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
  // у раздела без таба (профиль) подсветка гаснет на месте (250)
  anime.animate(tabHighlightEl, { opacity: tabEl ? 1 : 0, duration: animate ? 250 : 0, ease: A24.EASE.ease });
  if (!tabEl) return;
  // подсветка на 4px шире таба с каждой стороны (tui-tab-bar); переезжает
  // x + ширина, 450, пружина
  const to = { x: tabEl.offsetLeft - 4, width: tabEl.offsetWidth + 8 };
  if (animate) anime.animate(tabHighlightEl, { ...to, duration: 450, ease: A24.EASE.spring });
  else anime.set(tabHighlightEl, to);
}

const screenEls = Object.fromEntries(
  Array.from(document.querySelectorAll('.v2-screen')).map((el) => [el.dataset.screen, el])
);

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
  Object.values(screenEls).forEach((el) => {
    if (el !== toEl && el !== fromEl) {
      anime.remove(el);
      el.style.visibility = 'hidden';
    }
  });

  // переходы между разделами — фейдом: разделы будут жить на разных роутах,
  // и общий горизонтальный слайдер между ними не сделать
  toEl.style.transform = '';
  anime.remove([toEl, fromEl].filter(Boolean));
  if (!animate || !fromEl) {
    toEl.style.opacity = '1';
    toEl.style.visibility = 'visible';
    if (fromEl) fromEl.style.visibility = 'hidden';
  } else {
    // кроссфейд 250: новый раздел проявляется, старый гаснет и скрывается
    if (toEl.style.visibility !== 'visible') toEl.style.opacity = '0';
    toEl.style.visibility = 'visible';
    anime.animate(toEl, { opacity: 1, duration: 250, ease: A24.EASE.ease });
    anime.animate(fromEl, {
      opacity: 0,
      duration: 250,
      ease: A24.EASE.ease,
      onComplete: () => { if (currentScreen !== fromEl.dataset.screen) fromEl.style.visibility = 'hidden'; },
    });
  }

  history.replaceState(null, '', screen === 'game' ? location.pathname + location.search : `#${screen}`);
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
