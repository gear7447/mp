/* ============ export / import JSON ============ */
function exportStr() {
  return JSON.stringify({
    app: 'entraineur-techniques',
    version: 1,
    exportedAt: Date.now(),
    techniques: state.techniques,
    history: state.history,
    settings: state.settings
  }, null, 2);
}

function dstatus(m) {
  document.getElementById('dataStatus').textContent = m || '';
}

function openData() {
  document.getElementById('dataCode').value = '';
  document.getElementById('impCode').value = '';
  document.getElementById('impFile').value = '';
  dstatus('');
  show('data');
}

function applyImport(data, mode) {
  const incT = Array.isArray(data.techniques) ? data.techniques : [];
  const incH = Array.isArray(data.history) ? data.history : [];
  incH.forEach(s => { if (!s.id) s.id = uid() + '-' + (s.date || 0); });
  incT.forEach(t => { if (!t.id) t.id = uid(); if (!t.updated) t.updated = t.last || 0; });
  if (mode === 'replace') {
    state.techniques = incT; state.history = incH;
    if (data.settings) state.settings = data.settings;
    normalize();
    return { addedT: incT.length, addedS: incH.length };
  }
  let addedT = 0, addedS = 0;
  const tById = {};
  state.techniques.forEach(t => tById[t.id] = t);
  incT.forEach(t => {
    if (!tById[t.id]) { state.techniques.push(t); tById[t.id] = t; addedT++; }
    else if ((t.updated || 0) > (tById[t.id].updated || 0)) Object.assign(tById[t.id], t);
  });
  const seen = new Set(state.history.map(s => s.id));
  incH.forEach(s => { if (!seen.has(s.id)) { state.history.push(s); seen.add(s.id); addedS++; } });
  state.history.sort((a, b) => a.date - b.date);
  if (data.settings && (data.settings.updated || 0) > (state.settings.updated || 0))
    state.settings = data.settings;
  normalize();
  return { addedT, addedS };
}

function doImport(mode) {
  let data;
  const raw = document.getElementById('impCode').value.trim();
  if (!raw) { dstatus('Aucune donnée à importer.'); return; }
  try { data = JSON.parse(raw); } catch (e) { dstatus('Contenu illisible (JSON invalide).'); return; }
  if (!data || !Array.isArray(data.techniques)) { dstatus('Format non reconnu.'); return; }
  if (mode === 'replace' && !confirm('Remplacer toutes les données de cet appareil par le contenu importé ?')) return;
  const res = applyImport(data, mode);
  save(); renderLibrary();
  dstatus(mode === 'merge'
    ? `Fusion : +${res.addedT} technique(s), +${res.addedS} séance(s).`
    : `Données remplacées : ${res.addedT} technique(s), ${res.addedS} séance(s).`);
}

/* ---- listeners ---- */
document.getElementById('goData').addEventListener('click', openData);
document.getElementById('dataBack').addEventListener('click', () => show('settings'));

document.getElementById('expFile').addEventListener('click', () => {
  const str = exportStr();
  document.getElementById('dataCode').value = str;
  try {
    const blob = new Blob([str], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const d = new Date(), p = n => String(n).padStart(2, '0');
    const a = document.createElement('a'); a.href = url;
    a.download = 'entraineur-magie-' + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes()) + '.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    dstatus('Fichier exporté.');
  } catch (e) { dstatus("Export impossible ici — utilise « Copier le code »."); }
});

document.getElementById('expCopy').addEventListener('click', async () => {
  const str = exportStr();
  const ta = document.getElementById('dataCode');
  ta.value = str;
  try { await navigator.clipboard.writeText(str); dstatus('Code copié dans le presse-papier.'); }
  catch (e) { ta.focus(); ta.select(); dstatus('Sélectionne le code ci-dessus et copie-le.'); }
});

document.getElementById('impFile').addEventListener('change', e => {
  const f = e.target.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = () => { document.getElementById('impCode').value = r.result; dstatus('Fichier chargé — choisis Fusionner ou Remplacer.'); };
  r.onerror = () => dstatus('Lecture du fichier impossible.');
  r.readAsText(f);
});

document.getElementById('impMerge').addEventListener('click', () => doImport('merge'));
document.getElementById('impReplace').addEventListener('click', () => doImport('replace'));
