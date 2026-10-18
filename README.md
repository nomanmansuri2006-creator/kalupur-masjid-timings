# 🕌 Kalupur Masjid Timings — Trial Website

A complete, mobile-first community web platform for displaying and managing verified Azaan and Jamaat prayer timings for masjids in **Kalupur, Ahmedabad, Gujarat, India**.

Designed as a free community service that enables citizens to view accurate schedules while empowering authorized Imams with a simple, high-contrast mobile interface to submit timing adjustments without technical complexity.

---

## 🌟 Key Features & User Roles

### 1. Public Visitor
- **Browse & Search:** Filter masjids by name or area in Kalupur in real-time.
- **Prayer Schedule Table:** View 5 daily prayers (*Fajr*, *Dhuhr*, *Asr*, *Maghrib*, *Isha*) with separate **Azaan** and **Jamaat** columns.
- **Verification Status:** Clearly flags verified timings vs unconfirmed trial demonstration data.
- **Google Maps Directions:** Direct one-click links to navigation directions.
- **Correction Reports:** Submit timing corrections or address fixes for administrator review.

### 2. Authorized Imam
- **Effortless Mobile Access:** Sign in via mobile phone OTP.
- **Persistent Session:** Stays signed in across visits on mobile browsers.
- **Simplified Dashboard:** Large touch targets (≥ 48px), clean typography, zero clutter.
- **Edit Prayer Timings:** Propose adjustments for the 5 prayers with an optional explanation note.
- **Status & Feedback:** Track pending, approved, or rejected submissions with administrator feedback.
- **Android Home Screen (PWA):** Installs directly to Android home screen without an app store.

### 3. Administrator Console
- **Summary Metrics:** Total masjids, active Imams, pending proposals, and unresolved reports.
- **Visual Diff Review:** Side-by-side comparison of **Current Published** vs **Proposed** timings.
- **One-Click Approval:** Atomic database transaction updates the public schedule instantly, refreshes timestamps, and appends an audit log.
- **Rejection with Feedback:** Send structured reasons back to the Imam without modifying public timings.
- **Imam Account Management:** Authorize Imams, link to a specific masjid, change assignments, or revoke access.
- **Audit History:** Immutable audit log tracking all actions with actor, masjid, and before/after payloads.

---

## 🛠️ Technology Stack & Operating Cost

| Component | Technology | Cost |
|---|---|---|
| **Frontend** | Pure HTML5, Responsive CSS, Modern ES Modules (Zero Build Step) | **₹0** |
| **Backend / DB** | Supabase (PostgreSQL with Row Level Security & Stored Procedures) | **₹0** (Free Tier) |
| **Authentication** | Supabase Auth (Phone OTP with Free Test Numbers + Email fallback) | **₹0** (Trial) |
| **Hosting** | GitHub Pages (Static Host) | **₹0** (Free) |
| **Maps** | Google Maps links | **₹0** (Free) |

> 💡 **Initial Operating Cost:** **₹0 / Free**. See [`docs/SMS_OTP_EXPLANATION.md`](docs/SMS_OTP_EXPLANATION.md) for full details on Indian DLT regulations and low-cost SMS options for production.

---

## 📁 Project Structure

```text
Masjid Timing/
├── index.html                     # Main SPA entry point
├── manifest.json                  # PWA Web App Manifest for mobile installation
├── sw.js                          # Service Worker for offline resilience
├── test.js                        # Automated test suite (8 tests)
├── package.json                   # Project metadata and test scripts
├── css/
│   └── style.css                  # Mosque-inspired styling (Emerald, Cream, Gold)
├── js/
│   ├── config.js                  # Runtime configuration and demo mode detector
│   ├── app.js                     # Bootstrap, PWA registration, and mode banner
│   ├── router.js                  # Hash-based SPA routing with role guards
│   ├── store.js                   # Unified data store (Supabase + Local Demo fallback)
│   ├── supabase-client.js         # Supabase client wrapper & RPC methods
│   ├── utils/
│   │   ├── formatters.js          # 12hr/24hr time conversion and upcoming prayer logic
│   │   ├── toast.js               # Toast notification system
│   │   └── validator.js           # Phone number and prayer timing validation
│   └── views/
│       ├── public-home.js         # Search, masjid cards, prayer previews
│       ├── public-masjid.js       # Masjid details, 5-prayer table, directions
│       ├── public-report.js       # Correction report form & confirmation
│       ├── auth-login.js          # Phone OTP & password authentication
│       ├── imam-dashboard.js      # Simplified, mobile-first Imam dashboard
│       ├── imam-edit.js           # 5-prayer timing editor with confirmation modal
│       ├── imam-history.js        # Previous submissions & admin feedback
│       └── admin-dashboard.js     # Diff review, masjid/imam management, audit log
├── assets/
│   ├── logo.svg                   # Emerald & gold mosque dome emblem
│   └── icons/                     # Favicon and PWA icons
├── supabase/
│   ├── complete_setup.sql         # 1-Click all-in-one setup script for Supabase
│   ├── schema.sql                 # DDL tables, foreign keys, and indexes
│   ├── rls.sql                    # Row Level Security policies
│   ├── functions.sql              # Stored procedures (approve/reject/submit)
│   └── seed.sql                   # Trial data for 1 Kalupur masjid & test accounts
└── docs/
    ├── SUPABASE_SETUP.md          # Guide to creating project and running SQL
    ├── FIRST_ADMIN_GUIDE.md       # Securely provisioning the first administrator
    ├── SMS_OTP_EXPLANATION.md     # Indian SMS regulations, DLT, and ₹0 testing
    └── GITHUB_PAGES_DEPLOYMENT.md # Instructions for free GitHub Pages hosting
```

---

## 🚀 Quick Start & Testing

### Option A: Instant Local Testing (Zero Setup Required)

The project includes an **Interactive Trial Demo Mode** pre-loaded with a demonstration Kalupur masjid record:

1. Open `index.html` in any modern web browser, or run a local static server:
   ```powershell
   npx serve -l 3000 .
   ```
2. Open `http://localhost:3000` in your browser.
3. Test the workflows:
   - **Public View:** Search for *"Kalupur"*, view the trial masjid card and 5-prayer schedule.
   - **Imam Proposal Workflow:** Click **🔐 Imam / Admin** &rarr; Click **👤 Login as Trial Imam**. Notice the simplified dashboard. Click **Edit Prayer Timings**, change Asr or Isha Jamaat time, and submit for approval.
   - **Admin Approval Workflow:** Click **Switch to Admin View** (or log in as Admin). Notice the pending submission badge. Review the **side-by-side visual diff** highlighting your proposed changes in gold. Click **✓ Approve & Publish Schedule**.
   - **Verify Public Update:** Return to the Home page or Masjid Details page; observe that the public schedule updated immediately!

---

### Option B: Connect to Live Supabase Backend

1. Create a free project on [Supabase.com](https://supabase.com).
2. Open **SQL Editor** in Supabase and paste the contents of `supabase/complete_setup.sql`. Click **Run**.
3. In Supabase Dashboard, go to **Settings** &rarr; **API** and copy:
   - **Project URL**
   - **`anon` `public` key**
4. Open the website, click **Connect Supabase** on the top banner, paste your credentials, and click **Save & Connect**.
5. Follow [`docs/FIRST_ADMIN_GUIDE.md`](docs/FIRST_ADMIN_GUIDE.md) to provision your administrator account.

---

## 🔒 Security Architecture (Row Level Security)

- **Strict Server-Side Enforcement:** Every sensitive action is validated in PostgreSQL stored procedures (`approve_timing_update`, `reject_timing_update`, `submit_timing_update`) running as `SECURITY DEFINER`.
- **Public Isolation:** Public visitors have read-only access to active masjids and published schedules. They can insert correction reports into a quarantined queue.
- **Imam Scoping:** Imams can read only their assigned masjid's records and submit proposals strictly for their assigned masjid (`masjid_id = get_assigned_masjid_id()`). They cannot approve proposals or alter published schedules directly.
- **Admin Exclusivity:** Only accounts with `role = 'admin'` verified through server-side functions can approve proposals, edit masjids, or assign Imams.
- **Immutable Audit Trail:** The `audit_logs` table has no `UPDATE` or `DELETE` policies, guaranteeing a tamper-proof historical record of every approval and rejection.
- **No Secret Leaks:** Only public `anon` client credentials are used in the browser; the `service_role` secret is never exposed.

---

## 🧪 Testing Checklist Verification

| # | Requirement | Status | Verification Method |
|---|---|:---:|---|
| 1 | Public can search & view timings without login | ✅ | Tested in `public-home.js` & `public-masjid.js` |
| 2 | Imam can authenticate with phone number | ✅ | Implemented via Supabase Phone Auth & test numbers |
| 3 | Valid session returns Imam to dashboard | ✅ | Persistent session restored via `store.initSession()` |
| 4 | Imam cannot access other masjids | ✅ | RLS check: `masjid_id = get_assigned_masjid_id()` |
| 5 | Submission remains pending until approved | ✅ | Default status `'pending'` in database constraint |
| 6 | Public timings unchanged while pending | ✅ | Published schedule table untouched until approval RPC |
| 7 | Approval updates public schedule atomically | ✅ | Implemented in `approve_timing_update` function |
| 8 | Rejection preserves existing schedule | ✅ | Implemented in `reject_timing_update` with reason logging |
| 9 | Approvals and rejections recorded in audit | ✅ | Automated `audit_logs` insertion in stored procedures |
| 10 | Correction reports do not change published data | ✅ | Reports stored in separate `correction_reports` table |
| 11 | Revoked/inactive accounts blocked | ✅ | Checked via `active = true` condition in RLS & RPCs |
| 12 | Works well on small Android screens | ✅ | Mobile-first CSS, touch targets ≥ 48px, PWA manifest |
| 13 | Missing SMS configuration reported honestly | ✅ | Clear banner explaining Supabase test numbers vs DLT |
| 14 | No private keys or secrets in frontend | ✅ | Verified by automated test in `test.js` |

---

## 📄 License & Community Usage

This trial project is released under the **MIT License**. It is provided as a free community public service for the masjids and people of Kalupur, Ahmedabad.
