/* ============ module Vidéothèque ============ */

let videoEditId  = null;
let videoTagFilter = '';
let videoSearch    = '';

const VIDEO_TAGS = ['technique','tour','théorie','performance','interview','tutoriel','inspiration','mentalisme','cartomagie'];

function videoInit() {
  if (!state.videos || typeof state.videos !== 'object') state.videos = {};
  if (!Array.isArray(state.videos.list)) state.videos.list = [];
}

function _ytId(url) {
  const m = (url || '').match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}
function _ytThumb(url) {
  const id = _ytId(url);
  return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null;
}
async function _ytFetchTitle(url) {
  try {
    const r = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
    if (!r.ok) return null;
    const d = await r.json();
    return d.title || null;
  } catch { return null; }
}

/* ============ liste ============ */

function renderVideos() {
  videoInit();
  renderVideoTagFilter();
  const list = document.getElementById('videoList');
  const q    = videoSearch.toLowerCase();
  const vids = [...state.videos.list]
    .filter(v => !videoTagFilter || (v.tags || []).includes(videoTagFilter))
    .filter(v => !q || v.title.toLowerCase().includes(q))
    .sort((a, b) => b.createdAt - a.createdAt);

  if (!vids.length) {
    list.innerHTML = `<div class="empty" style="grid-column:1/-1">${videoTagFilter || q ? 'Aucune vidéo pour ce filtre.' : 'Aucune vidéo.<br>Touche « + Ajouter » pour commencer.'}</div>`;
    return;
  }
  list.innerHTML = '';
  vids.forEach(v => {
    const thumb    = _ytThumb(v.url);
    const hasNotes = (v.notes || '').trim().length > 0;
    const el       = document.createElement('div');
    el.className   = 'video-card';
    el.innerHTML   = `
      <div class="video-thumb-wrap">
        ${thumb
          ? `<img class="video-thumb" src="${escapeHtml(thumb)}" alt="" loading="lazy">`
          : `<div class="video-thumb-ph">🎬</div>`}
        <a class="video-play-btn" href="${escapeHtml(v.url)}" target="_blank" rel="noopener" title="Ouvrir la vidéo">▶</a>
      </div>
      <div class="video-card-body">
        <div class="video-card-title">${escapeHtml(v.title)}</div>
        <div class="video-card-meta">
          ${(v.tags || []).map(t => `<span class="badge badge-tag">${escapeHtml(t)}</span>`).join('')}
          ${hasNotes ? `<span class="badge">📝</span>` : ''}
        </div>
      </div>`;
    el.querySelector('.video-card-body').addEventListener('click', () => openVideoEditor(v.id));
    list.appendChild(el);
  });
}

function renderVideoTagFilter() {
  videoInit();
  const container = document.getElementById('videoTagFilter');
  if (!container) return;
  const usedTags = new Set();
  state.videos.list.forEach(v => (v.tags || []).forEach(t => usedTags.add(t)));
  if (!usedTags.size) { container.innerHTML = ''; return; }
  container.innerHTML =
    `<button class="cat-pill${!videoTagFilter ? ' active' : ''}" data-tag="">Tous</button>` +
    [...usedTags].map(t =>
      `<button class="cat-pill${videoTagFilter === t ? ' active' : ''}" data-tag="${escapeHtml(t)}">${escapeHtml(t)}</button>`
    ).join('');
}

/* ============ éditeur ============ */

function openVideoEditor(id) {
  videoInit();
  videoEditId = id || null;
  const v = id ? state.videos.list.find(x => x.id === id) : null;
  document.getElementById('videoEditorTitle').textContent = v ? 'Modifier' : 'Nouvelle vidéo';
  document.getElementById('video_url').value   = v ? (v.url   || '') : '';
  document.getElementById('video_title').value = v ? (v.title || '') : '';
  document.getElementById('video_notes').value = v ? (v.notes || '') : '';
  renderVideoTagEditor(v ? (v.tags || []) : []);
  _videoUpdateThumb(v ? v.url : '');
  document.getElementById('videoDeleteBtn').classList.toggle('hidden', !id);
  show('videos-editor');
}

function renderVideoTagEditor(selectedTags) {
  const container = document.getElementById('videoTagsLinks');
  if (!container) return;
  container.innerHTML = VIDEO_TAGS.map(tag => `
    <label class="tour-tag-item">
      <input type="checkbox" value="${escapeHtml(tag)}"${selectedTags.includes(tag) ? ' checked' : ''}>
      <span>${escapeHtml(tag)}</span>
    </label>`).join('');
}

function _videoUpdateThumb(url) {
  const thumb   = _ytThumb(url);
  const preview = document.getElementById('videoThumbPreview');
  if (!preview) return;
  if (thumb) { preview.src = thumb; preview.classList.remove('hidden'); }
  else        { preview.classList.add('hidden'); }
}

async function saveVideo() {
  videoInit();
  const url = document.getElementById('video_url').value.trim();
  if (!url) { document.getElementById('video_url').focus(); return; }
  let title = document.getElementById('video_title').value.trim();
  if (!title) {
    const btn = document.getElementById('videoSaveBtn');
    btn.textContent = 'Chargement…';
    btn.disabled = true;
    title = (await _ytFetchTitle(url)) || url;
    btn.textContent = 'Enregistrer';
    btn.disabled = false;
  }
  const notes = document.getElementById('video_notes').value.trim();
  const tags  = [...document.querySelectorAll('#videoTagsLinks input[type=checkbox]:checked')].map(c => c.value);
  const data  = { url, title, notes, tags };
  if (videoEditId) {
    const v = state.videos.list.find(x => x.id === videoEditId);
    if (v) Object.assign(v, data);
  } else {
    state.videos.list.push({ id: uid(), createdAt: Date.now(), ...data });
  }
  save();
  renderVideos();
  show('videos');
}

function deleteVideo() {
  if (!videoEditId) return;
  const v = state.videos.list.find(x => x.id === videoEditId);
  confirmDelete(
    'Supprimer « ' + escapeHtml(v ? v.title : 'cette vidéo') + ' » ?',
    'Cette action est définitive.',
    () => {
      state.videos.list = state.videos.list.filter(x => x.id !== videoEditId);
      save(); renderVideos(); show('videos');
    }
  );
}

/* ============ listeners ============ */

document.getElementById('videoAddBtn').addEventListener('click', () => openVideoEditor(null));

document.getElementById('videoTagFilter').addEventListener('click', e => {
  const pill = e.target.closest('.cat-pill');
  if (!pill) return;
  videoTagFilter = pill.dataset.tag;
  renderVideoTagFilter();
  renderVideos();
});

document.getElementById('videoSearch').addEventListener('input', e => {
  videoSearch = e.target.value;
  renderVideos();
});

document.getElementById('video_url').addEventListener('input', e => _videoUpdateThumb(e.target.value));

document.getElementById('videoEditorCancel').addEventListener('click', () => { renderVideos(); show('videos'); });
document.getElementById('videoSaveBtn').addEventListener('click', saveVideo);
document.getElementById('videoDeleteBtn').addEventListener('click', deleteVideo);
