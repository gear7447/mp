/* ============ notes par technique ============ */
let notesForId = null;
let noteToDeleteId = null;

function notesOf(techId) {
  return state.notes[techId] || [];
}

function openNotes(techId) {
  notesForId = techId;
  const t = state.techniques.find(x => x.id === techId);
  document.getElementById('notes_title').textContent = t ? t.name : '';
  document.getElementById('notes_input').value = '';
  renderNotesList();
  document.getElementById('notesOverlay').classList.remove('hidden');
}

function closeNotes() {
  document.getElementById('notesOverlay').classList.add('hidden');
  notesForId = null;
}

function renderNotesList() {
  const list = document.getElementById('notes_list');
  const notes = notesOf(notesForId);
  if (!notes.length) {
    list.innerHTML = '<div class="notes-empty">Aucune note pour l\'instant.</div>';
    return;
  }
  list.innerHTML = notes.slice().reverse().map(n => `
    <div class="note-item">
      <div class="note-text">${escapeHtml(n.text)}</div>
      <div class="note-meta">
        <span>${daysAgo(n.createdAt)}</span>
        <button class="note-del" data-id="${n.id}" aria-label="Supprimer">✕</button>
      </div>
    </div>`).join('');
  list.querySelectorAll('.note-del').forEach(btn => {
    btn.addEventListener('click', () => {
      noteToDeleteId = btn.dataset.id;
      document.getElementById('confirmDelNote').classList.remove('hidden');
    });
  });
}

document.getElementById('notes_add').addEventListener('click', () => {
  const txt = document.getElementById('notes_input').value.trim();
  if (!txt || !notesForId) return;
  if (!state.notes[notesForId]) state.notes[notesForId] = [];
  state.notes[notesForId].push({ id: uid(), text: txt, createdAt: Date.now() });
  document.getElementById('notes_input').value = '';
  save();
  renderNotesList();
  renderLibrary();
});

document.getElementById('notes_close').addEventListener('click', closeNotes);

document.getElementById('delNoteOk').addEventListener('click', () => {
  if (noteToDeleteId && notesForId) {
    state.notes[notesForId] = notesOf(notesForId).filter(n => n.id !== noteToDeleteId);
    save();
    renderNotesList();
    renderLibrary();
  }
  noteToDeleteId = null;
  document.getElementById('confirmDelNote').classList.add('hidden');
});

document.getElementById('delNoteCancel').addEventListener('click', () => {
  noteToDeleteId = null;
  document.getElementById('confirmDelNote').classList.add('hidden');
});

/* bouton Notes pendant le drill */
document.getElementById('drillNotesBtn').addEventListener('click', () => {
  if (S && S.prevId) openNotes(S.prevId);
});
