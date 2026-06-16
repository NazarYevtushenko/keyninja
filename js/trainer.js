'use strict';

/* ══════════════════════════════════════════════
   Trainer — Classic typing mode
   Improvements:
   - errors{} maps position → typed char
   - _scroll() keeps cursor visible
   - _showError() badge with expected vs typed
   - Shake animation on wrong key
   - Backspace clears error at position
   - Task integration (daily + program day)
══════════════════════════════════════════════ */
const Trainer = {
  text:       '',
  pos:        0,
  errors:     {},   /* pos → char that was typed */
  streak:     0,
  adaptive:   true,
  _totalChars: 0,   /* accumulated across lines for task tracking */
  _taskCtx:   null,
  _taskDone:  false,
  _interval:  null,
  _handler:   null,
  _errTimer:  null,

  /* ── Lifecycle ── */

  init() {
    SE.startSess();
    VK.init('kb-wrap', App.lang);

    this.adaptive    = true;
    this._totalChars = 0;
    this._taskDone   = false;
    this._taskCtx    = App.programContext || null;
    App.programContext = null; /* consume */

    document.getElementById('adp-btn').textContent = '🎯 Адаптив: ВКЛ';

    this._gen();
    this._render();
    this._startUI();
    this._initTask();

    this._handler = e => this._key(e);
    document.addEventListener('keydown', this._handler);
  },

  destroy() {
    document.removeEventListener('keydown', this._handler);
    clearInterval(this._interval);
    SE.endSess();
    this._hideTask();
  },

  /* ── Text generation ── */

  _gen() {
    /* If a task/program day provides focus keys, use them */
    let fk = [];
    if (this._taskCtx && this._taskCtx.focusKeys && this._taskCtx.focusKeys.length) {
      fk = this._taskCtx.focusKeys;
    } else if (this.adaptive) {
      fk = SE.weakKeys(5).map(w => w.key);
    }

    this.text   = TG.text(App.lang, 270, fk);
    this.pos    = 0;
    this.errors = {};

    const focusRow = document.getElementById('t-focus-row');
    if (fk.length) {
      focusRow.style.display = 'flex';
      document.getElementById('t-focus').textContent = fk.slice(0, 5).join(', ');
    } else {
      focusRow.style.display = 'none';
    }

    VK.clearAll();
    VK.showNext(this.text[0]);
    VK.markWeak(SE.weakKeys());
  },

  /* ── Render ── */

  _render() {
    const charsEl = document.getElementById('text-chars');
    if (!charsEl) return;

    const html = this.text.split('').map((ch, i) => {
      let cls  = 'ch ';
      let attr = '';

      if (i < this.pos) {
        if (this.errors[i] !== undefined) {
          cls += 'wrong';
          attr = ` data-typed="${this.errors[i].replace(/"/g, '&quot;')}"`;
        } else {
          cls += 'correct';
        }
      } else if (i === this.pos) {
        cls += 'cursor';
      } else {
        cls += 'pending';
      }

      const safe = ch === ' ' ? '&nbsp;'
                 : ch === '<' ? '&lt;'
                 : ch === '>' ? '&gt;'
                 : ch;
      return `<span class="${cls}"${attr}>${safe}</span>`;
    }).join('');

    charsEl.innerHTML = html;

    const pct  = this.text.length ? (this.pos / this.text.length * 100) : 0;
    const fill = document.getElementById('text-progress-fill');
    if (fill) fill.style.width = pct + '%';

    this._scroll();
  },

  /* Keep cursor visible without showing scrollbar */
  _scroll() {
    const display = document.getElementById('text-display');
    const cursor  = display && display.querySelector('.ch.cursor');
    if (!display || !cursor) return;

    const top    = cursor.offsetTop;
    const bottom = top + cursor.offsetHeight;
    const vBot   = display.scrollTop + display.clientHeight;

    if (bottom > vBot - 4)
      display.scrollTop = top - display.clientHeight * 0.35;
    if (top < display.scrollTop)
      display.scrollTop = top;
  },

  /* ── HUD update loop ── */

  _startUI() {
    clearInterval(this._interval);
    this._interval = setInterval(() => {
      const w = document.getElementById('t-wpm');
      const a = document.getElementById('t-acc');
      const s = document.getElementById('t-streak');
      if (w) w.textContent = SE.wpm();
      if (a) a.textContent = SE.acc();
      if (s) s.textContent = this.streak;
      this._refreshTask();
    }, 400);
  },

  /* ── Error badge ── */

  _showError(expected, typed) {
    const badge = document.getElementById('error-badge');
    if (!badge) return;
    const exp = expected === ' ' ? 'ПРОБЕЛ' : `"${expected}"`;
    const got = typed    === ' ' ? 'ПРОБЕЛ' : `"${typed}"`;
    badge.textContent = `✕ ожидалось ${exp}, введено ${got}`;
    badge.classList.add('show');
    clearTimeout(this._errTimer);
    this._errTimer = setTimeout(() => badge.classList.remove('show'), 1800);
  },

  /* ── Shake ── */

  _shake() {
    const el = document.getElementById('text-display');
    if (!el) return;
    el.classList.remove('shake');
    void el.offsetWidth;
    el.classList.add('shake');
    setTimeout(() => el.classList.remove('shake'), 250);
  },

  /* ── Task integration ── */

  _initTask() {
    const ctx = this._taskCtx;
    const banner = document.getElementById('task-banner');
    if (!banner) return;
    if (!ctx) { banner.style.display = 'none'; return; }

    banner.style.display = 'flex';
    this._refreshTask();
  },

  _hideTask() {
    const banner = document.getElementById('task-banner');
    if (banner) banner.style.display = 'none';
  },

  _refreshTask() {
    const ctx = this._taskCtx;
    if (!ctx || this._taskDone) return;

    const wpm  = SE.wpm(), acc = SE.acc(), chars = this._totalChars + this.pos;
    let label  = '', pct = 0;

    if (ctx.type === 'daily') {
      const t = ctx.dailyTask.task;
      label = `📅 ${t.label}`;
      pct   = DailyTask.calcProgress(ctx.dailyTask, wpm, acc, chars);

      if (DailyTask.isComplete(ctx.dailyTask, wpm, acc, chars)) {
        ctx.dailyTask.completed = true; ctx.dailyTask.progress = 100;
        DailyTask.save(ctx.dailyTask);
        this._completeTask('🎉 Ежедневное задание выполнено!');
        return;
      }
      /* save intermediate progress */
      ctx.dailyTask.progress = pct;
      DailyTask.save(ctx.dailyTask);

    } else if (ctx.type === 'program') {
      const d = ctx.day;
      label   = `🎓 День ${ctx.dayNum}: ${d.title}`;
      const wpmP  = Math.min(1, wpm / d.targetWPM);
      const charP = Math.min(1, chars / d.targetChars);
      pct = Math.round((wpmP + charP) / 2 * 100);

      if (wpm >= d.targetWPM && acc >= d.targetAcc && chars >= d.targetChars) {
        Program30.saveDay(ctx.dayNum, { success: true, wpm, acc, chars });
        this._completeTask(`🏆 День ${ctx.dayNum} пройден! ${wpm} зн/мин, ${acc}%`);
        return;
      }
    }

    const labelEl = document.getElementById('task-label');
    const fillEl  = document.getElementById('task-bar-fill');
    const pctEl   = document.getElementById('task-pct');
    if (labelEl) labelEl.textContent = label;
    if (fillEl)  fillEl.style.width  = pct + '%';
    if (pctEl)   pctEl.textContent   = pct + '%';
  },

  _completeTask(msg) {
    this._taskDone = true;
    const labelEl = document.getElementById('task-label');
    const fillEl  = document.getElementById('task-bar-fill');
    const pctEl   = document.getElementById('task-pct');
    const banner  = document.getElementById('task-banner');
    if (labelEl) labelEl.textContent = msg;
    if (fillEl)  fillEl.style.width  = '100%';
    if (pctEl)   pctEl.textContent   = '100%';
    if (banner)  banner.classList.add('task-complete');
  },

  /* ── Key handler ── */

  _key(e) {
    if (App.cur !== 'trainer') return;

    if (e.key === 'Tab') { e.preventDefault(); this.restart(); return; }

    if (e.key === 'Backspace') {
      e.preventDefault();
      if (this.pos > 0) { this.pos--; delete this.errors[this.pos]; }
      this._render();
      VK.clearAll();
      VK.showNext(this.text[this.pos]);
      return;
    }

    if (e.key.length !== 1 || e.ctrlKey || e.altKey || e.metaKey) return;
    e.preventDefault();

    const expected = this.text[this.pos];
    const typed    = e.key;
    const ok       = typed === expected;

    SE.record(expected, ok);
    VK.flash(typed, ok);

    if (ok) {
      this.streak++;
    } else {
      this.errors[this.pos] = typed;
      this.streak = 0;
      this._showError(expected, typed);
      this._shake();
    }

    this.pos++;

    if (this.pos >= this.text.length) { this.nextLine(); return; }

    VK.clearAll();
    VK.showNext(this.text[this.pos]);
    VK.markWeak(SE.weakKeys());
    this._render();
  },

  /* ── Controls ── */

  restart() {
    this._totalChars = 0;
    this._taskDone   = false;
    const banner = document.getElementById('task-banner');
    if (banner) banner.classList.remove('task-complete');
    this._gen(); this._render();
    if (this._taskCtx) this._initTask();
  },

  nextLine() {
    this._totalChars += this.pos;
    SE.endSess(); SE.startSess();
    this._gen(); this._render();
    this._refreshTask();
  },

  toggleAdaptive() {
    this.adaptive = !this.adaptive;
    document.getElementById('adp-btn').textContent =
      `🎯 Адаптив: ${this.adaptive ? 'ВКЛ' : 'ВЫКЛ'}`;
    this.restart();
  }
};
