// ==============================================================================
// INPUT VALIDATION HELPERS
// ==============================================================================

/**
 * Validates and normalizes Indian mobile phone numbers (+91...)
 */
export function validateAndFormatPhone(phone) {
  if (!phone) return { isValid: false, formatted: '', error: 'Phone number is required.' };

  // Remove spaces, hyphens, and non-digit characters except leading +
  let cleaned = phone.trim().replace(/[\s\-()]/g, '');

  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }

  // If 10 digits provided, prefix with +91
  if (/^\d{10}$/.test(cleaned)) {
    return { isValid: true, formatted: `+91${cleaned}`, error: null };
  }

  // If already starts with +91 and followed by 10 digits
  if (/^\+91\d{10}$/.test(cleaned)) {
    return { isValid: true, formatted: cleaned, error: null };
  }

  // If starts with 91 and followed by 10 digits
  if (/^91\d{10}$/.test(cleaned)) {
    return { isValid: true, formatted: `+${cleaned}`, error: null };
  }

  return {
    isValid: false,
    formatted: cleaned,
    error: 'Please enter a valid 10-digit mobile number (e.g., +91 98765 43210).'
  };
}

/**
 * Validates prayer time inputs for Fajr, Dhuhr, Asr, Maghrib, Isha
 */
export function validatePrayerTimes(timings) {
  const errors = [];
  const requiredPrayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

  for (const p of requiredPrayers) {
    const prayer = timings[p];
    if (!prayer) {
      errors.push(`${p} timing is missing.`);
      continue;
    }
    if (!prayer.azaan || !prayer.azaan.trim()) {
      errors.push(`${p} Azaan time is required.`);
    }
    if (!prayer.jamaat || !prayer.jamaat.trim()) {
      errors.push(`${p} Jamaat time is required.`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
