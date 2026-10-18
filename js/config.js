// ==============================================================================
// KALUPUR MASJID TIMINGS — CONFIGURATION
// Instructions:
// 1. Enter your Supabase Project URL and Public Anon Key below, OR
// 2. Configure them directly inside the website using the "Connect Supabase" banner.
// If left blank or if dummy placeholder values are detected, the website
// automatically runs in "Interactive Trial Demo Mode" with pre-loaded trial data
// so you can test adding masjids, submitting timings, and approving immediately!
// ==============================================================================

const ENV_CONFIG = {
  // Replace with your real project details from Supabase Dashboard -> Settings -> API
  SUPABASE_URL: '',
  SUPABASE_ANON_KEY: '',
  
  // App info
  APP_NAME: 'Kalupur Masjid Timings',
  APP_VERSION: '1.0.0-trial',
  DEFAULT_AREA: 'Kalupur, Ahmedabad',
  
  // Demonstration default accounts (used for instant testing in trial demo mode)
  DEMO_ACCOUNTS: {
    ADMIN_PHONE: '+919876543210',
    ADMIN_OTP: '123456',
    IMAM_PHONE: '+919876543211',
    IMAM_OTP: '123456'
  }
};

/**
 * Checks if a URL or key is an unconfigured example placeholder
 */
export function isPlaceholderConfig(url, anonKey) {
  if (!url || !anonKey) return true;
  const u = url.toLowerCase().trim();
  const k = anonKey.trim();

  return (
    u.includes('your-project-id') ||
    u.includes('your-project') ||
    u.includes('example.com') ||
    u.includes('placeholder') ||
    !u.startsWith('http') ||
    k.includes('...') ||
    k.length < 25
  );
}

// Check if credentials exist in localStorage (allows runtime configuration from UI)
export function getConfig() {
  const localUrl = localStorage.getItem('kalupur_supabase_url');
  const localKey = localStorage.getItem('kalupur_supabase_anon_key');

  const rawUrl = (localUrl && localUrl.trim()) || ENV_CONFIG.SUPABASE_URL.trim();
  const rawKey = (localKey && localKey.trim()) || ENV_CONFIG.SUPABASE_ANON_KEY.trim();

  // If stored credentials are placeholders (e.g. "your-project-id.supabase.co"), clean them up
  if (localUrl && isPlaceholderConfig(localUrl, localKey || '')) {
    localStorage.removeItem('kalupur_supabase_url');
    localStorage.removeItem('kalupur_supabase_anon_key');
    console.warn('Cleared placeholder Supabase credentials. Reverting to Trial Demo Mode.');
  }

  const isConfigured = !isPlaceholderConfig(rawUrl, rawKey);

  return {
    ...ENV_CONFIG,
    SUPABASE_URL: isConfigured ? rawUrl : '',
    SUPABASE_ANON_KEY: isConfigured ? rawKey : '',
    isConfigured,
    isDemoMode: !isConfigured
  };
}

export function saveConfig(url, anonKey) {
  if (url && anonKey && !isPlaceholderConfig(url, anonKey)) {
    localStorage.setItem('kalupur_supabase_url', url.trim());
    localStorage.setItem('kalupur_supabase_anon_key', anonKey.trim());
  } else {
    localStorage.removeItem('kalupur_supabase_url');
    localStorage.removeItem('kalupur_supabase_anon_key');
  }
}
