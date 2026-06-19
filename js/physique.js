/* ============ module Physique ============ */

let phyExEditId = null;
let phyRtEditId = null;
let phySession = null;
let phySessionInt = null;
let phyCatFilter = '';
let phyRtDraftSteps = [];

const PHY_ICON = { 'Flexibilité': '🤸', 'Mobilité': '🔄', 'Force': '💪', 'Précision': '🎯' };
const PHY_CATS = ['Flexibilité', 'Mobilité', 'Force', 'Précision'];

function phyInit() {
  if (!state.physique || typeof state.physique !== 'object') state.physique = { exercises: [], routines: [] };
  if (!Array.isArray(state.physique.exercises)) state.physique.exercises = [];
  if (!Array.isArray(state.physique.routines)) state.physique.routines = [];
}

/* ---------- exercices : liste ---------- */

function renderPhyExList() {
  phyInit();
  const list = document.getElementById('phyExList');
  const exs = [...state.physique.exercises]
    .filter(e => !phyCatFilter || e.category === phyCatFilter)
    .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
  if (!exs.length) {
    list.innerHTML = `<div class="empty">${phyCatFilter ? 'Aucun exercice dans cette catégorie.<br>' : ''}Touche « + Ajouter » pour commencer.</div>`;
    return;
  }
  list.innerHTML = '';
  exs.forEach(ex => {
    const el = document.createElement('div');
    el.className = 'tech phy-ex-row';
    el.innerHTML = `
      <div class="phy-cat-icon">${PHY_ICON[ex.category] || '●'}</div>
      <div class="body">
        <div class="name">${escapeHtml(ex.name)}</div>
        <div class="meta">
          <span class="badge">${escapeHtml(ex.category)}</span>
          <span class="badge">${ex.durationType === 'time' ? ex.duration + ' s' : ex.duration + ' rép.'}</span>
        </div>
      </div>`;
    el.addEventListener('click', () => openPhyExEditor(ex.id));
    list.appendChild(el);
  });
}

/* ---------- exercices : éditeur ---------- */

function openPhyExEditor(id) {
  phyExEditId = id || null;
  const ex = id ? state.physique.exercises.find(e => e.id === id) : null;
  document.getElementById('phyExTitle').textContent = ex ? 'Modifier l\'exercice' : 'Nouvel exercice';
  document.getElementById('phy_name').value = ex ? ex.name : '';
  document.getElementById('phy_cat').value = ex ? ex.category : 'Flexibilité';
  document.getElementById('phy_desc').value = ex ? (ex.description || '') : '';
  document.getElementById('phy_dur_type').value = ex ? ex.durationType : 'time';
  document.getElementById('phy_dur_val').value = ex ? ex.duration : 30;
  document.getElementById('phyExDelete').classList.toggle('hidden', !id);
  show('physique-editor');
}

function savePhyEx() {
  const name = document.getElementById('phy_name').value.trim();
  if (!name) return;
  phyInit();
  const data = {
    name,
    category: document.getElementById('phy_cat').value,
    description: document.getElementById('phy_desc').value.trim(),
    durationType: document.getElementById('phy_dur_type').value,
    duration: parseInt(document.getElementById('phy_dur_val').value, 10) || 30,
  };
  if (phyExEditId) {
    const ex = state.physique.exercises.find(e => e.id === phyExEditId);
    if (ex) Object.assign(ex, data);
  } else {
    state.physique.exercises.push({ id: uid(), ...data });
  }
  save();
  renderPhyExList();
  show('physique');
}

function deletePhyEx() {
  if (!phyExEditId) return;
  phyInit();
  state.physique.exercises = state.physique.exercises.filter(e => e.id !== phyExEditId);
  state.physique.routines.forEach(r => { r.steps = r.steps.filter(s => s.exId !== phyExEditId); });
  save();
  renderPhyExList();
  show('physique');
}

/* ---------- routines : liste ---------- */

function renderPhyRoutineList() {
  phyInit();
  const list = document.getElementById('phyRoutineList');
  if (!state.physique.routines.length) {
    list.innerHTML = '<div class="empty">Aucune routine.<br>Touche « + Créer » pour composer une routine.</div>';
    return;
  }
  list.innerHTML = '';
  state.physique.routines.forEach(rt => {
    const validSteps = rt.steps.filter(s => state.physique.exercises.find(e => e.id === s.exId));
    const totalSec = validSteps.reduce((sum, s) => {
      const ex = state.physique.exercises.find(e => e.id === s.exId);
      return sum + (ex && ex.durationType === 'time' ? (s.duration || ex.duration) : 0);
    }, 0);
    const el = document.createElement('div');
    el.className = 'tech';
    el.innerHTML = `
      <div class="body">
        <div class="name">${escapeHtml(rt.name)}</div>
        <div class="meta">
          <span class="badge">${validSteps.length} exercice${validSteps.length !== 1 ? 's' : ''}</span>
          ${totalSec ? `<span class="badge">~${Math.round(totalSec / 60)} min</span>` : ''}
        </div>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <button class="link phy-rt-edit-btn" style="font-size:.8rem;color:var(--muted)">Éditer</button>
        <button class="btn btn-primary phy-rt-start-btn" style="padding:10px 16px;font-size:.88rem;flex:none"${!validSteps.length ? ' disabled' : ''}>▶</button>
      </div>`;
    el.querySelector('.phy-rt-edit-btn').addEventListener('click', e => { e.stopPropagation(); openPhyRtEditor(rt.id); });
    el.querySelector('.phy-rt-start-btn').addEventListener('click', e => { e.stopPropagation(); startPhySession(rt.id); });
    list.appendChild(el);
  });
}

/* ---------- routines : éditeur ---------- */

function openPhyRtEditor(id) {
  phyRtEditId = id || null;
  const rt = id ? state.physique.routines.find(r => r.id === id) : null;
  document.getElementById('phyRtTitle').textContent = rt ? 'Modifier la routine' : 'Nouvelle routine';
  document.getElementById('phyRt_name').value = rt ? rt.name : '';
  phyRtDraftSteps = rt ? rt.steps.map(s => ({ ...s })) : [];
  document.getElementById('phyRtDelete').classList.toggle('hidden', !id);
  renderPhyRtSteps();
  show('physique-routine-editor');
}

function renderPhyRtSteps() {
  phyInit();
  const container = document.getElementById('phyRtSteps');
  if (!phyRtDraftSteps.length) {
    container.innerHTML = '<p class="hint" style="margin:4px 0">Aucun exercice dans cette routine.</p>';
    updatePhyRtHint();
    return;
  }
  container.innerHTML = '';
  phyRtDraftSteps.forEach((step, i) => {
    const ex = state.physique.exercises.find(e => e.id === step.exId);
    const dur = step.duration || (ex ? ex.duration : 30);
    const div = document.createElement('div');
    div.className = 'phy-step-row';
    div.innerHTML = `
      <div class="phy-step-num">${i + 1}</div>
      <div class="phy-step-name">${ex ? `${PHY_ICON[ex.category] || ''} ${escapeHtml(ex.name)}` : '—'}</div>
      <input type="number" class="phy-step-dur-inp" min="1" value="${dur}" style="width:58px;padding:6px 8px;text-align:center;font-size:.85rem">
      <span class="hint" style="white-space:nowrap">${ex && ex.durationType === 'reps' ? 'rép.' : 's'}</span>
      <button class="phy-step-del" aria-label="Retirer">✕</button>`;
    div.querySelector('.phy-step-dur-inp').addEventListener('input', e => {
      phyRtDraftSteps[i].duration = parseInt(e.target.value, 10) || 1;
      updatePhyRtHint();
    });
    div.querySelector('.phy-step-del').addEventListener('click', () => {
      phyRtDraftSteps.splice(i, 1);
      renderPhyRtSteps();
    });
    container.appendChild(div);
  });
  updatePhyRtHint();
}

function updatePhyRtHint() {
  phyInit();
  const totalSec = phyRtDraftSteps.reduce((sum, s) => {
    const ex = state.physique.exercises.find(e => e.id === s.exId);
    if (!ex || ex.durationType !== 'time') return sum;
    return sum + (s.duration || ex.duration);
  }, 0);
  document.getElementById('phyRtDurHint').textContent = totalSec ? `— ~${Math.round(totalSec / 60)} min` : '';
}

function addPhyStep() {
  phyInit();
  const exs = state.physique.exercises;
  if (!exs.length) {
    show('physique');
    return;
  }
  const existing = document.querySelector('.phy-ex-picker');
  if (existing) { existing.focus(); return; }
  const sel = document.createElement('select');
  sel.className = 'phy-ex-picker';
  sel.innerHTML = '<option value="">— Choisir un exercice —</option>' +
    PHY_CATS.flatMap(cat => {
      const catExs = exs.filter(e => e.category === cat);
      if (!catExs.length) return [];
      return [`<optgroup label="${PHY_ICON[cat] || ''} ${cat}">`,
        ...catExs.map(e => `<option value="${e.id}">${escapeHtml(e.name)}</option>`),
        '</optgroup>'];
    }).join('');
  sel.addEventListener('change', () => {
    if (!sel.value) return;
    const ex = exs.find(e => e.id === sel.value);
    phyRtDraftSteps.push({ exId: sel.value, duration: ex ? ex.duration : 30 });
    sel.remove();
    renderPhyRtSteps();
  });
  document.getElementById('phyRtAddStep').before(sel);
  sel.focus();
}

function savePhyRt() {
  const name = document.getElementById('phyRt_name').value.trim();
  if (!name) return;
  phyInit();
  const data = { name, steps: phyRtDraftSteps.filter(s => s.exId) };
  if (phyRtEditId) {
    const rt = state.physique.routines.find(r => r.id === phyRtEditId);
    if (rt) Object.assign(rt, data);
  } else {
    state.physique.routines.push({ id: uid(), ...data });
  }
  save();
  renderPhyRoutineList();
  show('physique-routines');
}

function deletePhyRt() {
  if (!phyRtEditId) return;
  state.physique.routines = state.physique.routines.filter(r => r.id !== phyRtEditId);
  save();
  renderPhyRoutineList();
  show('physique-routines');
}

/* ---------- session ---------- */

function startPhySession(rtId) {
  phyInit();
  const rt = state.physique.routines.find(r => r.id === rtId);
  if (!rt) return;
  const steps = rt.steps
    .map(s => ({ ...s, ex: state.physique.exercises.find(e => e.id === s.exId) }))
    .filter(s => s.ex);
  if (!steps.length) return;
  phySession = { steps, idx: 0 };
  show('physique-session');
  renderPhyStep();
}

function renderPhyStep() {
  if (phySessionInt) { clearInterval(phySessionInt); phySessionInt = null; }
  const { steps, idx } = phySession;
  const step = steps[idx];
  const ex = step.ex;
  const isLast = idx >= steps.length - 1;
  const dur = step.duration || ex.duration;

  document.getElementById('phySessProgress').textContent = `${idx + 1} / ${steps.length}`;
  document.getElementById('phySessCat').textContent = `${PHY_ICON[ex.category] || ''} ${ex.category}`;
  document.getElementById('phySessName').textContent = ex.name;
  document.getElementById('phySessDesc').textContent = ex.description || '';
  document.getElementById('phySessNext').textContent = isLast ? '✓ Terminer' : 'Suivant ▸';
  document.getElementById('phySessNext').style.animation = '';

  if (ex.durationType === 'time') {
    document.getElementById('phySessTimerLbl').textContent = 'secondes';
    let remaining = dur;
    document.getElementById('phySessTimerDisplay').textContent = fmtPhyTime(remaining);
    phySessionInt = setInterval(() => {
      remaining--;
      document.getElementById('phySessTimerDisplay').textContent = fmtPhyTime(remaining);
      if (remaining <= 0) {
        clearInterval(phySessionInt); phySessionInt = null;
        document.getElementById('phySessNext').style.animation = 'phy-pulse .6s ease 3';
      }
    }, 1000);
  } else {
    document.getElementById('phySessTimerDisplay').textContent = dur;
    document.getElementById('phySessTimerLbl').textContent = 'répétitions';
  }
}

function phyNextStep() {
  if (phySessionInt) { clearInterval(phySessionInt); phySessionInt = null; }
  phySession.idx++;
  if (phySession.idx >= phySession.steps.length) {
    phySession = null;
    renderPhyRoutineList();
    show('physique-routines');
    return;
  }
  renderPhyStep();
}

function phyEndSession() {
  if (phySessionInt) { clearInterval(phySessionInt); phySessionInt = null; }
  phySession = null;
  renderPhyRoutineList();
  show('physique-routines');
}

function fmtPhyTime(sec) {
  if (sec <= 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m + ':' + String(s).padStart(2, '0');
}

/* ---------- listeners ---------- */

document.getElementById('phyCatFilter').addEventListener('click', e => {
  const pill = e.target.closest('.cat-pill');
  if (!pill) return;
  phyCatFilter = pill.dataset.cat;
  document.querySelectorAll('#phyCatFilter .cat-pill').forEach(b => b.classList.toggle('active', b === pill));
  renderPhyExList();
});

document.getElementById('phyRoutinesBtn').addEventListener('click', () => { renderPhyRoutineList(); show('physique-routines'); });
document.getElementById('phyAddExBtn').addEventListener('click', () => openPhyExEditor(null));

document.getElementById('phyExCancel').addEventListener('click', () => { renderPhyExList(); show('physique'); });
document.getElementById('phyExSave').addEventListener('click', savePhyEx);
document.getElementById('phyExDelete').addEventListener('click', deletePhyEx);

document.getElementById('phyRoutinesBack').addEventListener('click', () => show('physique'));
document.getElementById('phyAddRoutineBtn').addEventListener('click', () => openPhyRtEditor(null));

document.getElementById('phyRtCancel').addEventListener('click', () => { renderPhyRoutineList(); show('physique-routines'); });
document.getElementById('phyRtSave').addEventListener('click', savePhyRt);
document.getElementById('phyRtDelete').addEventListener('click', deletePhyRt);
document.getElementById('phyRtAddStep').addEventListener('click', addPhyStep);

document.getElementById('phySessNext').addEventListener('click', phyNextStep);
document.getElementById('phySessEnd').addEventListener('click', phyEndSession);
