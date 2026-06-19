/* ============ initialisation ============ */
(async function () {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
  }

  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    show('login');
    return;
  }

  await load();
  renderLibrary();
  show('library');
})();
