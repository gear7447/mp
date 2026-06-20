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

  const DAY_L  = ['D','L','M','M','J','V','S'];
  const today  = todayStr();
  const weekDots = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000);
    const s = d.toISOString().slice(0, 10);
    return { s, letter: DAY_L[d.getDay()], active: actDates.has(s), isToday: s === today };
  });

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
        ${weekDots.map(d => `
          <div class="home-day">
            <div class="home-day-dot${d.active ? ' active' : ''}${d.isToday ? ' today' : ''}"></div>
            <div class="home-day-letter">${d.letter}</div>
          </div>
        `).join('')}
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
    <button class="btn btn-primary" id="homeActionMent">
      🧠 Réviser maintenant — ${mentDueTotal} carte${mentDueTotal > 1 ? 's' : ''}
    </button>` : ''}
  `;

  document.getElementById('homeCardMent').addEventListener('click', () => { show('mentalisme'); renderMentalisme(); });
  document.getElementById('homeCardCarto').addEventListener('click', () => show('library'));
  document.getElementById('homeCardTours').addEventListener('click', () => { renderTourStatusPills(); renderTourList(); show('tours'); });
  document.getElementById('homeActionMent')?.addEventListener('click', () => { show('mentalisme'); renderMentalisme(); });
}
