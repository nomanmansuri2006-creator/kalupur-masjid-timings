// ==============================================================================
// PUBLIC HOME VIEW — Kalupur Masjid Timings
// Displays list of active masjids, search filter, prayer preview, map directions,
// and correction report links.
// ==============================================================================

import { store } from '../store.js';
import { formatTo12Hour, formatDate, getActivePrayer } from '../utils/formatters.js';

export async function renderHome(container) {
  container.innerHTML = `
    <div style="text-align: center; margin-bottom: 1.5rem; padding-top: 0.5rem;">
      <h2 style="font-size: 1.6rem; color: var(--primary-dark); font-weight: 800; margin-bottom: 0.35rem;">
        Kalupur Masjid Timings
      </h2>
      <p style="color: var(--text-muted); font-size: 0.95rem; max-width: 580px; margin: 0 auto;">
        A free community service providing accurate, verified Azaan and Jamaat prayer timings for masjids across Kalupur, Ahmedabad.
      </p>
    </div>

    <!-- Search Input -->
    <div class="search-wrapper">
      <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="search"
        id="masjid-search"
        class="search-input"
        placeholder="Search by masjid name or area in Kalupur..."
        aria-label="Search Masjids"
      />
    </div>

    <!-- Masjid Cards Container -->
    <div id="masjid-cards-list">
      <div style="text-align:center; padding: 2rem; color: var(--text-muted);">
        Loading masjids...
      </div>
    </div>

    <!-- Public Report Correction Banner -->
    <div class="card" style="background: var(--bg-surface); border-color: #e2d9c5; text-align: center; margin-top: 1.5rem;">
      <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--primary-dark); margin-bottom: 0.35rem;">
        Notice an incorrect prayer time or address?
      </h3>
      <p style="font-size: 0.88rem; color: var(--text-muted); margin-bottom: 0.85rem;">
        Help our community keep information accurate. Anyone can report corrections for administrator verification.
      </p>
      <a href="#report" class="btn btn-secondary" style="background: #ffffff;">
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
        Submit a Correction Report
      </a>
    </div>
  `;

  let masjids = [];
  try {
    masjids = await store.getMasjids();
  } catch (err) {
    console.error(err);
  }

  const listContainer = document.getElementById('masjid-cards-list');
  const searchInput = document.getElementById('masjid-search');

  function renderCards(filtered) {
    if (filtered.length === 0) {
      listContainer.innerHTML = `
        <div class="card" style="text-align: center; padding: 2.5rem 1rem;">
          <p style="font-size: 1.05rem; font-weight: 600; color: var(--text-muted);">No masjids found matching your search.</p>
          <p style="font-size: 0.85rem; color: var(--text-light); margin-top: 0.25rem;">Try searching for "Kalupur" or clearing your search term.</p>
        </div>
      `;
      return;
    }

    listContainer.innerHTML = filtered.map((masjid) => {
      const schedules = masjid.prayer_schedules || [];
      const isVerified = schedules.some((s) => s.is_verified);
      const nextPrayer = getActivePrayer(schedules);
      const lastConfirmed = schedules[0]?.last_confirmed_at;

      return `
        <div class="card" style="position: relative;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.75rem; margin-bottom: 0.5rem; flex-wrap: wrap;">
            <div>
              <h3 style="font-size: 1.25rem; font-weight: 700; color: var(--primary-dark); line-height: 1.3;">
                <a href="#masjid?id=${masjid.id}" style="color: inherit; text-decoration: none;">
                  ${masjid.name}
                </a>
              </h3>
              <p style="font-size: 0.88rem; color: var(--text-muted); display: flex; align-items: center; gap: 0.35rem; margin-top: 0.2rem;">
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                ${masjid.address} (${masjid.area})
              </p>
            </div>
            
            <div>
              ${
                isVerified
                  ? `<span class="badge badge-verified">
                      <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                      Verified Timings
                    </span>`
                  : `<span class="badge badge-pending">
                      <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/></svg>
                      Awaiting Confirmation (Trial Sample)
                    </span>`
              }
            </div>
          </div>

          <!-- Quick Preview of 5 Prayers -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(95px, 1fr)); gap: 0.5rem; margin: 1rem 0; background: var(--bg-page); padding: 0.75rem; border-radius: var(--radius-sm); border: 1px solid var(--border);">
            ${['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((pName) => {
              const p = schedules.find((s) => s.prayer_name === pName);
              const isCurrent = pName === nextPrayer;
              return `
                <div style="text-align: center; padding: 0.35rem; border-radius: var(--radius-sm); ${isCurrent ? 'background: #d1fae5; border: 1px solid #a7f3d0;' : ''}">
                  <div style="font-size: 0.75rem; font-weight: 700; color: ${isCurrent ? 'var(--primary)' : 'var(--text-muted)'}; text-transform: uppercase;">
                    ${pName} ${isCurrent ? '• NEXT' : ''}
                  </div>
                  <div style="font-size: 0.88rem; font-weight: 700; color: var(--text-main); margin-top: 0.15rem;">
                    ${p ? formatTo12Hour(p.jamaat_time) : '--:--'}
                  </div>
                  <div style="font-size: 0.72rem; color: var(--text-light);">
                    Az: ${p ? formatTo12Hour(p.azaan_time) : '--:--'}
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid var(--border);">
            <div style="font-size: 0.78rem; color: var(--text-light);">
              Last confirmed: <strong>${formatDate(lastConfirmed)}</strong>
            </div>

            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
              ${
                masjid.maps_url
                  ? `<a href="${masjid.maps_url}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary" style="min-height: 40px; padding: 0.4rem 0.85rem; font-size: 0.88rem;">
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
                      </svg>
                      Directions
                    </a>`
                  : ''
              }
              <a href="#masjid?id=${masjid.id}" class="btn btn-primary" style="min-height: 40px; padding: 0.4rem 1rem; font-size: 0.88rem;">
                View All Timings &rarr;
              </a>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  renderCards(masjids);

  searchInput.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase().trim();
    if (!q) {
      renderCards(masjids);
      return;
    }
    const filtered = masjids.filter((m) => {
      return (
        m.name.toLowerCase().includes(q) ||
        (m.address && m.address.toLowerCase().includes(q)) ||
        (m.area && m.area.toLowerCase().includes(q))
      );
    });
    renderCards(filtered);
  });
}
