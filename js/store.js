// ==============================================================================
// KALUPUR MASJID TIMINGS — UNIFIED APPLICATION STORE
// Supports both Real Supabase Backend and Interactive Local Demo Mode.
// ==============================================================================

import { getConfig } from './config.js';
import * as SupabaseApi from './supabase-client.js';

// Default Demo Seeds (strictly labelled as demonstration data)
const DEMO_SEED = {
  masjids: [
    {
      id: 'a0000000-0000-0000-0000-000000000001',
      name: 'Masjid-e-Quba (Trial / Demonstration Record)',
      address: 'Near Kalupur Railway Station Circle, Kalupur, Ahmedabad - 380002',
      area: 'Kalupur',
      maps_url: 'https://maps.google.com/?q=Kalupur+Railway+Station+Ahmedabad',
      contact_information: 'Demonstration Office: +91 98765 00000',
      active: true,
      created_at: new Date('2026-10-01T08:00:00Z').toISOString(),
      updated_at: new Date('2026-10-01T08:00:00Z').toISOString(),
      prayer_schedules: [
        { id: 'ps-1', masjid_id: 'a0000000-0000-0000-0000-000000000001', prayer_name: 'Fajr', azaan_time: '05:30 AM', jamaat_time: '05:55 AM', is_verified: false, last_confirmed_at: new Date().toISOString() },
        { id: 'ps-2', masjid_id: 'a0000000-0000-0000-0000-000000000001', prayer_name: 'Dhuhr', azaan_time: '12:45 PM', jamaat_time: '01:15 PM', is_verified: false, last_confirmed_at: new Date().toISOString() },
        { id: 'ps-3', masjid_id: 'a0000000-0000-0000-0000-000000000001', prayer_name: 'Asr', azaan_time: '05:00 PM', jamaat_time: '05:25 PM', is_verified: false, last_confirmed_at: new Date().toISOString() },
        { id: 'ps-4', masjid_id: 'a0000000-0000-0000-0000-000000000001', prayer_name: 'Maghrib', azaan_time: '06:40 PM', jamaat_time: '06:45 PM', is_verified: false, last_confirmed_at: new Date().toISOString() },
        { id: 'ps-5', masjid_id: 'a0000000-0000-0000-0000-000000000001', prayer_name: 'Isha', azaan_time: '08:00 PM', jamaat_time: '08:30 PM', is_verified: false, last_confirmed_at: new Date().toISOString() }
      ]
    }
  ],
  profiles: [
    {
      id: 'demo-admin-id',
      display_name: 'Kalupur Community Administrator',
      phone: '+919876543210',
      role: 'admin',
      assigned_masjid_id: null,
      active: true,
      created_at: new Date('2026-10-01T08:00:00Z').toISOString()
    },
    {
      id: 'demo-imam-id',
      display_name: 'Imam Maulana Abdullah (Trial)',
      phone: '+919876543211',
      role: 'imam',
      assigned_masjid_id: 'a0000000-0000-0000-0000-000000000001',
      active: true,
      created_at: new Date('2026-10-01T08:00:00Z').toISOString()
    }
  ],
  timing_updates: [
    {
      id: 'demo-update-1',
      masjid_id: 'a0000000-0000-0000-0000-000000000001',
      submitted_by: 'demo-imam-id',
      submitted_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      status: 'pending',
      notes: 'Slight delay in Asr and Isha jamaat times for winter adjustment.',
      proposed_timings: {
        Fajr: { azaan: '05:35 AM', jamaat: '06:00 AM' },
        Dhuhr: { azaan: '12:45 PM', jamaat: '01:15 PM' },
        Asr: { azaan: '05:05 PM', jamaat: '05:30 PM' },
        Maghrib: { azaan: '06:38 PM', jamaat: '06:43 PM' },
        Isha: { azaan: '08:05 PM', jamaat: '08:35 PM' }
      }
    }
  ],
  correction_reports: [
    {
      id: 'demo-report-1',
      masjid_id: 'a0000000-0000-0000-0000-000000000001',
      category: 'timing_incorrect',
      description: 'Maghrib azaan time was shifted by 2 minutes recently.',
      contact_info: 'Brother Farhan (+91 98250 11111)',
      status: 'pending',
      created_at: new Date(Date.now() - 86400000).toISOString()
    }
  ],
  audit_logs: [
    {
      id: 'demo-audit-1',
      actor_user_id: 'demo-admin-id',
      masjid_id: 'a0000000-0000-0000-0000-000000000001',
      action: 'INIT_TRIAL_MASJID',
      details: { name: 'Masjid-e-Quba (Trial / Demonstration Record)' },
      created_at: new Date('2026-10-01T08:00:00Z').toISOString()
    },
    {
      id: 'demo-audit-2',
      actor_user_id: 'demo-imam-id',
      masjid_id: 'a0000000-0000-0000-0000-000000000001',
      action: 'SUBMIT_TIMING_UPDATE',
      affected_record_id: 'demo-update-1',
      details: { notes: 'Slight delay in Asr and Isha jamaat times for winter adjustment.' },
      created_at: new Date(Date.now() - 3600000 * 2).toISOString()
    }
  ]
};

// Internal demo storage helpers
function getDemoStorage() {
  const data = localStorage.getItem('kalupur_demo_db');
  if (!data) {
    localStorage.setItem('kalupur_demo_db', JSON.stringify(DEMO_SEED));
    return JSON.parse(JSON.stringify(DEMO_SEED));
  }
  return JSON.parse(data);
}

function saveDemoStorage(data) {
  localStorage.setItem('kalupur_demo_db', JSON.stringify(data));
}

// Global active session state
let currentUser = null;
let currentProfile = null;

// ==============================================================================
// PUBLIC STORE API
// ==============================================================================

export const store = {
  // Authentication & Session
  async initSession() {
    const config = getConfig();
    if (config.isConfigured) {
      SupabaseApi.initSupabase();
      const session = await SupabaseApi.authGetSession();
      if (session?.user) {
        currentUser = session.user;
        currentProfile = await SupabaseApi.fetchProfile(session.user.id);
      } else {
        currentUser = null;
        currentProfile = null;
      }
    } else {
      // In demo mode, restore demo session from localStorage
      const demoAuth = localStorage.getItem('kalupur_demo_session');
      if (demoAuth) {
        const parsed = JSON.parse(demoAuth);
        currentUser = { id: parsed.id, phone: parsed.phone, email: parsed.email };
        currentProfile = parsed;
      }
    }
    return { user: currentUser, profile: currentProfile };
  },

  getCurrentUser() {
    return currentUser;
  },

  getCurrentProfile() {
    return currentProfile;
  },

  async loginWithPhoneOtp(phone, otp) {
    const config = getConfig();
    if (config.isConfigured) {
      const data = await SupabaseApi.authVerifyOtp(phone, otp);
      currentUser = data.user;
      currentProfile = await SupabaseApi.fetchProfile(data.user.id);
      return { user: currentUser, profile: currentProfile };
    } else {
      // Demo authentication simulation
      const db = getDemoStorage();
      const profile = db.profiles.find((p) => p.phone === phone && p.active);
      if (!profile) {
        throw new Error('No active account found for this mobile number. Please contact the administrator.');
      }
      if (otp !== '123456') {
        throw new Error('Invalid OTP. For demonstration, use code 123456.');
      }
      currentUser = { id: profile.id, phone: profile.phone };
      currentProfile = profile;
      localStorage.setItem('kalupur_demo_session', JSON.stringify(profile));
      return { user: currentUser, profile };
    }
  },

  async loginWithEmailPassword(email, password) {
    const config = getConfig();
    if (config.isConfigured) {
      const data = await SupabaseApi.authSignInPassword(email, password);
      currentUser = data.user;
      currentProfile = await SupabaseApi.fetchProfile(data.user.id);
      return { user: currentUser, profile: currentProfile };
    } else {
      // Demo admin password login
      if (email === 'admin@kalupurmasjid.org' && password === 'admin123') {
        const db = getDemoStorage();
        const profile = db.profiles.find((p) => p.role === 'admin');
        currentUser = { id: profile.id, email };
        currentProfile = profile;
        localStorage.setItem('kalupur_demo_session', JSON.stringify(profile));
        return { user: currentUser, profile };
      }
      throw new Error('Invalid demo credentials. Use admin@kalupurmasjid.org / admin123');
    }
  },

  async loginDemoQuick(role) {
    const db = getDemoStorage();
    const profile = db.profiles.find((p) => p.role === role);
    if (!profile) throw new Error(`Demo ${role} not found.`);
    currentUser = { id: profile.id, phone: profile.phone };
    currentProfile = profile;
    localStorage.setItem('kalupur_demo_session', JSON.stringify(profile));
    return { user: currentUser, profile };
  },

  async logout() {
    const config = getConfig();
    if (config.isConfigured) {
      await SupabaseApi.authSignOut();
    }
    currentUser = null;
    currentProfile = null;
    localStorage.removeItem('kalupur_demo_session');
  },

  // Masjids
  async getMasjids() {
    const config = getConfig();
    if (config.isConfigured) {
      return await SupabaseApi.fetchAllMasjids();
    }
    const db = getDemoStorage();
    return db.masjids.filter((m) => m.active);
  },

  async getAllMasjidsAdmin() {
    const config = getConfig();
    if (config.isConfigured) {
      return await SupabaseApi.fetchAllMasjids();
    }
    const db = getDemoStorage();
    return db.masjids;
  },

  async getMasjidById(id) {
    const config = getConfig();
    if (config.isConfigured) {
      return await SupabaseApi.fetchMasjidDetails(id);
    }
    const db = getDemoStorage();
    return db.masjids.find((m) => m.id === id) || null;
  },

  async saveMasjid(masjidData) {
    const config = getConfig();
    if (config.isConfigured) {
      return await SupabaseApi.saveMasjid(masjidData);
    }
    const db = getDemoStorage();
    if (masjidData.id) {
      const idx = db.masjids.findIndex((m) => m.id === masjidData.id);
      if (idx !== -1) {
        db.masjids[idx] = { ...db.masjids[idx], ...masjidData, updated_at: new Date().toISOString() };
      }
    } else {
      const newMasjid = {
        id: 'masjid-' + Date.now(),
        ...masjidData,
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        prayer_schedules: [
          { id: 'ps-new-1', prayer_name: 'Fajr', azaan_time: '05:30 AM', jamaat_time: '05:55 AM', is_verified: false, last_confirmed_at: new Date().toISOString() },
          { id: 'ps-new-2', prayer_name: 'Dhuhr', azaan_time: '12:45 PM', jamaat_time: '01:15 PM', is_verified: false, last_confirmed_at: new Date().toISOString() },
          { id: 'ps-new-3', prayer_name: 'Asr', azaan_time: '05:00 PM', jamaat_time: '05:25 PM', is_verified: false, last_confirmed_at: new Date().toISOString() },
          { id: 'ps-new-4', prayer_name: 'Maghrib', azaan_time: '06:40 PM', jamaat_time: '06:45 PM', is_verified: false, last_confirmed_at: new Date().toISOString() },
          { id: 'ps-new-5', prayer_name: 'Isha', azaan_time: '08:00 PM', jamaat_time: '08:30 PM', is_verified: false, last_confirmed_at: new Date().toISOString() }
        ]
      };
      db.masjids.push(newMasjid);
    }
    saveDemoStorage(db);
  },

  // Timing Updates & Workflow
  async submitTimingUpdate(masjidId, proposedTimings, notes) {
    const config = getConfig();
    if (config.isConfigured) {
      return await SupabaseApi.submitTimingUpdateRPC(masjidId, proposedTimings, notes);
    }
    const db = getDemoStorage();
    const newUpdate = {
      id: 'update-' + Date.now(),
      masjid_id: masjidId,
      submitted_by: currentUser.id,
      submitted_at: new Date().toISOString(),
      status: 'pending',
      notes: notes || '',
      proposed_timings: proposedTimings
    };
    db.timing_updates.unshift(newUpdate);

    db.audit_logs.unshift({
      id: 'audit-' + Date.now(),
      actor_user_id: currentUser.id,
      masjid_id: masjidId,
      action: 'SUBMIT_TIMING_UPDATE',
      affected_record_id: newUpdate.id,
      details: { notes, proposed_timings: proposedTimings },
      created_at: new Date().toISOString()
    });

    saveDemoStorage(db);
    return { success: true, message: 'Proposal submitted for approval.' };
  },

  async getPendingTimingUpdates() {
    const config = getConfig();
    if (config.isConfigured) {
      return await SupabaseApi.fetchTimingUpdates({ status: 'pending' });
    }
    const db = getDemoStorage();
    return db.timing_updates
      .filter((u) => u.status === 'pending')
      .map((u) => {
        const m = db.masjids.find((m) => m.id === u.masjid_id);
        const p = db.profiles.find((p) => p.id === u.submitted_by);
        return {
          ...u,
          masjids: m ? { name: m.name } : { name: 'Unknown Masjid' },
          profiles: p ? { display_name: p.display_name, phone: p.phone } : { display_name: 'Imam', phone: '' }
        };
      });
  },

  async getImamTimingUpdates(masjidId) {
    const config = getConfig();
    if (config.isConfigured) {
      return await SupabaseApi.fetchTimingUpdates({ masjid_id: masjidId });
    }
    const db = getDemoStorage();
    return db.timing_updates
      .filter((u) => u.masjid_id === masjidId)
      .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));
  },

  async approveTimingUpdate(updateId) {
    const config = getConfig();
    if (config.isConfigured) {
      return await SupabaseApi.approveTimingUpdateRPC(updateId);
    }
    const db = getDemoStorage();
    const update = db.timing_updates.find((u) => u.id === updateId);
    if (!update) throw new Error('Update record not found');
    if (update.status !== 'pending') throw new Error('Update is already ' + update.status);

    const masjid = db.masjids.find((m) => m.id === update.masjid_id);
    if (!masjid) throw new Error('Masjid not found');

    // Update schedules
    const nowIso = new Date().toISOString();
    for (const prayer of ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']) {
      if (update.proposed_timings[prayer]) {
        let schedule = masjid.prayer_schedules.find((s) => s.prayer_name === prayer);
        if (schedule) {
          schedule.azaan_time = update.proposed_timings[prayer].azaan;
          schedule.jamaat_time = update.proposed_timings[prayer].jamaat;
          schedule.is_verified = true;
          schedule.last_confirmed_at = nowIso;
        } else {
          masjid.prayer_schedules.push({
            id: 'ps-' + Date.now() + '-' + prayer,
            masjid_id: masjid.id,
            prayer_name: prayer,
            azaan_time: update.proposed_timings[prayer].azaan,
            jamaat_time: update.proposed_timings[prayer].jamaat,
            is_verified: true,
            last_confirmed_at: nowIso
          });
        }
      }
    }

    update.status = 'approved';
    update.reviewed_by = currentUser?.id || 'admin';
    update.reviewed_at = nowIso;

    db.audit_logs.unshift({
      id: 'audit-' + Date.now(),
      actor_user_id: currentUser?.id || 'admin',
      masjid_id: masjid.id,
      action: 'APPROVE_TIMING_UPDATE',
      affected_record_id: updateId,
      details: { new_timings: update.proposed_timings },
      created_at: nowIso
    });

    saveDemoStorage(db);
    return { success: true };
  },

  async rejectTimingUpdate(updateId, reason) {
    const config = getConfig();
    if (config.isConfigured) {
      return await SupabaseApi.rejectTimingUpdateRPC(updateId, reason);
    }
    const db = getDemoStorage();
    const update = db.timing_updates.find((u) => u.id === updateId);
    if (!update) throw new Error('Update record not found');

    const nowIso = new Date().toISOString();
    update.status = 'rejected';
    update.rejection_reason = reason;
    update.reviewed_by = currentUser?.id || 'admin';
    update.reviewed_at = nowIso;

    db.audit_logs.unshift({
      id: 'audit-' + Date.now(),
      actor_user_id: currentUser?.id || 'admin',
      masjid_id: update.masjid_id,
      action: 'REJECT_TIMING_UPDATE',
      affected_record_id: updateId,
      details: { reason },
      created_at: nowIso
    });

    saveDemoStorage(db);
    return { success: true };
  },

  // Correction Reports
  async submitCorrectionReport(masjidId, category, description, contactInfo) {
    const config = getConfig();
    if (config.isConfigured) {
      return await SupabaseApi.submitCorrectionReport(masjidId, category, description, contactInfo);
    }
    const db = getDemoStorage();
    const newReport = {
      id: 'report-' + Date.now(),
      masjid_id: masjidId,
      category,
      description,
      contact_info: contactInfo,
      status: 'pending',
      created_at: new Date().toISOString()
    };
    db.correction_reports.unshift(newReport);
    saveDemoStorage(db);
    return { success: true };
  },

  async getCorrectionReports() {
    const config = getConfig();
    if (config.isConfigured) {
      return await SupabaseApi.fetchCorrectionReports();
    }
    const db = getDemoStorage();
    return db.correction_reports.map((r) => {
      const m = db.masjids.find((m) => m.id === r.masjid_id);
      return {
        ...r,
        masjids: m ? { name: m.name } : { name: 'General / Unspecified' }
      };
    });
  },

  async updateCorrectionReportStatus(reportId, status, notes = '') {
    const config = getConfig();
    if (config.isConfigured) {
      return await SupabaseApi.updateCorrectionReportStatus(reportId, status, notes);
    }
    const db = getDemoStorage();
    const r = db.correction_reports.find((r) => r.id === reportId);
    if (r) {
      r.status = status;
      r.admin_notes = notes;
      r.reviewed_at = new Date().toISOString();
      saveDemoStorage(db);
    }
    return { success: true };
  },

  // Imam Accounts & Profiles
  async getProfiles() {
    const config = getConfig();
    if (config.isConfigured) {
      return await SupabaseApi.fetchAllProfiles();
    }
    const db = getDemoStorage();
    return db.profiles.map((p) => {
      const m = db.masjids.find((m) => m.id === p.assigned_masjid_id);
      return {
        ...p,
        masjids: m ? { name: m.name } : null
      };
    });
  },

  async updateImamAssignment(profileId, masjidId, active = true) {
    const config = getConfig();
    if (config.isConfigured) {
      return await SupabaseApi.updateImamAssignment(profileId, masjidId, active);
    }
    const db = getDemoStorage();
    const profile = db.profiles.find((p) => p.id === profileId);
    if (profile) {
      profile.assigned_masjid_id = masjidId || null;
      profile.active = active;
      db.audit_logs.unshift({
        id: 'audit-' + Date.now(),
        actor_user_id: currentUser?.id || 'admin',
        masjid_id: masjidId || null,
        action: 'UPDATE_IMAM_ASSIGNMENT',
        affected_record_id: profileId,
        details: { assigned_masjid_id: masjidId, active },
        created_at: new Date().toISOString()
      });
      saveDemoStorage(db);
    }
    return { success: true };
  },

  async createImamAccount(displayName, phone, assignedMasjidId) {
    const config = getConfig();
    if (config.isConfigured) {
      // Direct instructions in UI since phone accounts in Supabase are generated via Auth
      throw new Error('In Supabase mode, please invite or add the user in Auth -> Users and insert into public.profiles.');
    }
    const db = getDemoStorage();
    const newProfile = {
      id: 'imam-' + Date.now(),
      display_name: displayName,
      phone,
      role: 'imam',
      assigned_masjid_id: assignedMasjidId,
      active: true,
      created_at: new Date().toISOString()
    };
    db.profiles.push(newProfile);
    saveDemoStorage(db);
    return newProfile;
  },

  // Audit Logs
  async getAuditLogs() {
    const config = getConfig();
    if (config.isConfigured) {
      return await SupabaseApi.fetchAuditLogs();
    }
    const db = getDemoStorage();
    return db.audit_logs.map((log) => {
      const p = db.profiles.find((p) => p.id === log.actor_user_id);
      const m = db.masjids.find((m) => m.id === log.masjid_id);
      return {
        ...log,
        profiles: p ? { display_name: p.display_name, role: p.role } : { display_name: 'System', role: 'admin' },
        masjids: m ? { name: m.name } : null
      };
    });
  },

  resetDemoData() {
    localStorage.removeItem('kalupur_demo_db');
    localStorage.removeItem('kalupur_demo_session');
    currentUser = null;
    currentProfile = null;
    return getDemoStorage();
  }
};
