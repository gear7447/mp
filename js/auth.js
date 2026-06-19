/* ============ authentification ============ */
let authMode = 'login';

document.getElementById('loginBtn').addEventListener('click', async () => {
  const email = document.getElementById('login_email').value.trim();
  const pwd   = document.getElementById('login_pwd').value;
  const errEl = document.getElementById('login_err');
  errEl.style.color = '#d98';
  errEl.textContent = '';
  if (!email || !pwd) { errEl.textContent = 'Remplis tous les champs.'; return; }

  const btn = document.getElementById('loginBtn');
  btn.disabled = true;

  if (authMode === 'signup') {
    const { error } = await supabaseClient.auth.signUp({ email, password: pwd });
    if (error) { errEl.textContent = error.message; }
    else {
      errEl.style.color = 'var(--brass)';
      errEl.textContent = 'Compte créé ! Vérifie ta boîte mail pour confirmer, puis connecte-toi.';
      authMode = 'login';
      btn.textContent = 'Se connecter';
      document.getElementById('signupToggle').textContent = 'Pas encore de compte ? Créer un compte';
    }
  } else {
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password: pwd });
    if (error) {
      errEl.textContent = 'Email ou mot de passe incorrect.';
    } else {
      await load();
      renderLibrary();
      show('library');
    }
  }
  btn.disabled = false;
});

document.getElementById('signupToggle').addEventListener('click', () => {
  authMode = authMode === 'login' ? 'signup' : 'login';
  document.getElementById('loginBtn').textContent =
    authMode === 'signup' ? 'Créer mon compte' : 'Se connecter';
  document.getElementById('signupToggle').textContent =
    authMode === 'signup' ? 'Déjà un compte ? Se connecter' : 'Pas encore de compte ? Créer un compte';
  document.getElementById('login_err').textContent = '';
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await supabaseClient.auth.signOut();
  state = { techniques: [] };
  show('login');
});

async function signOut() {
  await supabaseClient.auth.signOut();
  state = { techniques: [] };
  show('login');
}
