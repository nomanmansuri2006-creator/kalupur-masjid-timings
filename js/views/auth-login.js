// ==============================================================================
// AUTHENTICATION VIEW — Imam & Administrator Access
// Email and Password authentication for both Imams and Administrators.
// ==============================================================================

import { store } from '../store.js';
import { showToast } from '../utils/toast.js';

export function renderLogin(container) {
  container.innerHTML = `
    <div style="max-width: 440px; margin: 1.5rem auto;">
      <div style="text-align: center; margin-bottom: 1.5rem;">
        <img src="./assets/logo.svg" alt="Kalupur Masjid Timings Logo" style="width: 56px; height: 56px; margin-bottom: 0.5rem;" />
        <h2 style="font-size: 1.55rem; font-weight: 800; color: var(--primary-dark);">
          Masjid Portal Sign In
        </h2>
        <p style="font-size: 0.9rem; color: var(--text-muted); margin-top: 0.25rem;">
          Sign in with your email and password to access your Imam or Administrator portal.
        </p>
      </div>

      <div class="card" style="padding: 1.5rem;">
        <form id="portal-login-form">
          <div class="form-group">
            <label class="form-label" for="login-email">
              Email Address <span class="req">*</span>
            </label>
            <input
              type="email"
              id="login-email"
              class="form-input"
              placeholder="name@example.com"
              autocomplete="email"
              required
            />
            <div class="form-hint">Enter your registered email address.</div>
          </div>

          <div class="form-group" style="margin-top: 1.1rem;">
            <label class="form-label" for="login-password">
              Password <span class="req">*</span>
            </label>
            <input
              type="password"
              id="login-password"
              class="form-input"
              placeholder="••••••••"
              autocomplete="current-password"
              required
            />
            <div class="form-hint">Enter your account password.</div>
          </div>

          <button type="submit" class="btn btn-primary btn-block btn-lg" id="login-submit-btn" style="margin-top: 1.5rem;">
            Sign In &rarr;
          </button>
        </form>
      </div>

      <div style="text-align: center; margin-top: 1.5rem;">
        <a href="#home" style="color: var(--text-muted); font-size: 0.88rem; text-decoration: none;">
          &larr; Return to Public Masjids Home
        </a>
      </div>
    </div>
  `;

  const loginForm = document.getElementById('portal-login-form');
  loginForm.onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const submitBtn = document.getElementById('login-submit-btn');

    if (!email || !password) {
      showToast('Please enter both email and password.', 'error');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Authenticating...';

    try {
      const { user, profile } = await store.loginWithEmailPassword(email, password);
      const displayName = profile?.display_name || user?.email || 'User';
      showToast(`Welcome back, ${displayName}!`, 'success');
      handleLoginRedirect(profile);
    } catch (err) {
      console.error('Login error:', err);
      showToast(err.message || 'Login failed. Invalid email or password.', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign In →';
    }
  };

  function handleLoginRedirect(profile) {
    if (profile?.role === 'admin') {
      window.location.hash = '#admin';
    } else {
      window.location.hash = '#imam';
    }
  }
}
