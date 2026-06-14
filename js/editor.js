/* ============ éditeur de technique ============ */
let editingId = null, editorReturn = 'manage';

function fillSelect(sel, arr, fromIndex1) {
  sel.innerHTML = arr.map((v, i) =>
    `<option value="${fromIndex1 ? i + 1 : escapeHtml(v)}">${escapeHtml(v)}</option>`
  ).join('');
}
fillSelect(document.getElementById('f_family'), FAMILIES, false);

function openEditor(id, from) {
  editingId = id;
  editorReturn = from || 'manage';
  fillSelect(document.getElementById('f_level'), levelNames(), true);
  const t = id
    ? state.techniques.find(x => x.id === id)
    : { name:'', family:FAMILIES[FAMILIES.length - 1], mode:'tap', intervalSec:10, blockSec:300,
        level:1, focus:false, metro:false, bpm:60, template:'', nMin:1, nMax:6 };
  document.getElementById('editTitle').textContent = id ? 'Modifier' : 'Nouvelle technique';
  document.getElementById('deleteBtn').classList.toggle('hidden', !id);
  document.getElementById('f_name').value = t.name;
  document.getElementById('f_family').value = t.family;
  document.getElementById('f_mode').value = t.mode;
  document.getElementById('f_interval').value = t.intervalSec;
  document.getElementById('f_block').value = t.blockSec / 60;
  document.getElementById('f_level').value = t.level;
  document.getElementById('f_template').value = t.template;
  document.getElementById('f_nmin').value = t.nMin;
  document.getElementById('f_nmax').value = t.nMax;
  document.getElementById('f_focus').checked = t.focus;
  document.getElementById('f_metro').checked = t.metro;
  document.getElementById('f_bpm').value = t.bpm;
  syncEditorVis();
  show('editor');
}

function syncEditorVis() {
  document.getElementById('f_intervalWrap').classList.toggle('hidden',
    document.getElementById('f_mode').value !== 'interval');
  document.getElementById('f_bpmWrap').classList.toggle('hidden',
    !document.getElementById('f_metro').checked);
  const tpl = document.getElementById('f_template').value;
  document.getElementById('f_nWrap').classList.toggle('hidden', !/\{n\}|\{nx\}/.test(tpl));
}

/* ---- listeners ---- */
document.getElementById('f_mode').addEventListener('change', syncEditorVis);
document.getElementById('f_metro').addEventListener('change', syncEditorVis);
document.getElementById('f_template').addEventListener('input', syncEditorVis);

document.getElementById('editCancel').addEventListener('click', () => show(editorReturn));

document.getElementById('saveTechBtn').addEventListener('click', () => {
  const name = document.getElementById('f_name').value.trim();
  if (!name) { document.getElementById('f_name').focus(); return; }
  const obj = {
    name,
    family: document.getElementById('f_family').value,
    mode: document.getElementById('f_mode').value,
    intervalSec: Math.max(1, parseInt(document.getElementById('f_interval').value) || 10),
    blockSec: Math.max(15, Math.round((parseFloat(document.getElementById('f_block').value) || 5) * 60)),
    level: parseInt(document.getElementById('f_level').value) || 1,
    template: document.getElementById('f_template').value.trim() || name,
    nMin: Math.max(1, parseInt(document.getElementById('f_nmin').value) || 1),
    nMax: Math.max(1, parseInt(document.getElementById('f_nmax').value) || 6),
    focus: document.getElementById('f_focus').checked,
    metro: document.getElementById('f_metro').checked,
    bpm: Math.min(240, Math.max(30, parseInt(document.getElementById('f_bpm').value) || 60)),
    updated: Date.now(),
  };
  if (obj.nMax < obj.nMin) obj.nMax = obj.nMin;
  if (editingId) {
    Object.assign(state.techniques.find(x => x.id === editingId), obj);
  } else {
    obj.id = uid(); obj.last = 0;
    state.techniques.push(obj);
  }
  save(); renderLibrary(); renderManage(); show(editorReturn);
});

document.getElementById('deleteBtn').addEventListener('click', () => {
  if (!editingId) return;
  const t = state.techniques.find(x => x.id === editingId);
  if (!confirm('Supprimer « ' + (t ? t.name : 'cette technique') + ' » ? Cette action est définitive.')) return;
  state.techniques = state.techniques.filter(x => x.id !== editingId);
  save(); renderLibrary(); renderManage(); show(editorReturn);
});
