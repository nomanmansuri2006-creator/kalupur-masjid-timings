// ==============================================================================
// KALUPUR MASJID TIMINGS — CONFIGURATION
// Instructions:
// 1. Enter your Supabase Project URL and Public Anon Key below, OR
// 2. Configure them directly inside the website using the "Configure Supabase" banner.
// If left blank, the website automatically runs in "Interactive Trial Demo Mode"
// with pre-loaded trial data so you can test all workflows immediately!
// ==============================================================================

const ENV_CONFIG = {
  // Replace with your project details from Supabase Dashboard -> Settings -> API
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

// Check if credentials exist in localStorage (allows runtime configuration from UI)
export function getConfig() {
  const localUrl = localStorage.getItem('kalupur_supabase_url');
  const localKey = localStorage.getItem('kalupur_supabase_anon_key');

  const url = (localUrl && localUrl.trim()) || ENV_CONFIG.SUPABASE_URL.trim();
  const anonKey = (localKey && localKey.trim()) || ENV_CONFIG.SUPABASE_ANON_KEY.trim();

  const isConfigured = Boolean(url && anonKey && url.startsWith('http'));

  return {
    ...ENV_CONFIG,
    SUPABASE_URL: url,
    SUPABASE_ANON_KEY: anonKey,
    isConfigured,
    isDemoMode: !isConfigured
  };
}

export function saveConfig(url, anonKey) {
  if (url && anonKey) {
    localStorage.setItem('kalupur_supabase_url', url.trim());
    localStorage.setItem('kalupur_supabase_anon_key', anonKey.trim());
  } else {
    localStorage.removeItem('kalupur_supabase_url');
    localStorage.removeItem('kalupur_supabase_anon_key');
  }
}
