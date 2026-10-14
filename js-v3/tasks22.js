// Задания в версии 2.2: шкалы очков нет — задания дают валюты событий
// (снежинки — «Новогоднее событие», листики — «Дейлики») и монеты.
// «Забрать награду»: иконки валют улетают в таб «Игра» (там события),
// валюта зачисляется в своё событие — на главной загорается бейдж.
// Подключается до tasks.js; tasks.js сам зовёт TASKS22 в версии 2.2.

const CURRENCY_ICONS = {
  snow: 'assets/v2-cur-snow.png',
  leaf: 'assets/v2-cur-leaf.png',
  coins: 'assets/v2-coin.png',
  bolt: 'assets/v2-bolt.png',
};

const TASKS22_DATA = {
  daily: [
    { id: 'd22-win', title: 'Выиграйте 3 матча подряд', status: 'Заберите до 31 ноября', state: 'claimable', rewards: [['coins', 10], ['leaf', 6]] },
    { id: 'd22-play', title: 'Сыграйте 5 матчей за день', status: 'До 26 ноября', rewards: [['snow', 10], ['leaf', 6]] },
    { id: 'd22-capture', title: 'Захватите 20 карт соперника', status: 'До 26 ноября', progress: [10, 20], rewards: [['snow', 10], ['leaf', 6]] },
    { id: 'd22-done1', title: 'Сыграйте первый матч дня', status: 'Выполнено 23 ноября', state: 'done', rewards: [['leaf', 6]] },
    { id: 'd22-done2', title: 'Соберите колоду из 8 карт', status: 'Выполнено 23 ноября', state: 'done', rewards: [['snow', 6]] },
  ],
  weekly: [
    { id: 'w22-chest', title: 'Откройте 2 лутбокса в магазине', status: 'Заберите до 30 ноября', state: 'claimable', rewards: [['snow', 10], ['coins', 20]] },
    { id: 'w22-wins', title: 'Одержите 15 побед за неделю', status: 'До 30 ноября', progress: [6, 15], rewards: [['snow', 10], ['leaf', 6]] },
    { id: 'w22-combo', title: 'Сделайте 10 прострелов', status: 'До 30 ноября', progress: [2, 10], rewards: [['leaf', 12]] },
    { id: 'w22-done', title: 'Сыграйте 10 матчей', status: 'Выполнено 22 ноября', state: 'done', rewards: [['snow', 10]] },
  ],
};

const TASKS22 = {
  rewardsHTML(task) {
    return task.rewards
      .map(([cur, n]) => `<span class="t22-reward" data-cur="${cur}"><img src="${CURRENCY_ICONS[cur]}" alt=""><span>+${n}</span></span>`)
      .join('');
  },

  taskHTML(task) {
    const claimable = task.state === 'claimable';
    const done = task.state === 'done';
    let foot = '';
    if (claimable) foot = '<button class="task-claim t22-claim">Забрать награду</button>';
    else if (task.progress) {
      const [cur, total] = task.progress;
      foot = `<div class="task-progress-track"><div class="task-progress-fill" style="width:${(cur / total) * 100}%"></div></div>
        <p class="t22-meta"><span>${task.status}</span><span>${cur} / ${total}</span></p>`;
    }
    const statusTop = claimable ? `<p class="t22-status is-claim">${task.status}</p>` : '';
    const statusBottom = !claimable && !task.progress ? `<p class="t22-meta"><span>${task.status}</span></p>` : '';
    // 2.3: задания, которые двигают «Новогоднее событие», помечены
    // бейджем и голубоватым градиентом
    const isEvent = isAppVersion('2.3') && task.rewards.some(([cur]) => cur === 'snow');
    const eventTag = isEvent ? `<span class="e23-tag"><img src="${CURRENCY_ICONS.snow}" alt="">Новогоднее событие</span>` : '';
    return `<div class="task t22-task${claimable ? ' is-claimable' : ''}${done ? ' is-done' : ''}${isEvent ? ' is-event' : ''}" data-task="${task.id}">
      <div class="task-body">${eventTag}${statusTop}<p class="task-title">${task.title}</p>${foot}${statusBottom}</div>
      <div class="task-reward t22-rewards">${this.rewardsHTML(task)}</div>
    </div>`;
  },

  renderPanel(tab, panelEl) {
    const tasks = TASKS22_DATA[tab];
    const active = tasks.filter((t) => t.state !== 'done');
    active.sort((a, b) => (b.state === 'claimable') - (a.state === 'claimable'));
    const done = tasks.filter((t) => t.state === 'done');
    panelEl.innerHTML = `
      <div class="tasks-timer"><span class="tasks-timer-badge">${CLOCK_SVG}<span data-timer="${tab}"></span></span></div>
      <div class="tasks-list" data-list="active">${active.map((t) => this.taskHTML(t)).join('')}</div>
      <h2 class="tasks-done-title"${done.length ? '' : ' hidden'}>Выполненные</h2>
      <div class="tasks-list" data-list="done">${done.map((t) => this.taskHTML(t)).join('')}</div>
    `;
    updateTimers();
  },

  // иконка выпрыгивает из плитки награды и по дуге летит в таб «Игра»
  flyIcon(src, from, to, delay) {
    const el = document.createElement('img');
    el.src = src;
    el.className = 'fx-bolt';
    fxLayerEl.appendChild(el);
    const ctrl = { x: (from.x + to.x) / 2 + (Math.random() - 0.5) * 120, y: Math.min(from.y, to.y) - 60 - Math.random() * 60 };
    const frames = [{ transform: `translate(${from.x}px, ${from.y}px) scale(0.4)`, opacity: 0, offset: 0 }];
    const pop = { x: from.x + (Math.random() - 0.5) * 50, y: from.y - 20 - Math.random() * 20 };
    frames.push({ transform: `translate(${pop.x}px, ${pop.y}px) scale(1.15)`, opacity: 1, offset: 0.22 });
    for (let k = 1; k <= 12; k++) {
      const t = (k / 12) ** 2;
      const x = (1 - t) ** 2 * pop.x + 2 * (1 - t) * t * ctrl.x + t * t * to.x;
      const y = (1 - t) ** 2 * pop.y + 2 * (1 - t) * t * ctrl.y + t * t * to.y;
      frames.push({ transform: `translate(${x}px, ${y}px) scale(${1.15 - 0.65 * t})`, opacity: 1, offset: 0.22 + 0.78 * (k / 12) });
    }
    return el.animate(frames, { duration: 900, delay, fill: 'both' }).finished.then(() => el.remove());
  },

  busy: false,

  async claim(tab, taskId) {
    if (this.busy) return;
    const task = TASKS22_DATA[tab].find((t) => t.id === taskId);
    if (!task || task.state !== 'claimable') return;
    this.busy = true;
    const panel = panelEls[tab];
    const row = panel.querySelector(`[data-task="${taskId}"]`);
    row.querySelector('.t22-claim').disabled = true;
    const tile = row.querySelector('.t22-rewards');
    tile.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.86)' }, { transform: 'scale(1.06)' }, { transform: 'scale(1)' }], { duration: 360, easing: 'ease-out' });

    const gameTab = document.querySelector('.v2-tab[data-nav="game"]');
    const to = centerOf(gameTab.querySelector('.v2-tab-icon'));
    const flights = [];
    task.rewards.forEach(([cur], ri) => {
      const from = centerOf(row.querySelector(`.t22-reward[data-cur="${cur}"] img`));
      for (let i = 0; i < 4; i++) flights.push(this.flyIcon(CURRENCY_ICONS[cur], from, to, ri * 120 + i * 70));
    });

    task.state = 'done';
    task.status = 'Выполнено сегодня';
    setTimeout(async () => {
      await collapse(row);
      panel.querySelector('.tasks-done-title').hidden = false;
      const doneList = panel.querySelector('[data-list="done"]');
      doneList.insertAdjacentHTML('afterbegin', this.taskHTML(task));
      expandIn(doneList.firstElementChild);
    }, 260);

    await Promise.all(flights);
    gameTab.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.18)' }, { transform: 'scale(1)' }], { duration: 300, easing: 'ease-out' });
    burstAt(to);
    task.rewards.forEach(([cur, n]) => {
      if (cur === 'coins') addCoins(n);
      else if (typeof EVENTS22 !== 'undefined') EVENTS22.addCurrency(cur, n);
    });
    this.busy = false;
  },
};
