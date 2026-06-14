/* ============ réglages ============ */
let editLevels = [];

function syncLevelsFromDOM() {
  const ins = [...document.querySelectorAll('#set_levels input.lvlname')];
  if (ins.length) editLevels = ins.map(i => i.value);
}

function renderLevelRows() {
  const lv = document.getElementById('set_levels');
  lv.innerHTML = '';
  editLevels.forEach((n, i) => {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:8px;align-items:center';
    const inp = document.createElement('input');
    inp.type = 'text'; inp.className = 'lvlname'; inp.value = n;
    inp.placeholder = DEFAULT_LEVELS[i] || ('Niveau ' + (i + 1));
    inp.style.flex = '1';
    row.appendChild(inp);
    if (editLevels.length > 2) {
      const del = document.createElement('button');
      del.type = 'button'; del.textContent = '✕';
      del.style.cssText = 'background:none;border:1px solid rgba(221,136,136,.4);color:#d98;border-radius:8px;padding:8px 11px;font-size:.9rem';
      del.addEventListener('click', () => { syncLevelsFromDOM(); editLevels.splice(i, 1); renderLevelRows(); });
      row.appendChild(del);
    }
    lv.appendChild(row);
  });
  if (editLevels.length < 10) {
    const add = document.createElement('button');
    add.type = 'button'; add.className = 'link'; add.textContent = '+ Ajouter un niveau';
    add.style.alignSelf = 'flex-start';
    add.addEventListener('click', () => { syncLevelsFromDOM(); editLevels.push(''); renderLevelRows(); });
    lv.appendChild(add);
  }
}

function openSettings() {
  document.getElementById('set_focusW').value = state.settings.focusWeight;
  document.getElementById('set_byLevel').checked = state.settings.weightByLevel;
  editLevels = levelNames().slice();
  renderLevelRows();
  show('settings');
}

document.getElementById('settingsBtn').addEventListener('click', openSettings);
document.getElementById('setBack').addEventListener('click', () => show('library'));
document.getElementById('setSave').addEventListener('click', () => {
  state.settings.focusWeight = Math.max(1, parseFloat(document.getElementById('set_focusW').value) || 2);
  state.settings.weightByLevel = document.getElementById('set_byLevel').checked;
  syncLevelsFromDOM();
  let names = editLevels.map((v, i) => (v || '').trim() || DEFAULT_LEVELS[i] || ('Niveau ' + (i + 1)));
  if (names.length < 2) names = DEFAULT_LEVELS.slice();
  state.settings.levelNames = names;
  state.settings.updated = Date.now();
  state.techniques.forEach(t => {
    if (t.level > names.length) t.level = names.length;
    if (!t.level || t.level < 1) t.level = 1;
  });
  save(); renderLibrary(); show('library');
});
