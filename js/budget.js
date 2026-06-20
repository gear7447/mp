/* ============ MODULE BUDGET MAGIE ============ */

const BUDGET_DEFAULT_CATEGORIES = ['Cartes', 'Tour acheté', 'Livre / DVD', 'Matériel', 'Autre'];

/* ─── helpers ─────────────────────────────────── */
function bCoachById(id) { return state.budget.coaches.find(c => c.id === id); }
function bCatById(id)   { return state.budget.categories.find(c => c.id === id); }

function bCredits(coachId) {
  const coach = bCoachById(coachId);
  if (!coach || !coach.pricePerSession) return { totalPaid: 0, sessionsPaid: 0, used: 0, remaining: 0, money: 0 };
  const totalPaid = state.budget.versements
    .filter(v => v.coachId === coachId)
    .reduce((s, v) => s + (v.amount || 0), 0);
  const sessionsPaid = Math.floor(totalPaid / coach.pricePerSession);
  const used = state.budget.cours.filter(c => c.coachId === coachId && c.status === 'effectué').length;
  const remaining = sessionsPaid - used;
  return { totalPaid, sessionsPaid, used, remaining, money: remaining * coach.pricePerSession };
}

function bFmtDate(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function bDateVal(ts) {
  const d = ts ? new Date(ts) : new Date();
  return d.toISOString().slice(0, 10);
}
function bParseDate(str) { return str ? new Date(str).getTime() : Date.now(); }
function bFmtEur(n)      { return Number(n || 0).toFixed(0) + ' €'; }

function bCoachOpts(selectedId, empty) {
  const e = empty ? '<option value="">— Coach —</option>' : '';
  return e + state.budget.coaches.map(c =>
    `<option value="${c.id}" ${c.id === selectedId ? 'selected' : ''}>${escapeHtml(c.name)}</option>`
  ).join('');
}

/* ─── écran principal ─────────────────────────── */
function renderBudget() {
  /* cards coaches */
  const coaches = state.budget.coaches;
  document.getElementById('budgetCoaches').innerHTML = !coaches.length
    ? `<div class="empty">Aucun coach.<br><button class="btn btn-primary" onclick="renderBudgetGestion();show('budget-gestion')">+ Ajouter un coach</button></div>`
    : coaches.map(coach => {
        const cr = bCredits(coach.id);
        const total = Math.max(cr.sessionsPaid, 4);
        const bars = Array.from({ length: total }, (_, i) =>
          `<div class="bc-bar ${i < cr.used ? 'used' : i < cr.sessionsPaid ? 'avail' : 'empty'}"></div>`
        ).join('');
        const next = state.budget.cours
          .filter(c => c.coachId === coach.id && c.status === 'prévu')
          .sort((a, b) => (a.date || 0) - (b.date || 0))[0];
        return `<div class="tile bc-card">
          <div class="bc-head">
            <span class="bc-name">${escapeHtml(coach.name)}</span>
            <span class="bc-price">${bFmtEur(coach.pricePerSession)}/séance</span>
          </div>
          <div class="bc-bars">${bars}</div>
          <div class="bc-credit${cr.remaining < 0 ? ' bad' : ''}">
            ${cr.remaining > 0
              ? `<b>${cr.remaining}</b> séance${cr.remaining > 1 ? 's' : ''} restante${cr.remaining > 1 ? 's' : ''} · ${bFmtEur(cr.money)}`
              : cr.remaining === 0 ? 'Aucun crédit restant'
              : `<b>${Math.abs(cr.remaining)}</b> séance${Math.abs(cr.remaining) > 1 ? 's' : ''} à régler`}
          </div>
          ${next ? `<div class="bc-next">Prochain : ${bFmtDate(next.date)}</div>` : ''}
        </div>`;
      }).join('');

  /* activité récente */
  const activity = [
    ...state.budget.versements.map(v => ({ ...v, _t: 'v' })),
    ...state.budget.cours.map(c => ({ ...c, _t: 'c' })),
    ...state.budget.depenses.map(d => ({ ...d, _t: 'd' })),
  ].sort((a, b) => (b.date || 0) - (a.date || 0)).slice(0, 12);

  document.getElementById('budgetActivity').innerHTML = !activity.length
    ? '<div class="muted" style="text-align:center;padding:20px 0">Aucune activité enregistrée</div>'
    : activity.map(item => {
        if (item._t === 'v') {
          const coach = bCoachById(item.coachId);
          return `<div class="bact-row" data-id="${item.id}" data-t="v"><span class="bact-icon">💶</span><span class="bact-lbl">Versement · ${escapeHtml(coach?.name || '?')}</span><span class="bact-amt plus">+${bFmtEur(item.amount)}</span><span class="bact-date">${bFmtDate(item.date)}</span></div>`;
        }
        if (item._t === 'c') {
          const coach = bCoachById(item.coachId);
          return `<div class="bact-row" data-id="${item.id}" data-t="c"><span class="bact-icon">${item.status === 'effectué' ? '✅' : '📅'}</span><span class="bact-lbl">Cours ${item.status} · ${escapeHtml(coach?.name || '?')}</span><span class="bact-amt"></span><span class="bact-date">${bFmtDate(item.date)}</span></div>`;
        }
        const cat = bCatById(item.categoryId);
        return `<div class="bact-row" data-id="${item.id}" data-t="d"><span class="bact-icon">🛒</span><span class="bact-lbl">${escapeHtml(cat?.name || 'Autre')}${item.description ? ' · ' + escapeHtml(item.description) : ''}</span><span class="bact-amt minus">−${bFmtEur(item.amount)}</span><span class="bact-date">${bFmtDate(item.date)}</span></div>`;
      }).join('');

  document.querySelectorAll('.bact-row').forEach(row =>
    row.addEventListener('click', () => {
      if (row.dataset.t === 'v') openBudgetVersement(row.dataset.id);
      else if (row.dataset.t === 'c') openBudgetCours(row.dataset.id);
      else openBudgetDepense(row.dataset.id);
    })
  );
}

/* ─── gestion coaches + catégories ───────────── */
function renderBudgetGestion() {
  /* coaches */
  const cl = document.getElementById('bgCoachList');
  cl.innerHTML = !state.budget.coaches.length
    ? '<div class="muted" style="padding:8px 0">Aucun coach</div>'
    : state.budget.coaches.map(c => `
        <div class="bgest-row">
          <div class="bgest-info"><span class="bgest-name">${escapeHtml(c.name)}</span><span class="bgest-sub">${bFmtEur(c.pricePerSession)}/séance</span></div>
          <button class="btn btn-ghost btn-sm" data-coach-edit="${c.id}">Modifier</button>
          <button class="btn btn-danger btn-sm" data-coach-del="${c.id}">✕</button>
        </div>`).join('');

  cl.querySelectorAll('[data-coach-edit]').forEach(btn =>
    btn.addEventListener('click', () => openBudgetCoachEditor(btn.dataset.coachEdit)));
  cl.querySelectorAll('[data-coach-del]').forEach(btn =>
    btn.addEventListener('click', () => {
      const c = bCoachById(btn.dataset.coachDel);
      confirmDelete(`Supprimer ${c?.name} ?`, 'Les versements et cours liés seront conservés.', () => {
        state.budget.coaches = state.budget.coaches.filter(x => x.id !== btn.dataset.coachDel);
        save(); renderBudgetGestion();
      });
    }));

  /* catégories */
  const catEl = document.getElementById('bgCatList');
  catEl.innerHTML = state.budget.categories.map(cat => `
    <div class="bgest-row">
      <span class="bgest-name" style="flex:1">${escapeHtml(cat.name)}</span>
      <button class="btn btn-ghost btn-sm" data-cat-edit="${cat.id}">Modifier</button>
      <button class="btn btn-danger btn-sm" data-cat-del="${cat.id}">✕</button>
    </div>`).join('');

  catEl.querySelectorAll('[data-cat-edit]').forEach(btn =>
    btn.addEventListener('click', () => {
      const cat = bCatById(btn.dataset.catEdit);
      const name = prompt('Nom de la catégorie', cat?.name || '');
      if (name?.trim()) { cat.name = name.trim(); save(); renderBudgetGestion(); }
    }));
  catEl.querySelectorAll('[data-cat-del]').forEach(btn =>
    btn.addEventListener('click', () => {
      confirmDelete('Supprimer cette catégorie ?', 'Les dépenses liées resteront sans catégorie.', () => {
        state.budget.categories = state.budget.categories.filter(x => x.id !== btn.dataset.catDel);
        save(); renderBudgetGestion();
      });
    }));
}

/* coach editor dialog */
let _bCoachId = null;
function openBudgetCoachEditor(id) {
  _bCoachId = id || null;
  const c = id ? bCoachById(id) : null;
  document.getElementById('bgCoachName').value  = c?.name || '';
  document.getElementById('bgCoachPrice').value = c?.pricePerSession || '';
  document.getElementById('bgCoachDialog').classList.remove('hidden');
}
function saveBudgetCoach() {
  const name  = document.getElementById('bgCoachName').value.trim();
  const price = parseFloat(document.getElementById('bgCoachPrice').value) || 0;
  if (!name) { alert('Nom requis'); return; }
  if (_bCoachId) {
    const c = bCoachById(_bCoachId);
    if (c) { c.name = name; c.pricePerSession = price; }
  } else {
    state.budget.coaches.push({ id: uid(), name, pricePerSession: price });
  }
  save();
  document.getElementById('bgCoachDialog').classList.add('hidden');
  renderBudgetGestion();
}

/* ─── versement editor ────────────────────────── */
let _bVId = null;
function openBudgetVersement(id) {
  _bVId = id || null;
  const v = id ? state.budget.versements.find(x => x.id === id) : null;
  document.getElementById('bvCoach').innerHTML  = bCoachOpts(v?.coachId, !v);
  document.getElementById('bvAmount').value     = v?.amount || '';
  document.getElementById('bvDate').value       = bDateVal(v?.date);
  document.getElementById('bvNote').value       = v?.note || '';
  document.getElementById('bvDelBtn').classList.toggle('hidden', !id);
  document.getElementById('bvTitle').textContent = id ? 'Modifier le versement' : 'Nouveau versement';
  show('budget-versement-editor');
}
function saveBudgetVersement() {
  const coachId = document.getElementById('bvCoach').value;
  const amount  = parseFloat(document.getElementById('bvAmount').value);
  const date    = bParseDate(document.getElementById('bvDate').value);
  const note    = document.getElementById('bvNote').value.trim();
  if (!coachId) { alert('Choisis un coach'); return; }
  if (!amount || amount <= 0) { alert('Montant requis'); return; }
  if (_bVId) {
    const v = state.budget.versements.find(x => x.id === _bVId);
    if (v) Object.assign(v, { coachId, amount, date, note });
  } else {
    state.budget.versements.push({ id: uid(), coachId, amount, date, note });
  }
  save(); show('budget'); renderBudget();
}

/* ─── cours editor ────────────────────────────── */
let _bCId = null;
function openBudgetCours(id) {
  _bCId = id || null;
  const c = id ? state.budget.cours.find(x => x.id === id) : null;
  document.getElementById('bcCoach').innerHTML = bCoachOpts(c?.coachId, !c);
  document.getElementById('bcDate').value      = bDateVal(c?.date);
  const done = c?.status === 'effectué';
  document.getElementById('bcStatusPrev').classList.toggle('active', !done);
  document.getElementById('bcStatusDone').classList.toggle('active',  done);
  document.getElementById('bcNote').value = c?.note || '';
  document.getElementById('bcDelBtn').classList.toggle('hidden', !id);
  document.getElementById('bcTitle').textContent = id ? 'Modifier le cours' : 'Nouveau cours';

  const selTechs = new Set(c?.techniqueIds || []);
  document.getElementById('bcTechList').innerHTML = !state.techniques.length
    ? '<div class="muted">Aucune technique enregistrée</div>'
    : state.techniques.map(t => `<label class="bpick-row"><input type="checkbox" value="${t.id}" ${selTechs.has(t.id) ? 'checked' : ''}><span>${escapeHtml(t.name)}</span><span class="muted bpick-sub">${escapeHtml(t.family || '')}</span></label>`).join('');

  const selTours = new Set(c?.tourIds || []);
  document.getElementById('bcTourList').innerHTML = !state.tours.list.length
    ? '<div class="muted">Aucun tour enregistré</div>'
    : state.tours.list.map(t => `<label class="bpick-row"><input type="checkbox" value="${t.id}" ${selTours.has(t.id) ? 'checked' : ''}><span>${escapeHtml(t.name)}</span></label>`).join('');

  show('budget-cours-editor');
}
function bcStatus() {
  return document.getElementById('bcStatusDone').classList.contains('active') ? 'effectué' : 'prévu';
}
function saveBudgetCours() {
  const coachId      = document.getElementById('bcCoach').value;
  const date         = bParseDate(document.getElementById('bcDate').value);
  const status       = bcStatus();
  const note         = document.getElementById('bcNote').value.trim();
  if (!coachId) { alert('Choisis un coach'); return; }
  const techniqueIds = [...document.querySelectorAll('#bcTechList input:checked')].map(cb => cb.value);
  const tourIds      = [...document.querySelectorAll('#bcTourList input:checked')].map(cb => cb.value);
  if (_bCId) {
    const c = state.budget.cours.find(x => x.id === _bCId);
    if (c) Object.assign(c, { coachId, date, status, note, techniqueIds, tourIds });
  } else {
    state.budget.cours.push({ id: uid(), coachId, date, status, note, techniqueIds, tourIds });
  }
  save(); show('budget'); renderBudget();
}

/* ─── dépense editor ──────────────────────────── */
let _bDId = null;
function openBudgetDepense(id) {
  _bDId = id || null;
  const d = id ? state.budget.depenses.find(x => x.id === id) : null;
  document.getElementById('bdCat').innerHTML   = state.budget.categories.map(cat =>
    `<option value="${cat.id}" ${cat.id === d?.categoryId ? 'selected' : ''}>${escapeHtml(cat.name)}</option>`
  ).join('');
  document.getElementById('bdAmount').value      = d?.amount || '';
  document.getElementById('bdDesc').value        = d?.description || '';
  document.getElementById('bdDate').value        = bDateVal(d?.date);
  document.getElementById('bdDelBtn').classList.toggle('hidden', !id);
  document.getElementById('bdTitle').textContent = id ? 'Modifier la dépense' : 'Nouvelle dépense';
  show('budget-depense-editor');
}
function saveBudgetDepense() {
  const categoryId  = document.getElementById('bdCat').value;
  const amount      = parseFloat(document.getElementById('bdAmount').value);
  const description = document.getElementById('bdDesc').value.trim();
  const date        = bParseDate(document.getElementById('bdDate').value);
  if (!amount || amount <= 0) { alert('Montant requis'); return; }
  if (_bDId) {
    const d = state.budget.depenses.find(x => x.id === _bDId);
    if (d) Object.assign(d, { categoryId, amount, description, date });
  } else {
    state.budget.depenses.push({ id: uid(), categoryId, amount, description, date });
  }
  save(); show('budget'); renderBudget();
}

/* ─── stats ───────────────────────────────────── */
function renderBudgetStats() {
  const totalCours    = state.budget.coaches.reduce((s, c) => s + bCredits(c.id).totalPaid, 0);
  const totalDepenses = state.budget.depenses.reduce((s, d) => s + (d.amount || 0), 0);
  document.getElementById('bstatTotal').textContent    = bFmtEur(totalCours + totalDepenses);
  document.getElementById('bstatCours').textContent    = bFmtEur(totalCours);
  document.getElementById('bstatDepenses').textContent = bFmtEur(totalDepenses);

  const catMap = {};
  state.budget.depenses.forEach(d => { catMap[d.categoryId] = (catMap[d.categoryId] || 0) + (d.amount || 0); });
  document.getElementById('bstatCatRows').innerHTML = !Object.keys(catMap).length
    ? '<div class="muted" style="padding:8px">Aucune dépense</div>'
    : Object.entries(catMap).sort((a, b) => b[1] - a[1]).map(([id, amt]) => {
        const cat = bCatById(id);
        const pct = totalDepenses ? Math.round(amt / totalDepenses * 100) : 0;
        return `<div class="bstat-row"><span>${escapeHtml(cat?.name || 'Autre')}</span><span>${bFmtEur(amt)} <span class="muted">(${pct}%)</span></span></div>`;
      }).join('');

  document.getElementById('bstatCoachRows').innerHTML = !state.budget.coaches.length
    ? '<div class="muted" style="padding:8px">Aucun coach</div>'
    : state.budget.coaches.map(c => {
        const cr = bCredits(c.id);
        return `<div class="bstat-row"><span>${escapeHtml(c.name)}</span><span>${bFmtEur(cr.totalPaid)} · ${cr.sessionsPaid} séance${cr.sessionsPaid > 1 ? 's' : ''} · ${cr.used} effectuée${cr.used > 1 ? 's' : ''}</span></div>`;
      }).join('');

  const all = [
    ...state.budget.versements.map(v => ({ ...v, _t: 'v' })),
    ...state.budget.cours.map(c => ({ ...c, _t: 'c' })),
    ...state.budget.depenses.map(d => ({ ...d, _t: 'd' })),
  ].sort((a, b) => (b.date || 0) - (a.date || 0));

  document.getElementById('bstatHistory').innerHTML = !all.length
    ? '<div class="muted" style="text-align:center;padding:16px">Aucun historique</div>'
    : all.map(item => {
        if (item._t === 'v') { const coach = bCoachById(item.coachId); return `<div class="bact-row"><span class="bact-icon">💶</span><span class="bact-lbl">Versement · ${escapeHtml(coach?.name || '?')}${item.note ? ' · ' + escapeHtml(item.note) : ''}</span><span class="bact-amt plus">+${bFmtEur(item.amount)}</span><span class="bact-date">${bFmtDate(item.date)}</span></div>`; }
        if (item._t === 'c') { const coach = bCoachById(item.coachId); return `<div class="bact-row"><span class="bact-icon">${item.status === 'effectué' ? '✅' : '📅'}</span><span class="bact-lbl">Cours ${item.status} · ${escapeHtml(coach?.name || '?')}</span><span class="bact-amt"></span><span class="bact-date">${bFmtDate(item.date)}</span></div>`; }
        const cat = bCatById(item.categoryId);
        return `<div class="bact-row"><span class="bact-icon">🛒</span><span class="bact-lbl">${escapeHtml(cat?.name || 'Autre')}${item.description ? ' · ' + escapeHtml(item.description) : ''}</span><span class="bact-amt minus">−${bFmtEur(item.amount)}</span><span class="bact-date">${bFmtDate(item.date)}</span></div>`;
      }).join('');
}

/* ─── liens technique/tour → cours ───────────── */
function showBudgetTechCours(techId) {
  const tech   = state.techniques.find(t => t.id === techId);
  const linked = state.budget.cours.filter(c => (c.techniqueIds || []).includes(techId))
                   .sort((a, b) => (b.date || 0) - (a.date || 0));
  const body = !linked.length ? 'Aucun cours lié à cette technique.'
    : linked.map(c => `${bFmtDate(c.date)} · ${escapeHtml(bCoachById(c.coachId)?.name || '?')} (${c.status})`).join('<br>');
  _bShowLinks(`Cours liés — ${tech?.name || ''}`, body);
}
function showBudgetTourCours(tourId) {
  const tour   = state.tours.list.find(t => t.id === tourId);
  const linked = state.budget.cours.filter(c => (c.tourIds || []).includes(tourId))
                   .sort((a, b) => (b.date || 0) - (a.date || 0));
  const body = !linked.length ? 'Aucun cours lié à ce tour.'
    : linked.map(c => `${bFmtDate(c.date)} · ${escapeHtml(bCoachById(c.coachId)?.name || '?')} (${c.status})`).join('<br>');
  _bShowLinks(`Cours liés — ${tour?.name || ''}`, body);
}
function _bShowLinks(title, body) {
  document.getElementById('blinkTitle').textContent = title;
  document.getElementById('blinkBody').innerHTML    = body;
  document.getElementById('blinkOverlay').classList.remove('hidden');
}

/* ─── event listeners ─────────────────────────── */
/* main */
document.getElementById('budgetGestionBtn').addEventListener('click', () => { renderBudgetGestion(); show('budget-gestion'); });
document.getElementById('budgetStatsBtn').addEventListener('click',   () => { renderBudgetStats();   show('budget-stats');   });
document.getElementById('budgetAddVersement').addEventListener('click', () => openBudgetVersement(null));
document.getElementById('budgetAddCours').addEventListener('click',     () => openBudgetCours(null));
document.getElementById('budgetAddDepense').addEventListener('click',   () => openBudgetDepense(null));

/* gestion */
document.getElementById('bgBack').addEventListener('click', () => { show('budget'); renderBudget(); });
document.getElementById('bgAddCoach').addEventListener('click', () => openBudgetCoachEditor(null));
document.getElementById('bgAddCat').addEventListener('click', () => {
  const name = prompt('Nouvelle catégorie');
  if (name?.trim()) { state.budget.categories.push({ id: uid(), name: name.trim() }); save(); renderBudgetGestion(); }
});
document.getElementById('bgCoachSave').addEventListener('click',   saveBudgetCoach);
document.getElementById('bgCoachCancel').addEventListener('click', () => document.getElementById('bgCoachDialog').classList.add('hidden'));

/* versement */
document.getElementById('bvBack').addEventListener('click', () => { show('budget'); renderBudget(); });
document.getElementById('bvSave').addEventListener('click', saveBudgetVersement);
document.getElementById('bvDelBtn').addEventListener('click', () =>
  confirmDelete('Supprimer ce versement ?', '', () => {
    state.budget.versements = state.budget.versements.filter(x => x.id !== _bVId);
    save(); show('budget'); renderBudget();
  }));

/* cours */
document.getElementById('bcBack').addEventListener('click', () => { show('budget'); renderBudget(); });
document.getElementById('bcSave').addEventListener('click', saveBudgetCours);
document.getElementById('bcStatusPrev').addEventListener('click', () => {
  document.getElementById('bcStatusPrev').classList.add('active');
  document.getElementById('bcStatusDone').classList.remove('active');
});
document.getElementById('bcStatusDone').addEventListener('click', () => {
  document.getElementById('bcStatusDone').classList.add('active');
  document.getElementById('bcStatusPrev').classList.remove('active');
});
document.getElementById('bcNewTech').addEventListener('click', () => { openManage(); });
document.getElementById('bcNewTour').addEventListener('click', () => { renderTourList(); show('tours'); });
document.getElementById('bcDelBtn').addEventListener('click', () =>
  confirmDelete('Supprimer ce cours ?', '', () => {
    state.budget.cours = state.budget.cours.filter(x => x.id !== _bCId);
    save(); show('budget'); renderBudget();
  }));

/* dépense */
document.getElementById('bdBack').addEventListener('click', () => { show('budget'); renderBudget(); });
document.getElementById('bdSave').addEventListener('click', saveBudgetDepense);
document.getElementById('bdDelBtn').addEventListener('click', () =>
  confirmDelete('Supprimer cette dépense ?', '', () => {
    state.budget.depenses = state.budget.depenses.filter(x => x.id !== _bDId);
    save(); show('budget'); renderBudget();
  }));

/* stats */
document.getElementById('bstatBack').addEventListener('click', () => { show('budget'); renderBudget(); });

/* modal liens */
document.getElementById('blinkClose').addEventListener('click', () =>
  document.getElementById('blinkOverlay').classList.add('hidden'));
