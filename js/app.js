// ==============================================================================
// APP BOOTSTRAPPER
// Registers Service Worker, initializes session, configures mode banner,
// and starts the SPA router.
// ==============================================================================

import { store } from './store.js';
import { initRouter } from './router.js';
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

  // 3. Initialize Router
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

// Start app
bootstrap();
