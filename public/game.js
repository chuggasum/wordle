/* Ben Hoffmann – game logic. No dependencies. */
(() => {
  'use strict';

  const CFG = window.PENTA_CONFIG || {};
  const ANSWERS = window.ANSWERS;
  const VALID = new Set(ANSWERS.concat(window.EXTRA_GUESSES));
  const ROWS = 6, COLS = 5;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  /* ---------- safe storage ---------- */
  const store = {
    get(k, d) { try { const v = localStorage.getItem('pg:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('pg:' + k, JSON.stringify(v)); } catch (e) { /* private mode etc. */ } }
  };

  /* ---------- settings ---------- */
  const settings = Object.assign({ hard: false, marks: false, theme: 'auto', reduce: false }, store.get('settings', {}));
  function applySettings() {
    document.body.classList.toggle('marks', settings.marks);
    document.body.classList.toggle('reduce', settings.reduce);
    if (settings.theme === 'auto') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', settings.theme);
  }
  const reducedMotion = () => settings.reduce || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ---------- puzzle selection ---------- */
  const todayParts = () => { const d = new Date(); return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()); };
  const launch = (() => { const [y, m, d] = (CFG.launchDate || '2026-10-19').split('-').map(Number); return Date.UTC(y, m - 1, d); })();
  const dayNumber = () => Math.max(1, Math.floor((todayParts() - launch) / 864e5) + 1);
  const dailyAnswer = n => ANSWERS[((n - 1) % ANSWERS.length + ANSWERS.length) % ANSWERS.length];

  const encodeWord = w => btoa([...w].map(c => String.fromCharCode(c.charCodeAt(0) ^ 23)).join('')).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const decodeWord = s => { try { return [...atob(s.replace(/-/g, '+').replace(/_/g, '/'))].map(c => String.fromCharCode(c.charCodeAt(0) ^ 23)).join(''); } catch (e) { return ''; } };

  const siteUrl = () => (CFG.siteUrl || (location.origin + location.pathname)).replace(/index\.html$/, '');

  /* ---------- game state ---------- */
  let game;      // {mode, answer, day, guesses[], status}
  let current = '';
  let busy = false;

  function newGame(mode, answer, day) {
    game = { mode, answer, day: day || 0, guesses: [], status: 'playing' };
    current = '';
  }

  function startDaily() {
    const day = dayNumber();
    newGame('daily', dailyAnswer(day), day);
    const saved = store.get('daily', null);
    if (saved && saved.day === day) { game.guesses = saved.guesses; game.status = saved.status; }
  }
  const saveDaily = () => { if (game.mode === 'daily') store.set('daily', { day: game.day, guesses: game.guesses, status: game.status }); };

  function startPractice() {
    let w; do { w = ANSWERS[Math.floor(Math.random() * ANSWERS.length)]; } while (w === game?.answer);
    newGame('practice', w);
    buildBoard(); restore(); closeAll();
  }

  /* ---------- scoring ---------- */
  function score(guess, answer) {
    const res = Array(COLS).fill('absent'), left = {};
    for (let i = 0; i < COLS; i++) {
      if (guess[i] === answer[i]) res[i] = 'correct';
      else left[answer[i]] = (left[answer[i]] || 0) + 1;
    }
    for (let i = 0; i < COLS; i++) {
      if (res[i] !== 'correct' && left[guess[i]] > 0) { res[i] = 'present'; left[guess[i]]--; }
    }
    return res;
  }

  function hardModeError(guess) {
    for (const g of game.guesses) {
      const s = score(g, game.answer);
      for (let i = 0; i < COLS; i++) {
        if (s[i] === 'correct' && guess[i] !== g[i]) return `${ordinal(i + 1)} letter must be ${g[i].toUpperCase()}`;
      }
      for (let i = 0; i < COLS; i++) {
        if (s[i] === 'present' && !guess.includes(g[i])) return `Guess must contain ${g[i].toUpperCase()}`;
      }
    }
    return '';
  }
  const ordinal = n => ['', '1st', '2nd', '3rd', '4th', '5th'][n];

  /* ---------- board / keyboard ---------- */
  const boardEl = $('#board'), kbEl = $('#keyboard');
  const KEYS = ['qwertyuiop', ' asdfghjkl ', '+zxcvbnm-'];

  function buildBoard() {
    boardEl.textContent = '';
    for (let r = 0; r < ROWS; r++) {
      const row = document.createElement('div');
      row.className = 'row'; row.setAttribute('role', 'row');
      for (let c = 0; c < COLS; c++) {
        const t = document.createElement('div');
        t.className = 'tile'; t.setAttribute('role', 'gridcell'); t.setAttribute('aria-label', 'empty');
        row.appendChild(t);
      }
      boardEl.appendChild(row);
    }
    $$('.key', kbEl).forEach(k => k.removeAttribute('data-state'));
  }

  function buildKeyboard() {
    KEYS.forEach(line => {
      const row = document.createElement('div'); row.className = 'krow';
      [...line].forEach(ch => {
        const b = document.createElement('button');
        b.className = 'key'; b.type = 'button';
        if (ch === ' ') { b.className += ' spacer'; b.tabIndex = -1; b.setAttribute('aria-hidden', 'true'); }
        else if (ch === '+') { b.className += ' wide'; b.dataset.key = 'Enter'; b.textContent = 'Enter'; }
        else if (ch === '-') { b.className += ' wide'; b.dataset.key = 'Backspace'; b.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 5H9l-6 7 6 7h12z"/><path d="m13 9 5 6m0-6-5 6"/></svg>'; b.setAttribute('aria-label', 'Delete'); }
        else { b.dataset.key = ch; b.textContent = ch; }
        row.appendChild(b);
      });
      kbEl.appendChild(row);
    });
    kbEl.addEventListener('click', e => { const b = e.target.closest('.key[data-key]'); if (b) press(b.dataset.key); });
  }

  const tile = (r, c) => boardEl.children[r].children[c];
  const RANK = { absent: 1, present: 2, correct: 3 };

  function paintKey(letter, state) {
    const k = $(`.key[data-key="${letter}"]`, kbEl);
    if (!k) return;
    const cur = k.dataset.state;
    if (!cur || RANK[state] > RANK[cur]) k.dataset.state = state;
  }

  function renderCurrent() {
    const r = game.guesses.length;
    if (r >= ROWS) return;
    for (let c = 0; c < COLS; c++) {
      const t = tile(r, c), ch = current[c] || '';
      t.textContent = ch; t.dataset.letter = ch;
      t.setAttribute('aria-label', ch || 'empty');
    }
  }

  // Draw all saved guesses instantly (no animation)
  function restore() {
    game.guesses.forEach((g, r) => {
      const s = score(g, game.answer);
      for (let c = 0; c < COLS; c++) {
        const t = tile(r, c);
        t.textContent = g[c]; t.dataset.state = s[c]; t.setAttribute('aria-label', `${g[c]}, ${s[c]}`);
        paintKey(g[c], s[c]);
      }
    });
    renderCurrent();
    setModeLabel();
    $('#dlg-stats').dataset.over = game.status !== 'playing' ? '1' : '';
  }

  function setModeLabel() {
    $('#mode-label').textContent = game.mode === 'daily' ? `Daily puzzle · #${game.day}` : game.mode === 'challenge' ? 'Friend challenge' : 'Practice round';
  }

  /* ---------- input ---------- */
  function press(key) {
    if (busy || game.status !== 'playing') return;
    if (key === 'Enter') return submit();
    if (key === 'Backspace') { current = current.slice(0, -1); return renderCurrent(); }
    if (/^[a-z]$/.test(key) && current.length < COLS) { current += key; renderCurrent(); }
  }

  document.addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if ($$('dialog[open]').length) return;
    if (document.activeElement && document.activeElement.matches('input,select,textarea')) return;
    const k = e.key;
    if (k === 'Enter') { if (document.activeElement && document.activeElement.matches('button,a')) return; e.preventDefault(); press('Enter'); }
    else if (k === 'Backspace') press('Backspace');
    else if (/^[a-zA-Z]$/.test(k)) press(k.toLowerCase());
  });

  function toast(msg, ms = 1600) {
    const el = document.createElement('div');
    el.className = 'toast'; el.textContent = msg;
    $('#toasts').appendChild(el);
    $('#live').textContent = msg;
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 320); }, ms);
  }

  function reject(msg) {
    toast(msg);
    const row = boardEl.children[game.guesses.length];
    row.classList.remove('shake'); void row.offsetWidth; row.classList.add('shake');
    if (navigator.vibrate) navigator.vibrate(60);
  }

  function submit() {
    if (current.length < COLS) return reject('Not enough letters');
    if (!VALID.has(current)) return reject('Not in word list');
    if (settings.hard) { const err = hardModeError(current); if (err) return reject(err); }

    const guess = current, r = game.guesses.length, res = score(guess, game.answer);
    game.guesses.push(guess); current = '';
    if (guess === game.answer) game.status = 'won';
    else if (game.guesses.length === ROWS) game.status = 'lost';
    saveDaily();
    busy = true;

    const quick = reducedMotion(), step = quick ? 0 : 260;
    for (let c = 0; c < COLS; c++) {
      const t = tile(r, c);
      setTimeout(() => t.classList.add('flip'), c * step);
      setTimeout(() => {
        t.dataset.state = res[c]; t.setAttribute('aria-label', `${guess[c]}, ${res[c]}`);
      }, c * step + (quick ? 0 : 270));
    }
    const total = quick ? 0 : (COLS - 1) * step + 560;
    setTimeout(() => {
      [...guess].forEach((ch, i) => paintKey(ch, res[i]));
      busy = false;
      $('#live').textContent = `Guess ${r + 1}: ` + [...guess].map((ch, i) => `${ch} ${res[i]}`).join(', ');
      if (game.status !== 'playing') finish();
    }, total);
  }

  /* ---------- stats ---------- */
  const emptyStats = () => ({ played: 0, wins: 0, streak: 0, max: 0, dist: [0, 0, 0, 0, 0, 0], lastDay: 0, lastWinDay: 0 });
  const getStats = () => Object.assign(emptyStats(), store.get('stats', {}));

  function recordResult() {
    if (game.mode !== 'daily') return;
    const s = getStats();
    if (s.lastDay === game.day) return;   // already counted
    s.played++;
    if (game.status === 'won') {
      s.wins++; s.dist[game.guesses.length - 1]++;
      s.streak = s.lastWinDay === game.day - 1 ? s.streak + 1 : 1;
      s.lastWinDay = game.day;
    } else s.streak = 0;
    s.max = Math.max(s.max, s.streak);
    s.lastDay = game.day;
    store.set('stats', s);
  }

  function renderStats() {
    const s = getStats();
    $('#st-played').textContent = s.played;
    $('#st-win').textContent = s.played ? Math.round(100 * s.wins / s.played) : 0;
    $('#st-streak').textContent = s.streak;
    $('#st-max').textContent = s.max;
    const dist = $('#dist'); dist.textContent = '';
    const mx = Math.max(1, ...s.dist);
    const hl = game.status === 'won' && game.mode === 'daily' ? game.guesses.length - 1 : -1;
    s.dist.forEach((n, i) => {
      const row = document.createElement('div');
      row.innerHTML = `<span>${i + 1}</span><i class="${i === hl ? 'hl' : ''}" style="width:${Math.max(8, 100 * n / mx * .85)}%">${n}</i>`;
      dist.appendChild(row);
    });
    const over = game.status !== 'playing';
    $('#result-actions').hidden = !over;
    $('#result-sub').hidden = !over;
    $('#next-daily').hidden = !(over && game.mode === 'daily');
    $('#result-title').textContent = !over ? 'Your stats' : game.status === 'won' ? WIN_MSG[Math.min(game.guesses.length, 6) - 1] : 'So close!';
    if (over) {
      $('#result-sub').textContent = game.status === 'won'
        ? `Solved in ${game.guesses.length}/6${game.mode === 'daily' && s.streak > 1 ? ` · 🔥 ${s.streak}-day streak` : ''}`
        : `The word was ${game.answer.toUpperCase()}`;
    }
  }
  const WIN_MSG = ['Unreal!', 'Brilliant!', 'Sharp!', 'Nice one!', 'Phew!', 'Squeaker!'];

  function finish() {
    recordResult();
    if (game.status === 'won') {
      bounceRow(game.guesses.length - 1);
      if (!reducedMotion()) confetti();
      toast(WIN_MSG[game.guesses.length - 1], 1400);
    } else toast(game.answer.toUpperCase(), 3000);
    setTimeout(() => openDialog('dlg-stats'), game.status === 'won' ? 1700 : 1400);
  }

  function bounceRow(r) { for (let c = 0; c < COLS; c++) { const t = tile(r, c); t.classList.remove('flip'); setTimeout(() => t.classList.add('bounce'), reducedMotion() ? 0 : c * 90); } }

  /* ---------- share ---------- */
  const EMOJI = { correct: '🟩', present: '🟧', absent: '⬛' };
  const grid = () => game.guesses.map(g => score(g, game.answer).map(s => EMOJI[s]).join(''));
  const label = () => game.mode === 'daily' ? `Ben Hoffmann #${game.day}` : game.mode === 'challenge' ? 'Ben Hoffmann challenge' : 'Ben Hoffmann practice';

  function shareText() {
    const s = getStats();
    const score_ = game.status === 'won' ? `${game.guesses.length}/6` : 'X/6';
    const streak = game.mode === 'daily' && s.streak > 1 ? ` 🔥${s.streak}` : '';
    const hard = settings.hard ? '*' : '';
    const link = game.mode === 'challenge' ? location.href : siteUrl();
    const cta = game.mode === 'challenge' ? 'Think you can crack it too?' : 'Can you beat me?';
    return `${label()} ${score_}${hard}${streak}\n\n${grid().join('\n')}\n\n${cta} ${link}`;
  }

  async function shareOrCopy(text, url) {
    if (navigator.share) {
      try { await navigator.share({ text }); return; } catch (e) { if (e.name === 'AbortError') return; }
    }
    try { await navigator.clipboard.writeText(text); toast('Copied – paste it anywhere!'); }
    catch (e) {
      const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); toast('Copied – paste it anywhere!'); } catch (e2) { prompt('Copy this:', text); }
      ta.remove();
    }
  }

  // 1080×1920 story card (spoiler-free: no letters)
  function storyCanvas() {
    const W = 1080, H = 1920, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const x = cv.getContext('2d');
    const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
    const paper = css('--paper'), ink = css('--ink'), accent = css('--accent');
    const colors = { correct: css('--correct'), present: css('--present'), absent: css('--absent') };

    x.fillStyle = paper; x.fillRect(0, 0, W, H);
    x.fillStyle = ink; x.globalAlpha = .07;
    for (let py = 0; py < H; py += 28) for (let px = (py / 28 % 2) * 14; px < W; px += 28) { x.beginPath(); x.arc(px, py, 3, 0, 7); x.fill(); }
    x.globalAlpha = 1;
    x.textAlign = 'center'; x.fillStyle = ink;

    x.font = '900 108px Rockwell, "Roboto Slab", Georgia, serif';
    const w1 = x.measureText('Ben ').width, w2 = x.measureText('Hoffmann').width, sx = W / 2 - (w1 + w2) / 2;
    x.textAlign = 'left'; x.fillText('Ben ', sx, 270); x.fillStyle = accent; x.fillText('Hoffmann', sx + w1, 270);
    x.textAlign = 'center'; x.fillStyle = ink; x.font = '700 40px system-ui, Arial, sans-serif';
    x.fillText((game.mode === 'daily' ? `DAILY PUZZLE  #${game.day}` : game.mode === 'challenge' ? 'FRIEND CHALLENGE' : 'PRACTICE ROUND'), W / 2, 345);
    x.fillRect(190, 380, W - 380, 8);

    const won = game.status === 'won';
    x.font = '900 250px Rockwell, "Roboto Slab", Georgia, serif';
    x.fillStyle = won ? colors.correct : accent;
    x.fillText(won ? `${game.guesses.length}/6` : 'X/6', W / 2, 690);
    x.fillStyle = ink; x.font = '800 54px system-ui, Arial, sans-serif';
    const s = getStats();
    x.fillText(won ? WIN_MSG[game.guesses.length - 1].toUpperCase() : 'WORD DEFEATED ME', W / 2, 790);
    if (game.mode === 'daily' && s.streak > 1) { x.font = '700 46px system-ui, Arial, sans-serif'; x.fillText(`🔥 ${s.streak}-day streak`, W / 2, 860); }

    const size = 138, gap = 16, gw = COLS * size + (COLS - 1) * gap, gx = (W - gw) / 2, gh = game.guesses.length * (size + gap) - gap, gy = 950 + (6 - game.guesses.length) * (size + gap) / 4;
    game.guesses.forEach((g, r) => score(g, game.answer).forEach((st, c) => {
      const px = gx + c * (size + gap), py = gy + r * (size + gap);
      x.fillStyle = ink; roundRect(x, px + 5, py + 7, size, size, 16); x.fill();
      x.fillStyle = colors[st]; roundRect(x, px, py, size, size, 16); x.fill();
      x.lineWidth = 7; x.strokeStyle = ink; roundRect(x, px, py, size, size, 16); x.stroke();
    }));

    x.fillStyle = ink; x.font = '800 56px system-ui, Arial, sans-serif';
    x.fillText('Can you beat me?', W / 2, 1720);
    x.font = '700 44px system-ui, Arial, sans-serif'; x.fillStyle = accent;
    x.fillText('Play free at ' + siteUrl().replace(/^https?:\/\//, '').replace(/\/$/, ''), W / 2, 1790);
    return cv;
  }
  function roundRect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }

  async function shareStory() {
    const cv = storyCanvas();
    cv.toBlob(async blob => {
      if (!blob) return toast('Could not make image');
      const file = new File([blob], 'ben-hoffmann.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try { await navigator.share({ files: [file], text: shareText() }); return; } catch (e) { if (e.name === 'AbortError') return; }
      }
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'ben-hoffmann-story.png';
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      toast('Image saved – post it to your story!');
    }, 'image/png');
  }

  /* ---------- confetti ---------- */
  function confetti() {
    const cv = $('#confetti'), x = cv.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; x.scale(dpr, dpr);
    const cols = ['#12806f', '#f5a800', '#e8503a', '#1d2433', '#fffaf0'];
    const ps = Array.from({ length: 120 }, () => ({
      x: innerWidth / 2 + (Math.random() - .5) * 120, y: innerHeight * .35,
      vx: (Math.random() - .5) * 14, vy: -Math.random() * 14 - 4, s: 6 + Math.random() * 8,
      r: Math.random() * 6, vr: (Math.random() - .5) * .4, c: cols[Math.random() * cols.length | 0]
    }));
    let f = 0;
    (function tick() {
      x.clearRect(0, 0, innerWidth, innerHeight);
      ps.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += .35; p.vx *= .99; p.r += p.vr; x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = p.c; x.fillRect(-p.s / 2, -p.s / 3, p.s, p.s * .6); x.restore(); });
      if (++f < 140) requestAnimationFrame(tick); else x.clearRect(0, 0, innerWidth, innerHeight);
    })();
  }

  /* ---------- dialogs ---------- */
  function openDialog(id) {
    closeAll();
    const d = document.getElementById(id);
    if (id === 'dlg-stats') { renderStats(); startCountdown(); }
    if (id === 'dlg-challenge') { $('#challenge-msg').textContent = ''; $('#btn-challenge-go').textContent = 'Create link'; }
    if (!d.open) d.showModal();
    d.tabIndex = -1; d.focus();
    if (id === 'dlg-challenge') setTimeout(() => $('#challenge-word').focus(), 50);
    if (window.PentaAds) window.PentaAds.refresh(d);
  }
  function closeAll() { $$('dialog[open]').forEach(d => d.close()); }
  $$('dialog').forEach(d => d.addEventListener('click', e => { if (e.target === d) d.close(); }));
  document.addEventListener('click', e => { const o = e.target.closest('[data-open]'); if (o) openDialog(o.dataset.open); });

  let cdTimer;
  function startCountdown() {
    clearInterval(cdTimer);
    const tick = () => {
      const n = new Date(), next = new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1);
      const s = Math.max(0, Math.floor((next - n) / 1000));
      $('#countdown').textContent = [s / 3600 | 0, s % 3600 / 60 | 0, s % 60].map(v => String(v).padStart(2, '0')).join(':');
      if (s === 0 && game.mode === 'daily') location.reload();
    };
    tick(); cdTimer = setInterval(() => { if (!$('#dlg-stats').open) return clearInterval(cdTimer); tick(); }, 1000);
  }

  $('#btn-help').onclick = () => openDialog('dlg-help');
  $('#btn-stats').onclick = () => openDialog('dlg-stats');
  $('#btn-settings').onclick = () => { $('#set-hard').checked = settings.hard; $('#set-marks').checked = settings.marks; $('#set-theme').value = settings.theme; $('#set-motion').checked = settings.reduce; openDialog('dlg-settings'); };
  $('#btn-challenge').onclick = () => openDialog('dlg-challenge');
  $('#btn-share').onclick = () => shareOrCopy(shareText());
  $('#btn-story').onclick = shareStory;
  $('#btn-practice').onclick = startPractice;

  const saveSettings = () => { store.set('settings', settings); applySettings(); };
  $('#set-hard').onchange = e => {
    if (e.target.checked && game.mode !== 'practice' && game.guesses.length && game.status === 'playing') { e.target.checked = false; return toast('Hard mode can only be turned on before your first guess'); }
    settings.hard = e.target.checked; saveSettings();
  };
  $('#set-marks').onchange = e => { settings.marks = e.target.checked; saveSettings(); };
  $('#set-theme').onchange = e => { settings.theme = e.target.value; saveSettings(); };
  $('#set-motion').onchange = e => { settings.reduce = e.target.checked; saveSettings(); };

  /* ---------- challenge links ---------- */
  $('#challenge-word').addEventListener('input', e => { e.target.value = e.target.value.replace(/[^a-zA-Z]/g, '').toLowerCase(); });
  $('#challenge-word').addEventListener('keydown', e => { if (e.key === 'Enter') $('#btn-challenge-go').click(); });
  $('#btn-challenge-go').onclick = async () => {
    const w = $('#challenge-word').value.toLowerCase(), msg = $('#challenge-msg');
    if (w.length !== COLS) { msg.textContent = 'Enter a five-letter word.'; return; }
    if (!VALID.has(w)) { msg.textContent = "That word isn't in our list – try another."; return; }
    const link = `${siteUrl()}?c=${encodeWord(w)}`;
    const text = `I've hidden a five-letter word on Ben Hoffmann. Six guesses to crack it – can you? ${link}`;
    msg.textContent = 'Link ready – send it to a friend!';
    $('#btn-challenge-go').textContent = 'Share again';
    await shareOrCopy(text);
  };

  /* ---------- boot ---------- */
  function boot() {
    applySettings();
    buildKeyboard();
    const param = new URLSearchParams(location.search).get('c');
    const cw = param && decodeWord(param);
    if (cw && /^[a-z]{5}$/.test(cw) && VALID.has(cw)) newGame('challenge', cw);
    else startDaily();
    buildBoard(); restore();
    if (game.status !== 'playing') setTimeout(() => openDialog('dlg-stats'), 300);
    else if (!store.get('seen', false)) { store.set('seen', true); openDialog('dlg-help'); }
    if ('serviceWorker' in navigator && /^(https:|http:\/\/localhost)/.test(location.href)) navigator.serviceWorker.register('sw.js').catch(() => {});
  }
  boot();

  // test hook for the node tests
  window.__pg = { score };
})();
