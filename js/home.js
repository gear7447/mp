/* ============ ACCUEIL ============ */

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function updateStreak() {
  const today = todayStr();
  if (!state.settings.streak) state.settings.streak = { count: 0, lastDate: '' };
  const s = state.settings.streak;
  if (s.lastDate === today) return;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  s.count = (s.lastDate === yesterday) ? s.count + 1 : 1;
  s.lastDate = today;
  if (!Array.isArray(state.settings.activityDates)) state.settings.activityDates = [];
  if (!state.settings.activityDates.includes(today)) state.settings.activityDates.push(today);
  const cutoff = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);
  state.settings.activityDates = state.settings.activityDates.filter(d => d >= cutoff);
  save();
}

function _homeRelDate(ts) {
  if (!ts) return '—';
  const days = Math.floor((Date.now() - ts) / 86400000);
  if (days === 0) return 'aujourd\'hui';
  if (days === 1) return 'hier';
  if (days < 30) return `il y a ${days} j`;
  return `il y a ${Math.floor(days / 30)} mois`;
}

function renderHome() {
  updateStreak();
  const body = document.getElementById('homeBody');
  if (!body) return;

  const streak   = state.settings.streak || { count: 0 };
  const actDates = new Set(state.settings.activityDates || []);

  const mentFetesDue = mentDueItems('fetes').length;
  const mentAnnivDue = mentDueItems('anniversaires').length;
  const mentDueTotal = mentFetesDue + mentAnnivDue;

  const lastSess = [...(state.history || [])].sort((a, b) => b.date - a.date)[0];
  const toursRep = (state.tours?.list || []).filter(t => t.status === 'repertoire').length;

  const DAY_L   = ['D','L','M','M','J','V','S'];
  const today   = todayStr();
  const daily   = state.settings.dailyStats || {};

  // cartomagie sessions par jour depuis state.history
  const cartoByDay = {};
  (state.history || []).forEach(s => {
    const d = new Date(s.date).toISOString().slice(0, 10);
    cartoByDay[d] = (cartoByDay[d] || 0) + 1;
  });

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d   = new Date(Date.now() - (6 - i) * 86400000);
    const s   = d.toISOString().slice(0, 10);
    const carto = cartoByDay[s] || 0;
    const ment  = (daily[s] || {}).ment || 0;
    return { s, letter: DAY_L[d.getDay()], active: actDates.has(s), isToday: s === today, carto, ment, total: carto * 2 + ment };
  });
  const maxTotal = Math.max(1, ...weekDays.map(d => d.total));

  const streakIcon = streak.count >= 7 ? '🔥' : streak.count >= 3 ? '✨' : streak.count >= 1 ? '⚡' : '💤';

  body.innerHTML = `
    <div class="home-hero">
      <div class="home-streak-wrap">
        <span class="home-streak-icon">${streakIcon}</span>
        <div>
          <div class="home-streak-n">${streak.count}</div>
          <div class="home-streak-lbl">jour${streak.count !== 1 ? 's' : ''} de suite</div>
        </div>
      </div>
      <div class="home-week">
        ${weekDays.map(d => {
          const h = d.total > 0 ? Math.max(6, Math.round(d.total / maxTotal * 36)) : 4;
          return `
          <div class="home-day">
            <div class="home-day-bar-wrap">
              ${d.carto > 0 ? `<div class="home-day-seg carto" style="height:${Math.max(4,Math.round(d.carto*2/maxTotal*34))}px"></div>` : ''}
              ${d.ment  > 0 ? `<div class="home-day-seg ment"  style="height:${Math.max(4,Math.round(d.ment /maxTotal*34))}px"></div>` : ''}
            </div>
            <div class="home-day-letter${d.isToday ? ' today' : ''}">${d.letter}</div>
          </div>`;
        }).join('')}
      </div>
    </div>

    <div class="home-modules">
      <button class="home-mod-card${mentDueTotal > 0 ? ' has-due' : ''}" id="homeCardMent">
        <span class="home-mod-icon">🧠</span>
        <div class="home-mod-body">
          <div class="home-mod-name">Mentalisme</div>
          <div class="home-mod-sub ${mentDueTotal > 0 ? 'home-urgent' : 'home-ok'}">
            ${mentDueTotal > 0 ? `${mentDueTotal} carte${mentDueTotal > 1 ? 's' : ''} à réviser` : '✓ À jour'}
          </div>
        </div>
        <span class="home-mod-arrow">›</span>
      </button>
      <button class="home-mod-card" id="homeCardCarto">
        <span class="home-mod-icon">🃏</span>
        <div class="home-mod-body">
          <div class="home-mod-name">Cartomagie</div>
          <div class="home-mod-sub">${lastSess ? _homeRelDate(lastSess.date) : 'Aucune séance'}</div>
        </div>
        <span class="home-mod-arrow">›</span>
      </button>
      <button class="home-mod-card" id="homeCardTours">
        <span class="home-mod-icon">🎩</span>
        <div class="home-mod-body">
          <div class="home-mod-name">Tours</div>
          <div class="home-mod-sub">${toursRep} en répertoire</div>
        </div>
        <span class="home-mod-arrow">›</span>
      </button>
    </div>

    ${mentDueTotal > 0 ? `
    <button class="home-action" id="homeActionMent">
      <span class="home-action-icon">🧠</span>
      <div class="home-action-body">
        <div class="home-action-lbl">Révision en attente</div>
        <div class="home-action-count">${mentDueTotal} carte${mentDueTotal > 1 ? 's' : ''} à revoir</div>
      </div>
      <span class="home-action-cta">Commencer →</span>
    </button>` : ''}
  `;

  document.getElementById('homeCardMent').addEventListener('click', () => { show('mentalisme'); renderMentalisme(); });
  document.getElementById('homeCardCarto').addEventListener('click', () => show('library'));
  document.getElementById('homeCardTours').addEventListener('click', () => { renderTourStatusPills(); renderTourList(); show('tours'); });
  document.getElementById('homeActionMent')?.addEventListener('click', () => { show('mentalisme'); renderMentalisme(); });
}
