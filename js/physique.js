/* ============ module Physique ============ */

let phyExEditId = null;
let phyRtEditId = null;
let phySession = null;
let phySessionInt = null;
let phyCatFilter = '';
let phyRtDraftSteps = [];

const PHY_ICON = { 'Flexibilité': '🤸', 'Mobilité': '🔄', 'Force': '💪', 'Précision': '🎯' };
const PHY_CATS_DEFAULT = ['Flexibilité', 'Mobilité', 'Force', 'Précision'];

/* ---- state init ---- */
function phyInit() {
  if (!state.physique || typeof state.physique !== 'object') state.physique = {};
  if (!Array.isArray(state.physique.categories)) state.physique.categories = PHY_CATS_DEFAULT.slice();
  if (!Array.isArray(state.physique.exercises)) state.physique.exercises = [];
  if (!Array.isArray(state.physique.routines)) state.physique.routines = [];
}

function phyCatIcon(cat) {
  return PHY_ICON[cat] || '●';
}

/* ---- durée affichée d'un exercice ---- */
function phyExDurLabel(ex) {
  if (ex.durationType === 'time') return ex.duration + ' s';
  if (ex.durationType === 'reps') return ex.duration + ' rép.';
  if (ex.durationType === 'sets') return `${ex.sets}×${ex.repsPerSet} rép.`;
  return '';
}

/* ---- durée estimée en secondes pour la liste routines ---- */
function phyExEstSec(ex, stepDur) {
  if (ex.durationType === 'time') return stepDur || ex.duration;
  if (ex.durationType === 'sets') {
    const repTime = ex.timePerRep || 0;
    const restR = ex.restBetweenReps || 0;
    const restS = ex.restBetweenSets || 0;
    return ex.sets * (ex.repsPerSet * (repTime + restR)) + (ex.sets - 1) * restS;
  }
  return 0;
}

/* ============ catégories ============ */

function renderPhyCatList() {
  phyInit();
  const list = document.getElementById('phyCatList');
  list.innerHTML = '';
  state.physique.categories.forEach(cat => {
    const inUse = state.physique.exercises.some(e => e.category === cat);
    const el = document.createElement('div');
    el.className = 'tech';
    el.style.alignItems = 'center';
    el.innerHTML = `
      <div class="phy-cat-icon">${phyCatIcon(cat)}</div>
      <div class="body"><div class="name">${escapeHtml(cat)}</div></div>
      <button class="phy-cat-del link" style="color:${inUse ? 'var(--muted)' : '#d98'};font-size:.85rem" data-cat="${escapeHtml(cat)}">${inUse ? 'utilisée' : '✕'}</button>`;
    el.querySelector('.phy-cat-del').addEventListener('click', () => {
      if (inUse) return;
      confirmDelete(
        'Supprimer la catégorie « ' + cat + ' » ?',
        'Cette action est définitive.',
        () => {
          state.physique.categories = state.physique.categories.filter(c => c !== cat);
          save(); renderPhyCatList(); renderPhyCatPills();
        }
      );
    });
    list.appendChild(el);
  });
}

function renderPhyCatPills() {
  phyInit();
  const container = document.getElementById('phyCatFilter');
  const active = phyCatFilter;
  container.innerHTML = `<button class="cat-pill${!active ? ' active' : ''}" data-cat="">Tout</button>` +
    state.physique.categories.map(c =>
      `<button class="cat-pill${c === active ? ' active' : ''}" data-cat="${escapeHtml(c)}">${phyCatIcon(c)} ${escapeHtml(c)}</button>`
    ).join('');
}

function addPhyCat() {
  phyInit();
  const inp = document.getElementById('phyCatNewName');
  const name = inp.value.trim();
  if (!name) return;
  if (state.physique.categories.includes(name)) { inp.value = ''; return; }
  state.physique.categories.push(name);
  save();
  inp.value = '';
  renderPhyCatList();
  renderPhyCatPills();
}

/* ============ exercices : liste ============ */

function renderPhyExList() {
  phyInit();
  renderPhyCatPills();
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
      <div class="phy-cat-icon">${phyCatIcon(ex.category)}</div>
      <div class="body">
        <div class="name">${escapeHtml(ex.name)}</div>
        <div class="meta">
          <span class="badge">${escapeHtml(ex.category)}</span>
          <span class="badge">${phyExDurLabel(ex)}</span>
        </div>
      </div>`;
    el.addEventListener('click', () => openPhyExEditor(ex.id));
    list.appendChild(el);
  });
}

/* ============ exercices : éditeur ============ */

function updatePhyEditorMode() {
  const mode = document.getElementById('phy_dur_type').value;
  const simpleWrap = document.getElementById('phy_dur_simple_wrap');
  const setsWrap = document.getElementById('phy_sets_wrap');
  const label = document.getElementById('phy_dur_label');
  simpleWrap.classList.toggle('hidden', mode === 'sets');
  setsWrap.classList.toggle('hidden', mode !== 'sets');
  if (mode === 'time') label.textContent = 'Durée (secondes)';
  if (mode === 'reps') label.textContent = 'Nombre de répétitions';
}

function populatePhyCatSelect() {
  phyInit();
  const sel = document.getElementById('phy_cat');
  sel.innerHTML = state.physique.categories.map(c => `<option value="${escapeHtml(c)}">${phyCatIcon(c)} ${escapeHtml(c)}</option>`).join('');
}

function openPhyExEditor(id) {
  phyExEditId = id || null;
  const ex = id ? state.physique.exercises.find(e => e.id === id) : null;
  populatePhyCatSelect();
  document.getElementById('phyExTitle').textContent = ex ? "Modifier l'exercice" : 'Nouvel exercice';
  document.getElementById('phy_name').value = ex ? ex.name : '';
  document.getElementById('phy_cat').value = ex ? ex.category : (state.physique.categories[0] || '');
  document.getElementById('phy_desc').value = ex ? (ex.description || '') : '';
  document.getElementById('phy_dur_type').value = ex ? ex.durationType : 'time';
  document.getElementById('phy_dur_val').value = ex ? ex.duration : 30;
  document.getElementById('phy_sets').value = ex ? (ex.sets || 3) : 3;
  document.getElementById('phy_reps_per_set').value = ex ? (ex.repsPerSet || 10) : 10;
  document.getElementById('phy_time_per_rep').value = ex ? (ex.timePerRep || 0) : 0;
  document.getElementById('phy_rest_reps').value = ex ? (ex.restBetweenReps || 5) : 5;
  document.getElementById('phy_rest_sets').value = ex ? (ex.restBetweenSets || 30) : 30;
  document.getElementById('phyExDelete').classList.toggle('hidden', !id);
  updatePhyEditorMode();
  show('physique-editor');
}

function savePhyEx() {
  const name = document.getElementById('phy_name').value.trim();
  if (!name) return;
  phyInit();
  const durType = document.getElementById('phy_dur_type').value;
  const data = {
    name,
    category: document.getElementById('phy_cat').value,
    description: document.getElementById('phy_desc').value.trim(),
    durationType: durType,
    duration: durType !== 'sets' ? (parseInt(document.getElementById('phy_dur_val').value, 10) || 30) : 0,
    sets: parseInt(document.getElementById('phy_sets').value, 10) || 3,
    repsPerSet: parseInt(document.getElementById('phy_reps_per_set').value, 10) || 10,
    timePerRep: parseInt(document.getElementById('phy_time_per_rep').value, 10) || 0,
    restBetweenReps: parseInt(document.getElementById('phy_rest_reps').value, 10) || 0,
    restBetweenSets: parseInt(document.getElementById('phy_rest_sets').value, 10) || 30,
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
  const ex = state.physique.exercises.find(e => e.id === phyExEditId);
  confirmDelete(
    'Supprimer « ' + (ex ? ex.name : 'cet exercice') + ' » ?',
    'Cette action est définitive. Les routines qui utilisent cet exercice seront mises à jour.',
    () => {
      state.physique.exercises = state.physique.exercises.filter(e => e.id !== phyExEditId);
      state.physique.routines.forEach(r => { r.steps = r.steps.filter(s => s.exId !== phyExEditId); });
      save(); renderPhyExList(); show('physique');
    }
  );
}

/* ============ routines : liste ============ */

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
      return sum + phyExEstSec(ex, s.duration);
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

/* ============ routines : éditeur ============ */

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
    const isSets = ex && ex.durationType === 'sets';
    const div = document.createElement('div');
    div.className = 'phy-step-row';
    div.innerHTML = `
      <div class="phy-step-num">${i + 1}</div>
      <div class="phy-step-name">${ex ? `${phyCatIcon(ex.category)} ${escapeHtml(ex.name)}` : '—'}</div>
      ${isSets
        ? `<span class="hint" style="white-space:nowrap;font-size:.72rem">${ex.sets}×${ex.repsPerSet}</span>`
        : `<input type="number" class="phy-step-dur-inp" min="1" value="${dur}" style="width:58px;padding:6px 8px;text-align:center;font-size:.85rem">
           <span class="hint" style="white-space:nowrap">${ex && ex.durationType === 'reps' ? 'rép.' : 's'}</span>`
      }
      <button class="phy-step-del" aria-label="Retirer">✕</button>`;
    if (!isSets) {
      div.querySelector('.phy-step-dur-inp').addEventListener('input', e => {
        phyRtDraftSteps[i].duration = parseInt(e.target.value, 10) || 1;
        updatePhyRtHint();
      });
    }
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
    if (!ex) return sum;
    return sum + phyExEstSec(ex, s.duration);
  }, 0);
  document.getElementById('phyRtDurHint').textContent = totalSec ? `— ~${Math.round(totalSec / 60)} min` : '';
}

function addPhyStep() {
  phyInit();
  const exs = state.physique.exercises;
  if (!exs.length) { show('physique'); return; }
  const existing = document.querySelector('.phy-ex-picker');
  if (existing) { existing.focus(); return; }
  const sel = document.createElement('select');
  sel.className = 'phy-ex-picker';
  sel.innerHTML = '<option value="">— Choisir un exercice —</option>' +
    state.physique.categories.flatMap(cat => {
      const catExs = exs.filter(e => e.category === cat);
      if (!catExs.length) return [];
      return [`<optgroup label="${phyCatIcon(cat)} ${cat}">`,
        ...catExs.map(e => `<option value="${e.id}">${escapeHtml(e.name)} (${phyExDurLabel(e)})</option>`),
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
  const rt = state.physique.routines.find(r => r.id === phyRtEditId);
  confirmDelete(
    'Supprimer « ' + (rt ? rt.name : 'cette routine') + ' » ?',
    'Cette action est définitive.',
    () => {
      state.physique.routines = state.physique.routines.filter(r => r.id !== phyRtEditId);
      save(); renderPhyRoutineList(); show('physique-routines');
    }
  );
}

/* ============ session ============ */

function startPhySession(rtId) {
  phyInit();
  const rt = state.physique.routines.find(r => r.id === rtId);
  if (!rt) return;
  const steps = rt.steps
    .map(s => ({ ...s, ex: state.physique.exercises.find(e => e.id === s.exId) }))
    .filter(s => s.ex);
  if (!steps.length) return;
  phySession = { steps, idx: 0, phase: null, currentSet: 1, currentRep: 1 };
  show('physique-session');
  renderPhyStep();
}

function renderPhyStep() {
  if (phySessionInt) { clearInterval(phySessionInt); phySessionInt = null; }
  const { steps, idx } = phySession;
  const step = steps[idx];
  const ex = step.ex;
  const isLast = idx >= steps.length - 1;

  document.getElementById('phySessProgress').textContent = `${idx + 1} / ${steps.length}`;
  document.getElementById('phySessCat').textContent = `${phyCatIcon(ex.category)} ${ex.category}`;
  document.getElementById('phySessName').textContent = ex.name;
  document.getElementById('phySessDesc').textContent = ex.description || '';
  document.getElementById('phySessNext').style.animation = '';

  const setsInfo = document.getElementById('phySessSetsInfo');

  if (ex.durationType === 'sets') {
    setsInfo.classList.remove('hidden');
    if (!phySession.phase) {
      phySession.phase = 'rep';
      phySession.currentSet = 1;
      phySession.currentRep = 1;
    }
    renderSetsPhase(ex, isLast);
  } else {
    setsInfo.classList.add('hidden');
    document.getElementById('phySessNext').textContent = isLast ? '✓ Terminer' : 'Suivant ▸';
    const dur = step.duration || ex.duration;
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
}

function renderSetsPhase(ex, isLast) {
  const { phase, currentSet, currentRep } = phySession;
  const totalSets = ex.sets || 3;
  const totalReps = ex.repsPerSet || 10;
  const timePerRep = ex.timePerRep || 0;
  const restReps = ex.restBetweenReps || 0;
  const restSets = ex.restBetweenSets || 30;

  const nextBtn = document.getElementById('phySessNext');
  nextBtn.style.animation = '';

  if (phase === 'rep') {
    document.getElementById('phySessSetsInfo').textContent = `Série ${currentSet} / ${totalSets} · Rép. ${currentRep} / ${totalReps}`;
    if (timePerRep > 0) {
      document.getElementById('phySessTimerLbl').textContent = 'secondes';
      nextBtn.textContent = 'Passer ▸';
      let remaining = timePerRep;
      document.getElementById('phySessTimerDisplay').textContent = fmtPhyTime(remaining);
      phySessionInt = setInterval(() => {
        remaining--;
        document.getElementById('phySessTimerDisplay').textContent = fmtPhyTime(remaining);
        if (remaining <= 0) {
          clearInterval(phySessionInt); phySessionInt = null;
          advanceSetsPhase(ex, isLast);
        }
      }, 1000);
    } else {
      document.getElementById('phySessTimerDisplay').textContent = currentRep;
      document.getElementById('phySessTimerLbl').textContent = 'répétition';
      nextBtn.textContent = '✓ Fait';
    }
  } else if (phase === 'rest-rep') {
    document.getElementById('phySessSetsInfo').textContent = `Repos · Rép. ${currentRep + 1} / ${totalReps} dans…`;
    document.getElementById('phySessTimerLbl').textContent = 'secondes';
    nextBtn.textContent = 'Passer le repos ▸';
    let remaining = restReps;
    document.getElementById('phySessTimerDisplay').textContent = fmtPhyTime(remaining);
    phySessionInt = setInterval(() => {
      remaining--;
      document.getElementById('phySessTimerDisplay').textContent = fmtPhyTime(remaining);
      if (remaining <= 0) { clearInterval(phySessionInt); phySessionInt = null; advanceSetsPhase(ex, isLast); }
    }, 1000);
  } else if (phase === 'rest-set') {
    document.getElementById('phySessSetsInfo').textContent = `Repos · Série ${currentSet + 1} / ${totalSets} dans…`;
    document.getElementById('phySessTimerLbl').textContent = 'secondes';
    nextBtn.textContent = 'Passer le repos ▸';
    let remaining = restSets;
    document.getElementById('phySessTimerDisplay').textContent = fmtPhyTime(remaining);
    phySessionInt = setInterval(() => {
      remaining--;
      document.getElementById('phySessTimerDisplay').textContent = fmtPhyTime(remaining);
      if (remaining <= 0) { clearInterval(phySessionInt); phySessionInt = null; advanceSetsPhase(ex, isLast); }
    }, 1000);
  }
}

function advanceSetsPhase(ex, isLast) {
  if (phySessionInt) { clearInterval(phySessionInt); phySessionInt = null; }
  const { phase, currentSet, currentRep } = phySession;
  const totalSets = ex.sets || 3;
  const totalReps = ex.repsPerSet || 10;
  const restReps = ex.restBetweenReps || 0;
  const restSets = ex.restBetweenSets || 30;

  if (phase === 'rep') {
    if (currentRep < totalReps) {
      if (restReps > 0) { phySession.phase = 'rest-rep'; }
      else { phySession.currentRep++; }
    } else if (currentSet < totalSets) {
      if (restSets > 0) { phySession.phase = 'rest-set'; }
      else { phySession.currentSet++; phySession.currentRep = 1; }
    } else {
      goToNextExercise(); return;
    }
  } else if (phase === 'rest-rep') {
    phySession.currentRep++;
    phySession.phase = 'rep';
  } else if (phase === 'rest-set') {
    phySession.currentSet++;
    phySession.currentRep = 1;
    phySession.phase = 'rep';
  }
  renderSetsPhase(ex, isLast);
}

function phyNextStep() {
  if (phySessionInt) { clearInterval(phySessionInt); phySessionInt = null; }
  const step = phySession.steps[phySession.idx];
  const ex = step.ex;
  const isLast = phySession.idx >= phySession.steps.length - 1;
  if (ex.durationType === 'sets') { advanceSetsPhase(ex, isLast); return; }
  goToNextExercise();
}

function goToNextExercise() {
  phySession.idx++;
  phySession.phase = null;
  phySession.currentSet = 1;
  phySession.currentRep = 1;
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

/* ============ listeners ============ */

document.getElementById('phyCatFilter').addEventListener('click', e => {
  const pill = e.target.closest('.cat-pill');
  if (!pill) return;
  phyCatFilter = pill.dataset.cat;
  renderPhyExList();
});

document.getElementById('phyRoutinesBtn').addEventListener('click', () => { renderPhyRoutineList(); show('physique-routines'); });
document.getElementById('phyCategoriesBtn').addEventListener('click', () => { renderPhyCatList(); show('physique-categories'); });
document.getElementById('phyAddExBtn').addEventListener('click', () => openPhyExEditor(null));

document.getElementById('phy_dur_type').addEventListener('change', updatePhyEditorMode);
document.getElementById('phyExCancel').addEventListener('click', () => { renderPhyExList(); show('physique'); });
document.getElementById('phyExSave').addEventListener('click', savePhyEx);
document.getElementById('phyExDelete').addEventListener('click', deletePhyEx);

document.getElementById('phyRoutinesBack').addEventListener('click', () => show('physique'));
document.getElementById('phyAddRoutineBtn').addEventListener('click', () => openPhyRtEditor(null));

document.getElementById('phyRtCancel').addEventListener('click', () => { renderPhyRoutineList(); show('physique-routines'); });
document.getElementById('phyRtSave').addEventListener('click', savePhyRt);
document.getElementById('phyRtDelete').addEventListener('click', deletePhyRt);
document.getElementById('phyRtAddStep').addEventListener('click', addPhyStep);

document.getElementById('phyCatBack').addEventListener('click', () => { renderPhyExList(); show('physique'); });
document.getElementById('phyCatAdd').addEventListener('click', addPhyCat);
document.getElementById('phyCatNewName').addEventListener('keydown', e => { if (e.key === 'Enter') addPhyCat(); });

document.getElementById('phySessNext').addEventListener('click', phyNextStep);
document.getElementById('phySessEnd').addEventListener('click', phyEndSession);
