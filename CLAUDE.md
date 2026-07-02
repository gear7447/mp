# Entraîneur de Magie — CLAUDE.md

## Environnement
- Vanilla JS SPA, mobile-first PWA
- GitHub Pages : https://gear7447.github.io/mp/
- Git repo local : `/Users/guillaume/Library/Mobile Documents/com~apple~CloudDocs/Magie/logiciel/entraineur/`
- Supabase : Storage bucket `mentalisme-images` (public, auth required)
- Service Worker : `sw.js` — incrémenter `CACHE_NAME` (`entraineur-vN`) à chaque déploiement

## Architecture
- `index.html` — tout le HTML (pas de routing côté serveur)
- `css/app.css` — toutes les règles CSS
- `js/storage.js` — état global `state`, `load()`, `save()`, `normalize()`, `show(screenName)`, `confirmDelete()`
- `js/app.js` — boot, nav tabs
- `js/home.js` — écran accueil, streak, graphe 7 jours
- `js/library.js` — cartomagie, liste des techniques
- `js/session.js` + `js/recap.js` — séance cartomagie
- `js/tours.js` — module Tours (tags, setlists)
- `js/mentalisme.js` — module Mentalisme (fêtes, anniversaires, SRS)
- `js/mentalisme-data.js` — données MENT_FETES_DATA
- `js/physique.js` — module Physique
- `js/budget.js` — module Budget
- `js/notes.js`, `js/stats.js`, `js/data.js`, `js/settings.js`, `js/editor.js`

## Navigation
```js
// Ajouter un écran : 1) <section id="screen-NOM"> dans index.html
//                   2) Ajouter 'NOM' dans SCREENS[] dans storage.js
//                   3) Si onglet nav → NAV_SCREENS dans storage.js
show('nom-ecran'); // cache tous les autres, affiche celui-ci
```

## État global (state)
```js
state.techniques[]          // cartomagie
state.history[]             // séances cartomagie
state.notes{}               // notes par id
state.tours.list[]          // { id, name, status, effectType, duration, learnedAt, effect, description, techniqueIds, tags, createdAt }
state.tours.setlists[]      // { id, name, tourIds[] }
state.mentalisme.decks.fetes       // { paliers[], items[] }
state.mentalisme.decks.anniversaires  // { paliers[], items[] } — 5 catégories prédéfinies
state.mentalisme.sessionCount       // compteur SRS global
state.settings.streak       // { count, lastDate }
state.settings.activityDates[]  // dates ISO actives (90 jours)
state.settings.dailyStats{}     // { 'YYYY-MM-DD': { carto, ment } }
state.physique{}
state.budget{}              // { coaches[], versements[], cours[], depenses[], categories[] }
```

## Règles absolues
- **Toute suppression via `confirmDelete(title, desc, callback)`** — jamais en 1 clic direct
- `.hidden { display: none !important; }` — utilisé partout pour montrer/cacher
- `uid()` pour les IDs, `escapeHtml()` pour tout contenu HTML dynamique
- `save()` après chaque modification de `state`

## Conventions CSS
- Variables : `--brass`, `--brass-soft`, `--panel`, `--panel-2`, `--line`, `--text`, `--muted`
- Classes réutilisables : `.btn .btn-primary .btn-ghost .btn-danger`, `.badge`, `.chip`, `.cat-pill`, `.tech`, `.field`, `.form`, `.actions`, `.topbar`, `.overlay .dialog`
- Responsive automatique via `.screen` (max-width 560px, flex-column, safe-area)

## Mentalisme — SRS
```js
MENT_INTERVALS = [1,2,4,8,16,32]  // sessions avant prochaine révision (basé sur sessionCount)
item.level      // 0–6
item.nextSession // session à laquelle réviser
item.birthDate  // ISO 'YYYY-MM-DD' pour anniversaires uniquement
```

## Tours — statuts
`construction` → `repetition` → `praticable` → `repertoire`

## Budget — structure cours
```js
{ id, date, coachId, techniqueIds[], tourIds[], notes, montant }
```
