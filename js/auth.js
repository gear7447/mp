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

document.getElementById('homeLogoutBtn').addEventListener('click', signOut);

document.getElementById('forgotPwdBtn').addEventListener('click', async () => {
  const email = document.getElementById('login_email').value.trim();
  const errEl = document.getElementById('login_err');
  if (!email) {
    errEl.style.color = '#d98';
    errEl.textContent = 'Saisis ton email d\'abord.';
    return;
  }
  const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
    redirectTo: 'https://gear7447.github.io/mp/'
  });
  errEl.style.color = 'var(--brass)';
  errEl.textContent = error ? error.message : 'Email envoyé ! Vérifie ta boîte mail.';
});

document.getElementById('resetPwdBtn').addEventListener('click', async () => {
  const pwd  = document.getElementById('new_pwd').value;
  const pwd2 = document.getElementById('new_pwd2').value;
  const errEl = document.getElementById('reset_err');
  errEl.style.color = '#d98';
  errEl.textContent = '';
  if (pwd.length < 6) { errEl.textContent = 'Minimum 6 caractères.'; return; }
  if (pwd !== pwd2)   { errEl.textContent = 'Les mots de passe ne correspondent pas.'; return; }
  const { error } = await supabaseClient.auth.updateUser({ password: pwd });
  if (error) { errEl.textContent = error.message; return; }
  errEl.style.color = 'var(--brass)';
  errEl.textContent = 'Mot de passe modifié !';
  await load(); renderLibrary(); renderHome();
  setTimeout(() => show('home'), 1200);
});

supabaseClient.auth.onAuthStateChange((event) => {
  if (event === 'PASSWORD_RECOVERY') show('reset-pwd');
});
