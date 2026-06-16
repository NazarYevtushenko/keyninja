'use strict';

/* ══════════════════════════════════════════════
   30-DAY PROGRAM DEFINITION
   keys: { en, ru } — physical home/top/bottom row equivalents
══════════════════════════════════════════════ */
const PROGRAM_DAYS = [
  /* WEEK 1 — Home row */
  { day:1,  week:1, title:'Домашний ряд — левая рука',
    keys:{ en:['a','s','d','f'], ru:['ф','ы','в','а'] },
    targetWPM:18, targetAcc:80, targetChars:180,
    hint:'Мизинец→A, безымянный→S, средний→D, указательный→F. Не смотри на клавиатуру.' },

  { day:2,  week:1, title:'Домашний ряд — правая рука',
    keys:{ en:['j','k','l'], ru:['о','л','д'] },
    targetWPM:20, targetAcc:80, targetChars:180,
    hint:'Указательный→J, средний→K, безымянный→L. Руки на домашней позиции.' },

  { day:3,  week:1, title:'Домашний ряд — обе руки',
    keys:{ en:['a','s','d','f','j','k','l'], ru:['ф','ы','в','а','о','л','д'] },
    targetWPM:22, targetAcc:82, targetChars:220,
    hint:'Соединяем обе руки. Большой палец — на пробел.' },

  { day:4,  week:1, title:'Домашний ряд + центр G, H',
    keys:{ en:['a','s','d','f','g','h','j','k','l'], ru:['ф','ы','в','а','п','р','о','л','д'] },
    targetWPM:24, targetAcc:83, targetChars:240,
    hint:'G — указательный палец левой, H — указательный правой.' },

  { day:5,  week:1, title:'Тест домашнего ряда',
    keys:{ en:['a','s','d','f','g','h','j','k','l',';'], ru:['ф','ы','в','а','п','р','о','л','д','ж'] },
    targetWPM:28, targetAcc:87, targetChars:300,
    hint:'Финальный тест недели. Не смотри на клавиатуру.' },

  /* WEEK 2 — Top row */
  { day:6,  week:2, title:'Верхний ряд — левая рука',
    keys:{ en:['q','w','e','r','t'], ru:['й','ц','у','к','е'] },
    targetWPM:22, targetAcc:80, targetChars:200,
    hint:'Тянемся с домашнего ряда вверх. Q—мизинец, W—безымянный, E—средний, R/T—указательный.' },

  { day:7,  week:2, title:'Верхний ряд — правая рука',
    keys:{ en:['y','u','i','o','p'], ru:['н','г','ш','щ','з'] },
    targetWPM:22, targetAcc:80, targetChars:200,
    hint:'Y/U—указательный, I—средний, O—безымянный, P—мизинец.' },

  { day:8,  week:2, title:'Верхний + домашний — левая',
    keys:{ en:['q','w','e','r','t','a','s','d','f'], ru:['й','ц','у','к','е','ф','ы','в','а'] },
    targetWPM:26, targetAcc:83, targetChars:260,
    hint:'Чередуем два ряда левой рукой. Возвращай пальцы на домашний.' },

  { day:9,  week:2, title:'Верхний + домашний — правая',
    keys:{ en:['y','u','i','o','p','j','k','l'], ru:['н','г','ш','щ','з','о','л','д'] },
    targetWPM:26, targetAcc:83, targetChars:260,
    hint:'Два ряда правой рукой.' },

  { day:10, week:2, title:'Два ряда вместе',
    keys:{ en:['q','w','e','r','t','y','u','i','o','p','a','s','d','f','j','k','l'], ru:['й','ц','у','к','е','н','г','ш','щ','з','ф','ы','в','а','о','л','д'] },
    targetWPM:30, targetAcc:85, targetChars:320,
    hint:'Второй рубеж! Домашний и верхний ряды без остановок.' },

  /* WEEK 3 — Bottom row */
  { day:11, week:3, title:'Нижний ряд — левая рука',
    keys:{ en:['z','x','c','v','b'], ru:['я','ч','с','м','и'] },
    targetWPM:24, targetAcc:80, targetChars:210,
    hint:'Тянемся вниз. Z—мизинец, X—безымянный, C—средний, V/B—указательный.' },

  { day:12, week:3, title:'Нижний ряд — правая рука',
    keys:{ en:['n','m',',','.'], ru:['т','ь','б','ю'] },
    targetWPM:24, targetAcc:80, targetChars:210,
    hint:'N/M—указательный, «,»—средний, «.»—безымянный.' },

  { day:13, week:3, title:'Нижний + домашний',
    keys:{ en:['z','x','c','v','b','n','m','a','s','d','f','j','k','l'], ru:['я','ч','с','м','и','т','ь','ф','ы','в','а','о','л','д'] },
    targetWPM:28, targetAcc:83, targetChars:280,
    hint:'Прыжки между нижним и домашним рядом.' },

  { day:14, week:3, title:'Три ряда вместе',
    keys:{ en:[], ru:[] },
    targetWPM:32, targetAcc:85, targetChars:320,
    hint:'Весь алфавит в игре! Держи руки в позиции домашнего ряда.' },

  { day:15, week:3, title:'Промежуточный тест',
    keys:{ en:[], ru:[] },
    targetWPM:36, targetAcc:87, targetChars:380,
    hint:'Экзамен трёх недель. Покажи всё что выучил.' },

  /* WEEK 4 — Numbers & symbols */
  { day:16, week:4, title:'Цифры 1–5',
    keys:{ en:['1','2','3','4','5'], ru:['1','2','3','4','5'] },
    targetWPM:24, targetAcc:82, targetChars:220,
    hint:'Цифровой ряд слева — тянемся вверх без взгляда на клавиши.' },

  { day:17, week:4, title:'Цифры 6–0',
    keys:{ en:['6','7','8','9','0'], ru:['6','7','8','9','0'] },
    targetWPM:24, targetAcc:82, targetChars:220,
    hint:'Правая сторона цифрового ряда. Следи за позицией руки.' },

  { day:18, week:4, title:'Пунктуация , . ; -',
    keys:{ en:[',','.',';','-'], ru:[',','.',';','-'] },
    targetWPM:26, targetAcc:83, targetChars:240,
    hint:'Знаки препинания — ключ к скоростной печати реального текста.' },

  { day:19, week:4, title:'Цифры + буквы вместе',
    keys:{ en:['1','2','3','4','5','6','7','8','9','0'], ru:['1','2','3','4','5','6','7','8','9','0'] },
    targetWPM:28, targetAcc:83, targetChars:260,
    hint:'Смешанный текст — наиболее реалистичный режим.' },

  { day:20, week:4, title:'Вся клавиатура',
    keys:{ en:[], ru:[] },
    targetWPM:33, targetAcc:85, targetChars:340,
    hint:'Полный алфавит + цифры + пунктуация. Четвёртая неделя позади!' },

  /* WEEK 5 — Speed */
  { day:21, week:5, title:'Спринт: короткие слова',
    keys:{ en:[], ru:[] },
    targetWPM:40, targetAcc:87, targetChars:380,
    hint:'Короткие слова (2–4 буквы) — быстро и без остановок.' },

  { day:22, week:5, title:'Спринт: длинные слова',
    keys:{ en:[], ru:[] },
    targetWPM:36, targetAcc:86, targetChars:360,
    hint:'Длинные слова требуют точности при высокой скорости.' },

  { day:23, week:5, title:'Ритмичная печать',
    keys:{ en:[], ru:[] },
    targetWPM:42, targetAcc:88, targetChars:400,
    hint:'Одинаковый интервал между нажатиями. Думай о ритме.' },

  { day:24, week:5, title:'Максимальная скорость',
    keys:{ en:[], ru:[] },
    targetWPM:46, targetAcc:86, targetChars:420,
    hint:'Выжми максимум — до 14% ошибок допустимо при рекорде.' },

  { day:25, week:5, title:'Тест скорости',
    keys:{ en:[], ru:[] },
    targetWPM:50, targetAcc:88, targetChars:500,
    hint:'Рубеж 50 зн/мин. Пять недель тренировок — это сила!' },

  /* WEEK 6 — Accuracy & mastery */
  { day:26, week:6, title:'Точность: медленно и чисто',
    keys:{ en:[], ru:[] },
    targetWPM:30, targetAcc:96, targetChars:300,
    hint:'Замедлись, но не допускай ошибок. Точность важнее скорости.' },

  { day:27, week:6, title:'Твои слабые клавиши',
    keys:{ en:[], ru:[] },   /* filled dynamically */
    targetWPM:35, targetAcc:90, targetChars:320,
    hint:'Персональная тренировка — фокус на твоих реальных проблемных зонах.' },

  { day:28, week:6, title:'Скорость + точность',
    keys:{ en:[], ru:[] },
    targetWPM:48, targetAcc:92, targetChars:460,
    hint:'Жёсткий баланс: и быстро, и чисто.' },

  { day:29, week:6, title:'Генеральная репетиция',
    keys:{ en:[], ru:[] },
    targetWPM:52, targetAcc:91, targetChars:500,
    hint:'Последний шанс подготовиться. Набери полный текст без пауз.' },

  { day:30, week:6, title:'🏆 Финальный экзамен',
    keys:{ en:[], ru:[] },
    targetWPM:55, targetAcc:92, targetChars:600,
    hint:'30 дней позади. Докажи себе, что вырос. Удачи!' },
];

/* ══════════════════════════════════════════════
   Program30 — progress tracker for 30-day plan
══════════════════════════════════════════════ */
const Program30 = {
  KEY: 'kn_prog30',

  _empty() {
    return { currentDay: 1, days: {}, streak: 0, lastDate: null };
  },

  getProgress() {
    try { return { ...this._empty(), ...JSON.parse(localStorage.getItem(this.KEY) || '{}') }; }
    catch { return this._empty(); }
  },

  saveDay(dayNum, result) {
    const prog  = this.getProgress();
    const today = this._dateKey(0);
    prog.days[dayNum] = { ...result, date: today };

    if (result.success) {
      if (dayNum >= prog.currentDay) prog.currentDay = Math.min(30, dayNum + 1);
      if (prog.lastDate === this._dateKey(-1)) {
        prog.streak = (prog.streak || 0) + 1;
      } else if (prog.lastDate !== today) {
        prog.streak = 1;
      }
      prog.lastDate = today;
    }
    localStorage.setItem(this.KEY, JSON.stringify(prog));
    return prog;
  },

  completedCount() {
    const prog = this.getProgress();
    return Object.values(prog.days).filter(d => d.success).length;
  },

  _dateKey(offset = 0) {
    const d = new Date(); d.setDate(d.getDate() + offset);
    return d.toISOString().split('T')[0];
  },

  getDay(num) {
    const def = PROGRAM_DAYS[num - 1];
    if (!def) return null;
    if (num === 27) {
      /* personalise with user's actual weak keys */
      const wk = SE.weakKeys(6).map(w => w.key);
      return { ...def, keys: { en: wk, ru: wk } };
    }
    return def;
  },

  render() {
    const prog = this.getProgress();
    const done = this.completedCount();
    const pct  = Math.round(done / 30 * 100);

    const pctEl  = document.getElementById('prog-pct');
    const fillEl = document.getElementById('prog-bar-fill');
    const doneEl = document.getElementById('prog-done');
    if (pctEl)  pctEl.textContent   = pct + '%';
    if (fillEl) fillEl.style.width  = pct + '%';
    if (doneEl) doneEl.textContent  = done;

    const grid = document.getElementById('days-grid');
    if (!grid) return;
    grid.innerHTML = '';

    PROGRAM_DAYS.forEach(def => {
      const n       = def.day;
      const result  = prog.days[n];
      const current = n === prog.currentDay;
      const locked  = n > prog.currentDay && !result;
      const success = result && result.success;

      const card = document.createElement('div');
      card.className = ['day-card',
        success ? 'done' : '', current ? 'current' : '', locked ? 'locked' : ''
      ].filter(Boolean).join(' ');

      const ico = success ? '✅' : current ? '▶️' : locked ? '🔒' : '⏳';

      card.innerHTML = `
        <div class="dc-num">День ${n} ${ico}</div>
        <div class="dc-title">${def.title}</div>
        <div class="dc-wpm">${def.targetWPM}+ зн/мин · ${def.targetAcc}%+</div>
        ${success ? `<div class="dc-result" style="font-size:.6rem;color:var(--accent)">${result.wpm} зн · ${result.acc}%</div>` : ''}`;

      if (!locked) card.onclick = () => Program30.startDay(n);
      grid.appendChild(card);
    });
  },

  startDay(n) {
    const def = this.getDay(n);
    if (!def) return;
    App.programContext = {
      type: 'program',
      dayNum: n,
      day: def,
      focusKeys: (def.keys[App.lang] || [])
    };
    App.go('trainer');
  }
};

/* ══════════════════════════════════════════════
   DailyTask — daily challenge generator & tracker
══════════════════════════════════════════════ */
const DailyTask = {
  KEY: 'kn_daily',

  _dateKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  },

  generate() {
    const d    = new Date();
    const seed = d.getFullYear() * 10000 + (d.getMonth()+1) * 100 + d.getDate();
    const dow  = d.getDay(); /* 0=Sun */
    const wk   = SE.weakKeys(3).map(w => w.key);

    /* rotate task type across week */
    const types = ['speed','accuracy','marathon','focus','speed','accuracy','focus'];
    const type  = types[dow];

    let task;
    switch (type) {
      case 'speed': {
        const g = 25 + (seed % 36);
        task = { type, targetWPM: g, targetChars: 260,
                 label: `Достигни ${g} зн/мин`, icon: '⚡',
                 desc: `Напечатай не менее 260 знаков со скоростью ≥ ${g} зн/мин` };
        break;
      }
      case 'accuracy': {
        const g = 86 + (seed % 12);
        task = { type, targetAcc: g, targetChars: 300,
                 label: `Точность ${g}%+`, icon: '🎯',
                 desc: `Напечатай 300 знаков с точностью не ниже ${g}%` };
        break;
      }
      case 'marathon': {
        const g = 380 + (seed % 220);
        task = { type, targetChars: g,
                 label: `Марафон: ${g} знаков`, icon: '🏃',
                 desc: `Набери суммарно ${g} знаков за сессию` };
        break;
      }
      case 'focus': {
        const keys = wk.length ? wk.slice(0, 3) : ['a','s','d'];
        task = { type, keys, targetChars: 260,
                 label: `Прокачай: ${keys.join(' + ')}`, icon: '🔧',
                 desc: `260 знаков с упором на ${keys.join(', ')}` };
        break;
      }
    }
    const daily = { date: this._dateKey(), task, completed: false, progress: 0 };
    localStorage.setItem(this.KEY, JSON.stringify(daily));
    return daily;
  },

  get() {
    try {
      const s = JSON.parse(localStorage.getItem(this.KEY) || '{}');
      if (s.date === this._dateKey()) return s;
    } catch {}
    return this.generate();
  },

  save(data) {
    localStorage.setItem(this.KEY, JSON.stringify(data));
  },

  /* Returns 0-100 progress pct */
  calcProgress(daily, wpm, acc, totalChars) {
    const t = daily.task;
    switch (t.type) {
      case 'speed':    return Math.min(100, Math.round(Math.min(wpm/t.targetWPM, 1)*50 + Math.min(totalChars/(t.targetChars||260), 1)*50));
      case 'accuracy': return Math.min(100, Math.round(Math.min(acc/(t.targetAcc||90), 1)*50 + Math.min(totalChars/(t.targetChars||300), 1)*50));
      case 'marathon': return Math.min(100, Math.round(totalChars / (t.targetChars||380) * 100));
      case 'focus':    return Math.min(100, Math.round(totalChars / (t.targetChars||260) * 100));
      default:         return 0;
    }
  },

  isComplete(daily, wpm, acc, totalChars) {
    const t = daily.task;
    switch (t.type) {
      case 'speed':    return wpm >= t.targetWPM && totalChars >= t.targetChars;
      case 'accuracy': return acc >= t.targetAcc && totalChars >= t.targetChars;
      case 'marathon': return totalChars >= t.targetChars;
      case 'focus':    return totalChars >= t.targetChars;
      default:         return false;
    }
  },

  render() {
    const daily = this.get();
    const t     = daily.task;
    const wrap  = document.getElementById('daily-card-wrap');
    if (!wrap) return;

    const pct = Math.round(daily.progress || 0);

    /* Build target details */
    const meta = [];
    if (t.targetWPM)   meta.push(`<span><strong>${t.targetWPM}</strong>зн/мин</span>`);
    if (t.targetAcc)   meta.push(`<span><strong>${t.targetAcc}%</strong>точность</span>`);
    if (t.targetChars) meta.push(`<span><strong>${t.targetChars}</strong>знаков</span>`);

    wrap.innerHTML = `
      <div class="daily-card${daily.completed ? ' completed-card' : ''}">
        <div class="daily-icon">${t.icon}</div>
        <div class="daily-label">${t.label}</div>
        <div class="daily-desc">${t.desc}</div>
        <div class="daily-meta">${meta.join('')}</div>
        <div class="daily-progress-wrap">
          <div class="daily-prog-bar"><div class="daily-prog-fill" style="width:${pct}%"></div></div>
          <div class="daily-prog-pct">${pct}%</div>
        </div>
        ${daily.completed
          ? `<div style="text-align:center;color:var(--accent);font-weight:bold;font-size:.9rem">✅ Выполнено сегодня!</div>`
          : `<button class="btn btn-accent" onclick="DailyTask.start()" style="align-self:center">▶️ Начать тренировку</button>`}
        <div style="text-align:center;margin-top:4px">
          <button class="btn" onclick="DailyTask._reset()" style="font-size:.7rem;padding:3px 10px">🔄 Обновить задание</button>
        </div>
      </div>`;
  },

  _reset() {
    localStorage.removeItem(this.KEY);
    this.render();
  },

  start() {
    const daily = this.get();
    App.programContext = {
      type: 'daily',
      dailyTask: daily,
      focusKeys: daily.task.keys || []
    };
    App.go('trainer');
  }
};
