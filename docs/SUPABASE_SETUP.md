# Supabase Setup Guide — Kalupur Masjid Timings

This guide explains how to set up your free Supabase backend for the Kalupur Masjid Timings trial project.

---

## 1. Create a Free Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in (or create a free account).
2. Click **New Project**.
3. Choose an organization and set:
   - **Name:** `Kalupur Masjid Timings`
   - **Database Password:** (Choose a secure password and save it)
   - **Region:** `Mumbai, India (ap-south-1)` for lowest latency in Gujarat.
   - **Pricing Plan:** **Free Tier ($0/month)**
4. Click **Create new project** and wait ~2 minutes for provisioning.

---

## 2. Execute Database Schema & RLS Policies

1. In your Supabase Project Dashboard, navigate to the **SQL Editor** on the left menu (icon: `>_`).
2. Click **New query**.
3. Open the file `supabase/complete_setup.sql` from this repository.
4. Copy the entire contents and paste into the Supabase SQL Editor.
5. Click **Run** (green button).
6. Verify that all 6 tables, triggers, stored procedures, and RLS policies are created successfully:
   - `masjids`
   - `profiles`
   - `prayer_schedules`
   - `timing_updates`
   - `correction_reports`
   - `audit_logs`

---

## 3. Retrieve Project API Credentials

1. In Supabase Dashboard, click **Project Settings** (gear icon at bottom left).
2. Go to **API** in the settings menu.
3. Find:
   - **Project URL:** `https://your-project-id.supabase.co`
   - **Project API Keys:** Copy the **`anon` `public`** key.
     > ⚠️ **CRITICAL SECURITY RULE:** Never copy or share the `service_role` `secret` key! The website requires only the public `anon` key. All operations are protected by PostgreSQL Row Level Security (RLS).
4. You can either:
   - Enter these into `js/config.js`, or
   - Enter them directly on the website by clicking **Connect Supabase** in the top banner.

---

## 4. Configure Free Phone OTP Authentication (₹0 Cost)

To test mobile phone OTP login without paying for an SMS gateway:

1. In Supabase Dashboard, navigate to **Authentication** &rarr; **Providers**.
2. Click on **Phone** to expand it.
3. Toggle **Enable Phone Provider** to **ON**.
4. Scroll down to **Test phone numbers**.
5. Add test phone numbers and their fixed OTP codes:
   - Phone: `+919876543210`, OTP: `123456` (For Admin)
   - Phone: `+919876543211`, OTP: `123456` (For Trial Imam)
6. Click **Save**.

This allows you and your testers to log in via phone number and OTP instantly **without sending real SMS messages and without paying any fees**.
