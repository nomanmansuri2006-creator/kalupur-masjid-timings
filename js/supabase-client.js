// ==============================================================================
// SUPABASE CLIENT WRAPPER & API SERVICES
// Connects to Supabase PostgreSQL, Authentication, RPCs and Row Level Security.
// ==============================================================================

import { getConfig } from './config.js';

let supabase = null;

export function initSupabase() {
  const config = getConfig();
  if (config.isConfigured && window.supabase && window.supabase.createClient) {
    try {
      supabase = window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storage: window.localStorage
        }
      });
      return supabase;
    } catch (err) {
      console.error('Failed to initialize Supabase client:', err);
      return null;
    }
  }
  return null;
}

export function getClient() {
  if (!supabase) {
    initSupabase();
  }
  return supabase;
}

// ------------------------------------------------------------------------------
// AUTHENTICATION API
// ------------------------------------------------------------------------------

export async function authSendOtp(phone) {
  const client = getClient();
  if (!client) throw new Error('Supabase client not initialized.');
  
  // Uses Supabase Phone Auth
  const { data, error } = await client.auth.signInWithOtp({
    phone: phone,
    options: {
      channel: 'sms'
    }
  });

  if (error) throw error;
  return data;
}

export async function authVerifyOtp(phone, token) {
  const client = getClient();
  if (!client) throw new Error('Supabase client not initialized.');

  const { data, error } = await client.auth.verifyOtp({
    phone: phone,
    token: token,
    type: 'sms'
  });

  if (error) throw error;
  return data;
}

export async function authSignInPassword(email, password) {
  const client = getClient();
  if (!client) throw new Error('Supabase client not initialized.');

  const { data, error } = await client.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;
  return data;
}

export async function authSignOut() {
  const client = getClient();
  if (!client) return;
  await client.auth.signOut();
}

export async function authGetSession() {
  const client = getClient();
  if (!client) return null;
  const { data } = await client.auth.getSession();
  return data?.session || null;
}

export async function authGetUser() {
  const client = getClient();
  if (!client) return null;
  const { data } = await client.auth.getUser();
  return data?.user || null;
}

// ------------------------------------------------------------------------------
// DATABASE & PROFILES API
// ------------------------------------------------------------------------------

export async function fetchProfile(userId) {
  const client = getClient();
  if (!client || !userId) return null;

  try {
    const { data, error } = await client
      .from('profiles')
      .select('*, masjids(*)')
      .eq('id', userId)
      .maybeSingle();

    if (data) {
      return data;
    }

    if (error) {
      console.warn('Profile join error, falling back to simple select:', error.message);
      const { data: simpleData } = await client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (simpleData) return simpleData;
    }
  } catch (err) {
    console.error('Fetch profile exception:', err);
  }

  // If no profile row exists yet in public.profiles for this logged in user, auto-initialize it
  try {
    const session = await authGetSession();
    if (session?.user && session.user.id === userId) {
      const email = session.user.email || '';
      const emailPrefix = email ? email.split('@')[0] : 'User';
      const cleanName =
        session.user.user_metadata?.display_name ||
        emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
      const isUserAdmin = email.toLowerCase().includes('admin');
      const role = isUserAdmin ? 'admin' : 'imam';

      // Link to the first active masjid
      const masjids = await fetchAllMasjids().catch(() => []);
      const defaultMasjidId = isUserAdmin ? null : (masjids[0]?.id || null);

      const newRecord = {
        id: userId,
        display_name: cleanName,
        phone: session.user.phone || null,
        role: role,
        assigned_masjid_id: defaultMasjidId,
        active: true
      };

      // Attempt to upsert into public.profiles
      try {
        const { data: created, error: insertError } = await client
          .from('profiles')
          .upsert([newRecord], { onConflict: 'id' })
          .select()
          .maybeSingle();

        if (created && !insertError) {
          return created;
        }
        if (insertError) {
          console.warn('Auto profile database insert note:', insertError.message);
        }
      } catch (upsertErr) {
        console.warn('Profile upsert exception:', upsertErr);
      }

      // If database insert was blocked by RLS or awaiting DB trigger,
      // return a valid session profile so the user is NEVER locked out with "Access Restricted"
      return {
        ...newRecord,
        email: email,
        provisional: true
      };
    }
  } catch (initErr) {
    console.warn('Auto profile provisioning error:', initErr);
  }

  return null;
}

export async function createImamUserAndProfile(displayName, email, password, assignedMasjidId) {
  const config = getConfig();
  if (!window.supabase || !config.isConfigured) {
    throw new Error('Supabase client not initialized.');
  }

  // Create temporary client without persisting session so current administrator remains signed in
  const tempClient = window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });

  const { data: authData, error: authErr } = await tempClient.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName
      }
    }
  });

  if (authErr) {
    throw new Error(`Authentication registration failed: ${authErr.message}`);
  }

  const userId = authData?.user?.id;
  if (!userId) {
    throw new Error('Failed to obtain user identifier from authentication service.');
  }

  // Insert profile record using current administrator client
  const client = getClient();
  const profileRecord = {
    id: userId,
    display_name: displayName,
    role: 'imam',
    assigned_masjid_id: assignedMasjidId || null,
    active: true
  };

  const { data: profileData, error: profErr } = await client
    .from('profiles')
    .upsert([profileRecord], { onConflict: 'id' })
    .select()
    .single();

  if (profErr) {
    console.warn('Profile record creation warning:', profErr.message);
  }

  return profileData || profileRecord;
}

export async function assignUserAsImam(userId, displayName, assignedMasjidId) {
  const client = getClient();
  if (!client) throw new Error('Supabase not connected');

  const record = {
    id: userId,
    display_name: displayName || 'Imam',
    role: 'imam',
    assigned_masjid_id: assignedMasjidId || null,
    active: true
  };

  const { data, error } = await client
    .from('profiles')
    .upsert([record], { onConflict: 'id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function fetchAllMasjids() {
  const client = getClient();
  if (!client) return [];

  const { data, error } = await client
    .from('masjids')
    .select('*, prayer_schedules(*)')
    .order('name');

  if (error) {
    console.error('Error fetching masjids:', error);
    throw error;
  }
  return data || [];
}

export async function fetchMasjidDetails(masjidId) {
  const client = getClient();
  if (!client) return null;

  const { data, error } = await client
    .from('masjids')
    .select('*, prayer_schedules(*)')
    .eq('id', masjidId)
    .single();

  if (error) {
    console.error('Error fetching masjid details:', error);
    throw error;
  }
  return data;
}

export async function submitTimingUpdateRPC(masjidId, proposedTimings, notes) {
  const client = getClient();
  if (!client) throw new Error('Supabase not connected');

  // Call database function submit_timing_update
  const { data, error } = await client.rpc('submit_timing_update', {
    p_masjid_id: masjidId,
    p_proposed_timings: proposedTimings,
    p_notes: notes || null
  });

  if (error) throw error;
  return data;
}

export async function approveTimingUpdateRPC(updateId) {
  const client = getClient();
  if (!client) throw new Error('Supabase not connected');

  const { data, error } = await client.rpc('approve_timing_update', {
    p_update_id: updateId
  });

  if (error) throw error;
  return data;
}

export async function rejectTimingUpdateRPC(updateId, rejectionReason) {
  const client = getClient();
  if (!client) throw new Error('Supabase not connected');

  const { data, error } = await client.rpc('reject_timing_update', {
    p_update_id: updateId,
    p_rejection_reason: rejectionReason
  });

  if (error) throw error;
  return data;
}

export async function fetchTimingUpdates(filters = {}) {
  const client = getClient();
  if (!client) return [];

  let query = client
    .from('timing_updates')
    .select('*, masjids(name), profiles:submitted_by(display_name, phone)')
    .order('submitted_at', { ascending: false });

  if (filters.masjid_id) {
    query = query.eq('masjid_id', filters.masjid_id);
  }
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  if (filters.submitted_by) {
    query = query.eq('submitted_by', filters.submitted_by);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function submitCorrectionReport(masjidId, category, description, contactInfo) {
  const client = getClient();
  if (!client) throw new Error('Supabase not connected');

  const { data, error } = await client
    .from('correction_reports')
    .insert([
      {
        masjid_id: masjidId || null,
        category,
        description,
        contact_info: contactInfo || null,
        status: 'pending'
      }
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function fetchCorrectionReports() {
  const client = getClient();
  if (!client) return [];

  const { data, error } = await client
    .from('correction_reports')
    .select('*, masjids(name)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function updateCorrectionReportStatus(reportId, status, adminNotes = '') {
  const client = getClient();
  if (!client) throw new Error('Supabase not connected');

  const { data, error } = await client
    .from('correction_reports')
    .update({
      status,
      admin_notes: adminNotes,
      reviewed_at: new Date().toISOString()
    })
    .eq('id', reportId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function fetchAuditLogs() {
  const client = getClient();
  if (!client) return [];

  const { data, error } = await client
    .from('audit_logs')
    .select('*, profiles:actor_user_id(display_name, role), masjids(name)')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw error;
  return data || [];
}

export async function fetchAllProfiles() {
  const client = getClient();
  if (!client) return [];

  const { data, error } = await client
    .from('profiles')
    .select('*, masjids(name)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function saveMasjid(masjidData) {
  const client = getClient();
  if (!client) throw new Error('Supabase not connected');

  if (masjidData.id) {
    const { data, error } = await client
      .from('masjids')
      .update(masjidData)
      .eq('id', masjidData.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await client
      .from('masjids')
      .insert([masjidData])
      .select()
      .single();
    if (error) throw error;

    // Automatically initialize prayer schedule rows for the 5 daily prayers
    if (data?.id) {
      const defaultSchedules = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((p) => ({
        masjid_id: data.id,
        prayer_name: p,
        azaan_time: '05:30 AM',
        jamaat_time: '05:55 AM',
        is_verified: false,
        schedule_period: 'standard'
      }));
      await client.from('prayer_schedules').insert(defaultSchedules);
    }

    return data;
  }
}

export async function updateImamAssignment(profileId, assignedMasjidId, active = true) {
  const client = getClient();
  if (!client) throw new Error('Supabase not connected');

  const { data, error } = await client
    .from('profiles')
    .update({
      assigned_masjid_id: assignedMasjidId || null,
      active
    })
    .eq('id', profileId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
