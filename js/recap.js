/* ============ récapitulatif de séance ============ */
function endSession() {
  if (masterTimer) { clearInterval(masterTimer); masterTimer = null; }
  clearMetro();
  if (S.paused) {
    S.blockPaused = (S.blockPaused || 0) + (Date.now() - S.pauseStart);
    S.paused = false;
    updatePauseUI();
  }
  finalizeBlock(Date.now());
  const totalSec = Object.values(S.techSec).reduce((a, b) => a + b, 0);
  const perTech = {}, names = {};
  Object.keys(S.techSec).forEach(id => {
    perTech[id] = Math.round(S.techSec[id]);
    const t = techById(id);
    if (t) names[id] = t.name;
  });
  state.history = state.history || [];
  if (S.blocks > 0) {
    state.history.push({
      id: uid() + '-' + Date.now(),
      date: Date.now(),
      sec: Math.round(totalSec),
      blocks: S.blocks,
      perTech,
      names
    });
  }
  save();
  const mins = Math.max(1, Math.round(totalSec / 60));
  document.getElementById('recapStat').innerHTML =
    `<b>${mins}</b> min travaillées · <b>${S.blocks}</b> bloc${S.blocks > 1 ? 's' : ''} · <b>${S.appeared.size}</b> technique${S.appeared.size > 1 ? 's' : ''}`;
  const list = document.getElementById('recapList');
  list.innerHTML = '';
  [...S.appeared].forEach(id => {
    const t = techById(id);
    if (!t) return;
    const item = document.createElement('div');
    item.className = 'recap-item';
    item.innerHTML = `<div class="nm">${escapeHtml(t.name)}</div>
      <select data-id="${id}">${levelNames().map((l, i) =>
        `<option value="${i + 1}" ${t.level === i + 1 ? 'selected' : ''}>${escapeHtml(l)}</option>`
      ).join('')}</select>`;
    list.appendChild(item);
  });
  show('recap');
}

document.getElementById('recapSave').addEventListener('click', () => {
  document.querySelectorAll('#recapList select').forEach(sel => {
    const t = techById(sel.dataset.id);
    if (t) { t.level = parseInt(sel.value); t.last = Date.now(); t.updated = Date.now(); }
  });
  save(); S = null; renderLibrary(); show('library');
});
