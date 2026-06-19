/* ============ module Tours ============ */

let tourEditId = null;
let tourStatusFilter = '';

const TOUR_STATUS = {
  construction: { icon: '🔧', label: 'Construction' },
  repetition:   { icon: '🔄', label: 'Répétition'  },
  praticable:   { icon: '✅', label: 'Praticable'  },
  repertoire:   { icon: '⭐', label: 'Répertoire'  },
};

function tourInit() {
  if (!state.tours || typeof state.tours !== 'object') state.tours = {};
  if (!Array.isArray(state.tours.list)) state.tours.list = [];
}

function fmtTourDate(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/* ============ liste ============ */

function renderTourRepertoireBox() {
  tourInit();
  const box = document.getElementById('tourRepertoireBox');
  const ready = state.tours.list.filter(t => t.status === 'praticable' || t.status === 'repertoire');
  if (!ready.length) { box.innerHTML = ''; return; }
  const chips = ready.map(t =>
    `<button class="chip" data-id="${t.id}">${TOUR_STATUS[t.status].icon} ${escapeHtml(t.name)}</button>`
  ).join('');
  box.innerHTML = `<div class="review"><div class="review-h">Répertoire actuel</div><div class="chips">${chips}</div></div>`;
  box.querySelectorAll('.chip').forEach(c =>
    c.addEventListener('click', () => openTourEditor(c.dataset.id))
  );
}

function renderTourList() {
  tourInit();
  renderTourRepertoireBox();
  const list = document.getElementById('tourList');
  const tours = [...state.tours.list]
    .filter(t => !tourStatusFilter || t.status === tourStatusFilter)
    .sort((a, b) => {
      const order = { repertoire: 0, praticable: 1, repetition: 2, construction: 3 };
      return (order[a.status] ?? 4) - (order[b.status] ?? 4) || a.name.localeCompare(b.name);
    });
  if (!tours.length) {
    list.innerHTML = `<div class="empty">${tourStatusFilter ? 'Aucun tour à ce stade.' : 'Aucun tour pour le moment.<br>Touche « + Ajouter » pour commencer.'}</div>`;
    return;
  }
  list.innerHTML = '';
  tours.forEach(t => {
    const nCount = (state.notes[t.id] || []).length;
    const st = TOUR_STATUS[t.status] || TOUR_STATUS.construction;
    const techs = (t.techniqueIds || []).map(id => state.techniques.find(x => x.id === id)).filter(Boolean);
    const el = document.createElement('div');
    el.className = 'tech';
    el.innerHTML = `
      <div class="tour-status-dot ${t.status}">${st.icon}</div>
      <div class="body">
        <div class="name">${escapeHtml(t.name)}</div>
        <div class="meta">
          ${t.effectType ? `<span class="badge">${escapeHtml(t.effectType)}</span>` : ''}
          ${t.duration ? `<span class="badge">${t.duration} min</span>` : ''}
          ${t.learnedAt ? `<span class="badge">Appris le ${fmtTourDate(t.learnedAt)}</span>` : ''}
          ${techs.length ? `<span class="badge">${techs.length} tech.</span>` : ''}
        </div>
        ${t.effect ? `<div class="tour-effect-preview">${escapeHtml(t.effect)}</div>` : ''}
      </div>
      <div class="tech-actions">
        <button class="notes-btn ${nCount ? 'has-notes' : ''}" data-id="${t.id}" title="Notes">📝${nCount ? `<span class="notes-count">${nCount}</span>` : ''}</button>
      </div>`;
    el.querySelector('.notes-btn').addEventListener('click', e => {
      e.stopPropagation();
      openNotes(t.id, t.name, renderTourList);
    });
    el.querySelector('.body').addEventListener('click', () => openTourEditor(t.id));
    el.querySelector('.tour-status-dot').addEventListener('click', () => openTourEditor(t.id));
    list.appendChild(el);
  });
}

function renderTourStatusPills() {
  const container = document.getElementById('tourStatusFilter');
  container.innerHTML = `<button class="cat-pill${!tourStatusFilter ? ' active' : ''}" data-status="">Tous</button>` +
    Object.entries(TOUR_STATUS).map(([k, v]) =>
      `<button class="cat-pill${tourStatusFilter === k ? ' active' : ''}" data-status="${k}">${v.icon} ${v.label}</button>`
    ).join('');
}

/* ============ éditeur ============ */

function renderTourTechLinks(selectedIds) {
  const container = document.getElementById('tourTechLinks');
  if (!state.techniques.length) {
    container.innerHTML = '<p class="hint" style="margin:4px 0">Aucune technique dans Cartomagie.</p>';
    return;
  }
  const byFamily = {};
  [...state.techniques].sort((a, b) => a.family.localeCompare(b.family) || a.name.localeCompare(b.name))
    .forEach(t => { (byFamily[t.family] = byFamily[t.family] || []).push(t); });
  container.innerHTML = Object.entries(byFamily).map(([fam, techs]) => `
    <div class="tour-tech-group">
      <div class="tour-tech-fam">${escapeHtml(fam)}</div>
      ${techs.map(t => `
        <label class="tour-tech-item">
          <input type="checkbox" value="${t.id}"${selectedIds.includes(t.id) ? ' checked' : ''}>
          <span>${escapeHtml(t.name)}</span>
        </label>`).join('')}
    </div>`).join('');
}

function openTourEditor(id) {
  tourInit();
  tourEditId = id || null;
  const t = id ? state.tours.list.find(x => x.id === id) : null;
  document.getElementById('tourEditorTitle').textContent = t ? 'Modifier le tour' : 'Nouveau tour';
  document.getElementById('tour_name').value = t ? t.name : '';
  document.querySelectorAll('input[name="tourStatus"]').forEach(r => {
    r.checked = r.value === (t ? t.status : 'construction');
  });
  document.getElementById('tour_effect_type').value = t ? (t.effectType || '') : '';
  document.getElementById('tour_duration').value = t ? (t.duration || '') : '';
  document.getElementById('tour_learned_at').value = t && t.learnedAt
    ? new Date(t.learnedAt).toISOString().split('T')[0] : '';
  document.getElementById('tour_effect').value = t ? (t.effect || '') : '';
  document.getElementById('tour_description').value = t ? (t.description || '') : '';
  renderTourTechLinks(t ? (t.techniqueIds || []) : []);
  document.getElementById('tourDeleteBtn').classList.toggle('hidden', !id);
  show('tours-editor');
}

function saveTour() {
  const name = document.getElementById('tour_name').value.trim();
  if (!name) return;
  tourInit();
  const statusEl = document.querySelector('input[name="tourStatus"]:checked');
  const learnedAtVal = document.getElementById('tour_learned_at').value;
  const techniqueIds = [...document.querySelectorAll('#tourTechLinks input[type=checkbox]:checked')].map(c => c.value);
  const data = {
    name,
    status: statusEl ? statusEl.value : 'construction',
    effectType: document.getElementById('tour_effect_type').value.trim(),
    duration: parseFloat(document.getElementById('tour_duration').value) || 0,
    learnedAt: learnedAtVal ? new Date(learnedAtVal).getTime() : null,
    effect: document.getElementById('tour_effect').value.trim(),
    description: document.getElementById('tour_description').value.trim(),
    techniqueIds,
  };
  if (tourEditId) {
    const t = state.tours.list.find(x => x.id === tourEditId);
    if (t) Object.assign(t, data);
  } else {
    state.tours.list.push({ id: uid(), createdAt: Date.now(), ...data });
  }
  save();
  renderTourList();
  show('tours');
}

function deleteTour() {
  if (!tourEditId) return;
  const t = state.tours.list.find(x => x.id === tourEditId);
  confirmDelete(
    'Supprimer « ' + (t ? t.name : 'ce tour') + ' » ?',
    'Cette action est définitive.',
    () => {
      state.tours.list = state.tours.list.filter(x => x.id !== tourEditId);
      save(); renderTourList(); show('tours');
    }
  );
}

/* ============ listeners ============ */

document.getElementById('tourAddBtn').addEventListener('click', () => openTourEditor(null));

document.getElementById('tourStatusFilter').addEventListener('click', e => {
  const pill = e.target.closest('.cat-pill');
  if (!pill) return;
  tourStatusFilter = pill.dataset.status;
  renderTourStatusPills();
  renderTourList();
});

document.getElementById('tourEditorCancel').addEventListener('click', () => { renderTourList(); show('tours'); });
document.getElementById('tourSaveBtn').addEventListener('click', saveTour);
document.getElementById('tourDeleteBtn').addEventListener('click', deleteTour);
document.getElementById('tourNotesBtn').addEventListener('click', () => {
  if (!tourEditId) return;
  const t = state.tours.list.find(x => x.id === tourEditId);
  openNotes(tourEditId, t ? t.name : '', renderTourList);
});
