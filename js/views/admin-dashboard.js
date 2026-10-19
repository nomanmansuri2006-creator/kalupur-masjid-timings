// ==============================================================================
// ADMINISTRATOR DASHBOARD VIEW
// Full management suite: Metrics, Pending Submissions Diff Review,
// Masjids Management, Imam Account Assignments, Correction Reports, & Audit Logs.
// ==============================================================================

import { store } from '../store.js';
import { formatDate, formatTo12Hour } from '../utils/formatters.js';
import { showToast } from '../utils/toast.js';

export async function renderAdminDashboard(container, activeTab = 'submissions') {
  const profile = store.getCurrentProfile();

  if (!profile || profile.role !== 'admin') {
    container.innerHTML = `
      <div class="card" style="text-align: center; padding: 2.5rem 1rem;">
        <p style="color: #dc2626; font-weight: 700; font-size: 1.1rem; margin-bottom: 0.5rem;">
          Administrator Privileges Required
        </p>
        <p style="color: var(--text-muted); margin-bottom: 1.25rem;">
          You must be logged in as an authorized administrator to access this area.
        </p>
        <a href="#login" class="btn btn-primary">Sign In as Administrator</a>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
      Loading administrator management console...
    </div>
  `;

  // Fetch all necessary data
  let masjids = [];
  let pendingUpdates = [];
  let profiles = [];
  let reports = [];
  let auditLogs = [];

  let fetchError = null;
  try {
    [masjids, pendingUpdates, profiles, reports, auditLogs] = await Promise.all([
      store.getAllMasjidsAdmin(),
      store.getPendingTimingUpdates(),
      store.getProfiles(),
      store.getCorrectionReports(),
      store.getAuditLogs()
    ]);
  } catch (err) {
    console.error('Error fetching admin data:', err);
    fetchError = err;
  }

  const activeImamsCount = profiles.filter((p) => p.role === 'imam' && p.active).length;
  const pendingReportsCount = reports.filter((r) => r.status === 'pending').length;

  container.innerHTML = `
    <!-- Admin Header -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; margin-bottom: 1.25rem; flex-wrap: wrap;">
      <div>
        <h2 style="font-size: 1.6rem; font-weight: 800; color: var(--primary-dark);">
          Central Administrator Console
        </h2>
        <p style="font-size: 0.88rem; color: var(--text-muted); margin-top: 0.2rem;">
          Logged in as <strong>${profile.display_name}</strong> &bull; Kalupur Central Committee
        </p>
      </div>

      <div style="display: flex; gap: 0.5rem; align-items: center;">
        <a href="#imam" class="btn btn-secondary" style="min-height: 38px; padding: 0.35rem 0.75rem; font-size: 0.85rem;">
          Switch to Imam View
        </a>
        <button id="admin-logout-btn" class="btn btn-outline" style="min-height: 38px; padding: 0.35rem 0.75rem; font-size: 0.85rem; color: #dc2626; border-color: #fca5a5;">
          Sign Out
        </button>
      </div>
    </div>

    ${
      fetchError
        ? `<div style="background: #fee2e2; border: 1.5px solid #fca5a5; padding: 0.85rem 1.25rem; border-radius: var(--radius-md); margin-bottom: 1.25rem; color: #991b1b;">
            <div>
              <strong>⚠️ Database Connection Error:</strong> Cannot reach Supabase (${fetchError.message || 'Failed to fetch'}).
              <div style="font-size: 0.82rem; margin-top: 0.15rem; color: #7f1d1d;">
                Please verify your network connection and Supabase settings in <code>js/config.js</code>.
              </div>
            </div>
          </div>`
        : ''
    }

    <!-- Summary Metrics Cards -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 0.85rem; margin-bottom: 1.5rem;">
      <!-- Total Masjids -->
      <div class="card" style="margin: 0; padding: 1rem; border-left: 4px solid var(--primary);">
        <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">
          Total Masjids
        </div>
        <div style="font-size: 1.8rem; font-weight: 800; color: var(--primary-dark); margin-top: 0.25rem;">
          ${masjids.length}
        </div>
        <div style="font-size: 0.75rem; color: var(--text-light); margin-top: 0.15rem;">
          ${masjids.filter((m) => m.active).length} active records
        </div>
      </div>

      <!-- Active Imams -->
      <div class="card" style="margin: 0; padding: 1rem; border-left: 4px solid #059669;">
        <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">
          Active Imams
        </div>
        <div style="font-size: 1.8rem; font-weight: 800; color: #059669; margin-top: 0.25rem;">
          ${activeImamsCount}
        </div>
        <div style="font-size: 0.75rem; color: var(--text-light); margin-top: 0.15rem;">
          Authorized mosque representatives
        </div>
      </div>

      <!-- Pending Submissions -->
      <div class="card" style="margin: 0; padding: 1rem; border-left: 4px solid ${pendingUpdates.length > 0 ? 'var(--gold)' : '#a7f3d0'};">
        <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">
          Pending Timing Reviews
        </div>
        <div style="font-size: 1.8rem; font-weight: 800; color: ${pendingUpdates.length > 0 ? 'var(--gold-dark)' : 'var(--text-muted)'}; margin-top: 0.25rem;">
          ${pendingUpdates.length}
        </div>
        <div style="font-size: 0.75rem; color: var(--text-light); margin-top: 0.15rem;">
          Awaiting approval
        </div>
      </div>

      <!-- Correction Reports -->
      <div class="card" style="margin: 0; padding: 1rem; border-left: 4px solid ${pendingReportsCount > 0 ? '#dc2626' : '#a7f3d0'};">
        <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">
          Public Reports
        </div>
        <div style="font-size: 1.8rem; font-weight: 800; color: ${pendingReportsCount > 0 ? '#dc2626' : 'var(--text-muted)'}; margin-top: 0.25rem;">
          ${pendingReportsCount}
        </div>
        <div style="font-size: 0.75rem; color: var(--text-light); margin-top: 0.15rem;">
          Unresolved community reports
        </div>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div style="display: flex; gap: 0.35rem; overflow-x: auto; padding-bottom: 0.5rem; margin-bottom: 1.25rem; border-bottom: 2px solid var(--border);">
      <button class="nav-tab-btn ${activeTab === 'submissions' ? 'active' : ''}" data-tab="submissions">
        Pending Reviews (${pendingUpdates.length})
      </button>
      <button class="nav-tab-btn ${activeTab === 'masjids' ? 'active' : ''}" data-tab="masjids">
        Manage Masjids (${masjids.length})
      </button>
      <button class="nav-tab-btn ${activeTab === 'imams' ? 'active' : ''}" data-tab="imams">
        Manage Imams (${profiles.filter((p) => p.role === 'imam').length})
      </button>
      <button class="nav-tab-btn ${activeTab === 'reports' ? 'active' : ''}" data-tab="reports">
        Correction Reports (${pendingReportsCount})
      </button>
      <button class="nav-tab-btn ${activeTab === 'audit' ? 'active' : ''}" data-tab="audit">
        Audit Log (${auditLogs.length})
      </button>
    </div>

    <!-- Tab Content Container -->
    <div id="admin-tab-content"></div>

    <!-- Modals Container -->
    <div id="admin-modals-container"></div>
  `;

  // Style helper for tab buttons
  const tabStyles = document.createElement('style');
  tabStyles.innerHTML = `
    .nav-tab-btn {
      background: transparent;
      border: none;
      padding: 0.6rem 1rem;
      font-size: 0.92rem;
      font-weight: 600;
      color: var(--text-muted);
      cursor: pointer;
      border-bottom: 3px solid transparent;
      white-space: nowrap;
      transition: all 0.15s ease;
    }
    .nav-tab-btn:hover {
      color: var(--primary);
    }
    .nav-tab-btn.active {
      color: var(--primary);
      border-bottom-color: var(--primary);
    }
  `;
  document.head.appendChild(tabStyles);

  document.getElementById('admin-logout-btn').onclick = async () => {
    await store.logout();
    window.location.hash = '#home';
  };

  const tabContent = document.getElementById('admin-tab-content');
  const modalsContainer = document.getElementById('admin-modals-container');

  // Render chosen tab
  function switchTab(tabName) {
    document.querySelectorAll('.nav-tab-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    if (tabName === 'submissions') {
      renderSubmissionsTab(tabContent, modalsContainer, pendingUpdates, masjids);
    } else if (tabName === 'masjids') {
      renderMasjidsTab(tabContent, modalsContainer, masjids);
    } else if (tabName === 'imams') {
      renderImamsTab(tabContent, modalsContainer, profiles, masjids);
    } else if (tabName === 'reports') {
      renderReportsTab(tabContent, modalsContainer, reports);
    } else if (tabName === 'audit') {
      renderAuditTab(tabContent, auditLogs);
    }
  }

  document.querySelectorAll('.nav-tab-btn').forEach((btn) => {
    btn.onclick = () => switchTab(btn.dataset.tab);
  });

  switchTab(activeTab);
}

// ------------------------------------------------------------------------------
// SUB-TAB 1: REVIEW PENDING TIMING SUBMISSIONS (DIFF COMPARISON VIEW)
// ------------------------------------------------------------------------------
function renderSubmissionsTab(container, modalsContainer, pendingUpdates, masjids) {
  if (pendingUpdates.length === 0) {
    container.innerHTML = `
      <div class="card" style="text-align: center; padding: 3rem 1.5rem;">
        <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🎉</div>
        <h3 style="font-size: 1.2rem; font-weight: 700; color: var(--primary-dark); margin-bottom: 0.35rem;">
          No Pending Timing Submissions
        </h3>
        <p style="color: var(--text-muted); font-size: 0.9rem;">
          All prayer schedule submissions have been reviewed and published.
        </p>
      </div>
    `;
    return;
  }

  const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

  container.innerHTML = `
    <div style="margin-bottom: 1rem;">
      <h3 style="font-size: 1.2rem; font-weight: 700; color: var(--primary-dark);">
        Pending Mosque Timing Proposals
      </h3>
      <p style="font-size: 0.85rem; color: var(--text-muted);">
        Compare proposed changes against currently published timings. Approving will update public schedules immediately.
      </p>
    </div>

    ${pendingUpdates.map((update) => {
      const masjid = masjids.find((m) => m.id === update.masjid_id);
      const schedules = masjid?.prayer_schedules || [];
      const imamName = update.profiles?.display_name || 'Assigned Imam';
      const imamPhone = update.profiles?.phone || '';

      return `
        <div class="card" style="margin-bottom: 1.5rem; border: 1.5px solid var(--border);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 0.75rem;">
            <div>
              <h4 style="font-size: 1.25rem; font-weight: 800; color: var(--primary-dark);">
                ${update.masjids?.name || masjid?.name || 'Masjid'}
              </h4>
              <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.15rem;">
                Submitted by: <strong>${imamName}</strong> (${imamPhone}) &bull; 
                Date: <strong>${formatDate(update.submitted_at)}</strong>
              </p>
            </div>

            <span class="badge badge-pending" style="font-size: 0.85rem; padding: 0.3rem 0.65rem;">
              Pending Review
            </span>
          </div>

          ${
            update.notes
              ? `<div style="background: var(--bg-surface); padding: 0.65rem 0.85rem; border-radius: var(--radius-sm); font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">
                  <strong>Imam's Explanation:</strong> "${update.notes}"
                </div>`
              : ''
          }

          <!-- Diff Comparison Table -->
          <div style="overflow-x: auto; margin-bottom: 1.25rem;">
            <table class="diff-table">
              <thead>
                <tr>
                  <th rowspan="2" style="width: 20%;">Prayer</th>
                  <th colspan="2" style="background: #f1ede4; text-align: center;">Current Published Timings</th>
                  <th colspan="2" style="background: #fef9c3; text-align: center; color: #854d0e;">Proposed Timings (New)</th>
                </tr>
                <tr>
                  <th>Azaan</th>
                  <th>Jamaat</th>
                  <th style="color: #854d0e;">Azaan</th>
                  <th style="color: #854d0e;">Jamaat</th>
                </tr>
              </thead>
              <tbody>
                ${prayers.map((prayer) => {
                  const current = schedules.find((s) => s.prayer_name === prayer);
                  const proposed = update.proposed_timings?.[prayer] || {};

                  const curAz = current ? formatTo12Hour(current.azaan_time) : '--:--';
                  const curJm = current ? formatTo12Hour(current.jamaat_time) : '--:--';
                  const propAz = proposed.azaan ? formatTo12Hour(proposed.azaan) : '--:--';
                  const propJm = proposed.jamaat ? formatTo12Hour(proposed.jamaat) : '--:--';

                  const azChanged = curAz !== propAz;
                  const jmChanged = curJm !== propJm;

                  return `
                    <tr>
                      <td style="font-weight: 700; color: var(--primary-dark);">${prayer}</td>
                      <td>${curAz}</td>
                      <td style="font-weight: 600;">${curJm}</td>
                      <td class="${azChanged ? 'diff-changed' : ''}">
                        ${propAz} ${azChanged ? '⚡' : ''}
                      </td>
                      <td class="${jmChanged ? 'diff-changed' : ''}">
                        ${propJm} ${jmChanged ? '⚡' : ''}
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>

          <!-- Actions -->
          <div style="display: flex; justify-content: flex-end; gap: 0.75rem; flex-wrap: wrap;">
            <button class="btn btn-danger reject-submission-btn" data-id="${update.id}" style="min-height: 42px; padding: 0.45rem 1rem;">
              Reject with Feedback...
            </button>
            <button class="btn btn-primary approve-submission-btn" data-id="${update.id}" style="min-height: 42px; padding: 0.45rem 1.25rem;">
              ✓ Approve & Publish Schedule
            </button>
          </div>
        </div>
      `;
    }).join('')}
  `;

  // Attach approval handler
  container.querySelectorAll('.approve-submission-btn').forEach((btn) => {
    btn.onclick = () => {
      const updateId = btn.dataset.id;
      openApproveModal(modalsContainer, updateId);
    };
  });

  // Attach reject handler
  container.querySelectorAll('.reject-submission-btn').forEach((btn) => {
    btn.onclick = () => {
      const updateId = btn.dataset.id;
      openRejectModal(modalsContainer, updateId);
    };
  });
}

function openApproveModal(container, updateId) {
  container.innerHTML = `
    <div id="approve-confirm-modal" class="modal-overlay open">
      <div class="modal-dialog">
        <div class="modal-header">
          <h3 class="modal-title">Confirm Approval & Publication</h3>
          <button class="modal-close" id="modal-close-approve">&times;</button>
        </div>
        <p style="font-size: 0.92rem; color: var(--text-muted); line-height: 1.5; margin-bottom: 1.25rem;">
          Are you sure you want to approve this timing update?
          <br><br>
          This will immediately update the <strong>published prayer schedule</strong> for the public, update the last confirmed timestamp, mark the proposal as approved, and record an audit log entry.
        </p>
        <div class="modal-actions">
          <button id="cancel-approve-btn" class="btn btn-secondary">Cancel</button>
          <button id="exec-approve-btn" class="btn btn-primary btn-lg">Yes, Approve & Publish</button>
        </div>
      </div>
    </div>
  `;

  const modal = document.getElementById('approve-confirm-modal');
  const close = () => modal.remove();
  document.getElementById('modal-close-approve').onclick = close;
  document.getElementById('cancel-approve-btn').onclick = close;

  document.getElementById('exec-approve-btn').onclick = async () => {
    const btn = document.getElementById('exec-approve-btn');
    btn.disabled = true;
    btn.textContent = 'Publishing...';
    try {
      await store.approveTimingUpdate(updateId);
      showToast('Timing update approved and published successfully!', 'success');
      close();
      renderAdminDashboard(document.getElementById('main-view-container'), 'submissions');
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Approval failed.', 'error');
      btn.disabled = false;
      btn.textContent = 'Yes, Approve & Publish';
    }
  };
}

function openRejectModal(container, updateId) {
  container.innerHTML = `
    <div id="reject-modal" class="modal-overlay open">
      <div class="modal-dialog">
        <div class="modal-header">
          <h3 class="modal-title">Reject Timing Proposal</h3>
          <button class="modal-close" id="modal-close-reject">&times;</button>
        </div>
        <p style="font-size: 0.88rem; color: var(--text-muted); margin-bottom: 0.85rem;">
          The published prayer timings will remain unchanged. Please provide feedback explaining why the update was rejected so the Imam can correct it.
        </p>
        <div class="form-group">
          <label class="form-label" for="rejection-reason-input">
            Feedback / Rejection Reason <span class="req">*</span>
          </label>
          <textarea
            id="rejection-reason-input"
            class="form-textarea"
            rows="3"
            placeholder="e.g. Asr Jamaat time was submitted as 04:30 PM, but sunset is 06:40 PM. Please verify with mosque committee..."
            required
          ></textarea>
        </div>
        <div class="modal-actions">
          <button id="cancel-reject-btn" class="btn btn-secondary">Cancel</button>
          <button id="exec-reject-btn" class="btn btn-danger btn-lg">Confirm Rejection</button>
        </div>
      </div>
    </div>
  `;

  const modal = document.getElementById('reject-modal');
  const close = () => modal.remove();
  document.getElementById('modal-close-reject').onclick = close;
  document.getElementById('cancel-reject-btn').onclick = close;

  document.getElementById('exec-reject-btn').onclick = async () => {
    const reason = document.getElementById('rejection-reason-input').value.trim();
    if (!reason) {
      showToast('Please provide a reason for rejection.', 'error');
      return;
    }

    const btn = document.getElementById('exec-reject-btn');
    btn.disabled = true;
    btn.textContent = 'Rejecting...';
    try {
      await store.rejectTimingUpdate(updateId, reason);
      showToast('Timing proposal marked as rejected.', 'info');
      close();
      renderAdminDashboard(document.getElementById('main-view-container'), 'submissions');
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Rejection failed.', 'error');
      btn.disabled = false;
      btn.textContent = 'Confirm Rejection';
    }
  };
}

// ------------------------------------------------------------------------------
// SUB-TAB 2: MANAGE MASJIDS
// ------------------------------------------------------------------------------
function renderMasjidsTab(container, modalsContainer, masjids) {
  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.75rem;">
      <div>
        <h3 style="font-size: 1.2rem; font-weight: 700; color: var(--primary-dark);">Masjids in Kalupur</h3>
        <p style="font-size: 0.85rem; color: var(--text-muted);">Add new masjids, edit addresses, or deactivate listings.</p>
      </div>
      <button id="add-masjid-btn" class="btn btn-primary" style="min-height: 40px; padding: 0.4rem 0.9rem; font-size: 0.88rem;">
        + Add New Masjid
      </button>
    </div>

    <div style="display: flex; flex-direction: column; gap: 0.75rem;">
      ${masjids.map((m) => `
        <div class="card" style="margin: 0; padding: 1rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
          <div>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <h4 style="font-size: 1.1rem; font-weight: 700; color: var(--primary-dark);">${m.name}</h4>
              <span class="badge ${m.active ? 'badge-verified' : 'badge-muted'}">
                ${m.active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.2rem;">
              ${m.address} (${m.area})
            </p>
          </div>

          <div style="display: flex; gap: 0.5rem;">
            <button class="btn btn-secondary edit-masjid-btn" data-id="${m.id}" style="min-height: 36px; padding: 0.3rem 0.75rem; font-size: 0.82rem;">
              Edit Details
            </button>
            <button class="btn btn-outline toggle-masjid-btn" data-id="${m.id}" data-active="${m.active}" style="min-height: 36px; padding: 0.3rem 0.75rem; font-size: 0.82rem;">
              ${m.active ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  document.getElementById('add-masjid-btn').onclick = () => {
    openMasjidFormModal(modalsContainer, null);
  };

  container.querySelectorAll('.edit-masjid-btn').forEach((btn) => {
    btn.onclick = () => {
      const m = masjids.find((x) => x.id === btn.dataset.id);
      openMasjidFormModal(modalsContainer, m);
    };
  });

  container.querySelectorAll('.toggle-masjid-btn').forEach((btn) => {
    btn.onclick = async () => {
      const id = btn.dataset.id;
      const currentActive = btn.dataset.active === 'true';
      try {
        await store.saveMasjid({ id, active: !currentActive });
        showToast(`Masjid ${currentActive ? 'deactivated' : 'activated'}.`, 'info');
        renderAdminDashboard(document.getElementById('main-view-container'), 'masjids');
      } catch (err) {
        showToast(err.message, 'error');
      }
    };
  });
}

function openMasjidFormModal(container, existing) {
  const isEdit = Boolean(existing);
  container.innerHTML = `
    <div id="masjid-form-modal" class="modal-overlay open">
      <div class="modal-dialog">
        <div class="modal-header">
          <h3 class="modal-title">${isEdit ? 'Edit Masjid Details' : 'Add New Masjid'}</h3>
          <button class="modal-close" id="modal-close-masjid">&times;</button>
        </div>
        <form id="masjid-modal-form">
          <div class="form-group">
            <label class="form-label" for="m-name">Masjid Name <span class="req">*</span></label>
            <input type="text" id="m-name" class="form-input" value="${existing?.name || ''}" placeholder="e.g. Masjid-e-Quba" required />
          </div>
          <div class="form-group">
            <label class="form-label" for="m-address">Address <span class="req">*</span></label>
            <input type="text" id="m-address" class="form-input" value="${existing?.address || ''}" placeholder="e.g. Near Kalupur Tower, Kalupur" required />
          </div>
          <div class="form-group">
            <label class="form-label" for="m-area">Area</label>
            <input type="text" id="m-area" class="form-input" value="${existing?.area || 'Kalupur'}" placeholder="Kalupur" required />
          </div>
          <div class="form-group">
            <label class="form-label" for="m-maps">Google Maps URL</label>
            <input type="url" id="m-maps" class="form-input" value="${existing?.maps_url || ''}" placeholder="https://maps.google.com/?q=..." />
          </div>
          <div class="form-group">
            <label class="form-label" for="m-contact">Office Contact Phone</label>
            <input type="text" id="m-contact" class="form-input" value="${existing?.contact_information || ''}" placeholder="+91 XXXXX XXXXX" />
          </div>
          <div class="modal-actions">
            <button type="button" id="cancel-masjid-btn" class="btn btn-secondary">Cancel</button>
            <button type="submit" class="btn btn-primary btn-lg">${isEdit ? 'Save Changes' : 'Create Masjid'}</button>
          </div>
        </form>
      </div>
    </div>
  `;

  const modal = document.getElementById('masjid-form-modal');
  const close = () => modal.remove();
  document.getElementById('modal-close-masjid').onclick = close;
  document.getElementById('cancel-masjid-btn').onclick = close;

  document.getElementById('masjid-modal-form').onsubmit = async (e) => {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = isEdit ? 'Saving...' : 'Creating...';
    }

    const data = {
      ...(isEdit ? { id: existing.id } : {}),
      name: document.getElementById('m-name').value.trim(),
      address: document.getElementById('m-address').value.trim(),
      area: document.getElementById('m-area').value.trim(),
      maps_url: document.getElementById('m-maps').value.trim(),
      contact_information: document.getElementById('m-contact').value.trim()
    };
    try {
      await store.saveMasjid(data);
      showToast(`Masjid "${data.name}" ${isEdit ? 'updated' : 'created'} successfully!`, 'success');
      close();
      renderAdminDashboard(document.getElementById('main-view-container'), 'masjids');
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to save masjid.', 'error');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = isEdit ? 'Save Changes' : 'Create Masjid';
      }
    }
  };
}

// ------------------------------------------------------------------------------
// SUB-TAB 3: MANAGE IMAMS & ASSIGNMENTS
// ------------------------------------------------------------------------------
function renderImamsTab(container, modalsContainer, profiles, masjids) {
  const imams = profiles.filter((p) => p.role === 'imam');

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.75rem;">
      <div>
        <h3 style="font-size: 1.2rem; font-weight: 700; color: var(--primary-dark);">Authorized Imams</h3>
        <p style="font-size: 0.85rem; color: var(--text-muted);">
          Assign Imams to exactly one masjid or revoke access when phone numbers change.
        </p>
      </div>
      <button id="create-imam-btn" class="btn btn-primary" style="min-height: 40px; padding: 0.4rem 0.9rem; font-size: 0.88rem;">
        + Authorize New Imam
      </button>
    </div>

    <div style="display: flex; flex-direction: column; gap: 0.75rem;">
      ${imams.map((imam) => {
        const assignedMasjid = masjids.find((m) => m.id === imam.assigned_masjid_id);

        return `
          <div class="card" style="margin: 0; padding: 1rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
            <div>
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <h4 style="font-size: 1.1rem; font-weight: 700; color: var(--primary-dark);">${imam.display_name}</h4>
                <span class="badge ${imam.active ? 'badge-verified' : 'badge-rejected'}">
                  ${imam.active ? 'Active' : 'Access Revoked'}
                </span>
              </div>
              <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.2rem;">
                Registered Account: <strong>${imam.phone || 'Email User'}</strong>
              </p>
              <p style="font-size: 0.85rem; color: var(--primary); font-weight: 600; margin-top: 0.15rem;">
                Assigned Masjid: ${assignedMasjid ? assignedMasjid.name : '<em>None (Unassigned)</em>'}
              </p>
            </div>

            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
              <button class="btn btn-secondary reassign-imam-btn" data-id="${imam.id}" style="min-height: 36px; padding: 0.3rem 0.75rem; font-size: 0.82rem;">
                Change Masjid
              </button>
              <button class="btn btn-outline toggle-imam-btn" data-id="${imam.id}" data-active="${imam.active}" style="min-height: 36px; padding: 0.3rem 0.75rem; font-size: 0.82rem; color: ${imam.active ? '#dc2626' : 'var(--primary)'}; border-color: ${imam.active ? '#fca5a5' : 'var(--border)'};">
                ${imam.active ? 'Revoke Access' : 'Restore Access'}
              </button>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  document.getElementById('create-imam-btn').onclick = () => {
    openCreateImamModal(modalsContainer, masjids);
  };

  container.querySelectorAll('.reassign-imam-btn').forEach((btn) => {
    btn.onclick = () => {
      const imam = imams.find((p) => p.id === btn.dataset.id);
      openReassignModal(modalsContainer, imam, masjids);
    };
  });

  container.querySelectorAll('.toggle-imam-btn').forEach((btn) => {
    btn.onclick = async () => {
      const id = btn.dataset.id;
      const currentActive = btn.dataset.active === 'true';
      try {
        const imam = imams.find((p) => p.id === id);
        await store.updateImamAssignment(id, imam?.assigned_masjid_id, !currentActive);
        showToast(`Imam access ${currentActive ? 'revoked' : 'restored'}.`, 'info');
        renderAdminDashboard(document.getElementById('main-view-container'), 'imams');
      } catch (err) {
        showToast(err.message, 'error');
      }
    };
  });
}

function openReassignModal(container, imam, masjids) {
  container.innerHTML = `
    <div id="reassign-modal" class="modal-overlay open">
      <div class="modal-dialog">
        <div class="modal-header">
          <h3 class="modal-title">Change Masjid Assignment</h3>
          <button class="modal-close" id="modal-close-reassign">&times;</button>
        </div>
        <div style="font-size: 0.88rem; color: var(--text-muted); margin-bottom: 1rem;">
          Assign <strong>${imam.display_name}</strong> (${imam.phone}) to a masjid:
        </div>
        <div class="form-group">
          <label class="form-label" for="assign-select">Select Assigned Masjid</label>
          <select id="assign-select" class="form-select">
            <option value="">-- Unassigned --</option>
            ${masjids.map((m) => `
              <option value="${m.id}" ${m.id === imam.assigned_masjid_id ? 'selected' : ''}>
                ${m.name} (${m.area})
              </option>
            `).join('')}
          </select>
        </div>
        <div class="modal-actions">
          <button id="cancel-reassign-btn" class="btn btn-secondary">Cancel</button>
          <button id="save-reassign-btn" class="btn btn-primary btn-lg">Update Assignment</button>
        </div>
      </div>
    </div>
  `;

  const modal = document.getElementById('reassign-modal');
  const close = () => modal.remove();
  document.getElementById('modal-close-reassign').onclick = close;
  document.getElementById('cancel-reassign-btn').onclick = close;

  document.getElementById('save-reassign-btn').onclick = async () => {
    const masjidId = document.getElementById('assign-select').value;
    try {
      await store.updateImamAssignment(imam.id, masjidId, imam.active);
      showToast('Masjid assignment updated.', 'success');
      close();
      renderAdminDashboard(document.getElementById('main-view-container'), 'imams');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };
}

function openCreateImamModal(container, masjids) {
  container.innerHTML = `
    <div id="create-imam-modal" class="modal-overlay open">
      <div class="modal-dialog">
        <div class="modal-header">
          <h3 class="modal-title">Authorize New Imam Account</h3>
          <button class="modal-close" id="modal-close-create-imam">&times;</button>
        </div>
        <form id="create-imam-form">
          <div class="form-group">
            <label class="form-label" for="new-imam-name">Imam Name <span class="req">*</span></label>
            <input type="text" id="new-imam-name" class="form-input" placeholder="e.g. Maulana Bilal" required />
          </div>
          <div class="form-group">
            <label class="form-label" for="new-imam-email">Email Address <span class="req">*</span></label>
            <input type="email" id="new-imam-email" class="form-input" placeholder="imam@example.com" required />
            <div class="form-hint">The Imam will use this email address to sign in.</div>
          </div>
          <div class="form-group">
            <label class="form-label" for="new-imam-password">Initial Password <span class="req">*</span></label>
            <input type="password" id="new-imam-password" class="form-input" placeholder="At least 6 characters" minlength="6" required />
            <div class="form-hint">Set the password for this Imam's account.</div>
          </div>
          <div class="form-group">
            <label class="form-label" for="new-imam-masjid">Assigned Masjid <span class="req">*</span></label>
            <select id="new-imam-masjid" class="form-select" required>
              <option value="">-- Choose Assigned Masjid --</option>
              ${masjids.map((m) => `<option value="${m.id}">${m.name} (${m.area})</option>`).join('')}
            </select>
          </div>
          <div id="create-imam-error-container"></div>

          <div class="modal-actions" style="margin-top: 1.25rem;">
            <button type="button" id="cancel-create-imam-btn" class="btn btn-secondary">Cancel</button>
            <button type="submit" id="submit-create-imam-btn" class="btn btn-primary btn-lg">Authorize & Create Account</button>
          </div>
        </form>

        <div style="margin-top: 1.5rem; padding-top: 1.25rem; border-top: 1px solid var(--border);">
          <details>
            <summary style="font-size: 0.88rem; font-weight: 600; color: var(--primary); cursor: pointer;">
              Or Link Existing User UUID from Supabase
            </summary>
            <div style="margin-top: 0.75rem;">
              <div class="form-group">
                <label class="form-label" for="existing-user-id">Supabase Auth User UUID</label>
                <input type="text" id="existing-user-id" class="form-input" placeholder="e.g. e0a1b2c3-d4e5-..." />
                <div class="form-hint">Found under Supabase Dashboard &rarr; Authentication &rarr; Users.</div>
              </div>
              <div class="form-group">
                <label class="form-label" for="existing-user-name">Display Name</label>
                <input type="text" id="existing-user-name" class="form-input" placeholder="e.g. Maulana Bilal" />
              </div>
              <div class="form-group">
                <label class="form-label" for="existing-user-masjid">Assign to Masjid</label>
                <select id="existing-user-masjid" class="form-select">
                  <option value="">-- Choose Assigned Masjid --</option>
                  ${masjids.map((m) => `<option value="${m.id}">${m.name} (${m.area})</option>`).join('')}
                </select>
              </div>
              <button type="button" id="link-existing-user-btn" class="btn btn-secondary btn-block" style="margin-top: 0.5rem;">
                Link User as Imam
              </button>
            </div>
          </details>
        </div>
      </div>
    </div>
  `;

  const modal = document.getElementById('create-imam-modal');
  const close = () => modal.remove();
  document.getElementById('modal-close-create-imam').onclick = close;
  document.getElementById('cancel-create-imam-btn').onclick = close;

  document.getElementById('create-imam-form').onsubmit = async (e) => {
    e.preventDefault();
    const name = document.getElementById('new-imam-name').value.trim();
    const email = document.getElementById('new-imam-email').value.trim();
    const password = document.getElementById('new-imam-password').value;
    const masjidId = document.getElementById('new-imam-masjid').value;
    const submitBtn = document.getElementById('submit-create-imam-btn');
    const errContainer = document.getElementById('create-imam-error-container');

    if (errContainer) errContainer.innerHTML = '';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Authorizing...';

    try {
      await store.createImamAccount(name, email, password, masjidId);
      showToast('Imam authorized successfully!', 'success');
      close();
      renderAdminDashboard(document.getElementById('main-view-container'), 'imams');
    } catch (err) {
      console.error('Create imam error:', err);
      const isRateLimit = err.message && (err.message.toLowerCase().includes('rate limit') || err.message.toLowerCase().includes('rate_limit'));
      
      if (errContainer) {
        if (isRateLimit) {
          errContainer.innerHTML = `
            <div style="background: #fffbeb; border: 1.5px solid #fde68a; border-radius: 8px; padding: 0.9rem; margin-top: 1rem; text-align: left;">
              <div style="font-weight: 700; color: #92400e; font-size: 0.92rem; margin-bottom: 0.35rem;">
                ⚠️ Email Rate Limit Exceeded (3/hr)
              </div>
              <p style="font-size: 0.83rem; color: #78350f; line-height: 1.45; margin: 0 0 0.5rem 0;">
                Supabase shared email provider limits signup confirmation emails. You can eliminate this limit in <strong>30 seconds</strong>:
              </p>
              <ol style="font-size: 0.82rem; color: #78350f; margin: 0 0 0.6rem 1.25rem; line-height: 1.5;">
                <li>Open <strong>Supabase Dashboard &rarr; Authentication &rarr; Providers &rarr; Email</strong></li>
                <li>Turn <strong>Confirm email</strong> to <strong>OFF</strong></li>
                <li>Click <strong>Save</strong></li>
              </ol>
              <div style="font-size: 0.82rem; color: #92400e; font-weight: 600;">
                💡 Alternatively: Add user in Supabase Dashboard &rarr; Authentication &rarr; Users &rarr; Add User (with Auto Confirm ON), then paste their UUID in the "Link Existing User" section below.
              </div>
            </div>
          `;
          showToast('Email rate limit reached. See quick fix instructions in the modal.', 'error', 7000);
        } else {
          errContainer.innerHTML = `
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 0.75rem; margin-top: 0.85rem; color: #b91c1c; font-size: 0.85rem;">
              ${err.message || 'Failed to authorize imam.'}
            </div>
          `;
          showToast(err.message || 'Failed to authorize imam.', 'error');
        }
      } else {
        showToast(err.message || 'Failed to authorize imam.', 'error');
      }

      submitBtn.disabled = false;
      submitBtn.textContent = 'Authorize & Create Account';
    }
  };

  const linkBtn = document.getElementById('link-existing-user-btn');
  if (linkBtn) {
    linkBtn.onclick = async () => {
      const userId = document.getElementById('existing-user-id').value.trim();
      const name = document.getElementById('existing-user-name').value.trim();
      const masjidId = document.getElementById('existing-user-masjid').value;

      if (!userId) {
        showToast('Please enter the Supabase User UUID.', 'error');
        return;
      }

      linkBtn.disabled = true;
      linkBtn.textContent = 'Linking...';

      try {
        await store.assignUserAsImam(userId, name || 'Imam', masjidId || null);
        showToast('User linked as Imam successfully!', 'success');
        close();
        renderAdminDashboard(document.getElementById('main-view-container'), 'imams');
      } catch (err) {
        showToast(err.message || 'Failed to link user.', 'error');
        linkBtn.disabled = false;
        linkBtn.textContent = 'Link User as Imam';
      }
    };
  }
}

// ------------------------------------------------------------------------------
// SUB-TAB 4: PUBLIC CORRECTION REPORTS
// ------------------------------------------------------------------------------
function renderReportsTab(container, modalsContainer, reports) {
  if (reports.length === 0) {
    container.innerHTML = `
      <div class="card" style="text-align: center; padding: 2.5rem 1rem;">
        <p style="color: var(--text-muted); font-size: 1rem;">No public correction reports submitted.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div style="margin-bottom: 1rem;">
      <h3 style="font-size: 1.2rem; font-weight: 700; color: var(--primary-dark);">Community Correction Reports</h3>
      <p style="font-size: 0.85rem; color: var(--text-muted);">
        Feedback submitted by public visitors regarding prayer timings or masjid locations.
      </p>
    </div>

    <div style="display: flex; flex-direction: column; gap: 0.85rem;">
      ${reports.map((r) => `
        <div class="card" style="margin: 0; padding: 1.1rem; border-left: 4px solid ${r.status === 'pending' ? '#d97706' : r.status === 'resolved' ? '#059669' : '#6b7280'};">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; flex-wrap: wrap;">
            <div>
              <span class="badge ${r.status === 'pending' ? 'badge-pending' : r.status === 'resolved' ? 'badge-verified' : 'badge-muted'}" style="text-transform: uppercase;">
                ${r.status}
              </span>
              <h4 style="font-size: 1.05rem; font-weight: 700; color: var(--primary-dark); margin-top: 0.35rem;">
                ${r.masjids?.name || 'General Inquiry'}
              </h4>
              <p style="font-size: 0.78rem; color: var(--text-light);">
                Reported: ${formatDate(r.created_at)} &bull; Category: <strong>${r.category.replace('_', ' ')}</strong>
              </p>
            </div>

            ${
              r.status === 'pending'
                ? `<div style="display: flex; gap: 0.5rem;">
                    <button class="btn btn-secondary dismiss-report-btn" data-id="${r.id}" style="min-height: 36px; padding: 0.3rem 0.75rem; font-size: 0.82rem;">
                      Dismiss
                    </button>
                    <button class="btn btn-primary resolve-report-btn" data-id="${r.id}" style="min-height: 36px; padding: 0.3rem 0.75rem; font-size: 0.82rem;">
                      Mark Resolved
                    </button>
                  </div>`
                : ''
            }
          </div>

          <div style="margin-top: 0.75rem; padding: 0.65rem 0.85rem; background: var(--bg-surface); border-radius: var(--radius-sm); font-size: 0.88rem; color: var(--text-main);">
            "${r.description}"
          </div>

          ${
            r.contact_info
              ? `<div style="margin-top: 0.5rem; font-size: 0.8rem; color: var(--text-muted);">
                  Submitter Contact: <strong>${r.contact_info}</strong>
                </div>`
              : ''
          }
        </div>
      `).join('')}
    </div>
  `;

  container.querySelectorAll('.resolve-report-btn').forEach((btn) => {
    btn.onclick = async () => {
      try {
        await store.updateCorrectionReportStatus(btn.dataset.id, 'resolved');
        showToast('Report marked as resolved.', 'success');
        renderAdminDashboard(document.getElementById('main-view-container'), 'reports');
      } catch (err) {
        showToast(err.message, 'error');
      }
    };
  });

  container.querySelectorAll('.dismiss-report-btn').forEach((btn) => {
    btn.onclick = async () => {
      try {
        await store.updateCorrectionReportStatus(btn.dataset.id, 'dismissed');
        showToast('Report dismissed.', 'info');
        renderAdminDashboard(document.getElementById('main-view-container'), 'reports');
      } catch (err) {
        showToast(err.message, 'error');
      }
    };
  });
}

// ------------------------------------------------------------------------------
// SUB-TAB 5: AUDIT LOGS
// ------------------------------------------------------------------------------
function renderAuditTab(container, auditLogs) {
  container.innerHTML = `
    <div style="margin-bottom: 1rem;">
      <h3 style="font-size: 1.2rem; font-weight: 700; color: var(--primary-dark);">System Audit History</h3>
      <p style="font-size: 0.85rem; color: var(--text-muted);">
        Immutable chronological trail of all timing proposals, approvals, rejections, and administrative actions.
      </p>
    </div>

    <div style="overflow-x: auto;">
      <table class="prayer-table" style="background: #ffffff;">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Action</th>
            <th>Actor</th>
            <th>Masjid</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          ${auditLogs.map((log) => `
            <tr>
              <td style="font-size: 0.8rem; color: var(--text-light); white-space: nowrap;">
                ${formatDate(log.created_at)}
              </td>
              <td>
                <span class="badge ${log.action.includes('APPROVE') ? 'badge-verified' : log.action.includes('REJECT') ? 'badge-rejected' : 'badge-pending'}">
                  ${log.action}
                </span>
              </td>
              <td style="font-size: 0.85rem; font-weight: 600;">
                ${log.profiles?.display_name || 'System / Admin'}
              </td>
              <td style="font-size: 0.85rem;">
                ${log.masjids?.name || '--'}
              </td>
              <td style="font-size: 0.78rem; color: var(--text-muted); font-family: monospace; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                ${JSON.stringify(log.details || {})}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}
