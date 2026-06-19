/* ============ état + sauvegarde ============ */
const KEY = 'entraineur-techniques-v1';
let state = { techniques: [] };

function levelNames() {
  return (state.settings && state.settings.levelNames) || DEFAULT_LEVELS;
}
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
function defaults() {
  return [
    { id:uid(), name:'Cull', family:'Cull / triage', mode:'tap', intervalSec:10, blockSec:300,
      level:2, focus:true, metro:false, bpm:60, template:'Culle le {carte}', nMin:1, nMax:6, last:0 },
    { id:uid(), name:'Pinky count + levée', family:'Comptages / breaks', mode:'interval', intervalSec:10, blockSec:300,
      level:2, focus:true, metro:false, bpm:60, template:'Pinky count de {n} cartes → levée {nx}', nMin:1, nMax:6, last:0 },
    { id:uid(), name:'Break + étalement', family:'Comptages / breaks', mode:'fixed', intervalSec:10, blockSec:300,
      level:1, focus:false, metro:false, bpm:60, template:'Garde un break au petit doigt, étale en ruban, puis referme', nMin:1, nMax:6, last:0 },
  ];
}
function normalize() {
  if (!state.techniques || !Array.isArray(state.techniques)) state.techniques = defaults();
  state.settings = Object.assign(
    { focusWeight:2, weightByLevel:false, levelNames:DEFAULT_LEVELS.slice(), updated:0 },
    state.settings || {}
  );
  if (!Array.isArray(state.settings.levelNames) || state.settings.levelNames.length < 2)
    state.settings.levelNames = DEFAULT_LEVELS.slice();
  if (!Array.isArray(state.history)) state.history = [];
  state.history.forEach(s => { if (!s.id) s.id = uid() + '-' + (s.date || 0); });
  if (!state.notes || typeof state.notes !== 'object' || Array.isArray(state.notes)) state.notes = {};
  if (!state.physique || typeof state.physique !== 'object') state.physique = { exercises: [], routines: [] };
  if (!Array.isArray(state.physique.exercises)) state.physique.exercises = [];
  if (!Array.isArray(state.physique.routines)) state.physique.routines = [];
  state.techniques.forEach(t => {
    if (!t.id) t.id = uid();
    if (!t.updated) t.updated = t.last || Date.now();
    if (!t.level || t.level < 1) t.level = 1;
    if (t.level > state.settings.levelNames.length) t.level = state.settings.levelNames.length;
  });
}

/* ============ sync Supabase + localStorage ============ */
async function load() {
  // 1. Essaie Supabase si une session est active
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
      const { data, error } = await supabaseClient
        .from('user_data')
        .select('data')
        .eq('user_id', session.user.id)
        .single();
      if (data && !error) {
        state = data.data;
        normalize();
        try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
        return;
      }
      // Pas encore de données distantes → migre depuis localStorage si dispo
      const local = localStorage.getItem(KEY);
      if (local) {
        state = JSON.parse(local);
        normalize();
        await save();
        return;
      }
    }
  } catch (e) {}
  // 2. Repli sur localStorage (hors-ligne ou non connecté)
  try { const v = localStorage.getItem(KEY); if (v) { state = JSON.parse(v); normalize(); return; } } catch (e) {}
  state = { techniques: defaults() };
  normalize();
}

async function save() {
  // Toujours sauvegarder en local (cache hors-ligne)
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  // Sync Supabase si session active
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
      await supabaseClient.from('user_data').upsert({
        user_id: session.user.id,
        data: state,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
    }
  } catch (e) {}
}

/* ============ navigation ============ */
const SCREENS = ['login','library','manage','editor','setup','drill','recap','settings','stats','data','tours','mentalisme','physique','physique-editor','physique-routines','physique-routine-editor','physique-session'];
const NAV_SCREENS = new Set(['library','tours','mentalisme','physique']);

function show(name) {
  SCREENS.forEach(s => document.getElementById('screen-' + s).classList.toggle('hidden', s !== name));
  const nav = document.getElementById('bottomNav');
  const showNav = NAV_SCREENS.has(name);
  nav.classList.toggle('hidden', !showNav);
  if (showNav) {
    nav.querySelectorAll('.nav-tab').forEach(tab =>
      tab.classList.toggle('active', tab.dataset.module === name)
    );
  }
}

/* ============ utilitaires ============ */
function escapeHtml(s) {
  return (s || '').replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
}
function fmtDur(sec) {
  const m = Math.round(sec / 60);
  if (m < 60) return m + ' min';
  const h = Math.floor(m / 60), r = m % 60;
  return r ? h + ' h ' + r : h + ' h';
}
function dayKey(ts) {
  const d = new Date(ts);
  return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
}
function daysAgo(ts) {
  if (!ts) return 'jamais';
  const a = new Date(ts); a.setHours(0, 0, 0, 0);
  const b = new Date(); b.setHours(0, 0, 0, 0);
  const n = Math.round((b - a) / 86400000);
  return n <= 0 ? "aujourd'hui" : (n === 1 ? 'hier' : 'il y a ' + n + ' j');
}
