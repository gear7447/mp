/* ============ module Tours ============ */

let tourEditId = null;
let tourStatusFilter = '';
let tourTagFilter = '';
let _setlistEditId = null;
let _setlistTourIds = [];

const TOUR_STATUS = {
  construction: { icon: '🔧', label: 'Construction' },
  repetition:   { icon: '🔄', label: 'Répétition'  },
  praticable:   { icon: '✅', label: 'Praticable'  },
  repertoire:   { icon: '⭐', label: 'Répertoire'  },
};

const TOUR_TAGS = ['close-up','scène','cartes','pièces','soies','mental','ambiance','impromptu','enfants','restaurant'];

function tourInit() {
  if (!state.tours || typeof state.tours !== 'object') state.tours = {};
  if (!Array.isArray(state.tours.list)) state.tours.list = [];
  if (!Array.isArray(state.tours.setlists)) state.tours.setlists = [];
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

function renderTourTagFilter() {
  tourInit();
  const container = document.getElementById('tourTagFilter');
  if (!container) return;
  const usedTags = new Set();
  state.tours.list.forEach(t => (t.tags || []).forEach(tag => usedTags.add(tag)));
  if (!usedTags.size) { container.innerHTML = ''; return; }
  container.innerHTML =
    `<button class="cat-pill tag-pill${!tourTagFilter ? ' active' : ''}" data-tag="">Tous</button>` +
    [...usedTags].map(tag =>
      `<button class="cat-pill tag-pill${tourTagFilter === tag ? ' active' : ''}" data-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</button>`
    ).join('');
}

function renderTourList() {
  tourInit();
  renderTourRepertoireBox();
  renderTourTagFilter();
  const list = document.getElementById('tourList');
  const tours = [...state.tours.list]
    .filter(t => !tourStatusFilter || t.status === tourStatusFilter)
    .filter(t => !tourTagFilter || (t.tags || []).includes(tourTagFilter))
    .sort((a, b) => {
      const order = { repertoire: 0, praticable: 1, repetition: 2, construction: 3 };
      return (order[a.status] ?? 4) - (order[b.status] ?? 4) || a.name.localeCompare(b.name);
    });
  if (!tours.length) {
    list.innerHTML = `<div class="empty">${(tourStatusFilter || tourTagFilter) ? 'Aucun tour pour ce filtre.' : 'Aucun tour pour le moment.<br>Touche « + Ajouter » pour commencer.'}</div>`;
    return;
  }
  list.innerHTML = '';
  tours.forEach(t => {
    const nCount = (state.notes[t.id] || []).length;
    const st = TOUR_STATUS[t.status] || TOUR_STATUS.construction;
    const techs = (t.techniqueIds || []).map(id => state.techniques.find(x => x.id === id)).filter(Boolean);
    const tags = t.tags || [];
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
          ${tags.map(tag => `<span class="badge badge-tag">${escapeHtml(tag)}</span>`).join('')}
        </div>
        ${t.effect ? `<div class="tour-effect-preview">${escapeHtml(t.effect)}</div>` : ''}
      </div>
      <div class="tech-actions">
        <button class="cours-btn" data-id="${t.id}" title="Cours liés">📅</button>
        <button class="notes-btn ${nCount ? 'has-notes' : ''}" data-id="${t.id}" title="Notes">📝${nCount ? `<span class="notes-count">${nCount}</span>` : ''}</button>
      </div>`;
    el.querySelector('.cours-btn').addEventListener('click', e => { e.stopPropagation(); showBudgetTourCours(t.id); });
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

function renderTourTagLinks(selectedTags) {
  const container = document.getElementById('tourTagsLinks');
  if (!container) return;
  container.innerHTML = TOUR_TAGS.map(tag => `
    <label class="tour-tag-item">
      <input type="checkbox" value="${escapeHtml(tag)}"${selectedTags.includes(tag) ? ' checked' : ''}>
      <span>${escapeHtml(tag)}</span>
    </label>`).join('');
}

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
  renderTourTagLinks(t ? (t.tags || []) : []);
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
  const tags = [...document.querySelectorAll('#tourTagsLinks input[type=checkbox]:checked')].map(c => c.value);
  const data = {
    name,
    status: statusEl ? statusEl.value : 'construction',
    effectType: document.getElementById('tour_effect_type').value.trim(),
    duration: parseFloat(document.getElementById('tour_duration').value) || 0,
    learnedAt: learnedAtVal ? new Date(learnedAtVal).getTime() : null,
    effect: document.getElementById('tour_effect').value.trim(),
    description: document.getElementById('tour_description').value.trim(),
    techniqueIds,
    tags,
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
      (state.tours.setlists || []).forEach(sl => {
        sl.tourIds = sl.tourIds.filter(id => id !== tourEditId);
      });
      save(); renderTourList(); show('tours');
    }
  );
}

/* ============ setlists ============ */

function renderSetlists() {
  tourInit();
  const list = document.getElementById('tourSetlistList');
  if (!state.tours.setlists.length) {
    list.innerHTML = '<div class="empty">Aucune setlist.<br>Crée-en une avec « + Créer ».</div>';
    return;
  }
  list.innerHTML = '';
  state.tours.setlists.forEach(sl => {
    const count = (sl.tourIds || []).length;
    const totalMin = (sl.tourIds || []).reduce((sum, id) => {
      const t = state.tours.list.find(x => x.id === id);
      return sum + (t ? (t.duration || 0) : 0);
    }, 0);
    const el = document.createElement('div');
    el.className = 'tech';
    el.innerHTML = `
      <div class="body">
        <div class="name">📋 ${escapeHtml(sl.name || 'Sans titre')}</div>
        <div class="meta">
          <span class="badge">${count} tour${count !== 1 ? 's' : ''}</span>
          ${totalMin ? `<span class="badge">${totalMin} min</span>` : ''}
        </div>
      </div>
      <div class="tech-actions">
        <span style="color:var(--text-muted);font-size:1.3rem">›</span>
      </div>`;
    el.addEventListener('click', () => openSetlistView(sl.id));
    list.appendChild(el);
  });
}

function openSetlistView(id) {
  tourInit();
  _setlistEditId = id || null;
  const sl = id ? state.tours.setlists.find(x => x.id === id) : null;
  document.getElementById('tourSetlistViewTitle').textContent = sl ? (sl.name || 'Sans titre') : 'Nouvelle setlist';
  document.getElementById('tourSetlistName').value = sl ? (sl.name || '') : '';
  _setlistTourIds = sl ? [...(sl.tourIds || [])] : [];
  renderSetlistTours();
  document.getElementById('tourSetlistDeleteBtn').classList.toggle('hidden', !id);
  show('tours-setlist-view');
}

function renderSetlistTours() {
  tourInit();
  const container = document.getElementById('tourSetlistTours');
  if (!_setlistTourIds.length) {
    container.innerHTML = '<div class="empty" style="margin:16px 0">Aucun tour dans cette setlist.</div>';
    return;
  }
  container.innerHTML = '';
  _setlistTourIds.forEach((tId, i) => {
    const t = state.tours.list.find(x => x.id === tId);
    const name = t ? t.name : '(tour supprimé)';
    const dur = t ? (t.duration || 0) : 0;
    const st = t ? (TOUR_STATUS[t.status] || TOUR_STATUS.construction) : null;
    const el = document.createElement('div');
    el.className = 'tour-setlist-item';
    el.dataset.id = tId;
    el.innerHTML = `
      <span class="tour-setlist-n">${i + 1}.</span>
      <div class="tour-setlist-body">
        <span class="tour-setlist-name">${st ? st.icon + ' ' : ''}${escapeHtml(name)}</span>
        ${dur ? `<span class="tour-setlist-dur">${dur} min</span>` : ''}
      </div>
      <div class="tour-setlist-btns">
        <button class="icon-btn" data-up="${tId}"${i === 0 ? ' disabled' : ''}>↑</button>
        <button class="icon-btn" data-down="${tId}"${i === _setlistTourIds.length - 1 ? ' disabled' : ''}>↓</button>
        <button class="icon-btn icon-btn-del" data-remove="${tId}">✕</button>
      </div>`;
    container.appendChild(el);
  });
  container.querySelectorAll('[data-up]').forEach(btn => btn.addEventListener('click', () => {
    const idx = _setlistTourIds.indexOf(btn.dataset.up);
    if (idx > 0) { [_setlistTourIds[idx - 1], _setlistTourIds[idx]] = [_setlistTourIds[idx], _setlistTourIds[idx - 1]]; renderSetlistTours(); }
  }));
  container.querySelectorAll('[data-down]').forEach(btn => btn.addEventListener('click', () => {
    const idx = _setlistTourIds.indexOf(btn.dataset.down);
    if (idx < _setlistTourIds.length - 1) { [_setlistTourIds[idx], _setlistTourIds[idx + 1]] = [_setlistTourIds[idx + 1], _setlistTourIds[idx]]; renderSetlistTours(); }
  }));
  container.querySelectorAll('[data-remove]').forEach(btn => btn.addEventListener('click', () => {
    _setlistTourIds = _setlistTourIds.filter(id => id !== btn.dataset.remove);
    renderSetlistTours();
  }));

  const totalMin = _setlistTourIds.reduce((sum, id) => {
    const t = state.tours.list.find(x => x.id === id);
    return sum + (t ? (t.duration || 0) : 0);
  }, 0);
  if (totalMin > 0) {
    const total = document.createElement('div');
    total.className = 'tour-setlist-total';
    total.textContent = `Durée totale : ${totalMin} min`;
    container.appendChild(total);
  }
}

function openTourPicker() {
  tourInit();
  const overlay = document.getElementById('tourPickerOverlay');
  const listEl = document.getElementById('tourPickerList');
  const available = state.tours.list.filter(t => !_setlistTourIds.includes(t.id));
  if (!available.length) {
    listEl.innerHTML = '<div class="empty">Tous les tours sont déjà dans la setlist.</div>';
  } else {
    listEl.innerHTML = '';
    available.forEach(t => {
      const st = TOUR_STATUS[t.status] || TOUR_STATUS.construction;
      const btn = document.createElement('button');
      btn.className = 'tour-picker-item';
      btn.innerHTML = `${st.icon} ${escapeHtml(t.name)}${t.duration ? ` <span class="tour-setlist-dur">${t.duration} min</span>` : ''}`;
      btn.addEventListener('click', () => {
        _setlistTourIds.push(t.id);
        overlay.classList.add('hidden');
        renderSetlistTours();
      });
      listEl.appendChild(btn);
    });
  }
  overlay.classList.remove('hidden');
}

function saveSetlist() {
  tourInit();
  const name = document.getElementById('tourSetlistName').value.trim() || 'Sans titre';
  if (_setlistEditId) {
    const sl = state.tours.setlists.find(x => x.id === _setlistEditId);
    if (sl) { sl.name = name; sl.tourIds = [..._setlistTourIds]; }
  } else {
    const newSl = { id: uid(), name, tourIds: [..._setlistTourIds] };
    state.tours.setlists.push(newSl);
    _setlistEditId = newSl.id;
  }
  document.getElementById('tourSetlistViewTitle').textContent = name;
  document.getElementById('tourSetlistDeleteBtn').classList.remove('hidden');
  save();
}

function deleteSetlist() {
  if (!_setlistEditId) return;
  const sl = state.tours.setlists.find(x => x.id === _setlistEditId);
  confirmDelete(
    'Supprimer « ' + (sl ? sl.name || 'cette setlist' : 'cette setlist') + ' » ?',
    'Cette action est définitive.',
    () => {
      state.tours.setlists = state.tours.setlists.filter(x => x.id !== _setlistEditId);
      save(); renderSetlists(); show('tours-setlist');
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

document.getElementById('tourTagFilter').addEventListener('click', e => {
  const pill = e.target.closest('.tag-pill');
  if (!pill) return;
  tourTagFilter = pill.dataset.tag;
  renderTourTagFilter();
  renderTourList();
});

document.getElementById('tourSetlistBtn').addEventListener('click', () => { renderSetlists(); show('tours-setlist'); });
document.getElementById('tourSetlistBack').addEventListener('click', () => { renderTourList(); show('tours'); });
document.getElementById('tourSetlistAddBtn').addEventListener('click', () => openSetlistView(null));
document.getElementById('tourSetlistViewBack').addEventListener('click', () => { renderSetlists(); show('tours-setlist'); });
document.getElementById('tourSetlistSaveBtn').addEventListener('click', saveSetlist);
document.getElementById('tourSetlistDeleteBtn').addEventListener('click', deleteSetlist);
document.getElementById('tourSetlistAddTourBtn').addEventListener('click', openTourPicker);
document.getElementById('tourPickerCancel').addEventListener('click', () => document.getElementById('tourPickerOverlay').classList.add('hidden'));

document.getElementById('tourEditorCancel').addEventListener('click', () => { renderTourList(); show('tours'); });
document.getElementById('tourSaveBtn').addEventListener('click', saveTour);
document.getElementById('tourDeleteBtn').addEventListener('click', deleteTour);
document.getElementById('tourNotesBtn').addEventListener('click', () => {
  if (!tourEditId) return;
  const t = state.tours.list.find(x => x.id === tourEditId);
  openNotes(tourEditId, t ? t.name : '', renderTourList);
});
