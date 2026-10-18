// ==============================================================================
// TIME AND DATE FORMATTING HELPERS
// ==============================================================================

/**
 * Formats a 24-hour time string ("17:30" or "05:30") to 12-hour format ("05:30 PM")
 */
export function formatTo12Hour(timeStr) {
  if (!timeStr) return '--:--';
  const clean = timeStr.trim();
  
  // If already in 12-hour format (contains AM/PM)
  if (clean.toUpperCase().includes('AM') || clean.toUpperCase().includes('PM')) {
    return clean;
  }

  const parts = clean.split(':');
  if (parts.length < 2) return clean;

  let hours = parseInt(parts[0], 10);
  const minutes = parts[1].padStart(2, '0');
  
  if (isNaN(hours)) return clean;

  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 hour should be 12
  const formattedHour = hours < 10 ? `0${hours}` : `${hours}`;

  return `${formattedHour}:${minutes} ${ampm}`;
}

/**
 * Converts a 12-hour or arbitrary time string to 24-hour format ("HH:mm") for HTML5 <input type="time">
 */
export function formatTo24Hour(timeStr) {
  if (!timeStr) return '';
  const clean = timeStr.trim().toUpperCase();

  const isPM = clean.includes('PM');
  const isAM = clean.includes('AM');

  const timePart = clean.replace(/[^\d:]/g, '');
  const parts = timePart.split(':');
  if (parts.length < 2) return '';

  let hours = parseInt(parts[0], 10);
  const minutes = parts[1].padStart(2, '0').slice(0, 2);

  if (isNaN(hours)) return '';

  if (isPM && hours < 12) {
    hours += 12;
  } else if (isAM && hours === 12) {
    hours = 0;
  }

  return `${hours.toString().padStart(2, '0')}:${minutes}`;
}

/**
 * Formats an ISO timestamp to human friendly localized string (e.g., "18 Oct 2026, 04:30 PM")
 */
export function formatDate(isoString) {
  if (!isoString) return 'Not available';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return 'Not available';
    
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(d);
  } catch (e) {
    return isoString;
  }
}

/**
 * Calculates which prayer is next or current based on prayer schedules and current time
 */
export function getActivePrayer(schedules) {
  if (!schedules || schedules.length === 0) return null;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const prayerOrder = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
  
  // Sort schedules by standard prayer order
  const sorted = [...schedules].sort((a, b) => {
    return prayerOrder.indexOf(a.prayer_name) - prayerOrder.indexOf(b.prayer_name);
  });

  for (const s of sorted) {
    const time24 = formatTo24Hour(s.jamaat_time || s.azaan_time);
    if (time24) {
      const [h, m] = time24.split(':').map(Number);
      const prayerMinutes = h * 60 + m;
      if (prayerMinutes > currentMinutes) {
        return s.prayer_name;
      }
    }
  }

  // If passed Isha, next prayer is Fajr tomorrow
  return 'Fajr';
}
