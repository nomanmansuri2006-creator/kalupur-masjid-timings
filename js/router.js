// ==============================================================================
// CLIENT-SIDE HASH ROUTER
// Seamless SPA navigation on GitHub Pages without server-side rewrites.
// ==============================================================================

import { store } from './store.js';
import { renderHome } from './views/public-home.js';
import { renderMasjidDetails } from './views/public-masjid.js';
import { renderReport } from './views/public-report.js';
import { renderLogin } from './views/auth-login.js';
import { renderImamDashboard } from './views/imam-dashboard.js';
import { renderImamEdit } from './views/imam-edit.js';
import { renderImamHistory } from './views/imam-history.js';
import { renderAdminDashboard } from './views/admin-dashboard.js';

export async function navigate() {
  const container = document.getElementById('main-view-container');
  if (!container) return;

  // Extract hash path and query parameters
  const rawHash = window.location.hash || '#home';
  const [routePath, queryString] = rawHash.split('?');
  const params = new URLSearchParams(queryString || '');

  // Update navigation pills
  updateNavState(routePath);

  // Scroll to top on navigation
  window.scrollTo({ top: 0, behavior: 'instant' });

  // Route Handling
  switch (routePath) {
    case '#home':
    case '':
      await renderHome(container);
      break;

    case '#masjid':
      await renderMasjidDetails(container, params.get('id'));
      break;

    case '#report':
      await renderReport(container, params.get('id'));
      break;

    case '#login':
      renderLogin(container);
      break;

    case '#imam':
      await renderImamDashboard(container);
      break;

    case '#imam/edit':
      await renderImamEdit(container);
      break;

    case '#imam/history':
      await renderImamHistory(container);
      break;

    case '#admin':
      await renderAdminDashboard(container, params.get('tab') || 'submissions');
      break;

    default:
      await renderHome(container);
      break;
  }
}

function updateNavState(routePath) {
  const profile = store.getCurrentProfile();
  const navAuthPill = document.getElementById('nav-auth-pill');
  if (!navAuthPill) return;

  if (profile) {
    if (profile.role === 'admin') {
      navAuthPill.href = '#admin';
      navAuthPill.innerHTML = `🛡️ Admin (${profile.display_name.split(' ')[0]})`;
    } else {
      navAuthPill.href = '#imam';
      navAuthPill.innerHTML = `👤 Imam Portal`;
    }
  } else {
    navAuthPill.href = '#login';
    navAuthPill.innerHTML = `🔐 Imam / Admin`;
  }
}

export function initRouter() {
  window.addEventListener('hashchange', navigate);
  // Initial navigation
  navigate();
}
