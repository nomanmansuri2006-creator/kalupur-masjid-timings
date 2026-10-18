-- ==============================================================================
-- KALUPUR MASJID TIMINGS — DATABASE SCHEMA
-- Purpose: Schema definition for Masjids, Profiles, Prayer Schedules,
--          Timing Updates, Correction Reports, and Audit Logs.
-- ==============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. MASJIDS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.masjids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    area TEXT NOT NULL DEFAULT 'Kalupur',
    maps_url TEXT,
    contact_information TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for searching masjids by name or area
CREATE INDEX IF NOT EXISTS idx_masjids_active_area ON public.masjids(active, area);
CREATE INDEX IF NOT EXISTS idx_masjids_name ON public.masjids(name);

-- ------------------------------------------------------------------------------
-- 2. PROFILES TABLE (Linked to auth.users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL CHECK (role IN ('admin', 'imam')),
    assigned_masjid_id UUID REFERENCES public.masjids(id) ON DELETE SET NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_assigned_masjid ON public.profiles(assigned_masjid_id);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);

-- ------------------------------------------------------------------------------
-- 3. PRAYER SCHEDULES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.prayer_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    masjid_id UUID NOT NULL REFERENCES public.masjids(id) ON DELETE CASCADE,
    prayer_name TEXT NOT NULL CHECK (prayer_name IN ('Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha')),
    azaan_time TEXT NOT NULL,
    jamaat_time TEXT NOT NULL,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    schedule_period TEXT DEFAULT 'standard',
    last_confirmed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    CONSTRAINT uq_masjid_prayer UNIQUE (masjid_id, prayer_name)
);

CREATE INDEX IF NOT EXISTS idx_prayer_schedules_masjid ON public.prayer_schedules(masjid_id);

-- ------------------------------------------------------------------------------
-- 4. TIMING UPDATES TABLE (Proposals submitted by Imams)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.timing_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    masjid_id UUID NOT NULL REFERENCES public.masjids(id) ON DELETE CASCADE,
    submitted_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    proposed_timings JSONB NOT NULL,
    -- Structure of proposed_timings:
    -- {
    --   "Fajr": {"azaan": "05:30 AM", "jamaat": "05:55 AM"},
    --   "Dhuhr": {"azaan": "12:45 PM", "jamaat": "01:15 PM"},
    --   ...
    -- }
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    rejection_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_timing_updates_masjid ON public.timing_updates(masjid_id);
CREATE INDEX IF NOT EXISTS idx_timing_updates_status ON public.timing_updates(status);
CREATE INDEX IF NOT EXISTS idx_timing_updates_submitted_by ON public.timing_updates(submitted_by);

-- ------------------------------------------------------------------------------
-- 5. CORRECTION REPORTS TABLE (Public feedback)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.correction_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    masjid_id UUID REFERENCES public.masjids(id) ON DELETE SET NULL,
    category TEXT NOT NULL CHECK (category IN ('timing_incorrect', 'wrong_address', 'name_error', 'contact_issue', 'other')),
    description TEXT NOT NULL,
    contact_info TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    admin_notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_correction_reports_status ON public.correction_reports(status);
CREATE INDEX IF NOT EXISTS idx_correction_reports_masjid ON public.correction_reports(masjid_id);

-- ------------------------------------------------------------------------------
-- 6. AUDIT LOGS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    masjid_id UUID REFERENCES public.masjids(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    affected_record_id UUID,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_masjid ON public.audit_logs(masjid_id);

-- ------------------------------------------------------------------------------
-- 7. AUTOMATIC TIMESTAMP TRIGGER
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_masjids_updated_at ON public.masjids;
CREATE TRIGGER set_masjids_updated_at
BEFORE UPDATE ON public.masjids
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_prayer_schedules_updated_at ON public.prayer_schedules;
CREATE TRIGGER set_prayer_schedules_updated_at
BEFORE UPDATE ON public.prayer_schedules
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
