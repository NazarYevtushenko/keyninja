'use strict';

/* ══════════════════════════════════════════════
   Shared game loop helper
   Each game object mixes in these methods.
══════════════════════════════════════════════ */
function gameBase() {
  return {
    canvas: null, ctx: null, raf: null,
    running: false, score: 0, lives: 3, level: 1, lastT: 0,

    _resize() {
      const p = this.canvas.parentElement;
      this.canvas.width  = p.clientWidth;
      this.canvas.height = p.clientHeight;
    },

    _startLoop() {
      this.running = true;
      this.lastT   = performance.now();
      this.raf     = requestAnimationFrame(t => this._loop(t));
    },

    _loop(t) {
      if (!this.running) return;
      const dt = Math.min((t - this.lastT) / 1000, 0.05);
      this.lastT = t;
      this._update(dt);
      this._draw();
      this.raf = requestAnimationFrame(ts => this._loop(ts));
    },

    _loseLife() {
      this.lives--;
      hud(this._prefix + '-lives', hearts(this.lives));
      if (this.lives <= 0) this._over();
    },

    _over() {
      this.running = false;
      cancelAnimationFrame(this.raf);
      SE.endSess();
      showGameOver(this.canvas.parentElement, this);
    },

    _cleanupOverlay() {
      this.canvas && this.canvas.parentElement.querySelector('.gameover')?.remove();
    },

    _detachResize() {
      window.removeEventListener('resize', this._rh);
    }
  };
}

/* ══════════════════════════════════════════════
   GAME: FALLING WORDS (GFW)
══════════════════════════════════════════════ */
const GFW = {
  ...gameBase(),
  _prefix: 'fw',
  items: [], spawnT: 0, spawnI: 3.0, speed: 50,
  inp: null, _rh: null, _ih: null,

  init() {
    this.canvas = document.getElementById('c-fw');
    this.ctx    = this.canvas.getContext('2d');
    Object.assign(this, { score:0, lives:3, level:1, items:[], spawnT:0, spawnI:3.0, speed:50 });

    this._rh = () => this._resize();
    window.addEventListener('resize', this._rh);
    this._resize();

    this.inp = document.getElementById('i-fw');
    this.inp.value = '';
    this.inp.focus();
    this._ih = () => this._input();
    this.inp.addEventListener('input', this._ih);

    hud('fw-score', 0); hud('fw-level', 1);
    hud('fw-lives', hearts(3)); hud('fw-wpm', 0);

    SE.startSess();
    this._startLoop();
  },

  _spawn() {
    const W = this.canvas.width;
    const words = WORDS[App.lang];
    const text  = words[Math.floor(Math.random() * words.length)];
    const tw    = text.length * 14;
    this.items.push({
      text, y: -30,
      x: Math.random() * (W - tw - 20) + 10,
      spd: this.speed + Math.random() * 20,
      color: `hsl(${170 + Math.random() * 90},75%,68%)`
    });
  },

  _input() {
    const v = this.inp.value.toLowerCase().trim();
    const idx = this.items.findIndex(it => it.text.toLowerCase() === v);
    if (idx === -1) return;

    const it = this.items[idx];
    for (const ch of it.text) SE.record(ch, true);
    this.score += it.text.length * 10 * this.level;
    this.items.splice(idx, 1);
    this.inp.value = '';
    hud('fw-score', this.score);
    hud('fw-wpm', SE.wpm());

    if (this.score >= this.level * 600) {
      this.level++; this.speed += 15;
      this.spawnI = Math.max(1.0, this.spawnI - 0.3);
      hud('fw-level', this.level);
    }
  },

  _update(dt) {
    this.spawnT += dt;
    if (this.spawnT >= this.spawnI) {
      this.spawnT = 0;
      this._spawn();
      if (this.items.length < 5 && Math.random() < 0.3) this._spawn();
    }
    const H = this.canvas.height;
    for (let i = this.items.length - 1; i >= 0; i--) {
      this.items[i].y += this.items[i].spd * dt;
      if (this.items[i].y > H + 10) {
        for (const ch of this.items[i].text) SE.record(ch, false);
        this.items.splice(i, 1);
        this._loseLife();
      }
    }
  },

  _draw() {
    const ctx = this.ctx, W = this.canvas.width, H = this.canvas.height;
    ctx.fillStyle = '#0a0a0f'; ctx.fillRect(0, 0, W, H);

    /* danger zone */
    ctx.fillStyle = 'rgba(255,51,85,.06)'; ctx.fillRect(0, H - 56, W, 56);
    ctx.strokeStyle = 'rgba(255,51,85,.3)'; ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.moveTo(0, H - 56); ctx.lineTo(W, H - 56); ctx.stroke();
    ctx.setLineDash([]);

    const v = this.inp ? this.inp.value.toLowerCase().trim() : '';
    ctx.font = 'bold 22px Courier New, monospace';

    this.items.forEach(it => {
      const targeted = v.length > 0 && it.text.toLowerCase().startsWith(v);
      const pad = 10, tw = ctx.measureText(it.text).width;

      ctx.fillStyle   = targeted ? 'rgba(0,255,136,.12)' : 'rgba(18,18,30,.9)';
      ctx.strokeStyle = targeted ? 'rgba(0,255,136,.75)' : 'rgba(60,60,100,.5)';
      ctx.lineWidth   = targeted ? 2 : 1;
      rrect(ctx, it.x - pad, it.y - 22 - 4, tw + pad * 2, 30, 6);
      ctx.fill(); ctx.stroke();

      let xo = it.x;
      for (let i = 0; i < it.text.length; i++) {
        ctx.fillStyle = (i < v.length && targeted) ? '#00ff88' : it.color;
        const ch = it.text[i];
        ctx.fillText(ch, xo, it.y); xo += ctx.measureText(ch).width;
      }
    });
  },

  destroy() {
    this.running = false; cancelAnimationFrame(this.raf);
    this._detachResize();
    if (this.inp) this.inp.removeEventListener('input', this._ih);
    this._cleanupOverlay();
    SE.endSess();
  }
};

/* ══════════════════════════════════════════════
   GAME: RISING WORDS (GRW)
══════════════════════════════════════════════ */
const GRW = {
  ...gameBase(),
  _prefix: 'rw',
  items: [], spawnT: 0, spawnI: 2.8, speed: 42,
  inp: null, _rh: null, _ih: null,

  init() {
    this.canvas = document.getElementById('c-rw');
    this.ctx    = this.canvas.getContext('2d');
    Object.assign(this, { score:0, lives:3, level:1, items:[], spawnT:0, spawnI:2.8, speed:42 });

    this._rh = () => this._resize();
    window.addEventListener('resize', this._rh);
    this._resize();

    this.inp = document.getElementById('i-rw');
    this.inp.value = ''; this.inp.focus();
    this._ih = () => this._input();
    this.inp.addEventListener('input', this._ih);

    hud('rw-score', 0); hud('rw-level', 1); hud('rw-lives', hearts(3));
    SE.startSess();
    this._startLoop();
  },

  _spawn() {
    const W = this.canvas.width, H = this.canvas.height;
    const words = WORDS[App.lang];
    const text  = words[Math.floor(Math.random() * words.length)];
    const tw    = text.length * 14;
    this.items.push({
      text, y: H + 10,
      x: Math.random() * (W - tw - 20) + 10,
      spd: this.speed + Math.random() * 15,
      color: `hsl(${200 + Math.random() * 80},75%,68%)`
    });
  },

  _input() {
    const v = this.inp.value.toLowerCase().trim();
    const idx = this.items.findIndex(it => it.text.toLowerCase() === v);
    if (idx === -1) return;

    const it = this.items[idx];
    for (const ch of it.text) SE.record(ch, true);
    this.score += it.text.length * 10 * this.level;
    this.items.splice(idx, 1);
    this.inp.value = '';
    hud('rw-score', this.score);

    if (this.score >= this.level * 600) {
      this.level++; this.speed += 10;
      this.spawnI = Math.max(1.0, this.spawnI - 0.25);
      hud('rw-level', this.level);
    }
  },

  _update(dt) {
    this.spawnT += dt;
    if (this.spawnT >= this.spawnI) { this.spawnT = 0; this._spawn(); }
    for (let i = this.items.length - 1; i >= 0; i--) {
      this.items[i].y -= this.items[i].spd * dt;
      if (this.items[i].y < -30) {
        for (const ch of this.items[i].text) SE.record(ch, false);
        this.items.splice(i, 1);
        this._loseLife();
      }
    }
  },

  _draw() {
    const ctx = this.ctx, W = this.canvas.width, H = this.canvas.height;
    ctx.fillStyle = '#0a0a0f'; ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = 'rgba(255,51,85,.06)'; ctx.fillRect(0, 0, W, 56);
    ctx.strokeStyle = 'rgba(255,51,85,.3)'; ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.moveTo(0, 56); ctx.lineTo(W, 56); ctx.stroke();
    ctx.setLineDash([]);

    const v = this.inp ? this.inp.value.toLowerCase().trim() : '';
    ctx.font = 'bold 22px Courier New, monospace';

    this.items.forEach(it => {
      const targeted = v.length > 0 && it.text.toLowerCase().startsWith(v);
      const pad = 10, tw = ctx.measureText(it.text).width;

      ctx.fillStyle   = targeted ? 'rgba(0,200,255,.12)' : 'rgba(18,18,30,.9)';
      ctx.strokeStyle = targeted ? 'rgba(0,200,255,.75)' : 'rgba(60,60,100,.5)';
      ctx.lineWidth   = targeted ? 2 : 1;
      rrect(ctx, it.x - pad, it.y - 22 - 4, tw + pad * 2, 30, 6);
      ctx.fill(); ctx.stroke();

      let xo = it.x;
      for (let i = 0; i < it.text.length; i++) {
        ctx.fillStyle = (i < v.length && targeted) ? '#00ccff' : it.color;
        const ch = it.text[i];
        ctx.fillText(ch, xo, it.y); xo += ctx.measureText(ch).width;
      }
    });
  },

  destroy() {
    this.running = false; cancelAnimationFrame(this.raf);
    this._detachResize();
    if (this.inp) this.inp.removeEventListener('input', this._ih);
    this._cleanupOverlay();
    SE.endSess();
  }
};

/* ══════════════════════════════════════════════
   GAME: SCATTERED WORDS (GSW)
══════════════════════════════════════════════ */
const GSW = {
  ...gameBase(),
  _prefix: 'sw',
  items: [], particles: [], timeLeft: 60, timer: null,
  inp: null, _rh: null, _ih: null,

  init() {
    this.canvas = document.getElementById('c-sw');
    this.ctx    = this.canvas.getContext('2d');
    Object.assign(this, { score:0, lives:3, items:[], particles:[], timeLeft:60 });

    this._rh = () => { this._resize(); this._spawnAll(); };
    window.addEventListener('resize', this._rh);
    this._resize();

    this.inp = document.getElementById('i-sw');
    this.inp.value = ''; this.inp.focus();
    this._ih = () => this._input();
    this.inp.addEventListener('input', this._ih);

    hud('sw-score', 0); hud('sw-time', 60); hud('sw-rem', 0);
    this._spawnAll();

    clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.timeLeft--;
      hud('sw-time', this.timeLeft);
      hud('sw-rem', this.items.length);
      if (this.timeLeft <= 0) { clearInterval(this.timer); this._over(); }
    }, 1000);

    SE.startSess();
    this._startLoop();
  },

  _spawnAll() {
    const W = this.canvas.width, H = this.canvas.height;
    const pool = [...WORDS[App.lang]].sort(() => Math.random() - .5).slice(0, 16);
    this.items = pool.map(text => ({
      text,
      x: 50 + Math.random() * (W - 130),
      y: 80 + Math.random() * (H - 130),
      fs: 17 + Math.floor(Math.random() * 8),
      color: `hsl(${Math.random() * 360},70%,68%)`,
      phase: Math.random() * Math.PI * 2
    }));
    hud('sw-rem', this.items.length);
  },

  _input() {
    const v = this.inp.value.toLowerCase().trim();
    const idx = this.items.findIndex(it => it.text.toLowerCase() === v);
    if (idx === -1) return;

    const it = this.items[idx];
    for (const ch of it.text) SE.record(ch, true);
    this.score += it.text.length * 10;

    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      this.particles.push({
        x: it.x, y: it.y,
        vx: Math.cos(a) * (50 + Math.random() * 80),
        vy: Math.sin(a) * (50 + Math.random() * 80),
        life: 1, color: it.color, r: 3 + Math.random() * 3
      });
    }
    this.items.splice(idx, 1);
    this.inp.value = '';
    hud('sw-score', this.score);
    hud('sw-rem', this.items.length);
    if (this.items.length === 0) this._spawnAll();
  },

  _update(dt) {
    const T = Date.now() / 1000, W = this.canvas.width, H = this.canvas.height;
    this.items.forEach(it => {
      it.x += Math.sin(T * 0.5 + it.phase) * 0.35;
      it.y += Math.cos(T * 0.4 + it.phase + 1) * 0.25;
      it.x = Math.max(40, Math.min(W - 80, it.x));
      it.y = Math.max(70, Math.min(H - 50, it.y));
    });
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 90 * dt; p.life -= dt * 1.6;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  },

  _draw() {
    const ctx = this.ctx, W = this.canvas.width, H = this.canvas.height;
    ctx.fillStyle = '#0a0a0f'; ctx.fillRect(0, 0, W, H);

    const v = this.inp ? this.inp.value.toLowerCase().trim() : '';

    this.items.forEach(it => {
      const targeted = v.length > 0 && it.text.toLowerCase().startsWith(v);
      ctx.font = `bold ${it.fs}px Courier New, monospace`;
      const pad = 8, tw = ctx.measureText(it.text).width;

      if (targeted) { ctx.shadowColor = it.color; ctx.shadowBlur = 16; }
      ctx.fillStyle   = targeted ? 'rgba(255,255,255,.08)' : 'rgba(18,18,30,.85)';
      ctx.strokeStyle = targeted ? it.color : 'rgba(60,60,100,.4)';
      ctx.lineWidth   = targeted ? 2 : 1;
      rrect(ctx, it.x - pad, it.y - it.fs - 3, tw + pad * 2, it.fs + 9, 8);
      ctx.fill(); ctx.stroke();
      ctx.shadowBlur = 0;

      let xo = it.x;
      for (let i = 0; i < it.text.length; i++) {
        ctx.fillStyle = (i < v.length && targeted) ? '#fff' : it.color;
        const ch = it.text[i];
        ctx.fillText(ch, xo, it.y); xo += ctx.measureText(ch).width;
      }
    });

    this.particles.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
  },

  destroy() {
    this.running = false; cancelAnimationFrame(this.raf);
    clearInterval(this.timer);
    this._detachResize();
    if (this.inp) this.inp.removeEventListener('input', this._ih);
    this._cleanupOverlay();
    SE.endSess();
  }
};

/* ══════════════════════════════════════════════
   GAME: FALLING LETTERS (GFL)
══════════════════════════════════════════════ */
const GFL = {
  ...gameBase(),
  _prefix: 'fl',
  items: [], spawnT: 0, spawnI: 1.1, speed: 65,
  _rh: null, _kh: null,

  init() {
    this.canvas = document.getElementById('c-fl');
    this.ctx    = this.canvas.getContext('2d');
    Object.assign(this, { score:0, lives:5, level:1, items:[], spawnT:0, spawnI:1.1, speed:65 });

    this._rh = () => this._resize();
    window.addEventListener('resize', this._rh);
    this._resize();

    this._kh = e => this._key(e);
    document.addEventListener('keydown', this._kh);

    hud('fl-score', 0); hud('fl-lives', hearts(5)); hud('fl-wpm', 0);
    SE.startSess();
    this._startLoop();
  },

  _spawn() {
    const W = this.canvas.width;
    const fk = SE.weakKeys(4).map(w => w.key);
    const letter = TG.letters(App.lang, fk, 1)[0];
    const col    = Math.floor(Math.random() * Math.floor(W / 52));
    this.items.push({
      text: letter, y: -24, x: col * 52 + 26,
      spd: this.speed + Math.random() * 20 * this.level,
      color: `hsl(${100 + Math.random() * 140},70%,68%)`
    });
  },

  _key(e) {
    if (App.cur !== 'fl' || e.key.length !== 1 || e.ctrlKey || e.metaKey) return;
    const k = e.key.toLowerCase();
    const idx = this.items.findIndex(it => it.text.toLowerCase() === k);
    if (idx !== -1) {
      SE.record(this.items[idx].text, true);
      this.score += 10 * this.level;
      this.items.splice(idx, 1);
      hud('fl-score', this.score); hud('fl-wpm', SE.wpm());
      if (this.score >= this.level * 200) {
        this.level++; this.speed += 8;
        this.spawnI = Math.max(0.45, this.spawnI - 0.08);
      }
    } else {
      SE.record(k, false);
    }
  },

  _update(dt) {
    this.spawnT += dt;
    if (this.spawnT >= this.spawnI) {
      this.spawnT = 0; this._spawn();
      if (Math.random() < 0.25) this._spawn();
    }
    const H = this.canvas.height;
    for (let i = this.items.length - 1; i >= 0; i--) {
      this.items[i].y += this.items[i].spd * dt;
      if (this.items[i].y > H + 10) {
        SE.record(this.items[i].text, false);
        this.items.splice(i, 1);
        this._loseLife();
      }
    }
  },

  _draw() {
    const ctx = this.ctx, W = this.canvas.width, H = this.canvas.height;
    ctx.fillStyle = '#0a0a0f'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,51,85,.05)'; ctx.fillRect(0, H - 48, W, 48);

    ctx.textAlign = 'center';
    this.items.forEach(it => {
      ctx.font = 'bold 34px Courier New, monospace';
      ctx.shadowColor = it.color; ctx.shadowBlur = 14;
      ctx.fillStyle   = it.color;
      ctx.fillText(it.text.toUpperCase(), it.x, it.y);
      ctx.shadowBlur  = 0;
    });

    ctx.font = '13px Courier New'; ctx.fillStyle = 'rgba(255,255,255,.18)';
    ctx.fillText('Нажимай соответствующую букву!', W / 2, H - 14);
    ctx.textAlign = 'left';
  },

  destroy() {
    this.running = false; cancelAnimationFrame(this.raf);
    document.removeEventListener('keydown', this._kh);
    this._detachResize(); this._cleanupOverlay();
    SE.endSess();
  }
};

/* ══════════════════════════════════════════════
   GAME: RISING LETTERS (GRL)
══════════════════════════════════════════════ */
const GRL = {
  ...gameBase(),
  _prefix: 'rl',
  items: [], spawnT: 0, spawnI: 1.2, speed: 55,
  _rh: null, _kh: null,

  init() {
    this.canvas = document.getElementById('c-rl');
    this.ctx    = this.canvas.getContext('2d');
    Object.assign(this, { score:0, lives:5, level:1, items:[], spawnT:0, spawnI:1.2, speed:55 });

    this._rh = () => this._resize();
    window.addEventListener('resize', this._rh);
    this._resize();

    this._kh = e => this._key(e);
    document.addEventListener('keydown', this._kh);

    hud('rl-score', 0); hud('rl-lives', hearts(5)); hud('rl-wpm', 0);
    SE.startSess();
    this._startLoop();
  },

  _spawn() {
    const W = this.canvas.width, H = this.canvas.height;
    const fk = SE.weakKeys(4).map(w => w.key);
    const letter = TG.letters(App.lang, fk, 1)[0];
    const col    = Math.floor(Math.random() * Math.floor(W / 52));
    this.items.push({
      text: letter, y: H + 24, x: col * 52 + 26,
      spd: this.speed + Math.random() * 20 * this.level,
      color: `hsl(${180 + Math.random() * 120},70%,68%)`
    });
  },

  _key(e) {
    if (App.cur !== 'rl' || e.key.length !== 1 || e.ctrlKey || e.metaKey) return;
    const k = e.key.toLowerCase();
    const idx = this.items.findIndex(it => it.text.toLowerCase() === k);
    if (idx !== -1) {
      SE.record(this.items[idx].text, true);
      this.score += 10 * this.level;
      this.items.splice(idx, 1);
      hud('rl-score', this.score); hud('rl-wpm', SE.wpm());
      if (this.score >= this.level * 200) {
        this.level++; this.speed += 8;
        this.spawnI = Math.max(0.5, this.spawnI - 0.08);
      }
    } else {
      SE.record(k, false);
    }
  },

  _update(dt) {
    this.spawnT += dt;
    if (this.spawnT >= this.spawnI) { this.spawnT = 0; this._spawn(); }
    for (let i = this.items.length - 1; i >= 0; i--) {
      this.items[i].y -= this.items[i].spd * dt;
      if (this.items[i].y < -24) {
        SE.record(this.items[i].text, false);
        this.items.splice(i, 1);
        this._loseLife();
      }
    }
  },

  _draw() {
    const ctx = this.ctx, W = this.canvas.width, H = this.canvas.height;
    ctx.fillStyle = '#0a0a0f'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,51,85,.05)'; ctx.fillRect(0, 0, W, 48);

    ctx.textAlign = 'center';
    this.items.forEach(it => {
      ctx.font = 'bold 34px Courier New, monospace';
      ctx.shadowColor = it.color; ctx.shadowBlur = 14;
      ctx.fillStyle   = it.color;
      ctx.fillText(it.text.toUpperCase(), it.x, it.y);
      ctx.shadowBlur  = 0;
    });

    ctx.font = '13px Courier New'; ctx.fillStyle = 'rgba(255,255,255,.18)';
    ctx.fillText('Нажми букву, пока она не улетела вверх!', W / 2, H - 14);
    ctx.textAlign = 'left';
  },

  destroy() {
    this.running = false; cancelAnimationFrame(this.raf);
    document.removeEventListener('keydown', this._kh);
    this._detachResize(); this._cleanupOverlay();
    SE.endSess();
  }
};

/* ══════════════════════════════════════════════
   GAME: SCATTERED LETTERS (GSL)
══════════════════════════════════════════════ */
const GSL = {
  ...gameBase(),
  _prefix: 'sl',
  items: [], particles: [], timeLeft: 60, timer: null,
  _rh: null, _kh: null,

  init() {
    this.canvas = document.getElementById('c-sl');
    this.ctx    = this.canvas.getContext('2d');
    Object.assign(this, { score:0, items:[], particles:[], timeLeft:60 });

    this._rh = () => { this._resize(); this._spawnAll(); };
    window.addEventListener('resize', this._rh);
    this._resize();

    this._kh = e => this._key(e);
    document.addEventListener('keydown', this._kh);

    hud('sl-score', 0); hud('sl-time', 60);
    this._spawnAll();

    clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.timeLeft--;
      hud('sl-time', this.timeLeft);
      if (this.timeLeft <= 0) { clearInterval(this.timer); this._over(); }
    }, 1000);

    SE.startSess();
    this._startLoop();
  },

  _spawnAll() {
    const W = this.canvas.width, H = this.canvas.height;
    const fk = SE.weakKeys(4).map(w => w.key);
    const letters = TG.letters(App.lang, fk, 20);
    this.items = letters.map(letter => ({
      text: letter,
      x: 60 + Math.random() * (W - 120),
      y: 80 + Math.random() * (H - 130),
      fs: 26 + Math.floor(Math.random() * 14),
      color: `hsl(${Math.random() * 360},70%,70%)`,
      phase: Math.random() * Math.PI * 2
    }));
  },

  _key(e) {
    if (App.cur !== 'sl' || e.key.length !== 1 || e.ctrlKey || e.metaKey) return;
    const k = e.key.toLowerCase();
    const idx = this.items.findIndex(it => it.text.toLowerCase() === k);
    if (idx !== -1) {
      const it = this.items[idx];
      SE.record(it.text, true);
      this.score += 10;
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        this.particles.push({
          x: it.x, y: it.y,
          vx: Math.cos(a) * (50 + Math.random() * 60),
          vy: Math.sin(a) * (50 + Math.random() * 60),
          life: 1, color: it.color, r: 3 + Math.random() * 3
        });
      }
      this.items.splice(idx, 1);
      hud('sl-score', this.score);

      /* spawn replacement */
      const W = this.canvas.width, H = this.canvas.height;
      const fk = SE.weakKeys(4).map(w => w.key);
      const nl = TG.letters(App.lang, fk, 1)[0];
      this.items.push({
        text: nl,
        x: 60 + Math.random() * (W - 120),
        y: 80 + Math.random() * (H - 130),
        fs: 26 + Math.floor(Math.random() * 14),
        color: `hsl(${Math.random() * 360},70%,70%)`,
        phase: Math.random() * Math.PI * 2
      });
    } else {
      SE.record(k, false);
    }
  },

  _update(dt) {
    const T = Date.now() / 1000, W = this.canvas.width, H = this.canvas.height;
    this.items.forEach(it => {
      it.x += Math.sin(T * 0.7 + it.phase) * 0.4;
      it.y += Math.cos(T * 0.5 + it.phase + 1) * 0.3;
      it.x = Math.max(40, Math.min(W - 40, it.x));
      it.y = Math.max(60, Math.min(H - 40, it.y));
    });
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 80 * dt; p.life -= dt * 2;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  },

  _draw() {
    const ctx = this.ctx, W = this.canvas.width, H = this.canvas.height;
    ctx.fillStyle = '#0a0a0f'; ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';

    this.items.forEach(it => {
      ctx.font = `bold ${it.fs}px Courier New, monospace`;
      ctx.shadowColor = it.color; ctx.shadowBlur = 10;
      ctx.fillStyle   = it.color;
      ctx.fillText(it.text.toUpperCase(), it.x, it.y);
      ctx.shadowBlur  = 0;
    });

    this.particles.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;

    ctx.font = '13px Courier New'; ctx.fillStyle = 'rgba(255,255,255,.18)';
    ctx.fillText('Нажимай буквы на клавиатуре!', W / 2, H - 14);
    ctx.textAlign = 'left';
  },

  destroy() {
    this.running = false; cancelAnimationFrame(this.raf);
    clearInterval(this.timer);
    document.removeEventListener('keydown', this._kh);
    this._detachResize(); this._cleanupOverlay();
    SE.endSess();
  }
};
