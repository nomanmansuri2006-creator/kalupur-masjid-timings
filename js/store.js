// ==============================================================================
// KALUPUR MASJID TIMINGS — APPLICATION STORE
// Direct integration with Supabase PostgreSQL, Authentication, and RPCs.
// ==============================================================================

import { getConfig } from './config.js';
import * as SupabaseApi from './supabase-client.js';

// Global active session state
let currentUser = null;
let currentProfile = null;

export const store = {
  // ----------------------------------------------------------------------------
  // Authentication & Session
  // ----------------------------------------------------------------------------
  async initSession() {
    const config = getConfig();
    if (!config.isConfigured) {
      console.warn('Supabase is not configured. Please check js/config.js.');
      currentUser = null;
      currentProfile = null;
      return { user: null, profile: null };
    }

    SupabaseApi.initSupabase();
    try {
      const session = await SupabaseApi.authGetSession();
      if (session?.user) {
        currentUser = session.user;
        currentProfile = await SupabaseApi.fetchProfile(session.user.id);
      } else {
        currentUser = null;
        currentProfile = null;
      }
    } catch (err) {
      console.error('Session retrieval error:', err);
      currentUser = null;
      currentProfile = null;
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
    const data = await SupabaseApi.authVerifyOtp(phone, otp);
    currentUser = data.user;
    currentProfile = await SupabaseApi.fetchProfile(data.user.id);
    return { user: currentUser, profile: currentProfile };
  },

  async loginWithEmailPassword(email, password) {
    const data = await SupabaseApi.authSignInPassword(email, password);
    currentUser = data.user;
    currentProfile = await SupabaseApi.fetchProfile(data.user.id);
    return { user: currentUser, profile: currentProfile };
  },

  async logout() {
    try {
      await SupabaseApi.authSignOut();
    } catch (err) {
      console.warn('Sign out warning:', err);
    }
    currentUser = null;
    currentProfile = null;
    localStorage.removeItem('kalupur_demo_session');
  },

  // ----------------------------------------------------------------------------
  // Masjids Management
  // ----------------------------------------------------------------------------
  async getMasjids() {
    const masjids = await SupabaseApi.fetchAllMasjids();
    return masjids.filter((m) => m.active !== false);
  },

  async getAllMasjidsAdmin() {
    return await SupabaseApi.fetchAllMasjids();
  },

  async getMasjidById(id) {
    return await SupabaseApi.fetchMasjidDetails(id);
  },

  async saveMasjid(masjidData) {
    return await SupabaseApi.saveMasjid(masjidData);
  },

  // ----------------------------------------------------------------------------
  // Timing Updates & Workflow
  // ----------------------------------------------------------------------------
  async submitTimingUpdate(masjidId, proposedTimings, notes) {
    return await SupabaseApi.submitTimingUpdateRPC(masjidId, proposedTimings, notes);
  },

  async getPendingTimingUpdates() {
    return await SupabaseApi.fetchTimingUpdates({ status: 'pending' });
  },

  async getImamTimingUpdates(masjidId) {
    return await SupabaseApi.fetchTimingUpdates({ masjid_id: masjidId });
  },

  async approveTimingUpdate(updateId) {
    return await SupabaseApi.approveTimingUpdateRPC(updateId);
  },

  async rejectTimingUpdate(updateId, reason) {
    return await SupabaseApi.rejectTimingUpdateRPC(updateId, reason);
  },

  // ----------------------------------------------------------------------------
  // Correction Reports
  // ----------------------------------------------------------------------------
  async submitCorrectionReport(masjidId, category, description, contactInfo) {
    return await SupabaseApi.submitCorrectionReport(masjidId, category, description, contactInfo);
  },

  async getCorrectionReports() {
    return await SupabaseApi.fetchCorrectionReports();
  },

  async updateCorrectionReportStatus(reportId, status, notes = '') {
    return await SupabaseApi.updateCorrectionReportStatus(reportId, status, notes);
  },

  // ----------------------------------------------------------------------------
  // Imam Accounts & Profiles
  // ----------------------------------------------------------------------------
  async getProfiles() {
    return await SupabaseApi.fetchAllProfiles();
  },

  async updateImamAssignment(profileId, masjidId, active = true) {
    return await SupabaseApi.updateImamAssignment(profileId, masjidId, active);
  },

  async createImamAccount(displayName, email, password, assignedMasjidId) {
    return await SupabaseApi.createImamUserAndProfile(displayName, email, password, assignedMasjidId);
  },

  async assignUserAsImam(userId, displayName, assignedMasjidId) {
    return await SupabaseApi.assignUserAsImam(userId, displayName, assignedMasjidId);
  },

  // ----------------------------------------------------------------------------
  // Audit Logs
  // ----------------------------------------------------------------------------
  async getAuditLogs() {
    return await SupabaseApi.fetchAuditLogs();
  }
};
