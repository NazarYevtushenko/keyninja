'use strict';

/* ══════════════════════════════════════════════
   SE — Stats Engine
   Tracks per-key error rates, session WPM/accuracy,
   persists to localStorage.
══════════════════════════════════════════════ */
const SE = {
  KEY: 'kn_stats_v2',

  d: {
    totalChars: 0, totalErrors: 0, totalSessions: 0,
    bestWPM: 0,    avgWPM: 0,
    keyErrors: {}, keyAttempts: {},
    wpmHistory: []
  },

  sess: { correct: 0, errors: 0, t0: null },

  load() {
    try {
      const s = localStorage.getItem(this.KEY);
      if (s) this.d = { ...this.d, ...JSON.parse(s) };
    } catch (e) {}
  },

  save() {
    try { localStorage.setItem(this.KEY, JSON.stringify(this.d)); } catch (e) {}
  },

  reset() {
    this.d = {
      totalChars: 0, totalErrors: 0, totalSessions: 0,
      bestWPM: 0,    avgWPM: 0,
      keyErrors: {}, keyAttempts: {},
      wpmHistory: []
    };
    this.save();
  },

  startSess() {
    this.sess = { correct: 0, errors: 0, t0: Date.now() };
  },

  record(key, ok) {
    const k = key.toLowerCase();
    this.d.keyAttempts[k] = (this.d.keyAttempts[k] || 0) + 1;
    if (ok) {
      this.sess.correct++;
      this.d.totalChars++;
    } else {
      this.sess.errors++;
      this.d.totalErrors++;
      this.d.keyErrors[k] = (this.d.keyErrors[k] || 0) + 1;
    }
  },

  wpm() {
    if (!this.sess.t0) return 0;
    const minutes = (Date.now() - this.sess.t0) / 60000;
    return minutes < 0.001 ? 0 : Math.round(this.sess.correct / minutes);
  },

  acc() {
    const total = this.sess.correct + this.sess.errors;
    return total ? Math.round(this.sess.correct / total * 100) : 100;
  },

  endSess() {
    const w = this.wpm();
    if (w > 0) {
      this.d.totalSessions++;
      if (w > this.d.bestWPM) this.d.bestWPM = w;
      this.d.wpmHistory.push(w);
      if (this.d.wpmHistory.length > 20) this.d.wpmHistory.shift();
      this.d.avgWPM = Math.round(
        this.d.wpmHistory.reduce((a, b) => a + b, 0) / this.d.wpmHistory.length
      );
    }
    this.save();
  },

  /* Returns top-N keys with error_rate > 5%, min 3 attempts */
  weakKeys(n = 8) {
    const res = [];
    for (const k in this.d.keyAttempts) {
      const att  = this.d.keyAttempts[k];
      const err  = this.d.keyErrors[k] || 0;
      if (att < 3) continue;
      const rate = err / att;
      if (rate > 0.05) res.push({ key: k, rate, err, att });
    }
    return res.sort((a, b) => b.rate - a.rate).slice(0, n);
  },

  globalAcc() {
    const total = this.d.totalChars + this.d.totalErrors;
    return total ? Math.round(this.d.totalChars / total * 100) : 100;
  }
};

/* ══════════════════════════════════════════════
   TG — Text / Letter Generator
══════════════════════════════════════════════ */
const TG = {
  /* Generate training text. focusKeys get 60% share if available. */
  text(lang, len = 270, focusKeys = []) {
    const pool  = WORDS[lang] || WORDS.en;
    const fpool = focusKeys.length
      ? pool.filter(w => focusKeys.some(k => w.includes(k)))
      : [];

    const out = [];
    let total = 0;
    while (total < len) {
      const w = (fpool.length && Math.random() < 0.6)
        ? fpool[Math.floor(Math.random() * fpool.length)]
        : pool[Math.floor(Math.random() * pool.length)];
      out.push(w);
      total += w.length + 1;
    }
    return out.join(' ');
  },

  /* Generate n random letters, biased toward focusKeys */
  letters(lang, focusKeys = [], n = 1) {
    const alpha = ALPHA[lang] || ALPHA.en;
    const res = [];
    for (let i = 0; i < n; i++) {
      res.push(
        (focusKeys.length && Math.random() < 0.5)
          ? focusKeys[Math.floor(Math.random() * focusKeys.length)]
          : alpha[Math.floor(Math.random() * alpha.length)]
      );
    }
    return res;
  }
};

/* ══════════════════════════════════════════════
   VK — Virtual Keyboard
══════════════════════════════════════════════ */

/* Finger index per key: 1=L.pinky 2=L.ring 3=L.middle 4=L.index
   0=thumbs  5=R.index 6=R.middle 7=R.ring 8=R.pinky
   Note: both Shift keys share 'Shift' eventKey → colored fc1 (left pinky shade).
   Backspace/Enter/right-side keys → fc8 (right pinky, sage green). */
const VK_FINGER = {
  /* Left pinky — red */
  '`':1,'1':1,'Tab':1,'q':1,'CapsLock':1,'a':1,'Shift':1,'z':1,
  /* Left ring — orange */
  '2':2,'w':2,'s':2,'x':2,
  /* Left middle — green */
  '3':3,'e':3,'d':3,'c':3,
  /* Left index — blue (2 columns) */
  '4':4,'5':4,'r':4,'t':4,'f':4,'g':4,'v':4,'b':4,
  /* Thumbs — lavender */
  ' ':0,'Alt':0,
  /* Right index — light blue (2 columns) */
  '6':5,'7':5,'y':5,'u':5,'h':5,'j':5,'n':5,'m':5,
  /* Right middle — teal */
  '8':6,'i':6,'k':6,',':6,
  /* Right ring — teal-green */
  '9':7,'o':7,'l':7,'.':7,
  /* Right pinky — sage green */
  '0':8,'-':8,'=':8,'Backspace':8,'p':8,'[':8,']':8,'\\':8,
  ';':8,"'":8,'Enter':8,'/':8,
};

const VK = {
  el: null,

  init(elId, lang) {
    this.el = document.getElementById(elId);
    this.render(lang);
  },

  render(lang) {
    if (!this.el) return;
    this.el.innerHTML = '';
    (KB[lang] || KB.en).forEach(row => {
      const rowEl = document.createElement('div');
      rowEl.className = 'kb-row';
      row.forEach(([code, label, cls = '']) => {
        const k = document.createElement('div');
        const fi = VK_FINGER[code];
        const fc = fi !== undefined ? ` fc${fi}` : '';
        k.className = 'key' + (cls ? ' ' + cls : '') + fc;
        k.textContent = label;
        k.dataset.kc = code;
        rowEl.appendChild(k);
      });
      this.el.appendChild(rowEl);
    });
  },

  _get(code) {
    return this.el ? this.el.querySelector(`[data-kc="${code.replace(/\\/g, '\\\\')}"]`) : null;
  },

  clearAll() {
    this.el && this.el.querySelectorAll('.key')
      .forEach(k => k.classList.remove('next', 'hit', 'miss'));
  },

  showNext(code) {
    const e = this._get(code);
    if (e) e.classList.add('next');
  },

  flash(code, ok) {
    const e = this._get(code);
    if (!e) return;
    const cls = ok ? 'hit' : 'miss';
    e.classList.add(cls);
    setTimeout(() => e.classList.remove(cls), 160);
  },

  markWeak(weakArr) {
    if (!this.el) return;
    this.el.querySelectorAll('.key').forEach(k => k.classList.remove('weak'));
    weakArr.forEach(({ key }) => {
      const e = this._get(key);
      if (e) e.classList.add('weak');
    });
  }
};

/* ══════════════════════════════════════════════
   canvasTheme — returns palette matching current UI theme
   Call once per _draw() frame, not per item.
══════════════════════════════════════════════ */
function canvasTheme() {
  const L = document.documentElement.dataset.theme === 'light';
  return {
    L,
    bg:         L ? '#f0f4fc' : '#0a0a0f',
    pill:       L ? 'rgba(255,255,255,.96)' : 'rgba(18,18,30,.90)',
    pillBd:     L ? 'rgba(160,165,215,.70)' : 'rgba(60,60,100,.50)',
    pillTgt:    L ? 'rgba(0,140,85,.10)'    : 'rgba(0,255,136,.12)',
    pillTgtBd:  L ? 'rgba(0,140,85,.75)'    : 'rgba(0,255,136,.75)',
    match:      L ? '#007744'               : '#00ff88',
    match2:     L ? '#0077bb'               : '#00ccff',
    wordLn:     L ? 30                      : 68,  /* HSL lightness */
    dangerFill: L ? 'rgba(200,30,60,.04)'   : 'rgba(255,51,85,.06)',
    dangerLine: L ? 'rgba(200,30,60,.32)'   : 'rgba(255,51,85,.30)',
    hint:       L ? 'rgba(30,30,80,.30)'    : 'rgba(255,255,255,.18)',
  };
}

/* ══════════════════════════════════════════════
   Canvas utilities (used by games)
══════════════════════════════════════════════ */

/* Rounded rectangle path */
function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);   ctx.arcTo(x + w, y,     x + w, y + r,     r);
  ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);   ctx.arcTo(x,     y + h, x,     y + h - r, r);
  ctx.lineTo(x, y + r);       ctx.arcTo(x,     y,     x + r, y,         r);
  ctx.closePath();
}

/* Set a HUD element value */
function hud(id, val) {
  const e = document.getElementById(id);
  if (e) e.textContent = val;
}

/* Build hearts string */
function hearts(n) {
  return '❤️'.repeat(Math.max(0, n));
}

/* Show game-over overlay on a canvas parent */
function showGameOver(wrap, game) {
  const div = document.createElement('div');
  div.className = 'gameover';
  div.innerHTML = `
    <h2>GAME OVER</h2>
    <div class="go-stats">
      <div class="go-item"><div class="go-val">${game.score}</div><div class="go-lbl">ОЧКИ</div></div>
      <div class="go-item"><div class="go-val">${SE.wpm()}</div><div class="go-lbl">ЗН/МИН</div></div>
      <div class="go-item"><div class="go-val">${SE.acc()}%</div><div class="go-lbl">ТОЧНОСТЬ</div></div>
    </div>
    <div class="go-btns">
      <button class="btn" id="go-retry">↺ Снова</button>
      <button class="btn btn-danger" onclick="App.go('home')">← Главная</button>
    </div>`;
  wrap.appendChild(div);
  div.querySelector('#go-retry').onclick = () => { div.remove(); game.init(); };
}
