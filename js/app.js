'use strict';

/* ══════════════════════════════════════════════
   StatsScreen
══════════════════════════════════════════════ */
const StatsScreen = {
  render() {
    const d = SE.d;
    const L = document.documentElement.dataset.theme === 'light';

    document.getElementById('stat-grid').innerHTML = `
      <div class="stat-card"><div class="sc-val">${d.bestWPM}</div><div class="sc-lbl">Лучший результат (зн/мин)</div></div>
      <div class="stat-card"><div class="sc-val">${d.avgWPM}</div><div class="sc-lbl">Средняя скорость</div></div>
      <div class="stat-card"><div class="sc-val">${SE.globalAcc()}%</div><div class="sc-lbl">Общая точность</div></div>
      <div class="stat-card"><div class="sc-val">${d.totalChars.toLocaleString()}</div><div class="sc-lbl">Знаков напечатано</div></div>
      <div class="stat-card"><div class="sc-val">${d.totalErrors.toLocaleString()}</div><div class="sc-lbl">Всего ошибок</div></div>
      <div class="stat-card"><div class="sc-val">${d.totalSessions}</div><div class="sc-lbl">Сессий</div></div>`;

    const wk  = SE.weakKeys(10);
    const el  = document.getElementById('weak-keys');
    if (!wk.length) {
      el.innerHTML = `<span style="color:var(--dim);font-size:.82rem">Нужно больше тренировок — данных пока недостаточно.</span>`;
    } else {
      el.innerHTML = wk.map(({ key, rate }) => {
        const pct = Math.round(rate * 100);
        const h   = Math.round(120 - rate * 120);
        const ln  = L ? '88%' : '14%';
        const cl  = L ? '35%' : '70%';
        return `<div class="wk-pill" style="background:hsl(${h},45%,${ln});border-color:hsl(${h},55%,40%)">
          <div class="wk-char" style="color:hsl(${h},70%,${cl})">${key.toUpperCase()}</div>
          <div class="wk-pct">${pct}% ошибок</div>
        </div>`;
      }).join('');
    }
  }
};

/* ══════════════════════════════════════════════
   App — router + controls
══════════════════════════════════════════════ */
const App = {
  cur:            'home',
  lang:           'en',
  programContext: null,   /* set before go('trainer') to pass task/program day */

  _screens: {
    home:    { el: 's-home' },
    trainer: { el: 's-trainer',  init() { Trainer.init();         }, destroy() { Trainer.destroy();  } },
    fw:      { el: 's-fw',       init() { GFW.init();              }, destroy() { GFW.destroy();      } },
    rw:      { el: 's-rw',       init() { GRW.init();              }, destroy() { GRW.destroy();      } },
    sw:      { el: 's-sw',       init() { GSW.init();              }, destroy() { GSW.destroy();      } },
    fl:      { el: 's-fl',       init() { GFL.init();              }, destroy() { GFL.destroy();      } },
    rl:      { el: 's-rl',       init() { GRL.init();              }, destroy() { GRL.destroy();      } },
    sl:      { el: 's-sl',       init() { GSL.init();              }, destroy() { GSL.destroy();      } },
    stats:   { el: 's-stats',    init() { StatsScreen.render();    } },
    daily:   { el: 's-daily',    init() { DailyTask.render();      } },
    program: { el: 's-program',  init() { Program30.render();      } },
  },

  go(name) {
    const cur = this._screens[this.cur];
    if (cur && cur.destroy) cur.destroy();
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = this._screens[name];
    if (!target) return;
    document.getElementById(target.el).classList.add('active');
    this.cur = name;
    if (target.init) target.init();
  },

  toggleLang() {
    this.lang = this.lang === 'en' ? 'ru' : 'en';
    document.getElementById('lang-btn').textContent = this.lang.toUpperCase();
    if (this.cur === 'trainer') { VK.render(this.lang); Trainer.restart(); }
  },

  toggleTheme() {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('kn_theme', next);
    document.getElementById('theme-btn').textContent = next === 'dark' ? '☀️' : '🌙';
    /* re-render stats heatmap so colours adapt */
    if (this.cur === 'stats') StatsScreen.render();
  },

  _loadTheme() {
    const saved = localStorage.getItem('kn_theme') || 'dark';
    document.documentElement.dataset.theme = saved;
    const btn = document.getElementById('theme-btn');
    if (btn) btn.textContent = saved === 'dark' ? '☀️' : '🌙';
  },

  /* Update daily-task badge on home screen */
  _updateHomeBadge() {
    const daily = DailyTask.get();
    const el = document.getElementById('home-daily-badge');
    if (!el) return;
    const icon = daily.completed ? '✅' : daily.task.icon;
    const sub  = daily.completed ? 'Выполнено!' : daily.task.label;
    el.innerHTML = `<span>${icon}</span><span>${sub}</span>`;
    el.style.display = 'flex';
  },

  init() {
    SE.load();
    this._loadTheme();
    this.go('home');
    this._updateHomeBadge();
  }
};

/* ── Bootstrap ── */
App.init();
