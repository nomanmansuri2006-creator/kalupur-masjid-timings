// ==============================================================================
// KALUPUR MASJID TIMINGS — CONFIGURATION
// Configures Supabase Project URL, Public Anon Key, and application metadata.
// ==============================================================================

const ENV_CONFIG = {
  // Supabase Project details from Supabase Dashboard -> Settings -> API
  SUPABASE_URL: 'https://xmdmuqnjkadcwbkwqdfz.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtZG11cW5qa2FkY3dia3dxZGZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzMjAxNTMsImV4cCI6MjEwNzg5NjE1M30.EyyRVZywxpfgU-rgBxjaT5tg0eCbuLme0dLbMbvq7IM',
  
  // App info
  APP_NAME: 'Kalupur Masjid Timings',
  APP_VERSION: '1.0.0',
  DEFAULT_AREA: 'Kalupur, Ahmedabad'
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

// Check if credentials exist in localStorage (allows runtime override if needed)
export function getConfig() {
  const localUrl = localStorage.getItem('kalupur_supabase_url');
  const localKey = localStorage.getItem('kalupur_supabase_anon_key');

  const rawUrl = (localUrl && localUrl.trim()) || ENV_CONFIG.SUPABASE_URL.trim();
  const rawKey = (localKey && localKey.trim()) || ENV_CONFIG.SUPABASE_ANON_KEY.trim();

  // If stored credentials are placeholders, clean them up
  if (localUrl && isPlaceholderConfig(localUrl, localKey || '')) {
    localStorage.removeItem('kalupur_supabase_url');
    localStorage.removeItem('kalupur_supabase_anon_key');
  }

  const isConfigured = !isPlaceholderConfig(rawUrl, rawKey);

  return {
    ...ENV_CONFIG,
    SUPABASE_URL: isConfigured ? rawUrl : '',
    SUPABASE_ANON_KEY: isConfigured ? rawKey : '',
    isConfigured
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
