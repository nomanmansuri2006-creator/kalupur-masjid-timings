// ==============================================================================
// PUBLIC MASJID DETAILS VIEW
// Full details for a single masjid: Azaan & Jamaat prayer table, directions,
// last confirmed timestamp, verification status, and correction reporting.
// ==============================================================================

import { store } from '../store.js';
import { formatTo12Hour, formatDate, getActivePrayer } from '../utils/formatters.js';

export async function renderMasjidDetails(container, masjidId) {
  if (!masjidId) {
    container.innerHTML = `
      <div class="card" style="text-align: center; padding: 2rem;">
        <p style="color: #dc2626; font-weight: 600;">No masjid ID specified.</p>
        <a href="#home" class="btn btn-primary" style="margin-top: 1rem;">Back to Masjids</a>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div style="text-align:center; padding: 3rem; color: var(--text-muted);">
      Loading prayer schedule...
    </div>
  `;

  let masjid = null;
  try {
    masjid = await store.getMasjidById(masjidId);
  } catch (err) {
    console.error(err);
  }

  if (!masjid) {
    container.innerHTML = `
      <div class="card" style="text-align: center; padding: 2.5rem;">
        <h3 style="font-size: 1.25rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.5rem;">
          Masjid Not Found
        </h3>
        <p style="color: var(--text-muted); margin-bottom: 1rem;">
          The requested masjid record does not exist or has been deactivated.
        </p>
        <a href="#home" class="btn btn-primary">Back to All Masjids</a>
      </div>
    `;
    return;
  }

  const schedules = masjid.prayer_schedules || [];
  const isVerified = schedules.some((s) => s.is_verified);
  const activePrayer = getActivePrayer(schedules);
  const lastConfirmed = schedules[0]?.last_confirmed_at;

  const prayers = [
    { name: 'Fajr', arabic: 'الفجر', desc: 'Dawn Prayer' },
    { name: 'Dhuhr', arabic: 'الظهر', desc: 'Noon Prayer' },
    { name: 'Asr', arabic: 'العصر', desc: 'Afternoon Prayer' },
    { name: 'Maghrib', arabic: 'المغرب', desc: 'Sunset Prayer' },
    { name: 'Isha', arabic: 'العشاء', desc: 'Night Prayer' }
  ];

  container.innerHTML = `
    <div style="margin-bottom: 1rem;">
      <a href="#home" style="display: inline-flex; align-items: center; gap: 0.35rem; color: var(--primary); text-decoration: none; font-size: 0.9rem; font-weight: 600;">
        &larr; Back to all masjids
      </a>
    </div>

    <div class="card">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap;">
        <div>
          <h2 style="font-size: 1.6rem; font-weight: 800; color: var(--primary-dark); line-height: 1.25;">
            ${masjid.name}
          </h2>
          <p style="font-size: 0.95rem; color: var(--text-muted); margin-top: 0.35rem;">
            ${masjid.address}, ${masjid.area}, Ahmedabad
          </p>
          ${
            masjid.contact_information
              ? `<p style="font-size: 0.85rem; color: var(--text-light); margin-top: 0.2rem;">
                  Office Contact: ${masjid.contact_information}
                </p>`
              : ''
          }
        </div>

        <div>
          ${
            isVerified
              ? `<span class="badge badge-verified" style="font-size: 0.85rem; padding: 0.35rem 0.75rem;">
                  <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                  Verified Schedule
                </span>`
              : `<span class="badge badge-pending" style="font-size: 0.85rem; padding: 0.35rem 0.75rem;">
                  <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/></svg>
                  Awaiting Confirmation (Trial Sample)
                </span>`
          }
        </div>
      </div>

      <!-- Quick Action Buttons -->
      <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; margin-top: 1.25rem;">
        ${
          masjid.maps_url
            ? `<a href="${masjid.maps_url}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                Google Maps Directions
              </a>`
            : ''
        }

        <a href="#report?id=${masjid.id}" class="btn btn-secondary">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          Report Incorrect Timings
        </a>
      </div>

      <!-- Notice for trial / unverified schedule -->
      ${
        !isVerified
          ? `<div style="margin-top: 1rem; padding: 0.75rem 1rem; background: #fffbeb; border: 1px solid #fef3c7; border-radius: var(--radius-sm); font-size: 0.85rem; color: #92400e;">
              <strong>Note:</strong> These timings are clearly marked demonstration data for trial testing. Official timings will be displayed once verified and confirmed by the assigned Imam or administrator.
            </div>`
          : ''
      }
    </div>

    <!-- 5 Daily Prayers Table -->
    <div class="card" style="padding: 0; overflow: hidden;">
      <div style="padding: 1rem 1.25rem; background: var(--primary-dark); color: #ffffff; display: flex; justify-content: space-between; align-items: center;">
        <h3 style="font-size: 1.15rem; font-weight: 700;">
          Daily Prayer Schedule (Salah Timings)
        </h3>
        <span style="font-size: 0.8rem; color: var(--gold-light);">
          Last Confirmed: ${formatDate(lastConfirmed)}
        </span>
      </div>

      <div class="prayer-table-container" style="border: none; margin: 0; border-radius: 0;">
        <table class="prayer-table">
          <thead>
            <tr>
              <th style="width: 34%;">Prayer</th>
              <th style="width: 33%;">Azaan Time</th>
              <th style="width: 33%;">Jamaat Time</th>
            </tr>
          </thead>
          <tbody>
            ${prayers.map((prayer) => {
              const row = schedules.find((s) => s.prayer_name === prayer.name);
              const isCurrent = prayer.name === activePrayer;
              return `
                <tr class="${isCurrent ? 'current-prayer' : ''}">
                  <td>
                    <div class="prayer-name-cell">
                      <div>
                        <div style="font-weight: 700; color: var(--primary-dark); font-size: 1.05rem;">
                          ${prayer.name}
                        </div>
                        <div style="font-size: 0.75rem; color: var(--text-light);">
                          ${prayer.desc}
                        </div>
                      </div>
                      ${isCurrent ? `<span class="prayer-badge">UPCOMING</span>` : ''}
                    </div>
                  </td>
                  <td style="font-size: 1.1rem; font-weight: 600; color: var(--text-main);">
                    ${row ? formatTo12Hour(row.azaan_time) : '--:--'}
                  </td>
                  <td style="font-size: 1.15rem; font-weight: 700; color: var(--primary);">
                    ${row ? formatTo12Hour(row.jamaat_time) : '--:--'}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>

      <div style="padding: 0.85rem 1.25rem; background: var(--bg-surface); font-size: 0.82rem; color: var(--text-muted); border-top: 1px solid var(--border);">
        <p>• Jamaat is held in the main prayer hall. Please arrive at least 5 minutes before the scheduled Jamaat time.</p>
        <p>• Timings are managed by authorized mosque representatives.</p>
      </div>
    </div>
  `;
}
