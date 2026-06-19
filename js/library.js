/* ============ bibliothèque ============ */
function fmtMin(sec) {
  const m = sec / 60;
  return (Number.isInteger(m) ? m : m.toFixed(1)) + ' min';
}

function renderReview() {
  const box = document.getElementById('reviewBox');
  box.innerHTML = '';
  const NEGLECT_MS = 7 * 86400000, now = Date.now();
  const due = state.techniques.filter(t => t.focus && (now - (t.last || 0)) >= NEGLECT_MS);
  if (!due.length) return;
  due.sort((a, b) => (a.last || 0) - (b.last || 0));
  const chips = due.map(t =>
    `<button class="chip" data-id="${t.id}">${escapeHtml(t.name)}<small>${daysAgo(t.last)}</small></button>`
  ).join('');
  box.innerHTML = `<div class="review"><div class="review-h">À revoir ⭐</div><div class="chips">${chips}</div></div>`;
  box.querySelectorAll('.chip').forEach(c =>
    c.addEventListener('click', () => openEditor(c.dataset.id, 'library'))
  );
}

function sortedTechs() {
  return [...state.techniques].sort((a, b) =>
    a.family.localeCompare(b.family) || a.name.localeCompare(b.name)
  );
}

function techRowHTML(t) {
  return `<div class="body">
    <div class="name">${escapeHtml(t.name)}</div>
    <div class="meta">
      <span class="badge">${escapeHtml(t.family)}</span>
      <span class="badge">${MODE_LABEL[t.mode]}${t.mode === 'interval' ? ' ' + t.intervalSec + 's' : ''}</span>
      <span class="badge">${fmtMin(t.blockSec)}</span>
      <span class="badge lvl">${escapeHtml(levelNames()[t.level - 1] || '')}</span>
    </div>
  </div>`;
}

function renderLibrary() {
  renderReview();
  const list = document.getElementById('techList');
  list.innerHTML = '';
  if (!state.techniques.length) {
    list.innerHTML = '<div class="empty">Aucune technique pour le moment.<br>Touche « Gérer » pour créer ton répertoire.</div>';
    return;
  }
  for (const t of sortedTechs()) {
    const el = document.createElement('div');
    el.className = 'tech ro';
    const nCount = (state.notes[t.id] || []).length;
    el.innerHTML = techRowHTML(t) + `
      <div class="tech-actions">
        <button class="notes-btn ${nCount ? 'has-notes' : ''}" data-id="${t.id}" title="Notes" aria-label="Notes">📝${nCount ? `<span class="notes-count">${nCount}</span>` : ''}</button>
        <span class="star ${t.focus ? 'on' : ''}" style="pointer-events:none">${t.focus ? '★' : '☆'}</span>
      </div>`;
    el.querySelector('.notes-btn').addEventListener('click', e => { e.stopPropagation(); openNotes(t.id); });
    list.appendChild(el);
  }
}

function renderManage() {
  const list = document.getElementById('manageList');
  list.innerHTML = '';
  if (!state.techniques.length) {
    list.innerHTML = '<div class="empty">Aucune technique.<br>Touche « + Ajouter » pour en créer une.</div>';
    return;
  }
  for (const t of sortedTechs()) {
    const el = document.createElement('div');
    el.className = 'tech';
    el.innerHTML = techRowHTML(t) + `<button class="star ${t.focus ? 'on' : ''}" title="Focus">${t.focus ? '★' : '☆'}</button>`;
    el.querySelector('.body').addEventListener('click', () => openEditor(t.id, 'manage'));
    el.querySelector('.star').addEventListener('click', e => {
      e.stopPropagation();
      t.focus = !t.focus;
      t.updated = Date.now();
      save();
      renderManage();
      renderLibrary();
    });
    list.appendChild(el);
  }
}

function openManage() { renderManage(); show('manage'); }

/* ---- listeners ---- */
document.getElementById('manageBtn').addEventListener('click', openManage);
document.getElementById('manageBack').addEventListener('click', () => show('library'));
document.getElementById('manageAdd').addEventListener('click', () => openEditor(null, 'manage'));
