/* ============ setup séance ============ */
let sessionDur = {};

function openSetup() {
  if (!state.techniques.length) { alert('Ajoute au moins une technique.'); return; }
  sessionDur = {};
  state.techniques.forEach(t => sessionDur[t.id] = t.blockSec);
  document.querySelector('input[name=mode][value=once]').checked = true;
  syncSetupVis(); renderPick(); show('setup');
}

function currentMode() {
  return document.querySelector('input[name=mode]:checked').value;
}

function syncSetupVis() {
  const m = currentMode();
  document.getElementById('totalWrap').classList.toggle('hidden', m !== 'total');
  const showPick = (m === 'total' || m === 'free');
  document.getElementById('pickWrap').classList.toggle('hidden', !showPick);
  document.getElementById('pickHint').textContent = showPick ? '(coche + règle la durée de chaque bloc)' : '';
}

function renderPick() {
  const wrap = document.getElementById('pickList');
  wrap.innerHTML = '';
  for (const t of state.techniques) {
    const row = document.createElement('div');
    row.className = 'pick-row';
    row.innerHTML = `<input type="checkbox" data-id="${t.id}" checked>
      <span class="nm">${escapeHtml(t.name)} ${t.focus ? '⭐' : ''}</span>
      <span class="dur"><input type="number" min="0.5" step="0.5" value="${t.blockSec / 60}" data-dur="${t.id}"> min</span>`;
    row.querySelector('[data-dur]').addEventListener('change', e => {
      sessionDur[t.id] = Math.max(15, Math.round((parseFloat(e.target.value) || 5) * 60));
    });
    wrap.appendChild(row);
  }
}

document.querySelectorAll('input[name=mode]').forEach(r => r.addEventListener('change', syncSetupVis));
document.getElementById('startSessionBtn').addEventListener('click', openSetup);
document.getElementById('setupCancel').addEventListener('click', () => show('library'));
document.getElementById('beginBtn').addEventListener('click', startSession);

/* ============ moteur de séance ============ */
let S = null;
let _cullMode = 'carte'; // 'carte' | 'carre' | 'couleur'

function _cullCarteFace(r, s) {
  const rank = RANKS[r], suit = SUITS[s];
  return `
    <div class="corner tl ${suit.cls}"><span class="s">${suit.sym}</span></div>
    <div class="corner tr ${suit.cls}"><span class="s">${suit.sym}</span></div>
    <div class="corner bl ${suit.cls}"><span class="s">${suit.sym}</span></div>
    <div class="corner br ${suit.cls}"><span class="s">${suit.sym}</span></div>
    <div class="cull-rank-center">${rank}</div>`;
}
function _cullCarreFace(r) {
  const rank = RANKS[r];
  return `
    <div class="corner tl black"><span class="s">${SUITS[0].sym}</span></div>
    <div class="corner tr red"><span class="s">${SUITS[1].sym}</span></div>
    <div class="corner bl red"><span class="s">${SUITS[2].sym}</span></div>
    <div class="corner br black"><span class="s">${SUITS[3].sym}</span></div>
    <div class="cull-rank-center">${rank}</div>`;
}
function _cullCouleurFace(s) {
  const suit = SUITS[s];
  return `
    <div class="corner tl ${suit.cls}"><span class="s">${suit.sym}</span></div>
    <div class="corner tr ${suit.cls}"><span class="s">${suit.sym}</span></div>
    <div class="corner bl ${suit.cls}"><span class="s">${suit.sym}</span></div>
    <div class="corner br ${suit.cls}"><span class="s">${suit.sym}</span></div>
    <div class="cbig ${suit.cls}">${suit.sym}</div>`;
}

document.getElementById('drillCullStrip').addEventListener('click', e => {
  const chip = e.target.closest('.cull-chip');
  if (!chip) return;
  _cullMode = chip.dataset.mode;
  document.querySelectorAll('.cull-chip').forEach(c => c.classList.toggle('active', c === chip));
  if (S) rollConsigne(techById(S.prevId));
});
let masterTimer = null, metroTimer = null, audioCtx = null;

function initAudio() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  } catch (e) {}
}
function beep(freq, dur, vol) {
  if (!audioCtx) return;
  try {
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.frequency.value = freq; o.connect(g); g.connect(audioCtx.destination);
    g.gain.value = vol || 0.18; o.start();
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + (dur || 0.15));
    o.stop(audioCtx.currentTime + (dur || 0.15));
  } catch (e) {}
}
function bell() {
  beep(880, 0.18, 0.22);
  setTimeout(() => beep(1320, 0.22, 0.2), 140);
  try { navigator.vibrate && navigator.vibrate(140); } catch (e) {}
}

function startSession() {
  initAudio();
  const mode = currentMode();
  let ids;
  if (mode === 'once') {
    ids = state.techniques.map(t => t.id);
  } else {
    ids = [...document.querySelectorAll('#pickList input[type=checkbox]:checked')].map(c => c.dataset.id);
  }
  if (!ids.length) { alert('Sélectionne au moins une technique.'); return; }

  S = { mode, ids, durOf:{}, order:null, idx:-1, appeared:new Set(), prevId:null,
        sessionEnd:0, blockEnd:0, nextRoll:0, currentCard:null, blocks:0, startedAt:Date.now(),
        paused:false, pauseStart:0, techSec:{}, blockStart:0, blockPaused:0 };
  ids.forEach(id => {
    S.durOf[id] = (mode === 'once') ? techById(id).blockSec : (sessionDur[id] || techById(id).blockSec);
  });
  if (mode === 'once') S.order = shuffle([...ids]);
  if (mode === 'total') {
    const tot = Math.max(1, parseInt(document.getElementById('s_total').value) || 15);
    S.sessionEnd = Date.now() + tot * 60000;
  }
  document.getElementById('totalTimerWrap').classList.toggle('hidden', mode !== 'total');
  show('drill');
  updatePauseUI();
  nextBlock(true);
  masterTimer = setInterval(tick, 200);
}

function techById(id) { return state.techniques.find(t => t.id === id); }
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function levelWeight(level) {
  const N = levelNames().length;
  if (N <= 1) return 1;
  return 1 + (N - level) / (N - 1);
}
function weightOf(t) {
  let w = 1;
  if (t.focus) w *= (state.settings.focusWeight || 2);
  if (state.settings.weightByLevel) w *= levelWeight(t.level || 1);
  return w;
}
function pickWeighted() {
  let pool = S.ids;
  if (pool.length > 1) pool = pool.filter(id => id !== S.prevId);
  const weights = pool.map(id => weightOf(techById(id)));
  let r = Math.random() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < pool.length; i++) { r -= weights[i]; if (r <= 0) return pool[i]; }
  return pool[pool.length - 1];
}

function finalizeBlock(now) {
  if (!S.prevId || !S.blockStart) return;
  const el = Math.max(0, (now - S.blockStart - (S.blockPaused || 0)) / 1000);
  S.techSec[S.prevId] = (S.techSec[S.prevId] || 0) + el;
}

function nextBlock(first) {
  clearMetro();
  if (!first) finalizeBlock(Date.now());
  let id;
  if (S.mode === 'once') {
    S.idx++;
    if (S.idx >= S.order.length) { endSession(); return; }
    id = S.order[S.idx];
  } else {
    if (S.mode === 'total' && Date.now() >= S.sessionEnd) { endSession(); return; }
    id = pickWeighted();
  }
  S.prevId = id; S.blocks++;
  const t = techById(id); S.appeared.add(id);
  S.blockStart = Date.now(); S.blockPaused = 0;
  S.blockEnd = Date.now() + S.durOf[id] * 1000;

  document.getElementById('d_fam').textContent = t.family + '  ·  ' + MODE_LABEL[t.mode];
  document.getElementById('d_name').textContent = t.name;
  const hint = document.getElementById('d_hint');
  hint.textContent = t.mode === 'tap' ? 'Touche pour une nouvelle carte'
    : (t.mode === 'interval' ? 'Change toutes les ' + t.intervalSec + ' s' : '');
  const isCull = t.family === 'Cull / triage';
  document.getElementById('drillCullStrip').classList.toggle('hidden', !isCull);
  rollConsigne(t);
  if (t.metro) startMetro(t.bpm);
}

function rollConsigne(t) {
  const cardEl = document.getElementById('d_card');
  let txt = t.template || t.name, card = null;
  if (/\{n\}|\{nx\}/.test(txt)) {
    const lo = Math.min(t.nMin, t.nMax), hi = Math.max(t.nMin, t.nMax);
    const n = lo + Math.floor(Math.random() * (hi - lo + 1));
    txt = txt.replace(/\{n\}/g, n).replace(/\{nx\}/g, NX[n] || ('' + n + '×'));
  }
  if (/\{carte\}/.test(txt)) {
    const isCull = techById(S?.prevId)?.family === 'Cull / triage';
    const mode = isCull ? _cullMode : 'carte';
    if (mode === 'carre') {
      card = { carre: Math.floor(Math.random() * 13) };
      txt = '';
    } else if (mode === 'couleur') {
      card = { couleur: Math.floor(Math.random() * 4) };
      txt = '';
    } else {
      const r = Math.floor(Math.random() * 13), s = Math.floor(Math.random() * 4);
      card = { r, s, isCull };
      if (!isCull) {
        const suit = SUITS[s];
        txt = txt.replace(/\{carte\}/g, `<b class="${suit.cls}">${RANKS[r]}${suit.sym}</b>`);
      } else {
        txt = '';
      }
    }
  }
  txt = txt.replace(/(^|[^\d])1 cartes\b/g, '$11 carte');
  document.getElementById('d_consigne').innerHTML = txt;
  if (card) {
    cardEl.classList.remove('hidden');
    cardEl.classList.toggle('tappable', t.mode === 'tap');
    cardEl.classList.remove('flip');
    void cardEl.offsetWidth;
    cardEl.classList.add('flip');
    if (card.carre !== undefined)       cardEl.innerHTML = _cullCarreFace(card.carre);
    else if (card.couleur !== undefined) cardEl.innerHTML = _cullCouleurFace(card.couleur);
    else if (card.isCull)               cardEl.innerHTML = _cullCarteFace(card.r, card.s);
    else                                cardEl.innerHTML = cardFace(card.r, card.s);
    S.currentCard = card;
  } else {
    cardEl.classList.add('hidden');
    cardEl.innerHTML = '';
  }
  if (t.mode === 'interval') S.nextRoll = Date.now() + t.intervalSec * 1000;
}

function tick() {
  if (!S || S.paused) return;
  const now = Date.now();
  if (S.mode === 'total') {
    const tr = Math.max(0, S.sessionEnd - now);
    document.getElementById('totalTimer').textContent = mmss(tr);
    if (tr <= 0) { endSession(); return; }
  }
  const br = Math.max(0, S.blockEnd - now);
  document.getElementById('blockTimer').textContent = mmss(br);
  if (br <= 0) { bell(); nextBlock(false); return; }
  const cur = techById(S.prevId);
  if (cur && cur.mode === 'interval' && now >= S.nextRoll) rollConsigne(cur);
}

function mmss(ms) {
  const s = Math.round(ms / 1000);
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}

/* tap → nouvelle consigne */
document.getElementById('drillStage').addEventListener('click', () => {
  if (!S || S.paused) return;
  const t = techById(S.prevId);
  if (t && t.mode === 'tap') rollConsigne(t);
});
document.getElementById('nextBtn').addEventListener('click', () => { if (!S || S.paused) return; openNextConfirm(); });
document.getElementById('endBtn').addEventListener('click', () => endSession());
document.getElementById('pauseBtn').addEventListener('click', togglePause);

/* pause */
function togglePause() {
  if (!S) return;
  if (S.paused) {
    const d = Date.now() - S.pauseStart;
    S.blockEnd += d; S.nextRoll += d;
    S.blockPaused = (S.blockPaused || 0) + d;
    if (S.mode === 'total') S.sessionEnd += d;
    S.paused = false;
    const cur = techById(S.prevId);
    if (cur && cur.metro) startMetro(cur.bpm);
  } else {
    S.paused = true; S.pauseStart = Date.now(); clearMetro();
  }
  updatePauseUI();
}
function updatePauseUI() {
  const p = S && S.paused;
  document.getElementById('pauseBtn').textContent = p ? '▶ Reprendre' : '⏸ Pause';
  document.getElementById('pausedInd').classList.toggle('hidden', !p);
  document.getElementById('nextBtn').disabled = !!p;
  document.getElementById('drillStage').style.opacity = p ? '.32' : '';
}

/* confirmation Suivant */
function openNextConfirm() {
  S.paused = true; S.pauseStart = Date.now();
  document.getElementById('confirmNext').classList.remove('hidden');
}
function confirmNext() {
  const d = Date.now() - S.pauseStart;
  if (S.mode === 'total') S.sessionEnd += d;
  S.blockPaused = (S.blockPaused || 0) + d;
  S.paused = false;
  document.getElementById('confirmNext').classList.add('hidden');
  nextBlock(false);
}
function cancelNext() {
  const d = Date.now() - S.pauseStart;
  S.blockEnd += d; S.nextRoll += d;
  S.blockPaused = (S.blockPaused || 0) + d;
  if (S.mode === 'total') S.sessionEnd += d;
  S.paused = false;
  document.getElementById('confirmNext').classList.add('hidden');
}
document.getElementById('cnOk').addEventListener('click', confirmNext);
document.getElementById('cnCancel').addEventListener('click', cancelNext);

/* métronome */
function startMetro(bpm) {
  clearMetro();
  const iv = 60000 / Math.min(240, Math.max(30, bpm));
  metroTimer = setInterval(() => beep(1000, 0.04, 0.12), iv);
}
function clearMetro() {
  if (metroTimer) { clearInterval(metroTimer); metroTimer = null; }
}
