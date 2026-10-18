-- ==============================================================================
-- KALUPUR MASJID TIMINGS — TRIAL SEED DATA
-- Purpose: Sample data for 1 clearly labelled demonstration masjid and initial
--          unverified sample timings.
-- ==============================================================================

-- 1. Insert 1 clearly labelled demonstration test masjid
INSERT INTO public.masjids (
    id,
    name,
    address,
    area,
    maps_url,
    contact_information,
    active
)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Masjid-e-Quba (Trial / Demonstration Record)',
    'Near Kalupur Railway Station Circle, Kalupur, Ahmedabad - 380002',
    'Kalupur',
    'https://maps.google.com/?q=Kalupur+Railway+Station+Ahmedabad',
    'Demo Coordinator: +91 98765 00000',
    true
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    address = EXCLUDED.address,
    area = EXCLUDED.area,
    maps_url = EXCLUDED.maps_url,
    contact_information = EXCLUDED.contact_information,
    active = true;

-- 2. Insert initial prayer schedules for the 5 daily prayers
-- NOTE: Marked explicitly as is_verified = false (Awaiting Confirmation)
-- Demonstration sample timings:
INSERT INTO public.prayer_schedules (
    masjid_id,
    prayer_name,
    azaan_time,
    jamaat_time,
    is_verified,
    schedule_period,
    last_confirmed_at
)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 'Fajr', '05:30 AM', '05:55 AM', false, 'trial_sample', timezone('utc'::text, now())),
    ('a0000000-0000-0000-0000-000000000001', 'Dhuhr', '12:45 PM', '01:15 PM', false, 'trial_sample', timezone('utc'::text, now())),
    ('a0000000-0000-0000-0000-000000000001', 'Asr', '05:00 PM', '05:25 PM', false, 'trial_sample', timezone('utc'::text, now())),
    ('a0000000-0000-0000-0000-000000000001', 'Maghrib', '06:40 PM', '06:45 PM', false, 'trial_sample', timezone('utc'::text, now())),
    ('a0000000-0000-0000-0000-000000000001', 'Isha', '08:00 PM', '08:30 PM', false, 'trial_sample', timezone('utc'::text, now()))
ON CONFLICT (masjid_id, prayer_name) DO UPDATE SET
    azaan_time = EXCLUDED.azaan_time,
    jamaat_time = EXCLUDED.jamaat_time,
    is_verified = false,
    last_confirmed_at = timezone('utc'::text, now());

-- ------------------------------------------------------------------------------
-- INSTRUCTIONS FOR FIRST ADMIN & IMAM ACCOUNTS
-- ------------------------------------------------------------------------------
-- Step A: Sign up the Admin user via Supabase Auth (Dashboard -> Authentication -> Users -> Add User)
--         or via the website sign-in with phone / email.
-- Step B: Run the following SQL query in Supabase SQL Editor replacing the Auth User ID:
/*
-- 1. Provision First Administrator:
INSERT INTO public.profiles (id, display_name, phone, role, active)
VALUES (
    '<SUPABASE_AUTH_USER_UUID_FOR_ADMIN>',
    'Kalupur Community Administrator',
    '+919876543210',
    'admin',
    true
)
ON CONFLICT (id) DO UPDATE SET role = 'admin', active = true;

-- 2. Provision Trial Imam:
INSERT INTO public.profiles (id, display_name, phone, role, assigned_masjid_id, active)
VALUES (
    '<SUPABASE_AUTH_USER_UUID_FOR_IMAM>',
    'Imam Maulana Abdullah (Trial)',
    '+919876543211',
    'imam',
    'a0000000-0000-0000-0000-000000000001',
    true
)
ON CONFLICT (id) DO UPDATE SET
    role = 'imam',
    assigned_masjid_id = 'a0000000-0000-0000-0000-000000000001',
    active = true;
*/

-- ------------------------------------------------------------------------------
-- HOW TO REPLACE TRIAL DATA WITH A REAL KALUPUR MASJID
-- ------------------------------------------------------------------------------
/*
UPDATE public.masjids
SET
    name = 'Jama Masjid (Kalupur)',
    address = 'Opposite Relief Road / Gandhi Road Junction, Kalupur, Ahmedabad - 380001',
    area = 'Kalupur',
    maps_url = 'https://maps.google.com/?q=Jama+Masjid+Ahmedabad',
    contact_information = 'Trust Office: 079-XXXXXXXX'
WHERE id = 'a0000000-0000-0000-0000-000000000001';
*/
