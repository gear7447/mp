/* ============ MENTALISME ============ */

const MENT_INTERVALS = [1, 2, 4, 8, 16, 32]; // sessions avant prochaine révision
const MONTHS_FR = ['janvier','février','mars','avril','mai','juin',
                   'juillet','août','septembre','octobre','novembre','décembre'];

const MENT_DECK_INFO = {
  fetes:         { icon: '🌍', label: 'Fêtes nationales', qLabel: 'Pays',         aLabel: 'Date fête nationale' },
  anniversaires: { icon: '🎂', label: 'Anniversaires',    qLabel: 'Personnalité', aLabel: 'Date de naissance'    }
};

let mentSess       = null;  // { deckId, queue, idx, flipped, rc:{bad,ok,good} }
let mentBrowseDeck = null;
let mentPalierDeck = null;
let mentEditDeck   = null;
let mentEditPalier = null;
let mentEditItem   = null;
let mentEditorFrom = null;  // 'browse' | 'paliers'
let mentHubMode   = 'revision'; // 'revision' | 'gestion'
let mentGestDeck  = 'fetes';   // deck actif dans l'onglet Gérer
let _mentNewItemId    = null; // pré-généré pour les nouveaux items
let _mentPendingImg   = null; // Blob en attente d'upload
let _mentDeleteImg    = false;
let _mentImgBlobUrl   = null; // object URL temporaire pour preview

/* ─── Supabase Storage — images mnémotechniques ─── */
const MENT_IMG_BUCKET = 'mentalisme-images';

async function _mentCompressImg(file) {
  return new Promise(resolve => {
    const img = new Image();
    const bUrl = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 700;
      let w = img.width, h = img.height;
      if (w > MAX || h > MAX) { const r = Math.min(MAX / w, MAX / h); w = Math.round(w * r); h = Math.round(h * r); }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(bUrl);
      canvas.toBlob(blob => resolve(blob), 'image/jpeg', 0.78);
    };
    img.src = bUrl;
  });
}

async function _mentUserId() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  return session ? session.user.id : null;
}

async function _mentUploadImg(itemId, blob) {
  const userId = await _mentUserId();
  if (!userId) return null;
  const path = `${userId}/${itemId}`;
  const { error } = await supabaseClient.storage.from(MENT_IMG_BUCKET).upload(path, blob, { upsert: true, contentType: 'image/jpeg' });
  if (error) { console.error('image upload:', error.message); return null; }
  const { data } = supabaseClient.storage.from(MENT_IMG_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

async function _mentRemoveImg(itemId) {
  const userId = await _mentUserId(); if (!userId) return;
  await supabaseClient.storage.from(MENT_IMG_BUCKET).remove([`${userId}/${itemId}`]);
}

function _mentSetImgUI(url) {
  const preview = document.getElementById('mentItemImgPreview');
  const label   = document.getElementById('mentItemImgLabel');
  const delBtn  = document.getElementById('mentItemImgDel');
  if (url) {
    preview.src = url; preview.classList.remove('hidden');
    label.textContent = '📷 Changer l\'image';
    delBtn.classList.remove('hidden');
  } else {
    preview.src = ''; preview.classList.add('hidden');
    label.textContent = '📷 Ajouter une image';
    delBtn.classList.add('hidden');
  }
}

/* ---- helpers ---- */
function mentDeck(id) { return state.mentalisme.decks[id]; }

function mentActivePalierIds(deckId) {
  return new Set(mentDeck(deckId).paliers.filter(p => p.unlockedAt).map(p => p.id));
}

function mentActiveItems(deckId) {
  const ids = mentActivePalierIds(deckId);
  return mentDeck(deckId).items.filter(i => ids.has(i.palierId));
}

function mentDueItems(deckId) {
  const sc = state.mentalisme.sessionCount;
  return mentActiveItems(deckId).filter(i => i.nextSession <= sc);
}

function _mentContinentPalierIds(deckId, continent) {
  if (!continent) return null;
  const ids = new Set(mentDeck(deckId).paliers.filter(p => p.name.startsWith(continent)).map(p => p.id));
  return ids;
}

function mentBuildQueue(deckId, continent) {
  const sc = state.mentalisme.sessionCount;
  let active = mentActiveItems(deckId);
  if (continent) {
    const ids = _mentContinentPalierIds(deckId, continent);
    active = active.filter(i => ids.has(i.palierId));
  }
  const due   = active.filter(i => i.nextSession <= sc);
  const maint = active.filter(i => i.level >= 5 && i.nextSession > sc && Math.random() < 0.10);
  const all = [...due, ...maint];
  for (let k = all.length - 1; k > 0; k--) {
    const j = Math.floor(Math.random() * (k + 1));
    [all[k], all[j]] = [all[j], all[k]];
  }
  return all;
}

function mentLevelDots(level) {
  return Array.from({length:6}, (_,i) =>
    `<span class="ment-dot${i < level ? ' filled' : ''}"></span>`
  ).join('');
}

/* ============ HUB PRINCIPAL ============ */
function renderMentalisme() {
  document.getElementById('mentTabRevision').classList.toggle('active', mentHubMode === 'revision');
  document.getElementById('mentTabGestion').classList.toggle('active', mentHubMode === 'gestion');
  if (mentHubMode === 'gestion') { renderMentGestion(); return; }

  const body = document.getElementById('mentBody');
  if (!body) return;
  body.innerHTML = '';

  ['fetes', 'anniversaires'].forEach(deckId => {
    const info    = MENT_DECK_INFO[deckId];
    const active  = mentActiveItems(deckId);
    const mastered = active.filter(i => i.level >= 5).length;
    const due     = mentDueItems(deckId).length;
    const pct     = active.length ? Math.round(mastered / active.length * 100) : 0;

    const card = document.createElement('div');
    card.className = 'ment-deck-card';
    card.innerHTML = `
      <div class="ment-deck-top">
        <span class="ment-deck-icon">${info.icon}</span>
        <div class="ment-deck-info">
          <div class="ment-deck-name">${info.label}</div>
          <div class="ment-deck-sub">
            ${active.length
              ? `${mastered}/${active.length} maîtrisées · <b class="${due > 0 ? 'ment-due' : 'ment-ok'}">${due > 0 ? due + ' à réviser' : '✓ À jour'}</b>`
              : '<span style="color:var(--muted)">Aucun palier actif</span>'}
          </div>
        </div>
      </div>
      ${active.length ? `<div class="ment-progbar"><div class="ment-progfill" style="width:${pct}%"></div></div>` : ''}
      <div class="ment-deck-btns">
        <button class="btn btn-primary ment-btn-start" data-deck="${deckId}">Pratiquer</button>
        <button class="btn btn-ghost ment-btn-paliers" data-deck="${deckId}" style="flex:none;padding:14px 16px" title="Gérer les paliers">≡</button>
      </div>
    `;
    body.appendChild(card);
  });

  body.querySelectorAll('.ment-btn-start').forEach(b =>
    b.addEventListener('click', () => {
      if (b.dataset.deck === 'fetes') mentShowContinentPicker();
      else mentStartSession(b.dataset.deck);
    }));
  body.querySelectorAll('.ment-btn-paliers').forEach(b =>
    b.addEventListener('click', () => mentOpenPaliers(b.dataset.deck)));
}

function renderMentGestion() {
  const body = document.getElementById('mentBody');
  if (!body) return;

  const deckId = mentGestDeck;
  const deck   = mentDeck(deckId);

  let html = `<div class="ment-gest-deck-tabs">`;
  Object.entries(MENT_DECK_INFO).forEach(([id, info]) => {
    html += `<button class="ment-gest-deck-tab${id === deckId ? ' active' : ''}" data-deck="${id}">${info.icon} ${info.label}</button>`;
  });
  html += `</div>`;

  deck.paliers.forEach(palier => {
    const items = deck.items.filter(i => i.palierId === palier.id);
    const locked = !palier.unlockedAt;
    html += `
      <div class="ment-gest-palier">
        <div class="ment-gest-palier-hdr">
          <span class="ment-gest-palier-name">${locked ? '🔒 ' : ''}${escapeHtml(palier.name)}</span>
          <button class="btn-sm ment-gest-add-btn" data-deck="${deckId}" data-pid="${palier.id}">+ Ajouter</button>
        </div>
        ${items.map(item => `
          <div class="ment-gest-item" data-deck="${deckId}" data-pid="${palier.id}" data-id="${item.id}">
            <span class="ment-gest-item-q">${escapeHtml(item.question)}</span>
            <span class="ment-gest-item-a">${escapeHtml(item.answer)}</span>
            ${item.imageUrl ? '<span style="font-size:.8rem;opacity:.6">🖼</span>' : ''}
            <div class="ment-dots-sm" style="flex-shrink:0">${mentLevelDots(item.level)}</div>
          </div>
        `).join('')}
        ${!items.length ? '<div class="hint" style="padding:4px 0 8px;font-size:.8rem">Aucune carte.</div>' : ''}
      </div>
    `;
  });

  body.innerHTML = html;

  body.querySelectorAll('.ment-gest-deck-tab').forEach(b =>
    b.addEventListener('click', () => { mentGestDeck = b.dataset.deck; renderMentGestion(); }));

  body.querySelectorAll('.ment-gest-add-btn').forEach(b =>
    b.addEventListener('click', () => {
      mentEditDeck = b.dataset.deck; mentEditPalier = b.dataset.pid;
      mentEditItem = null; mentEditorFrom = 'gestion';
      mentOpenItemEditor();
    }));

  body.querySelectorAll('.ment-gest-item').forEach(row =>
    row.addEventListener('click', () => {
      mentEditDeck = row.dataset.deck; mentEditPalier = row.dataset.pid;
      mentEditItem = row.dataset.id;  mentEditorFrom = 'gestion';
      mentOpenItemEditor();
    }));
}

/* ============ SESSION ============ */
function mentShowContinentPicker() {
  const CONTINENTS = ['Europe','Amériques','Afrique','Asie','Océanie'];
  const list = document.getElementById('mentContinentList');
  const dueByC = {};
  CONTINENTS.forEach(c => {
    const ids = _mentContinentPalierIds('fetes', c);
    const due = mentDueItems('fetes').filter(i => ids.has(i.palierId)).length;
    dueByC[c] = due;
  });
  const totalDue = mentDueItems('fetes').length;
  list.innerHTML = `<button class="btn btn-ghost" data-c="" style="width:100%">🌍 Tous les continents${totalDue > 0 ? ` <b>(${totalDue})</b>` : ''}</button>`
    + CONTINENTS.map(c => `<button class="btn btn-ghost" data-c="${c}" style="width:100%">${c}${dueByC[c] > 0 ? ` <b>(${dueByC[c]})</b>` : ''}</button>`).join('');
  list.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
    document.getElementById('mentContinentPicker').classList.add('hidden');
    mentStartSession('fetes', b.dataset.c || null);
  }));
  document.getElementById('mentContinentPicker').classList.remove('hidden');
}

function mentStartSession(deckId, continent) {
  const queue = mentBuildQueue(deckId, continent);
  if (!queue.length) {
    const msg = document.getElementById('mentHubMsg');
    const label = continent ? `${continent} (${MENT_DECK_INFO[deckId].label})` : MENT_DECK_INFO[deckId].label;
    msg.textContent = `Rien à réviser pour "${label}" !`;
    msg.classList.remove('hidden');
    setTimeout(() => msg.classList.add('hidden'), 3000);
    return;
  }
  mentSess = { deckId, queue, idx: 0, flipped: false, rc: { bad:0, ok:0, good:0 } };
  document.getElementById('mentSessCardWrap').classList.remove('hidden');
  document.getElementById('mentSessRecap').classList.add('hidden');
  mentRenderCard();
  show('mentalisme-session');
}

function mentRenderCard() {
  if (!mentSess) return;
  const { deckId, queue, idx } = mentSess;
  const item = queue[idx];
  const info = MENT_DECK_INFO[deckId];

  document.getElementById('mentSessTitle').textContent    = info.label;
  document.getElementById('mentSessProgress').textContent = `${idx + 1} / ${queue.length}`;
  document.getElementById('mentSessQ').textContent        = item.question;
  document.getElementById('mentSessLvl').innerHTML        = mentLevelDots(item.level);

  mentSess.answered      = false;
  mentSess.cardStartTime = Date.now();

  document.getElementById('mentSessInputWrap').classList.remove('hidden');
  document.getElementById('mentSessGiveUpBtn').classList.remove('hidden');
  document.getElementById('mentSessAnswerBlock').classList.add('hidden');
  document.getElementById('mentSessContinueBtn').classList.add('hidden');

  document.getElementById('mentSessDate').textContent = item.answer;
  const majorEl = document.getElementById('mentSessMajorRow');
  majorEl.textContent = item.majorHint || '';
  majorEl.classList.toggle('hidden', !item.majorHint);
  document.getElementById('mentSessMnemInput').value = item.mnemonic || '';

  const imgEl    = document.getElementById('mentSessImg');
  const imgBtn   = document.getElementById('mentSessImgBtn');
  const hintBtn  = document.getElementById('mentSessHintBtn');
  const hintText = document.getElementById('mentSessHintText');
  imgEl.src = ''; imgEl.classList.add('hidden');
  hintText.classList.add('hidden'); hintText.textContent = '';
  imgBtn.textContent  = '🖼 Image';
  hintBtn.textContent = '💬 Aide';
  imgBtn.classList.toggle('hidden', !item.imageUrl);
  hintBtn.classList.toggle('hidden', !item.mnemonic);
  if (item.imageUrl) imgEl.src = item.imageUrl;
  if (item.mnemonic) hintText.textContent = item.mnemonic;

  const inp = document.getElementById('mentSessInput');
  inp.value = '';
  setTimeout(() => inp.focus(), 50);
}

function mentCheckAnswer(typed, correct) {
  const m = typed.trim().match(/^(\d{1,2})\/(\d{1,2})$/);
  if (!m) return false;
  const day = parseInt(m[1], 10), month = parseInt(m[2], 10);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const typedFr = `${day === 1 ? '1er' : day} ${MONTHS_FR[month - 1]}`;
  function norm(s) {
    return (s || '').toLowerCase().trim().replace(/\b1er\b/g, '1').replace(/\s+/g, ' ');
  }
  return norm(typedFr) === norm(correct);
}

function answerToJJMM(answer) {
  const lower = (answer || '').toLowerCase().trim();
  for (let i = 0; i < MONTHS_FR.length; i++) {
    if (lower.endsWith(MONTHS_FR[i])) {
      const day = parseInt(lower.replace(MONTHS_FR[i], '').replace('er', ''), 10);
      if (!isNaN(day)) return String(day).padStart(2,'0') + '/' + String(i+1).padStart(2,'0');
    }
  }
  return '';
}

function mentSubmitAnswer() {
  if (!mentSess || mentSess.answered) return;
  const inp   = document.getElementById('mentSessInput');
  const typed = inp.value.trim();
  if (!typed) return;

  const elapsed = Date.now() - mentSess.cardStartTime;
  const { deckId, queue, idx } = mentSess;
  const item    = queue[idx];
  const correct = mentCheckAnswer(typed, item.answer);
  const rating  = !correct ? 'bad' : elapsed < 6000 ? 'good' : 'ok';

  mentSess.answered = true;

  const si = mentDeck(deckId).items.find(i => i.id === item.id);
  if (si) {
    if (rating === 'bad') { si.level = Math.max(0, si.level - 1); si.errorCount = (si.errorCount || 0) + 1; }
    if (rating === 'good') si.level = Math.min(5, si.level + 1);
    const sc = state.mentalisme.sessionCount;
    si.lastSession = sc;
    si.nextSession = sc + MENT_INTERVALS[si.level];
    save();
  }
  mentSess.rc[rating]++;

  const feedbackLine = document.getElementById('mentSessFeedbackLine');
  if (correct) {
    feedbackLine.textContent = rating === 'good' ? '✅ Correct !' : '😐 Correct, mais hésitant…';
    feedbackLine.className   = `ment-feedback-line ${rating}`;
  } else {
    const jjmm = answerToJJMM(item.answer);
    feedbackLine.innerHTML = `❌ Raté — <b>${escapeHtml(jjmm)}</b> · ${escapeHtml(item.answer)}`;
    feedbackLine.className = 'ment-feedback-line bad';
  }

  document.getElementById('mentSessInputWrap').classList.add('hidden');
  document.getElementById('mentSessGiveUpBtn').classList.add('hidden');
  document.getElementById('mentSessAnswerBlock').classList.remove('hidden');
  document.getElementById('mentSessContinueBtn').classList.remove('hidden');
  document.getElementById('mentSessContinueBtn').focus();
}

function mentGiveUp() {
  if (!mentSess || mentSess.answered) return;
  const { deckId, queue, idx } = mentSess;
  const item = queue[idx];
  mentSess.answered = true;
  const si = mentDeck(deckId).items.find(i => i.id === item.id);
  if (si) {
    si.level = Math.max(0, si.level - 1);
    si.errorCount = (si.errorCount || 0) + 1;
    const sc = state.mentalisme.sessionCount;
    si.lastSession = sc;
    si.nextSession = sc + MENT_INTERVALS[si.level];
    save();
  }
  mentSess.rc.bad++;
  const jjmm = answerToJJMM(item.answer);
  const feedbackLine = document.getElementById('mentSessFeedbackLine');
  feedbackLine.innerHTML = `❓ Je ne sais pas — <b>${escapeHtml(jjmm)}</b> · ${escapeHtml(item.answer)}`;
  feedbackLine.className = 'ment-feedback-line bad';
  document.getElementById('mentSessInputWrap').classList.add('hidden');
  document.getElementById('mentSessGiveUpBtn').classList.add('hidden');
  document.getElementById('mentSessAnswerBlock').classList.remove('hidden');
  document.getElementById('mentSessContinueBtn').classList.remove('hidden');
  document.getElementById('mentSessContinueBtn').focus();
}

function mentContinue() {
  if (!mentSess) return;
  const item = mentDeck(mentSess.deckId).items.find(i => i.id === mentSess.queue[mentSess.idx]?.id);
  if (item) { item.mnemonic = document.getElementById('mentSessMnemInput').value.trim(); save(); }
  if (mentSess.idx + 1 < mentSess.queue.length) {
    mentSess.idx++;
    mentRenderCard();
  } else {
    mentSessionEnd();
  }
}

function _mentTrackDaily() {
  const today = new Date().toISOString().slice(0, 10);
  if (!state.settings.dailyStats) state.settings.dailyStats = {};
  if (!state.settings.dailyStats[today]) state.settings.dailyStats[today] = { carto: 0, ment: 0 };
  state.settings.dailyStats[today].ment++;
  const cutoff = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  Object.keys(state.settings.dailyStats).forEach(k => { if (k < cutoff) delete state.settings.dailyStats[k]; });
}

function mentSessionEnd() {
  if (!mentSess) return;
  state.mentalisme.sessionCount++;
  _mentTrackDaily();
  save();
  const rc    = { ...mentSess.rc };
  const total = rc.bad + rc.ok + rc.good;
  const sc    = state.mentalisme.sessionCount;
  mentSess = null;

  document.getElementById('mentSessCardWrap').classList.add('hidden');
  document.getElementById('mentSessRecap').classList.remove('hidden');
  document.getElementById('mentSessTitle').textContent    = 'Terminé';
  document.getElementById('mentSessProgress').textContent = '✓';
  document.getElementById('mentSessRecapText').innerHTML  = `
    <div class="ment-recap-done">Session terminée !</div>
    <div class="ment-recap-row"><span>❌ Raté</span><b>${rc.bad}</b></div>
    <div class="ment-recap-row"><span>😐 Hésitant</span><b>${rc.ok}</b></div>
    <div class="ment-recap-row"><span>✅ Maîtrisé</span><b>${rc.good}</b></div>
    <div class="ment-recap-row ment-recap-total">
      <span>${total} carte${total !== 1 ? 's' : ''} révisée${total !== 1 ? 's' : ''}</span>
      <b>Session #${sc}</b>
    </div>
  `;
}

/* ============ CONSULTER ============ */
function mentOpenBrowse(deckId) {
  mentBrowseDeck = deckId;
  mentEditorFrom = 'browse';
  document.getElementById('mentBrowseSearch').value = '';
  renderMentBrowse('');
  show('mentalisme-browse');
}

function renderMentBrowse(q) {
  const deckId = mentBrowseDeck;
  const info   = MENT_DECK_INFO[deckId];
  document.getElementById('mentBrowseTitle').textContent = info.label;

  const deck = mentDeck(deckId);
  const sq   = q.toLowerCase();
  let html   = '';

  deck.paliers.forEach(palier => {
    const items = deck.items.filter(i =>
      i.palierId === palier.id &&
      (!sq || i.question.toLowerCase().includes(sq) || i.answer.toLowerCase().includes(sq))
    );
    if (!items.length && sq) return;

    const active = !!palier.unlockedAt;
    html += `<div class="ment-group-label${active ? '' : ' locked'}">${active ? '' : '🔒 '}${escapeHtml(palier.name)} <span style="color:var(--muted);font-weight:normal">(${items.length})</span></div>`;

    if (!items.length) {
      html += `<div class="hint" style="padding:4px 4px 12px">Aucune carte.</div>`;
      return;
    }
    html += items.map(item => `
      <div class="ment-item-row" data-id="${item.id}" data-pid="${palier.id}">
        <div class="ment-item-q">${escapeHtml(item.question)}</div>
        <div class="ment-item-a">${escapeHtml(item.answer)}</div>
        <div class="ment-dots-sm">${mentLevelDots(item.level)}</div>
      </div>
    `).join('');
  });

  const list = document.getElementById('mentBrowseList');
  list.innerHTML = html || '<div class="hint" style="padding:16px">Aucune carte trouvée.</div>';
  list.querySelectorAll('.ment-item-row').forEach(row => {
    row.addEventListener('click', () => {
      mentEditDeck   = deckId;
      mentEditPalier = row.dataset.pid;
      mentEditItem   = row.dataset.id;
      mentEditorFrom = 'browse';
      mentOpenItemEditor();
    });
  });
}

/* ============ STATS ============ */
function mentOpenStats() {
  renderMentStats();
  show('mentalisme-stats');
}

function renderMentStats() {
  const body = document.getElementById('mentStatsBody');
  const LEVEL_COLORS = ['#b56','#c87','#aa7','#7a9','#4a8','#4c6'];
  const LEVEL_LABELS = ['Nouveau','Hésitant','Correct','Bien','Très bien','Maîtrisé'];

  let html = `
    <div class="ment-stat-card">
      <div class="ment-stat-row">
        <span>Sessions complétées</span>
        <b style="color:var(--brass);font-size:1.25rem">${state.mentalisme.sessionCount}</b>
      </div>
    </div>
  `;

  ['fetes', 'anniversaires'].forEach(deckId => {
    const info = MENT_DECK_INFO[deckId];
    const deck = mentDeck(deckId);
    html += `<div class="ment-stat-card">`;
    html += `<div class="ment-stat-hdr">${info.icon} ${info.label}</div>`;

    if (!deck.items.length) {
      html += `<div class="hint">Aucune carte.</div></div>`;
      return;
    }

    const levels = [0,0,0,0,0,0];
    deck.items.forEach(i => levels[i.level]++);
    const total = deck.items.length;

    html += `<div class="ment-lvl-bar">`;
    for (let l = 0; l <= 5; l++) {
      if (levels[l]) {
        html += `<div class="ment-lvl-seg" style="flex:${levels[l]};background:${LEVEL_COLORS[l]}" title="${LEVEL_LABELS[l]}: ${levels[l]}">${levels[l]}</div>`;
      }
    }
    html += `</div>`;

    html += `<div class="ment-lvl-legend">`;
    for (let l = 0; l <= 5; l++) {
      html += `<div style="text-align:center"><div style="color:${LEVEL_COLORS[l]};font-size:.66rem">${LEVEL_LABELS[l]}</div><b style="font-size:.82rem">${levels[l]}</b></div>`;
    }
    html += `</div>`;

    html += `<div style="margin-top:12px;display:flex;flex-direction:column;gap:8px">`;
    deck.paliers.forEach(palier => {
      const pItems = deck.items.filter(i => i.palierId === palier.id);
      if (!pItems.length && !palier.unlockedAt) return;
      const m   = pItems.filter(i => i.level >= 5).length;
      const pct = pItems.length ? Math.round(m / pItems.length * 100) : 0;
      const act = !!palier.unlockedAt;
      html += `
        <div>
          <div style="display:flex;justify-content:space-between;margin-bottom:3px;font-size:.82rem">
            <span style="color:${act ? 'var(--text)' : 'var(--muted)'}">${act ? '' : '🔒 '}${escapeHtml(palier.name)}</span>
            <span style="color:var(--muted)">${m}/${pItems.length} (${pct}%)</span>
          </div>
          ${act && pItems.length ? `<div class="ment-progbar"><div class="ment-progfill" style="width:${pct}%"></div></div>` : ''}
        </div>
      `;
    });
    html += `</div></div>`;
  });

  // Top erreurs tous decks confondus
  const allErrors = [];
  ['fetes','anniversaires'].forEach(deckId => {
    mentDeck(deckId).items.forEach(item => {
      if ((item.errorCount || 0) > 0) allErrors.push({ ...item, deckId });
    });
  });
  allErrors.sort((a, b) => (b.errorCount || 0) - (a.errorCount || 0));
  if (allErrors.length) {
    html += `<div class="ment-stat-card" style="margin-top:8px">`;
    html += `<div class="ment-stat-hdr">❌ Erreurs fréquentes</div>`;
    html += `<div style="display:flex;flex-direction:column;gap:6px;margin-top:10px">`;
    allErrors.slice(0, 10).forEach(item => {
      html += `
        <div style="display:flex;align-items:center;gap:10px;background:var(--panel);border-radius:8px;padding:8px 12px;border:1px solid var(--line)">
          <span style="flex:1;font-size:.88rem;font-weight:500">${escapeHtml(item.question)}</span>
          <span style="font-size:.8rem;color:var(--muted)">${escapeHtml(item.answer)}</span>
          <span style="font-size:.78rem;color:var(--red);font-weight:700;flex-shrink:0">×${item.errorCount}</span>
        </div>`;
    });
    html += `</div></div>`;
  }

  body.innerHTML = html;
}

/* ============ PALIERS ============ */
function mentOpenPaliers(deckId) {
  mentPalierDeck = deckId;
  mentEditorFrom = 'paliers';
  renderMentPaliers();
  show('mentalisme-paliers');
}

function renderMentPaliers() {
  const deckId = mentPalierDeck;
  const deck   = mentDeck(deckId);
  const info   = MENT_DECK_INFO[deckId];
  document.getElementById('mentPaliersTitle').textContent = `${info.icon} ${info.label}`;

  const list = document.getElementById('mentPaliersList');
  if (!deck.paliers.length) {
    list.innerHTML = '<div class="hint" style="padding:16px">Aucun palier. Crée-en un ci-dessous !</div>';
    return;
  }

  list.innerHTML = deck.paliers.map(palier => {
    const items = deck.items.filter(i => i.palierId === palier.id);
    const m     = items.filter(i => i.level >= 5).length;
    const pct   = items.length ? Math.round(m / items.length * 100) : 0;
    const act   = !!palier.unlockedAt;

    return `
      <div class="ment-palier-card">
        <div class="ment-palier-head">
          <span class="ment-palier-name">${act ? '' : '🔒 '}${escapeHtml(palier.name)}</span>
          <div style="display:flex;gap:6px;align-items:center;flex-shrink:0">
            ${!act ? `<button class="btn btn-ghost" style="padding:6px 10px;font-size:.78rem" data-unlock="${palier.id}">Débloquer</button>` : ''}
            <button class="btn btn-ghost" style="padding:6px 10px;font-size:.78rem" data-add-item="${palier.id}">+ Carte</button>
            <button class="link" style="color:var(--muted);font-size:.9rem;padding:6px 8px" data-del-palier="${palier.id}">✕</button>
          </div>
        </div>
        ${act && items.length ? `<div class="ment-progbar" style="margin:6px 0 4px"><div class="ment-progfill" style="width:${pct}%"></div></div>` : ''}
        <div class="hint" style="margin-bottom:${items.length ? '8px' : '0'}">${items.length} carte${items.length !== 1 ? 's' : ''}${act && items.length ? ` · ${m} maîtrisée${m!==1?'s':''}` : ''}</div>
        <div class="ment-chip-wrap">
          ${items.map(item => `<div class="ment-chip" data-iid="${item.id}" data-pid="${palier.id}">${escapeHtml(item.question)}</div>`).join('')}
        </div>
      </div>
    `;
  }).join('');

  list.querySelectorAll('[data-unlock]').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = deck.paliers.find(p => p.id === btn.dataset.unlock);
      if (p) { p.unlockedAt = Date.now(); save(); renderMentPaliers(); renderMentalisme(); }
    });
  });

  list.querySelectorAll('[data-add-item]').forEach(btn => {
    btn.addEventListener('click', () => {
      mentEditDeck   = deckId;
      mentEditPalier = btn.dataset.addItem;
      mentEditItem   = null;
      mentEditorFrom = 'paliers';
      mentOpenItemEditor();
    });
  });

  list.querySelectorAll('[data-del-palier]').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = deck.paliers.find(p => p.id === btn.dataset.delPalier);
      const n = deck.items.filter(i => i.palierId === p.id).length;
      confirmDelete(
        `Supprimer "${p.name}" ?`,
        n ? `Ce palier contient ${n} carte${n>1?'s':''}, qui seront supprimées.` : 'Ce palier est vide.',
        () => {
          deck.items   = deck.items.filter(i => i.palierId !== p.id);
          deck.paliers = deck.paliers.filter(x => x.id !== p.id);
          save(); renderMentPaliers(); renderMentalisme();
        }
      );
    });
  });

  list.querySelectorAll('.ment-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      mentEditDeck   = deckId;
      mentEditPalier = chip.dataset.pid;
      mentEditItem   = chip.dataset.iid;
      mentEditorFrom = 'paliers';
      mentOpenItemEditor();
    });
  });
}

function mentAddPalier() {
  const inp  = document.getElementById('mentPalierNewName');
  const name = inp.value.trim();
  if (!name) return;
  mentDeck(mentPalierDeck).paliers.push({ id: uid(), name, unlockedAt: null });
  save();
  inp.value = '';
  renderMentPaliers();
}

/* ============ ÉDITEUR CARTE ============ */
function mentOpenItemEditor() {
  const deck = mentDeck(mentEditDeck);
  const info = MENT_DECK_INFO[mentEditDeck];

  const sel = document.getElementById('mentItemPalier');
  sel.innerHTML = deck.paliers.map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('');
  sel.value = mentEditPalier || deck.paliers[0]?.id;

  document.getElementById('mentItemQLabel').textContent = info.qLabel;
  document.getElementById('mentItemALabel').textContent = info.aLabel;

  // reset image state
  _mentPendingImg = null; _mentDeleteImg = false;
  if (_mentImgBlobUrl) { URL.revokeObjectURL(_mentImgBlobUrl); _mentImgBlobUrl = null; }

  if (mentEditItem) {
    const item = deck.items.find(i => i.id === mentEditItem);
    _mentNewItemId = null;
    document.getElementById('mentItemEditorTitle').textContent = 'Modifier la carte';
    document.getElementById('mentItemQ').value     = item.question;
    document.getElementById('mentItemA').value     = item.answer;
    document.getElementById('mentItemMajor').value = item.majorHint || '';
    document.getElementById('mentItemMnem').value  = item.mnemonic  || '';
    document.getElementById('mentItemLvlRow').classList.remove('hidden');
    document.getElementById('mentItemLvlDots').innerHTML = mentLevelDots(item.level);
    document.getElementById('mentItemDelete').classList.remove('hidden');
    _mentSetImgUI(item.imageUrl || '');
  } else {
    _mentNewItemId = uid();
    document.getElementById('mentItemEditorTitle').textContent = 'Nouvelle carte';
    document.getElementById('mentItemQ').value     = '';
    document.getElementById('mentItemA').value     = '';
    document.getElementById('mentItemMajor').value = '';
    document.getElementById('mentItemMnem').value  = '';
    document.getElementById('mentItemLvlRow').classList.add('hidden');
    document.getElementById('mentItemDelete').classList.add('hidden');
    _mentSetImgUI('');
  }

  show('mentalisme-item-editor');
}

function mentItemGoBack() {
  if (mentEditorFrom === 'paliers') {
    renderMentPaliers();
    show('mentalisme-paliers');
  } else if (mentEditorFrom === 'gestion') {
    show('mentalisme');
    renderMentalisme();
  } else {
    renderMentBrowse(document.getElementById('mentBrowseSearch').value || '');
    show('mentalisme-browse');
  }
}

async function saveMentItem() {
  const q = document.getElementById('mentItemQ').value.trim();
  const a = document.getElementById('mentItemA').value.trim();
  if (!q || !a) return;
  const deck      = mentDeck(mentEditDeck);
  const palierId  = document.getElementById('mentItemPalier').value;
  const major     = document.getElementById('mentItemMajor').value.trim();
  const mnem      = document.getElementById('mentItemMnem').value.trim();
  const resolvedId = mentEditItem || _mentNewItemId;

  let imageUrl = mentEditItem ? ((deck.items.find(i => i.id === mentEditItem) || {}).imageUrl || '') : '';

  if (_mentDeleteImg && mentEditItem && imageUrl) { await _mentRemoveImg(mentEditItem); imageUrl = ''; }
  if (_mentPendingImg) {
    const url = await _mentUploadImg(resolvedId, _mentPendingImg);
    if (url) imageUrl = url;
    _mentPendingImg = null;
  }

  if (mentEditItem) {
    Object.assign(deck.items.find(i => i.id === mentEditItem), { question:q, answer:a, majorHint:major, mnemonic:mnem, palierId, imageUrl });
  } else {
    deck.items.push({ id:resolvedId, palierId, question:q, answer:a, majorHint:major, mnemonic:mnem, imageUrl, level:0, lastSession:0, nextSession:0 });
  }
  save();
  mentItemGoBack();
}

function deleteMentItem() {
  const deck = mentDeck(mentEditDeck);
  const item = deck.items.find(i => i.id === mentEditItem);
  confirmDelete(
    `Supprimer "${item.question}" ?`,
    'Cette carte et sa progression seront perdues.',
    async () => {
      if (item.imageUrl) await _mentRemoveImg(mentEditItem);
      deck.items = deck.items.filter(i => i.id !== mentEditItem);
      save();
      mentItemGoBack();
    }
  );
}

/* ============ ÉVÉNEMENTS ============ */
document.getElementById('mentStatsBtn').addEventListener('click', mentOpenStats);
document.getElementById('mentStatsBack').addEventListener('click', () => { show('mentalisme'); renderMentalisme(); });

// Session
document.getElementById('mentSessSubmitBtn').addEventListener('click', mentSubmitAnswer);
document.getElementById('mentSessInput').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); mentSubmitAnswer(); } });
document.getElementById('mentSessInput').addEventListener('input', function() {
  let d = this.value.replace(/\D/g, '').slice(0, 4);
  this.value = d.length > 2 ? d.slice(0, 2) + '/' + d.slice(2) : d;
});
document.getElementById('mentSessGiveUpBtn').addEventListener('click', mentGiveUp);
document.getElementById('mentSessImgBtn').addEventListener('click', () => {
  const imgEl = document.getElementById('mentSessImg');
  const btn   = document.getElementById('mentSessImgBtn');
  imgEl.classList.toggle('hidden');
  btn.textContent = imgEl.classList.contains('hidden') ? '🖼 Image' : '🖼 Masquer';
});
document.getElementById('mentSessHintBtn').addEventListener('click', () => {
  const el  = document.getElementById('mentSessHintText');
  const btn = document.getElementById('mentSessHintBtn');
  el.classList.toggle('hidden');
  btn.textContent = el.classList.contains('hidden') ? '💬 Aide' : '💬 Masquer';
});
document.getElementById('mentContinentCancel').addEventListener('click', () =>
  document.getElementById('mentContinentPicker').classList.add('hidden'));

document.getElementById('mentTabRevision').addEventListener('click', () => {
  mentHubMode = 'revision'; renderMentalisme();
});
document.getElementById('mentTabGestion').addEventListener('click', () => {
  mentHubMode = 'gestion'; renderMentalisme();
});
document.getElementById('mentSessContinueBtn').addEventListener('click', mentContinue);
document.getElementById('mentSessRecapBack').addEventListener('click', () => { show('mentalisme'); renderMentalisme(); });
document.getElementById('mentSessQuit').addEventListener('click', () => {
  if (mentSess) {
    const rated = mentSess.rc.bad + mentSess.rc.ok + mentSess.rc.good;
    if (rated > 0) { state.mentalisme.sessionCount++; save(); }
    mentSess = null;
  }
  show('mentalisme'); renderMentalisme();
});
document.getElementById('mentSessMnemInput').addEventListener('blur', () => {
  if (!mentSess) return;
  const item = mentDeck(mentSess.deckId).items.find(i => i.id === mentSess.queue[mentSess.idx]?.id);
  if (item) { item.mnemonic = document.getElementById('mentSessMnemInput').value.trim(); save(); }
});

// Browse
document.getElementById('mentBrowseBack').addEventListener('click', () => { show('mentalisme'); renderMentalisme(); });
document.getElementById('mentBrowseSearch').addEventListener('input', e => renderMentBrowse(e.target.value));
document.getElementById('mentBrowseAddBtn').addEventListener('click', () => {
  const deck  = mentDeck(mentBrowseDeck);
  const first = deck.paliers.find(p => p.unlockedAt);
  if (!first) { alert('Créez et débloquez d\'abord un palier.'); return; }
  mentEditDeck   = mentBrowseDeck;
  mentEditPalier = first.id;
  mentEditItem   = null;
  mentEditorFrom = 'browse';
  mentOpenItemEditor();
});

// Paliers
document.getElementById('mentPaliersBack').addEventListener('click', () => { show('mentalisme'); renderMentalisme(); });
document.getElementById('mentPalierAddBtn').addEventListener('click', mentAddPalier);
document.getElementById('mentPalierNewName').addEventListener('keydown', e => { if (e.key === 'Enter') mentAddPalier(); });

// Éditeur carte
document.getElementById('mentItemCancel').addEventListener('click', mentItemGoBack);
document.getElementById('mentItemSave').addEventListener('click', saveMentItem);
document.getElementById('mentItemDelete').addEventListener('click', deleteMentItem);

document.getElementById('mentItemImgLabel').addEventListener('click', () => {
  document.getElementById('mentItemImgInput').click();
});
document.getElementById('mentItemImgInput').addEventListener('change', async e => {
  const file = e.target.files[0]; if (!file) return;
  e.target.value = '';
  if (_mentImgBlobUrl) { URL.revokeObjectURL(_mentImgBlobUrl); _mentImgBlobUrl = null; }
  _mentPendingImg = await _mentCompressImg(file);
  _mentImgBlobUrl = URL.createObjectURL(_mentPendingImg);
  _mentDeleteImg = false;
  _mentSetImgUI(_mentImgBlobUrl);
});

document.getElementById('mentItemImgDel').addEventListener('click', () => {
  _mentPendingImg = null; _mentDeleteImg = true;
  if (_mentImgBlobUrl) { URL.revokeObjectURL(_mentImgBlobUrl); _mentImgBlobUrl = null; }
  _mentSetImgUI('');
});
