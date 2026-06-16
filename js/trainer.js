'use strict';

/* ══════════════════════════════════════════════
   Trainer — Classic typing mode
   Key improvements over v1:
   - errors{} stores typed char per position
   - _scroll() keeps cursor visible without scrollbar
   - _showError() notification badge
   - Progress bar
   - Shake animation on wrong key
   - Backspace correctly removes error mark
══════════════════════════════════════════════ */
const Trainer = {
  text:     '',
  pos:      0,
  errors:   {},   /* pos → char that was typed (wrong) */
  streak:   0,
  adaptive: true,
  _interval: null,
  _handler:  null,
  _errTimer: null,

  /* ── Lifecycle ── */

  init() {
    SE.startSess();
    VK.init('kb-wrap', App.lang);
    this.adaptive = true;
    document.getElementById('adp-btn').textContent = '🎯 Адаптив: ВКЛ';
    this._gen();
    this._render();
    this._startUI();
    this._handler = e => this._key(e);
    document.addEventListener('keydown', this._handler);
  },

  destroy() {
    document.removeEventListener('keydown', this._handler);
    clearInterval(this._interval);
    SE.endSess();
  },

  /* ── Text generation ── */

  _gen() {
    const fk = this.adaptive ? SE.weakKeys(5).map(w => w.key) : [];
    this.text   = TG.text(App.lang, 270, fk);
    this.pos    = 0;
    this.errors = {};
    this.streak = 0;

    const focusRow = document.getElementById('t-focus-row');
    if (fk.length && this.adaptive) {
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
          /* store typed char as data attribute for potential CSS use */
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

    /* progress bar */
    const pct = this.text.length ? (this.pos / this.text.length * 100) : 0;
    const fill = document.getElementById('text-progress-fill');
    if (fill) fill.style.width = pct + '%';

    this._scroll();
  },

  /* Keep cursor in view by adjusting scrollTop of #text-display */
  _scroll() {
    const display  = document.getElementById('text-display');
    const cursor   = display && display.querySelector('.ch.cursor');
    if (!display || !cursor) return;

    const cursorTop    = cursor.offsetTop;
    const cursorBottom = cursorTop + cursor.offsetHeight;
    const viewTop      = display.scrollTop;
    const viewBottom   = viewTop + display.clientHeight;

    if (cursorBottom > viewBottom - 4) {
      /* scroll down so cursor is ~35% from top */
      display.scrollTop = cursorTop - display.clientHeight * 0.35;
    }
    if (cursorTop < viewTop) {
      display.scrollTop = cursorTop;
    }
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
    }, 400);
  },

  /* ── Error notification badge ── */

  _showError(expected, typed) {
    const badge = document.getElementById('error-badge');
    if (!badge) return;
    const exp  = expected === ' ' ? 'ПРОБЕЛ' : `"${expected}"`;
    const got  = typed    === ' ' ? 'ПРОБЕЛ' : `"${typed}"`;
    badge.textContent = `✕ ожидалось ${exp}, введено ${got}`;
    badge.classList.add('show');
    clearTimeout(this._errTimer);
    this._errTimer = setTimeout(() => badge.classList.remove('show'), 1800);
  },

  /* ── Shake animation ── */

  _shake() {
    const display = document.getElementById('text-display');
    if (!display) return;
    display.classList.remove('shake');
    /* force reflow so animation restarts even on consecutive errors */
    void display.offsetWidth;
    display.classList.add('shake');
    setTimeout(() => display.classList.remove('shake'), 250);
  },

  /* ── Key handler ── */

  _key(e) {
    if (App.cur !== 'trainer') return;

    /* Tab = restart */
    if (e.key === 'Tab') { e.preventDefault(); this.restart(); return; }

    /* Backspace = step back */
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (this.pos > 0) {
        this.pos--;
        delete this.errors[this.pos]; /* un-mark error at stepped-back position */
      }
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

    if (this.pos >= this.text.length) {
      this.nextLine();
      return;
    }

    VK.clearAll();
    VK.showNext(this.text[this.pos]);
    VK.markWeak(SE.weakKeys());
    this._render();
  },

  /* ── Controls ── */

  restart() {
    this._gen();
    this._render();
  },

  nextLine() {
    SE.endSess();
    SE.startSess();
    this._gen();
    this._render();
  },

  toggleAdaptive() {
    this.adaptive = !this.adaptive;
    document.getElementById('adp-btn').textContent =
      `🎯 Адаптив: ${this.adaptive ? 'ВКЛ' : 'ВЫКЛ'}`;
    this.restart();
  }
};
