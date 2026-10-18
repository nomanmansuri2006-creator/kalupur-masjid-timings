// ==============================================================================
// IMAM SUBMISSION HISTORY VIEW
// Displays history of proposals submitted by the Imam, review statuses,
// and administrator feedback.
// ==============================================================================

import { store } from '../store.js';
import { formatDate } from '../utils/formatters.js';

export async function renderImamHistory(container) {
  const profile = store.getCurrentProfile();

  if (!profile) {
    window.location.hash = '#login';
    return;
  }

  container.innerHTML = `
    <div style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
      Loading submission history...
    </div>
  `;

  let updates = [];
  try {
    const masjidId = profile.assigned_masjid_id;
    if (masjidId) {
      updates = await store.getImamTimingUpdates(masjidId);
    } else if (profile.role === 'admin') {
      const masjids = await store.getMasjids();
      if (masjids.length > 0) updates = await store.getImamTimingUpdates(masjids[0].id);
    }
  } catch (err) {
    console.error(err);
  }

  container.innerHTML = `
    <div style="margin-bottom: 1rem;">
      <a href="#imam" style="display: inline-flex; align-items: center; gap: 0.35rem; color: var(--primary); text-decoration: none; font-size: 0.92rem; font-weight: 600;">
        &larr; Back to Imam Dashboard
      </a>
    </div>

    <div style="margin-bottom: 1.25rem;">
      <h2 style="font-size: 1.45rem; font-weight: 800; color: var(--primary-dark);">
        Timing Submission History
      </h2>
      <p style="font-size: 0.88rem; color: var(--text-muted); margin-top: 0.2rem;">
        Track the status of your proposed prayer timing updates and review administrator feedback.
      </p>
    </div>

    <div id="updates-list">
      ${
        updates.length === 0
          ? `<div class="card" style="text-align: center; padding: 2.5rem 1rem;">
              <p style="color: var(--text-muted); font-size: 1rem;">No timing updates have been submitted yet.</p>
              <a href="#imam/edit" class="btn btn-primary" style="margin-top: 1rem;">Submit Your First Update</a>
            </div>`
          : updates.map((update) => {
              const statusClass =
                update.status === 'approved'
                  ? 'badge-verified'
                  : update.status === 'rejected'
                  ? 'badge-rejected'
                  : 'badge-pending';

              const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

              return `
                <div class="card" style="margin-bottom: 1rem; border-left: 4px solid ${
                  update.status === 'approved' ? '#059669' : update.status === 'rejected' ? '#dc2626' : '#d97706'
                };">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; flex-wrap: wrap;">
                    <div>
                      <span class="badge ${statusClass}" style="text-transform: uppercase;">
                        ${update.status}
                      </span>
                      <div style="font-size: 0.85rem; color: var(--text-light); margin-top: 0.35rem;">
                        Submitted on: <strong>${formatDate(update.submitted_at)}</strong>
                      </div>
                    </div>

                    ${
                      update.reviewed_at
                        ? `<div style="font-size: 0.78rem; color: var(--text-light); text-align: right;">
                            Reviewed: ${formatDate(update.reviewed_at)}
                          </div>`
                        : ''
                    }
                  </div>

                  <!-- Optional Notes by Imam -->
                  ${
                    update.notes
                      ? `<div style="margin: 0.75rem 0; font-size: 0.85rem; color: var(--text-muted); background: var(--bg-surface); padding: 0.5rem 0.75rem; border-radius: var(--radius-sm);">
                          <strong>Your Note:</strong> "${update.notes}"
                        </div>`
                      : ''
                  }

                  <!-- Admin Rejection Feedback -->
                  ${
                    update.status === 'rejected' && update.rejection_reason
                      ? `<div style="margin: 0.75rem 0; font-size: 0.88rem; color: #991b1b; background: #fee2e2; padding: 0.65rem 0.85rem; border-radius: var(--radius-sm); border: 1px solid #fecaca;">
                          <strong>Administrator Feedback:</strong> "${update.rejection_reason}"
                        </div>`
                      : ''
                  }

                  <!-- Timings Breakdown -->
                  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(90px, 1fr)); gap: 0.5rem; margin-top: 0.75rem; background: var(--bg-page); padding: 0.5rem; border-radius: var(--radius-sm);">
                    ${prayers.map((p) => {
                      const t = update.proposed_timings?.[p];
                      return `
                        <div style="text-align: center; font-size: 0.78rem;">
                          <div style="font-weight: 700; color: var(--primary-dark);">${p}</div>
                          <div style="color: var(--primary); font-weight: 600;">Jm: ${t ? t.jamaat : '--'}</div>
                          <div style="color: var(--text-light); font-size: 0.7rem;">Az: ${t ? t.azaan : '--'}</div>
                        </div>
                      `;
                    }).join('')}
                  </div>
                </div>
              `;
            }).join('')
      }
    </div>
  `;
}
