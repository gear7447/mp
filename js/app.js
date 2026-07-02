/* ============ initialisation ============ */
(async function () {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
  }

  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      show(tab.dataset.module);
      if (tab.dataset.module === 'home') renderHome();
      if (tab.dataset.module === 'physique') renderPhyExList();
      if (tab.dataset.module === 'tours') { renderTourStatusPills(); renderTourList(); }
      if (tab.dataset.module === 'mentalisme') renderMentalisme();
      if (tab.dataset.module === 'budget') renderBudget();
      if (tab.dataset.module === 'videos') renderVideos();
    });
  });

  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    show('login');
    return;
  }

  await load();
  renderLibrary();
  renderHome();
  show('home');
})();
