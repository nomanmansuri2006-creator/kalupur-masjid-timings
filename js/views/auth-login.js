// ==============================================================================
// AUTHENTICATION VIEW — Imam & Administrator Access
// Supports Mobile OTP authentication, Admin Email/Password, Supabase Test Numbers,
// and 1-Click Trial Demo Login.
// ==============================================================================

import { store } from '../store.js';
import { getConfig } from '../config.js';
import { validateAndFormatPhone } from '../utils/validator.js';
import { showToast } from '../utils/toast.js';

export function renderLogin(container) {
  const config = getConfig();

  container.innerHTML = `
    <div style="max-width: 480px; margin: 1rem auto;">
      <div style="text-align: center; margin-bottom: 1.5rem;">
        <img src="./assets/logo.svg" alt="Kalupur Masjid Timings Logo" style="width: 54px; height: 54px; margin-bottom: 0.5rem;" />
        <h2 style="font-size: 1.5rem; font-weight: 800; color: var(--primary-dark);">
          Masjid Portal Sign In
        </h2>
        <p style="font-size: 0.88rem; color: var(--text-muted); margin-top: 0.25rem;">
          For authorized Imams and Administrators of Kalupur masjids.
        </p>
      </div>

      <!-- Auth Method Tabs -->
      <div style="display: flex; background: var(--bg-surface); padding: 0.25rem; border-radius: var(--radius-md); margin-bottom: 1.25rem; border: 1px solid var(--border);">
        <button id="tab-phone-btn" class="btn" style="flex: 1; min-height: 40px; padding: 0.4rem; font-size: 0.88rem; background: var(--primary); color: #ffffff;">
          Phone OTP (Imam / Admin)
        </button>
        <button id="tab-email-btn" class="btn" style="flex: 1; min-height: 40px; padding: 0.4rem; font-size: 0.88rem; background: transparent; color: var(--text-main);">
          Admin Email Login
        </button>
      </div>

      <!-- Phone OTP Form Section -->
      <div id="phone-auth-section" class="card">
        <!-- Step 1: Enter Phone Number -->
        <div id="phone-step-1">
          <div class="form-group">
            <label class="form-label" for="login-phone">
              Registered Mobile Number <span class="req">*</span>
            </label>
            <div style="position: relative;">
              <input
                type="tel"
                id="login-phone"
                class="form-input"
                placeholder="+91 98765 43211"
                autocomplete="tel"
                value="${config.isDemoMode ? '+919876543211' : ''}"
                required
              />
            </div>
            <div class="form-hint">
              Enter your 10-digit mobile number registered by the administrator.
            </div>
          </div>

          <button id="send-otp-btn" class="btn btn-primary btn-block btn-lg">
            Send One-Time Password (OTP) &rarr;
          </button>
        </div>

        <!-- Step 2: Enter OTP (Hidden initially) -->
        <div id="phone-step-2" style="display: none;">
          <div style="margin-bottom: 1rem; padding: 0.75rem; background: var(--bg-surface); border-radius: var(--radius-sm); font-size: 0.85rem;">
            Sending OTP to: <strong id="display-target-phone"></strong>
            <button id="change-phone-btn" style="background: none; border: none; color: var(--primary); font-weight: 600; cursor: pointer; text-decoration: underline; margin-left: 0.5rem;">
              Change
            </button>
          </div>

          <div class="form-group">
            <label class="form-label" for="login-otp">
              Enter 6-Digit OTP <span class="req">*</span>
            </label>
            <input
              type="text"
              id="login-otp"
              class="form-input"
              placeholder="123456"
              maxlength="6"
              inputmode="numeric"
              pattern="[0-9]*"
              style="letter-spacing: 0.3em; font-size: 1.3rem; text-align: center; font-weight: 700;"
              autocomplete="one-time-code"
            />
            <div class="form-hint" id="otp-hint-text">
              Enter the verification code sent to your phone.
            </div>
          </div>

          <button id="verify-otp-btn" class="btn btn-primary btn-block btn-lg">
            Verify & Sign In &rarr;
          </button>
        </div>

        <!-- Honest SMS Notice -->
        <div style="margin-top: 1.25rem; padding: 0.85rem; background: #fefce8; border: 1px solid #fef08a; border-radius: var(--radius-sm); font-size: 0.82rem; color: #854d0e;">
          <strong>ℹ️ Free Testing Note:</strong>
          <p style="margin-top: 0.25rem;">
            For ₹0 testing without paid SMS gateways, Supabase supports <em>Test Phone Numbers</em> (e.g. <code>+919876543211</code> with OTP <code>123456</code>).
          </p>
        </div>
      </div>

      <!-- Admin Email Form Section (Hidden by default) -->
      <div id="email-auth-section" class="card" style="display: none;">
        <form id="email-login-form">
          <div class="form-group">
            <label class="form-label" for="admin-email">Administrator Email</label>
            <input
              type="email"
              id="admin-email"
              class="form-input"
              placeholder="admin@kalupurmasjid.org"
              value="${config.isDemoMode ? 'admin@kalupurmasjid.org' : ''}"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="admin-password">Password</label>
            <input
              type="password"
              id="admin-password"
              class="form-input"
              placeholder="••••••••"
              value="${config.isDemoMode ? 'admin123' : ''}"
              required
            />
          </div>

          <button type="submit" class="btn btn-primary btn-block btn-lg" id="email-submit-btn">
            Sign In as Administrator &rarr;
          </button>
        </form>
      </div>

      <!-- Quick Trial Switcher (Instant 1-Click login for testers) -->
      <div class="card" style="background: var(--bg-surface); border-color: #dfd7c2; text-align: center;">
        <h4 style="font-size: 0.92rem; font-weight: 700; color: var(--primary-dark); margin-bottom: 0.4rem;">
          ⚡ Instant Trial Demo Switcher
        </h4>
        <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.85rem;">
          Test all user roles instantly without waiting for SMS delivery:
        </p>

        <div style="display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap;">
          <button id="quick-imam-btn" class="btn btn-secondary" style="min-height: 42px; font-size: 0.85rem; background: #ffffff;">
            👤 Login as Trial Imam
          </button>
          <button id="quick-admin-btn" class="btn btn-secondary" style="min-height: 42px; font-size: 0.85rem; background: #ffffff;">
            🛡️ Login as Administrator
          </button>
        </div>
      </div>

      <div style="text-align: center; margin-top: 1.25rem;">
        <a href="#home" style="color: var(--text-muted); font-size: 0.88rem; text-decoration: none;">
          &larr; Return to Public Masjids Home
        </a>
      </div>
    </div>
  `;

  // Tab switching logic
  const tabPhoneBtn = document.getElementById('tab-phone-btn');
  const tabEmailBtn = document.getElementById('tab-email-btn');
  const phoneSection = document.getElementById('phone-auth-section');
  const emailSection = document.getElementById('email-auth-section');

  tabPhoneBtn.onclick = () => {
    tabPhoneBtn.style.background = 'var(--primary)';
    tabPhoneBtn.style.color = '#ffffff';
    tabEmailBtn.style.background = 'transparent';
    tabEmailBtn.style.color = 'var(--text-main)';
    phoneSection.style.display = 'block';
    emailSection.style.display = 'none';
  };

  tabEmailBtn.onclick = () => {
    tabEmailBtn.style.background = 'var(--primary)';
    tabEmailBtn.style.color = '#ffffff';
    tabPhoneBtn.style.background = 'transparent';
    tabPhoneBtn.style.color = 'var(--text-main)';
    phoneSection.style.display = 'none';
    emailSection.style.display = 'block';
  };

  // Phone OTP Flow Logic
  const phoneStep1 = document.getElementById('phone-step-1');
  const phoneStep2 = document.getElementById('phone-step-2');
  const sendOtpBtn = document.getElementById('send-otp-btn');
  const verifyOtpBtn = document.getElementById('verify-otp-btn');
  const phoneInput = document.getElementById('login-phone');
  const otpInput = document.getElementById('login-otp');
  const displayTargetPhone = document.getElementById('display-target-phone');
  const changePhoneBtn = document.getElementById('change-phone-btn');

  let activePhone = '';

  sendOtpBtn.onclick = async () => {
    const rawPhone = phoneInput.value;
    const validated = validateAndFormatPhone(rawPhone);

    if (!validated.isValid) {
      showToast(validated.error, 'error');
      return;
    }

    activePhone = validated.formatted;
    sendOtpBtn.disabled = true;
    sendOtpBtn.textContent = 'Sending OTP...';

    try {
      if (config.isConfigured) {
        const { authSendOtp } = await import('../supabase-client.js');
        await authSendOtp(activePhone);
      }
      displayTargetPhone.textContent = activePhone;
      phoneStep1.style.display = 'none';
      phoneStep2.style.display = 'block';
      otpInput.focus();
      showToast('OTP sent! Use your received code or demo code 123456.', 'success');
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to send OTP. Please check phone number or configuration.', 'error');
    } finally {
      sendOtpBtn.disabled = false;
      sendOtpBtn.textContent = 'Send One-Time Password (OTP) →';
    }
  };

  changePhoneBtn.onclick = () => {
    phoneStep2.style.display = 'none';
    phoneStep1.style.display = 'block';
    phoneInput.focus();
  };

  verifyOtpBtn.onclick = async () => {
    const otp = otpInput.value.trim();
    if (!otp || otp.length < 6) {
      showToast('Please enter the 6-digit OTP code.', 'error');
      return;
    }

    verifyOtpBtn.disabled = true;
    verifyOtpBtn.textContent = 'Verifying code...';

    try {
      const { user, profile } = await store.loginWithPhoneOtp(activePhone, otp);
      showToast(`Welcome back, ${profile?.display_name || 'User'}!`, 'success');
      handleLoginRedirect(profile);
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Verification failed. Please try again.', 'error');
      verifyOtpBtn.disabled = false;
      verifyOtpBtn.textContent = 'Verify & Sign In →';
    }
  };

  // Email login form
  const emailForm = document.getElementById('email-login-form');
  emailForm.onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById('admin-email').value.trim();
    const pass = document.getElementById('admin-password').value;
    const submitBtn = document.getElementById('email-submit-btn');

    submitBtn.disabled = true;
    submitBtn.textContent = 'Authenticating...';

    try {
      const { user, profile } = await store.loginWithEmailPassword(email, pass);
      showToast(`Signed in as ${profile.display_name}`, 'success');
      handleLoginRedirect(profile);
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Login failed. Invalid email or password.', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign In as Administrator →';
    }
  };

  // Instant Trial Quick Switchers
  document.getElementById('quick-imam-btn').onclick = async () => {
    try {
      const { profile } = await store.loginDemoQuick('imam');
      showToast(`Logged in as Imam: ${profile.display_name}`, 'success');
      handleLoginRedirect(profile);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  document.getElementById('quick-admin-btn').onclick = async () => {
    try {
      const { profile } = await store.loginDemoQuick('admin');
      showToast(`Logged in as Administrator: ${profile.display_name}`, 'success');
      handleLoginRedirect(profile);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  function handleLoginRedirect(profile) {
    if (profile?.role === 'admin') {
      window.location.hash = '#admin';
    } else {
      window.location.hash = '#imam';
    }
  }
}
