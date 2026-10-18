// ==============================================================================
// APP BOOTSTRAPPER
// Registers Service Worker, initializes session, configures mode banner,
// and starts the SPA router.
// ==============================================================================

import { getConfig, saveConfig } from './config.js';
import { store } from './store.js';
import { initRouter, navigate } from './router.js';
import { showToast } from './utils/toast.js';

let installPromptEvent = null;

async function bootstrap() {
  console.log('🕌 Initializing Kalupur Masjid Timings App...');

  initInstallButton();

  // 1. Register Service Worker for PWA Android installation & offline caching
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch((err) => {
        console.warn('ServiceWorker registration error:', err);
      });
    });
  }

  // 2. Initialize Session
  try {
    await store.initSession();
  } catch (err) {
    console.error('Session init error:', err);
  }

  // 3. Render Top Mode Banner
  renderModeBanner();

  // 4. Initialize Router
  initRouter();
}

function initInstallButton() {
  const installButton = document.getElementById('install-app-btn');
  if (!installButton) return;

  const isInstalled = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  if (isInstalled) {
    installButton.hidden = true;
    return;
  }

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    installPromptEvent = event;
  });

  window.addEventListener('appinstalled', () => {
    installPromptEvent = null;
    installButton.hidden = true;
    showToast('Masjid Timings has been added to your home screen.', 'success');
  });

  installButton.addEventListener('click', async () => {
    if (!installPromptEvent) {
      showToast('To add this app, open your browser menu and choose "Add to Home Screen" or "Install app".', 'info', 7000);
      return;
    }

    installPromptEvent.prompt();
    const { outcome } = await installPromptEvent.userChoice;
    if (outcome === 'accepted') installButton.hidden = true;
    installPromptEvent = null;
  });
}

function renderModeBanner() {
  const banner = document.getElementById('mode-banner');
  if (!banner) return;

  const config = getConfig();

  if (config.isConfigured) {
    banner.className = 'mode-banner connected';
    let host = 'Supabase Cloud';
    try {
      host = new URL(config.SUPABASE_URL).hostname;
    } catch (e) {}

    banner.innerHTML = `
      <span>
        🟢 <strong>Connected to Supabase:</strong> <code>${host}</code> (PostgreSQL + RLS Enabled)
      </span>
      <div style="display: flex; gap: 0.35rem;">
        <button id="switch-demo-btn" style="background: transparent; border: 1px solid currentColor; color: inherit;">Switch to Demo Mode</button>
        <button id="open-config-btn">Change Config</button>
      </div>
    `;

    const switchBtn = document.getElementById('switch-demo-btn');
    if (switchBtn) {
      switchBtn.onclick = () => {
        saveConfig('', '');
        showToast('Switched to local Trial Demo Mode.', 'info');
        window.location.reload();
      };
    }
  } else {
    banner.className = 'mode-banner';
    banner.innerHTML = `
      <span>
        ⚡ <strong>Trial Demo Mode:</strong> Running with local trial data & ₹0 testing simulation.
      </span>
      <div style="display: flex; gap: 0.35rem;">
        <button id="reset-demo-btn" title="Reset sample test data">Reset Demo Data</button>
        <button id="open-config-btn" style="background: var(--gold-dark); color: #fff; border-color: var(--gold-dark);">Connect Supabase</button>
      </div>
    `;

    const resetBtn = document.getElementById('reset-demo-btn');
    if (resetBtn) {
      resetBtn.onclick = () => {
        if (confirm('Reset trial demonstration data back to initial seed state?')) {
          store.resetDemoData();
          showToast('Demo data reset to initial trial state.', 'info');
          navigate();
        }
      };
    }
  }

  const openConfigBtn = document.getElementById('open-config-btn');
  if (openConfigBtn) {
    openConfigBtn.onclick = openSupabaseConfigModal;
  }
}

function openSupabaseConfigModal() {
  const config = getConfig();
  let modalContainer = document.getElementById('config-modal-container');
  if (!modalContainer) {
    modalContainer = document.createElement('div');
    modalContainer.id = 'config-modal-container';
    document.body.appendChild(modalContainer);
  }

  modalContainer.innerHTML = `
    <div id="config-modal" class="modal-overlay open">
      <div class="modal-dialog">
        <div class="modal-header">
          <h3 class="modal-title">Supabase Database Connection</h3>
          <button class="modal-close" id="close-config-modal">&times;</button>
        </div>
        <p style="font-size: 0.88rem; color: var(--text-muted); margin-bottom: 1rem; line-height: 1.5;">
          To connect this trial website to your live Supabase project, enter your actual Project URL and Public Anon Key (found in Supabase Dashboard &rarr; Settings &rarr; API).
          <br><br>
          <em>If you haven't created a Supabase project yet, click <strong>"Use Demo Mode"</strong> below to test all features locally without setup!</em>
        </p>

        <form id="save-config-form">
          <div class="form-group">
            <label class="form-label" for="cfg-url">
              Supabase Project URL <span class="req">*</span>
            </label>
            <input
              type="url"
              id="cfg-url"
              class="form-input"
              placeholder="https://xyzabcdefg.supabase.co"
              value="${config.SUPABASE_URL || ''}"
              required
            />
            <div class="form-hint">Replace with your real Supabase project URL (do not leave as "your-project-id").</div>
          </div>

          <div class="form-group">
            <label class="form-label" for="cfg-key">
              Supabase Public Anon Key <span class="req">*</span>
            </label>
            <textarea
              id="cfg-key"
              class="form-textarea"
              rows="3"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              required
            >${config.SUPABASE_ANON_KEY || ''}</textarea>
            <div class="form-hint">
              Only provide the <strong>public anon key</strong>. Never expose the service-role secret key!
            </div>
          </div>

          <div class="modal-actions" style="justify-content: space-between; flex-wrap: wrap; gap: 0.5rem;">
            <button type="button" id="clear-config-btn" class="btn btn-outline" style="color: #065f46; border-color: #065f46;">
              ⚡ Use Demo Mode (Local Trial)
            </button>
            <div style="display: flex; gap: 0.5rem;">
              <button type="button" id="cancel-cfg-btn" class="btn btn-secondary">Cancel</button>
              <button type="submit" class="btn btn-primary btn-lg" id="save-connect-btn">Test & Connect</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  `;

  const modal = document.getElementById('config-modal');
  const close = () => modal.remove();

  document.getElementById('close-config-modal').onclick = close;
  document.getElementById('cancel-cfg-btn').onclick = close;

  document.getElementById('clear-config-btn').onclick = () => {
    saveConfig('', '');
    showToast('Switched to local Trial Demo Mode.', 'info');
    close();
    renderModeBanner();
    window.location.reload();
  };

  document.getElementById('save-config-form').onsubmit = async (e) => {
    e.preventDefault();
    const url = document.getElementById('cfg-url').value.trim();
    const key = document.getElementById('cfg-key').value.trim();
    const submitBtn = document.getElementById('save-connect-btn');

    const { isPlaceholderConfig } = await import('./config.js');
    if (isPlaceholderConfig(url, key)) {
      showToast('Please enter your real project URL (e.g. https://xyz.supabase.co). Do not use the example placeholder "your-project-id".', 'error', 5000);
      return;
    }

    if (!url.startsWith('https://') && !url.startsWith('http://')) {
      showToast('Please enter a valid URL starting with https://', 'error');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Testing connection...';

    // Verify endpoint is reachable before saving
    try {
      const testRes = await fetch(`${url}/rest/v1/masjids?select=id&limit=1`, {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`
        }
      });
      // 200 OK or 401/403 (needs auth) indicates server exists and responded
      if (!testRes.ok && testRes.status !== 401 && testRes.status !== 403 && testRes.status !== 404) {
        throw new Error(`Server returned HTTP ${testRes.status}`);
      }
    } catch (netErr) {
      showToast(`Cannot reach ${url} (${netErr.message || 'Failed to fetch'}). Please verify your URL or click "Use Demo Mode".`, 'error', 6000);
      submitBtn.disabled = false;
      submitBtn.textContent = 'Test & Connect';
      return;
    }

    saveConfig(url, key);
    showToast('Supabase connection verified & saved!', 'success');
    close();
    renderModeBanner();
    window.location.reload();
  };
}

// Start app
bootstrap();
