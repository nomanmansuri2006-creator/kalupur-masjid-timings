// ==============================================================================
// PUBLIC CORRECTION REPORT VIEW
// Allows community members to report timing discrepancies or location corrections.
// All submissions are routed to the administrator review queue.
// ==============================================================================

import { store } from '../store.js';
import { showToast } from '../utils/toast.js';

export async function renderReport(container, preselectedMasjidId) {
  let masjids = [];
  try {
    masjids = await store.getMasjids();
  } catch (err) {
    console.error(err);
  }

  container.innerHTML = `
    <div style="margin-bottom: 1rem;">
      <a href="#home" style="display: inline-flex; align-items: center; gap: 0.35rem; color: var(--primary); text-decoration: none; font-size: 0.9rem; font-weight: 600;">
        &larr; Back to all masjids
      </a>
    </div>

    <div class="card" style="max-width: 600px; margin: 0 auto;">
      <h2 style="font-size: 1.4rem; font-weight: 800; color: var(--primary-dark); margin-bottom: 0.35rem;">
        Submit a Correction Report
      </h2>
      <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1.25rem;">
        If you noticed an incorrect prayer time, inaccurate address, or contact detail, please let us know. The administrator will review and verify every report.
      </p>

      <form id="correction-form">
        <!-- Masjid Selection -->
        <div class="form-group">
          <label class="form-label" for="report-masjid">
            Select Masjid <span class="req">*</span>
          </label>
          <select id="report-masjid" class="form-select" required>
            <option value="">-- Choose a Masjid --</option>
            ${masjids.map((m) => `
              <option value="${m.id}" ${m.id === preselectedMasjidId ? 'selected' : ''}>
                ${m.name} (${m.area})
              </option>
            `).join('')}
            <option value="other">Other / Not Listed</option>
          </select>
        </div>

        <!-- Issue Category -->
        <div class="form-group">
          <label class="form-label" for="report-category">
            Issue Category <span class="req">*</span>
          </label>
          <select id="report-category" class="form-select" required>
            <option value="timing_incorrect">Incorrect Prayer / Jamaat Timing</option>
            <option value="wrong_address">Incorrect Address or Location Pin</option>
            <option value="name_error">Typo in Masjid Name</option>
            <option value="contact_issue">Incorrect Contact Information</option>
            <option value="other">Other Inquiry / Suggestion</option>
          </select>
        </div>

        <!-- Details / Description -->
        <div class="form-group">
          <label class="form-label" for="report-description">
            Describe the Correction <span class="req">*</span>
          </label>
          <textarea
            id="report-description"
            class="form-textarea"
            placeholder="Please specify which prayer time or address details need updating (e.g. Asr Jamaat was changed to 05:15 PM last Friday)..."
            required
            minlength="5"
          ></textarea>
          <div class="form-hint">Provide as much detail as possible to assist verification.</div>
        </div>

        <!-- Submitter Contact Info (Optional) -->
        <div class="form-group">
          <label class="form-label" for="report-contact">
            Your Name / Phone Number (Optional)
          </label>
          <input
            type="text"
            id="report-contact"
            class="form-input"
            placeholder="e.g. Mohammed, +91 98250 XXXXX"
          />
          <div class="form-hint">Used only if the administrator needs to follow up with you.</div>
        </div>

        <div style="margin-top: 1.5rem; display: flex; gap: 0.75rem;">
          <button type="submit" class="btn btn-primary btn-block btn-lg" id="submit-report-btn">
            Submit Correction Report
          </button>
        </div>
      </form>
    </div>
  `;

  const form = document.getElementById('correction-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const masjidIdVal = document.getElementById('report-masjid').value;
    const category = document.getElementById('report-category').value;
    const description = document.getElementById('report-description').value.trim();
    const contactInfo = document.getElementById('report-contact').value.trim();

    if (!description || description.length < 5) {
      showToast('Please provide a descriptive explanation (at least 5 characters).', 'error');
      return;
    }

    const submitBtn = document.getElementById('submit-report-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting report...';

    try {
      const masjidId = masjidIdVal === 'other' ? null : masjidIdVal;
      await store.submitCorrectionReport(masjidId, category, description, contactInfo);

      // Render confirmation screen
      container.innerHTML = `
        <div class="card" style="max-width: 540px; margin: 2rem auto; text-align: center; padding: 2.5rem 1.5rem;">
          <div style="width: 56px; height: 56px; border-radius: 50%; background: #d1fae5; color: var(--primary); display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem;">
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          <h2 style="font-size: 1.4rem; font-weight: 800; color: var(--primary-dark); margin-bottom: 0.5rem;">
            Report Received — Jazakallahu Khair!
          </h2>
          <p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.5; margin-bottom: 1.5rem;">
            Thank you for helping maintain accurate prayer timings for Kalupur masjids. The administrator will review your report shortly.
          </p>
          <a href="#home" class="btn btn-primary btn-lg">Return to Home</a>
        </div>
      `;
      showToast('Correction report submitted successfully.', 'success');
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to submit report. Please try again.', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Correction Report';
    }
  });
}
