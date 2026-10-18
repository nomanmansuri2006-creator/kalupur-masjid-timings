// ==============================================================================
// IMAM DASHBOARD VIEW — Simplified, Mobile-First Interface
// Tailored for mosque Imams with large buttons, high contrast, clear status,
// and zero clutter.
// ==============================================================================

import { store } from '../store.js';
import { formatTo12Hour, formatDate } from '../utils/formatters.js';

export async function renderImamDashboard(container) {
  const profile = store.getCurrentProfile();

  if (!profile || (profile.role !== 'imam' && profile.role !== 'admin')) {
    container.innerHTML = `
      <div class="card" style="text-align: center; padding: 2.5rem 1rem;">
        <p style="color: #dc2626; font-weight: 700; font-size: 1.1rem; margin-bottom: 0.5rem;">
          Access Restricted
        </p>
        <p style="color: var(--text-muted); margin-bottom: 1.25rem;">
          You must be signed in as an authorized Imam or Administrator to access this dashboard.
        </p>
        <a href="#login" class="btn btn-primary">Sign In to Continue</a>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
      Loading your masjid dashboard...
    </div>
  `;

  // Fetch assigned masjid details
  let masjid = null;
  let updates = [];
  try {
    if (profile.assigned_masjid_id) {
      masjid = await store.getMasjidById(profile.assigned_masjid_id);
      updates = await store.getImamTimingUpdates(profile.assigned_masjid_id);
    } else if (profile.role === 'admin') {
      // If admin opened imam dashboard, pick first masjid for preview
      const masjids = await store.getMasjids();
      if (masjids.length > 0) {
        masjid = masjids[0];
        updates = await store.getImamTimingUpdates(masjid.id);
      }
    }
  } catch (err) {
    console.error(err);
  }

  if (!masjid) {
    container.innerHTML = `
      <div class="card" style="text-align: center; padding: 2.5rem 1rem;">
        <h3 style="font-size: 1.3rem; font-weight: 800; color: var(--primary-dark); margin-bottom: 0.5rem;">
          No Masjid Assigned
        </h3>
        <p style="color: var(--text-muted); margin-bottom: 1.25rem;">
          Assalamu Alaikum <strong>${profile.display_name}</strong>. Your account has not yet been linked to an active masjid by the administrator.
        </p>
        <p style="font-size: 0.85rem; color: var(--text-light); margin-bottom: 1.5rem;">
          Please contact the Kalupur Central Masjid Committee administrator to link your registered mobile number.
        </p>
        <button id="imam-logout-btn" class="btn btn-secondary">Sign Out</button>
      </div>
    `;
    document.getElementById('imam-logout-btn').onclick = async () => {
      await store.logout();
      window.location.hash = '#home';
    };
    return;
  }

  const latestPending = updates.find((u) => u.status === 'pending');
  const latestRejected = updates.find((u) => u.status === 'rejected');
  const schedules = masjid.prayer_schedules || [];
  const lastConfirmed = schedules[0]?.last_confirmed_at;

  container.innerHTML = `
    <!-- Top Greeting & Assigned Masjid -->
    <div class="imam-summary-box">
      <div style="font-size: 0.9rem; color: var(--gold-light); margin-bottom: 0.25rem;">
        Assalamu Alaikum, ${profile.display_name}
      </div>
      <h2 class="imam-summary-masjid">
        ${masjid.name}
      </h2>
      <div class="imam-summary-meta">
        <span>📍 ${masjid.area}, Ahmedabad</span>
        <span>🕒 Last Confirmed: <strong>${formatDate(lastConfirmed)}</strong></span>
      </div>
    </div>

    <!-- Submission Status Banner -->
    ${
      latestPending
        ? `<div class="card" style="background: #fffbeb; border: 1.5px solid #fde68a; margin-bottom: 1.25rem;">
            <div style="display: flex; align-items: flex-start; gap: 0.75rem;">
              <span style="font-size: 1.4rem;">⏳</span>
              <div>
                <h4 style="font-size: 1.05rem; font-weight: 700; color: #92400e;">
                  Timing Changes Awaiting Review
                </h4>
                <p style="font-size: 0.85rem; color: #78350f; margin-top: 0.2rem;">
                  You submitted proposed timing changes on <strong>${formatDate(latestPending.submitted_at)}</strong>. They are currently being reviewed by the administrator before being published.
                </p>
                <div style="margin-top: 0.5rem;">
                  <a href="#imam/history" style="font-size: 0.82rem; font-weight: 700; color: #92400e; text-decoration: underline;">
                    View Submitted Details &rarr;
                  </a>
                </div>
              </div>
            </div>
          </div>`
        : latestRejected
        ? `<div class="card" style="background: #fef2f2; border: 1.5px solid #fecaca; margin-bottom: 1.25rem;">
            <div style="display: flex; align-items: flex-start; gap: 0.75rem;">
              <span style="font-size: 1.4rem;">⚠️</span>
              <div>
                <h4 style="font-size: 1.05rem; font-weight: 700; color: #991b1b;">
                  Previous Submission Required Revision
                </h4>
                <p style="font-size: 0.85rem; color: #7f1d1d; margin-top: 0.2rem;">
                  <strong>Admin Feedback:</strong> "${latestRejected.rejection_reason || 'Please verify times.'}"
                </p>
                <div style="margin-top: 0.5rem;">
                  <a href="#imam/edit" class="btn btn-danger" style="min-height: 38px; padding: 0.35rem 0.85rem; font-size: 0.85rem;">
                    Resubmit Corrected Timings &rarr;
                  </a>
                </div>
              </div>
            </div>
          </div>`
        : ''
    }

    <!-- Main Big Action Buttons (Optimized for Mobile Touch) -->
    <div class="imam-actions-grid">
      <a href="#imam/edit" class="btn btn-primary btn-lg" style="font-size: 1.15rem; gap: 0.75rem;">
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
        </svg>
        Edit Prayer Timings
      </a>

      <a href="#imam/history" class="btn btn-secondary btn-lg" style="font-size: 1.05rem; gap: 0.75rem;">
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        Previous Submissions & History
      </a>
    </div>

    <!-- Currently Published Timings Card -->
    <div class="card" style="padding: 0; overflow: hidden; margin-top: 1.5rem;">
      <div style="padding: 1rem 1.25rem; background: var(--bg-surface); border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
        <h3 style="font-size: 1.1rem; font-weight: 700; color: var(--primary-dark);">
          Currently Published Timings
        </h3>
        <span class="badge badge-verified">Public View</span>
      </div>

      <div class="prayer-table-container" style="border: none; margin: 0; border-radius: 0;">
        <table class="prayer-table">
          <thead>
            <tr>
              <th>Prayer</th>
              <th>Azaan</th>
              <th>Jamaat</th>
            </tr>
          </thead>
          <tbody>
            ${['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((pName) => {
              const row = schedules.find((s) => s.prayer_name === pName);
              return `
                <tr>
                  <td style="font-weight: 700; color: var(--primary-dark); font-size: 1.05rem;">
                    ${pName}
                  </td>
                  <td style="font-size: 1.05rem;">
                    ${row ? formatTo12Hour(row.azaan_time) : '--:--'}
                  </td>
                  <td style="font-size: 1.1rem; font-weight: 700; color: var(--primary);">
                    ${row ? formatTo12Hour(row.jamaat_time) : '--:--'}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Help & Sign Out Options -->
    <div style="margin-top: 1.5rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
      <button id="imam-help-btn" class="btn btn-secondary" style="min-height: 42px; font-size: 0.88rem;">
        ❓ Help & Committee Contact
      </button>

      <button id="imam-signout-btn" class="btn btn-outline" style="min-height: 42px; font-size: 0.88rem; color: #dc2626; border-color: #fca5a5;">
        🚪 Sign Out
      </button>
    </div>

    <!-- Help Modal -->
    <div id="imam-help-modal" class="modal-overlay">
      <div class="modal-dialog">
        <div class="modal-header">
          <h3 class="modal-title">Imam Instructions & Help</h3>
          <button id="close-help-btn" class="modal-close">&times;</button>
        </div>
        <div style="font-size: 0.92rem; line-height: 1.6; color: var(--text-muted);">
          <p><strong>How timing updates work:</strong></p>
          <ol style="margin-left: 1.25rem; margin-top: 0.35rem; margin-bottom: 1rem;">
            <li>Click <strong>"Edit Prayer Timings"</strong> whenever your mosque changes Azaan or Jamaat times.</li>
            <li>Fill in the times and submit.</li>
            <li>The Central Committee Administrator will verify and approve the submission.</li>
            <li>Once approved, the public website updates instantly for everyone.</li>
          </ol>
          <p><strong>Need help or phone number change?</strong></p>
          <p>Contact Kalupur Central Admin: <strong>+91 98765 00000</strong></p>
        </div>
        <div class="modal-actions">
          <button id="dismiss-help-btn" class="btn btn-primary">Understood</button>
        </div>
      </div>
    </div>
  `;

  // Sign out handler
  document.getElementById('imam-signout-btn').onclick = async () => {
    await store.logout();
    window.location.hash = '#home';
  };

  // Help modal handlers
  const helpModal = document.getElementById('imam-help-modal');
  document.getElementById('imam-help-btn').onclick = () => helpModal.classList.add('open');
  document.getElementById('close-help-btn').onclick = () => helpModal.classList.remove('open');
  document.getElementById('dismiss-help-btn').onclick = () => helpModal.classList.remove('open');
}
