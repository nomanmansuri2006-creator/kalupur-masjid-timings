// ==============================================================================
// IMAM EDIT TIMINGS VIEW
// Native time inputs for the 5 daily prayers, note field, validation,
// and confirmation modal before submission.
// ==============================================================================

import { store } from '../store.js';
import { formatTo24Hour, formatTo12Hour } from '../utils/formatters.js';
import { validatePrayerTimes } from '../utils/validator.js';
import { showToast } from '../utils/toast.js';

export async function renderImamEdit(container) {
  const profile = store.getCurrentProfile();

  if (!profile) {
    window.location.hash = '#login';
    return;
  }

  container.innerHTML = `
    <div style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
      Loading editor...
    </div>
  `;

  let masjid = null;
  try {
    if (profile.assigned_masjid_id) {
      masjid = await store.getMasjidById(profile.assigned_masjid_id);
    } else if (profile.role === 'admin') {
      const masjids = await store.getMasjids();
      if (masjids.length > 0) masjid = masjids[0];
    }
  } catch (err) {
    console.error(err);
  }

  if (!masjid) {
    container.innerHTML = `
      <div class="card" style="text-align: center; padding: 2rem;">
        <p style="color: #dc2626;">No assigned masjid found.</p>
        <a href="#imam" class="btn btn-primary" style="margin-top: 1rem;">Back to Dashboard</a>
      </div>
    `;
    return;
  }

  const schedules = masjid.prayer_schedules || [];
  const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

  // Map current values
  const currentValues = {};
  for (const p of prayers) {
    const s = schedules.find((x) => x.prayer_name === p);
    currentValues[p] = {
      azaan: s ? formatTo24Hour(s.azaan_time) : '',
      jamaat: s ? formatTo24Hour(s.jamaat_time) : ''
    };
  }

  container.innerHTML = `
    <div style="margin-bottom: 1rem;">
      <a href="#imam" style="display: inline-flex; align-items: center; gap: 0.35rem; color: var(--primary); text-decoration: none; font-size: 0.92rem; font-weight: 600;">
        &larr; Back to Imam Dashboard
      </a>
    </div>

    <div class="card" style="max-width: 640px; margin: 0 auto;">
      <div style="border-bottom: 1.5px solid var(--border); padding-bottom: 0.75rem; margin-bottom: 1.25rem;">
        <span style="font-size: 0.8rem; font-weight: 700; color: var(--gold-dark); text-transform: uppercase; letter-spacing: 0.05em;">
          Proposed Schedule Update
        </span>
        <h2 style="font-size: 1.45rem; font-weight: 800; color: var(--primary-dark); margin-top: 0.2rem;">
          Edit Prayer Timings
        </h2>
        <p style="font-size: 0.88rem; color: var(--text-muted); margin-top: 0.25rem;">
          Masjid: <strong>${masjid.name}</strong>
        </p>
      </div>

      <!-- Info Alert Box -->
      <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: var(--radius-sm); padding: 0.75rem 1rem; margin-bottom: 1.5rem; font-size: 0.85rem; color: #065f46;">
        <strong>Notice:</strong> Proposed timing changes will be reviewed by the administrator before appearing on the public website.
      </div>

      <form id="edit-timings-form">
        <!-- 5 Prayers Grid Form -->
        <div style="display: flex; flex-direction: column; gap: 1rem;">
          ${prayers.map((prayer) => {
            const vals = currentValues[prayer] || {};
            return `
              <div style="background: var(--bg-page); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 0.85rem 1rem;">
                <div style="font-weight: 800; font-size: 1.05rem; color: var(--primary-dark); margin-bottom: 0.6rem; display: flex; align-items: center; justify-content: space-between;">
                  <span>${prayer}</span>
                  <span style="font-size: 0.75rem; color: var(--text-light); font-weight: normal;">Daily Salah</span>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                  <!-- Azaan Time Input -->
                  <div>
                    <label class="form-label" style="font-size: 0.8rem;" for="time-${prayer}-azaan">
                      Azaan Time <span class="req">*</span>
                    </label>
                    <input
                      type="time"
                      id="time-${prayer}-azaan"
                      name="${prayer}_azaan"
                      class="form-input"
                      value="${vals.azaan}"
                      required
                    />
                  </div>

                  <!-- Jamaat Time Input -->
                  <div>
                    <label class="form-label" style="font-size: 0.8rem;" for="time-${prayer}-jamaat">
                      Jamaat Time <span class="req">*</span>
                    </label>
                    <input
                      type="time"
                      id="time-${prayer}-jamaat"
                      name="${prayer}_jamaat"
                      class="form-input"
                      value="${vals.jamaat}"
                      required
                    />
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Optional Explanation Note -->
        <div class="form-group" style="margin-top: 1.25rem;">
          <label class="form-label" for="timings-notes">
            Optional Note for Administrator
          </label>
          <textarea
            id="timings-notes"
            class="form-textarea"
            rows="2"
            placeholder="e.g., Adjusting Asr and Isha timings as decided in the masjid trust committee meeting..."
          ></textarea>
        </div>

        <!-- Actions -->
        <div style="display: flex; gap: 0.75rem; margin-top: 1.5rem; flex-wrap: wrap;">
          <a href="#imam" class="btn btn-secondary" style="flex: 1;">Cancel</a>
          <button type="submit" class="btn btn-primary btn-lg" style="flex: 2;" id="preview-submit-btn">
            Submit for Approval &rarr;
          </button>
        </div>
      </form>
    </div>

    <!-- Confirmation Modal -->
    <div id="confirm-modal" class="modal-overlay">
      <div class="modal-dialog">
        <div class="modal-header">
          <h3 class="modal-title">Confirm Timing Submission</h3>
          <button id="close-confirm-modal" class="modal-close">&times;</button>
        </div>

        <div style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1rem;">
          Please confirm the proposed prayer timings for <strong>${masjid.name}</strong>:
        </div>

        <div id="confirm-summary-list" style="background: var(--bg-surface); padding: 0.85rem; border-radius: var(--radius-sm); font-size: 0.88rem; margin-bottom: 1rem;">
          <!-- Injected via JS -->
        </div>

        <div style="background: #fffbeb; border: 1px solid #fef08a; padding: 0.65rem 0.85rem; border-radius: var(--radius-sm); font-size: 0.82rem; color: #854d0e; margin-bottom: 1rem;">
          ⚠️ <strong>Reminder:</strong> Submitting will not alter the public website immediately. The administrator will review and verify these timings.
        </div>

        <div class="modal-actions">
          <button id="cancel-confirm-btn" class="btn btn-secondary">Go Back</button>
          <button id="final-submit-btn" class="btn btn-primary btn-lg">
            Confirm & Send to Admin
          </button>
        </div>
      </div>
    </div>
  `;

  const form = document.getElementById('edit-timings-form');
  const confirmModal = document.getElementById('confirm-modal');
  const confirmSummaryList = document.getElementById('confirm-summary-list');
  const cancelConfirmBtn = document.getElementById('cancel-confirm-btn');
  const closeConfirmModal = document.getElementById('close-confirm-modal');
  const finalSubmitBtn = document.getElementById('final-submit-btn');

  let proposedPayload = null;
  let notesPayload = '';

  form.onsubmit = (e) => {
    e.preventDefault();

    const proposed = {};
    for (const p of prayers) {
      const azInput = document.getElementById(`time-${p}-azaan`).value;
      const jmInput = document.getElementById(`time-${p}-jamaat`).value;

      proposed[p] = {
        azaan: formatTo12Hour(azInput),
        jamaat: formatTo12Hour(jmInput)
      };
    }

    const validation = validatePrayerTimes(proposed);
    if (!validation.isValid) {
      showToast(validation.errors[0] || 'Please complete all timing fields.', 'error');
      return;
    }

    proposedPayload = proposed;
    notesPayload = document.getElementById('timings-notes').value.trim();

    // Populate confirmation modal summary
    confirmSummaryList.innerHTML = prayers.map((p) => {
      return `
        <div style="display: flex; justify-content: space-between; padding: 0.25rem 0; border-bottom: 1px dashed var(--border);">
          <strong>${p}:</strong>
          <span>Azaan: <strong>${proposed[p].azaan}</strong> &bull; Jamaat: <strong style="color: var(--primary);">${proposed[p].jamaat}</strong></span>
        </div>
      `;
    }).join('') + (notesPayload ? `<div style="margin-top: 0.5rem; font-style: italic;">Note: "${notesPayload}"</div>` : '');

    confirmModal.classList.add('open');
  };

  const closeModal = () => confirmModal.classList.remove('open');
  cancelConfirmBtn.onclick = closeModal;
  closeConfirmModal.onclick = closeModal;

  finalSubmitBtn.onclick = async () => {
    finalSubmitBtn.disabled = true;
    finalSubmitBtn.textContent = 'Submitting...';

    try {
      await store.submitTimingUpdate(masjid.id, proposedPayload, notesPayload);
      closeModal();
      showToast('Prayer timing update submitted for administrator approval!', 'success');
      window.location.hash = '#imam';
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to submit update.', 'error');
      finalSubmitBtn.disabled = false;
      finalSubmitBtn.textContent = 'Confirm & Send to Admin';
    }
  };
}
