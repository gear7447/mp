/* ============ statistiques ============ */
function computeStats() {
  const H = state.history || [];
  const totalSec = H.reduce((a, s) => a + (s.sec || 0), 0);
  const weekAgo = Date.now() - 7 * 86400000;
  const weekSec = H.filter(s => s.date >= weekAgo).reduce((a, s) => a + (s.sec || 0), 0);
  const days = new Set(H.map(s => dayKey(s.date)));
  let streak = 0;
  let cur = new Date(); cur.setHours(0, 0, 0, 0);
  if (!days.has(dayKey(cur.getTime()))) cur.setDate(cur.getDate() - 1);
  while (days.has(dayKey(cur.getTime()))) { streak++; cur.setDate(cur.getDate() - 1); }
  const perDay = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - i);
    const k = dayKey(d.getTime());
    const sec = H.filter(s => dayKey(s.date) === k).reduce((a, s) => a + (s.sec || 0), 0);
    perDay.push({ date: d, min: Math.round(sec / 60) });
  }
  const tt = {};
  H.forEach(s => {
    const pt = s.perTech || {};
    Object.keys(pt).forEach(id => {
      tt[id] = tt[id] || { sec:0, count:0, last:0 };
      tt[id].sec += pt[id]; tt[id].count++; tt[id].last = Math.max(tt[id].last, s.date);
    });
  });
  return { totalSec, weekSec, sessions: H.length, streak, perDay, tt };
}

function renderStats() {
  const body = document.getElementById('statsBody');
  const H = state.history || [];
  if (!H.length) {
    body.innerHTML = '<div class="empty">Aucune séance enregistrée pour l\'instant.<br>Lance une séance : tes statistiques apparaîtront ici.</div>';
    return;
  }
  const st = computeStats(), DOW = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'], ln = levelNames();
  let h = '';
  h += '<div class="tiles">';
  h += `<div class="tile"><div class="v">${fmtDur(st.totalSec)}</div><div class="k">Temps total</div></div>`;
  h += `<div class="tile"><div class="v">${fmtDur(st.weekSec)}</div><div class="k">7 derniers jours</div></div>`;
  h += `<div class="tile"><div class="v">${st.sessions}</div><div class="k">Séances</div></div>`;
  h += `<div class="tile"><div class="v">${st.streak} j</div><div class="k">Série en cours</div></div>`;
  h += '</div>';
  const maxMin = Math.max(1, ...st.perDay.map(d => d.min));
  h += '<div class="sec-h">Activité — 7 jours</div><div class="bars">';
  st.perDay.forEach(d => {
    const px = d.min ? Math.max(3, Math.round(d.min / maxMin * 80)) : 0;
    h += `<div class="bar-col"><div class="bar-val">${d.min || ''}</div><div class="bar" style="height:${px}px"></div><div class="bar-lbl">${DOW[d.date.getDay()]}</div></div>`;
  });
  h += '</div>';
  const counts = ln.map(() => 0);
  state.techniques.forEach(t => {
    const i = Math.min(ln.length, Math.max(1, t.level || 1)) - 1;
    counts[i]++;
  });
  const maxC = Math.max(1, ...counts);
  h += '<div class="sec-h">Répertoire par niveau</div>';
  ln.forEach((n, i) => {
    h += `<div class="lvbar"><span class="nm">${escapeHtml(n)}</span><span class="track2"><span class="fill" style="width:${counts[i] / maxC * 100}%"></span></span><span class="ct">${counts[i]}</span></div>`;
  });
  h += '<div class="sec-h">Par technique</div>';
  const rows = state.techniques.map(t => ({ t, s: st.tt[t.id] || { sec:0, count:0, last:t.last || 0 } }));
  rows.sort((a, b) => b.s.sec - a.s.sec || a.t.name.localeCompare(b.t.name));
  rows.forEach(({ t, s }) => {
    h += `<div class="st-tech"><div class="l"><div class="n">${escapeHtml(t.name)} ${t.focus ? '⭐' : ''}</div><div class="s">${escapeHtml(levelNames()[t.level - 1] || '')} · ${s.count} séance${s.count > 1 ? 's' : ''}</div></div><div class="r">${fmtDur(s.sec)}<small>${daysAgo(s.last)}</small></div></div>`;
  });
  body.innerHTML = h;
}

function openStats() { renderStats(); show('stats'); }

document.getElementById('statsBtn').addEventListener('click', openStats);
document.getElementById('statsBack').addEventListener('click', () => show('library'));
