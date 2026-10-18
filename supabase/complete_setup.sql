-- ==============================================================================
-- KALUPUR MASJID TIMINGS — COMPLETE ALL-IN-ONE SUPABASE DATABASE SETUP
-- Paste and Run this script in your Supabase Project's SQL Editor:
-- (Supabase Dashboard -> Project -> SQL Editor -> New Query -> Run)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- PART 1: EXTENSIONS
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- PART 2: TABLES DEFINITION
-- ------------------------------------------------------------------------------

-- 1. MASJIDS
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

CREATE INDEX IF NOT EXISTS idx_masjids_active_area ON public.masjids(active, area);
CREATE INDEX IF NOT EXISTS idx_masjids_name ON public.masjids(name);

-- 2. PROFILES (Linked to auth.users)
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

-- 3. PRAYER SCHEDULES
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

-- 4. TIMING UPDATES (Proposals submitted by Imams)
CREATE TABLE IF NOT EXISTS public.timing_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    masjid_id UUID NOT NULL REFERENCES public.masjids(id) ON DELETE CASCADE,
    submitted_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    proposed_timings JSONB NOT NULL,
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

-- 5. CORRECTION REPORTS (Public reports)
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

-- 6. AUDIT LOGS
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
-- PART 3: TIMESTAMP TRIGGERS
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

-- ------------------------------------------------------------------------------
-- PART 4: SECURITY DEFINER FUNCTIONS & STORED PROCEDURES
-- ------------------------------------------------------------------------------

-- Helper: Check if active admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
    v_role TEXT;
    v_active BOOLEAN;
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN FALSE;
    END IF;

    SELECT role, active INTO v_role, v_active
    FROM public.profiles
    WHERE id = auth.uid();

    RETURN (v_role = 'admin' AND v_active = TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Helper: Get current user assigned masjid
CREATE OR REPLACE FUNCTION public.get_assigned_masjid_id()
RETURNS UUID AS $$
DECLARE
    v_masjid_id UUID;
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT assigned_masjid_id INTO v_masjid_id
    FROM public.profiles
    WHERE id = auth.uid() AND active = TRUE;

    RETURN v_masjid_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Stored Procedure: Approve Timing Update
CREATE OR REPLACE FUNCTION public.approve_timing_update(p_update_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_update RECORD;
    v_prayer_name TEXT;
    v_azaan TEXT;
    v_jamaat TEXT;
    v_old_timings JSONB;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied: Only active administrators can approve timing updates.';
    END IF;

    SELECT * INTO v_update
    FROM public.timing_updates
    WHERE id = p_update_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Timing update not found with ID %', p_update_id;
    END IF;

    IF v_update.status <> 'pending' THEN
        RAISE EXCEPTION 'This timing update is already processed (Status: %).', v_update.status;
    END IF;

    -- Capture current schedules for audit log
    SELECT jsonb_object_agg(prayer_name, jsonb_build_object('azaan', azaan_time, 'jamaat', jamaat_time))
    INTO v_old_timings
    FROM public.prayer_schedules
    WHERE masjid_id = v_update.masjid_id;

    -- Apply new timings for 5 prayers
    FOR v_prayer_name IN SELECT UNNEST(ARRAY['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'])
    LOOP
        IF v_update.proposed_timings ? v_prayer_name THEN
            v_azaan := v_update.proposed_timings -> v_prayer_name ->> 'azaan';
            v_jamaat := v_update.proposed_timings -> v_prayer_name ->> 'jamaat';

            IF v_azaan IS NOT NULL AND v_jamaat IS NOT NULL THEN
                INSERT INTO public.prayer_schedules (
                    masjid_id,
                    prayer_name,
                    azaan_time,
                    jamaat_time,
                    is_verified,
                    last_confirmed_at,
                    updated_at,
                    updated_by
                )
                VALUES (
                    v_update.masjid_id,
                    v_prayer_name,
                    v_azaan,
                    v_jamaat,
                    TRUE,
                    timezone('utc'::text, now()),
                    timezone('utc'::text, now()),
                    auth.uid()
                )
                ON CONFLICT (masjid_id, prayer_name)
                DO UPDATE SET
                    azaan_time = EXCLUDED.azaan_time,
                    jamaat_time = EXCLUDED.jamaat_time,
                    is_verified = TRUE,
                    last_confirmed_at = timezone('utc'::text, now()),
                    updated_at = timezone('utc'::text, now()),
                    updated_by = auth.uid();
            END IF;
        END IF;
    END LOOP;

    -- Update timing_updates record status
    UPDATE public.timing_updates
    SET
        status = 'approved',
        reviewed_by = auth.uid(),
        reviewed_at = timezone('utc'::text, now()),
        rejection_reason = NULL
    WHERE id = p_update_id;

    -- Append to audit log
    INSERT INTO public.audit_logs (
        actor_user_id,
        masjid_id,
        action,
        affected_record_id,
        details
    )
    VALUES (
        auth.uid(),
        v_update.masjid_id,
        'APPROVE_TIMING_UPDATE',
        p_update_id,
        jsonb_build_object(
            'submitted_by', v_update.submitted_by,
            'approved_by', auth.uid(),
            'notes', v_update.notes,
            'previous_timings', v_old_timings,
            'new_timings', v_update.proposed_timings
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Timing update approved and published successfully.',
        'update_id', p_update_id,
        'masjid_id', v_update.masjid_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Stored Procedure: Reject Timing Update
CREATE OR REPLACE FUNCTION public.reject_timing_update(
    p_update_id UUID,
    p_rejection_reason TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_update RECORD;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied: Only active administrators can reject timing updates.';
    END IF;

    IF p_rejection_reason IS NULL OR TRIM(p_rejection_reason) = '' THEN
        RAISE EXCEPTION 'Rejection reason is required so the Imam understands what needs correction.';
    END IF;

    SELECT * INTO v_update
    FROM public.timing_updates
    WHERE id = p_update_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Timing update not found with ID %', p_update_id;
    END IF;

    IF v_update.status <> 'pending' THEN
        RAISE EXCEPTION 'This timing update is already processed (Status: %).', v_update.status;
    END IF;

    UPDATE public.timing_updates
    SET
        status = 'rejected',
        reviewed_by = auth.uid(),
        reviewed_at = timezone('utc'::text, now()),
        rejection_reason = TRIM(p_rejection_reason)
    WHERE id = p_update_id;

    INSERT INTO public.audit_logs (
        actor_user_id,
        masjid_id,
        action,
        affected_record_id,
        details
    )
    VALUES (
        auth.uid(),
        v_update.masjid_id,
        'REJECT_TIMING_UPDATE',
        p_update_id,
        jsonb_build_object(
            'submitted_by', v_update.submitted_by,
            'rejected_by', auth.uid(),
            'reason', TRIM(p_rejection_reason)
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Timing update marked as rejected with feedback.',
        'update_id', p_update_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Stored Procedure: Submit Timing Update (Called by Imam)
CREATE OR REPLACE FUNCTION public.submit_timing_update(
    p_masjid_id UUID,
    p_proposed_timings JSONB,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_profile RECORD;
    v_new_id UUID;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required.';
    END IF;

    SELECT * INTO v_profile
    FROM public.profiles
    WHERE id = auth.uid();

    IF NOT FOUND OR NOT v_profile.active THEN
        RAISE EXCEPTION 'User profile not found or inactive.';
    END IF;

    IF v_profile.role = 'imam' THEN
        IF v_profile.assigned_masjid_id IS NULL OR v_profile.assigned_masjid_id <> p_masjid_id THEN
            RAISE EXCEPTION 'Access denied: You can only submit timing updates for your assigned masjid.';
        END IF;
    ELSIF v_profile.role <> 'admin' THEN
        RAISE EXCEPTION 'Unauthorized role.';
    END IF;

    INSERT INTO public.timing_updates (
        masjid_id,
        submitted_by,
        proposed_timings,
        notes,
        status
    )
    VALUES (
        p_masjid_id,
        auth.uid(),
        p_proposed_timings,
        p_notes,
        'pending'
    )
    RETURNING id INTO v_new_id;

    INSERT INTO public.audit_logs (
        actor_user_id,
        masjid_id,
        action,
        affected_record_id,
        details
    )
    VALUES (
        auth.uid(),
        p_masjid_id,
        'SUBMIT_TIMING_UPDATE',
        v_new_id,
        jsonb_build_object(
            'notes', p_notes,
            'proposed_timings', p_proposed_timings
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Timing update submitted successfully and is pending administrator review.',
        'update_id', v_new_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- PART 5: ROW LEVEL SECURITY POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.masjids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prayer_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timing_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.correction_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Masjids policies
DROP POLICY IF EXISTS "Public can view active masjids" ON public.masjids;
CREATE POLICY "Public can view active masjids" ON public.masjids FOR SELECT USING (active = true OR public.is_admin());

DROP POLICY IF EXISTS "Admins can insert masjids" ON public.masjids;
CREATE POLICY "Admins can insert masjids" ON public.masjids FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update masjids" ON public.masjids;
CREATE POLICY "Admins can update masjids" ON public.masjids FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete masjids" ON public.masjids;
CREATE POLICY "Admins can delete masjids" ON public.masjids FOR DELETE USING (public.is_admin());

-- Profiles policies
DROP POLICY IF EXISTS "Users can read own profile or admin can read all" ON public.profiles;
CREATE POLICY "Users can read own profile or admin can read all" ON public.profiles FOR SELECT USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
CREATE POLICY "Admins can insert profiles" ON public.profiles FOR INSERT WITH CHECK (public.is_admin() OR auth.uid() = id);

DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile" ON public.profiles FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Users can update own display name only" ON public.profiles;
CREATE POLICY "Users can update own display name only" ON public.profiles FOR UPDATE
USING (auth.uid() = id AND NOT public.is_admin())
WITH CHECK (
    auth.uid() = id
    AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
    AND (
        (assigned_masjid_id IS NULL AND (SELECT p.assigned_masjid_id FROM public.profiles p WHERE p.id = auth.uid()) IS NULL)
        OR assigned_masjid_id = (SELECT p.assigned_masjid_id FROM public.profiles p WHERE p.id = auth.uid())
    )
);

-- Prayer Schedules policies
DROP POLICY IF EXISTS "Public can view prayer schedules of active masjids" ON public.prayer_schedules;
CREATE POLICY "Public can view prayer schedules of active masjids" ON public.prayer_schedules FOR SELECT
USING (EXISTS (SELECT 1 FROM public.masjids m WHERE m.id = prayer_schedules.masjid_id AND (m.active = true OR public.is_admin())));

DROP POLICY IF EXISTS "Admins can insert prayer schedules" ON public.prayer_schedules;
CREATE POLICY "Admins can insert prayer schedules" ON public.prayer_schedules FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update prayer schedules" ON public.prayer_schedules;
CREATE POLICY "Admins can update prayer schedules" ON public.prayer_schedules FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete prayer schedules" ON public.prayer_schedules;
CREATE POLICY "Admins can delete prayer schedules" ON public.prayer_schedules FOR DELETE USING (public.is_admin());

-- Timing Updates policies
DROP POLICY IF EXISTS "View timing updates" ON public.timing_updates;
CREATE POLICY "View timing updates" ON public.timing_updates FOR SELECT
USING (public.is_admin() OR (auth.uid() IS NOT NULL AND (submitted_by = auth.uid() OR masjid_id = public.get_assigned_masjid_id())));

DROP POLICY IF EXISTS "Imams can insert timing updates" ON public.timing_updates;
CREATE POLICY "Imams can insert timing updates" ON public.timing_updates FOR INSERT
WITH CHECK (
    auth.uid() IS NOT NULL
    AND submitted_by = auth.uid()
    AND status = 'pending'
    AND (
        public.is_admin()
        OR (
            masjid_id = public.get_assigned_masjid_id()
            AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'imam' AND p.active = true)
        )
    )
);

DROP POLICY IF EXISTS "Only admins can update timing updates" ON public.timing_updates;
CREATE POLICY "Only admins can update timing updates" ON public.timing_updates FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Correction Reports policies
DROP POLICY IF EXISTS "Anyone can insert correction reports" ON public.correction_reports;
CREATE POLICY "Anyone can insert correction reports" ON public.correction_reports FOR INSERT
WITH CHECK (
    status = 'pending'
    AND category IN ('timing_incorrect', 'wrong_address', 'name_error', 'contact_issue', 'other')
    AND description IS NOT NULL
    AND length(trim(description)) >= 5
);

DROP POLICY IF EXISTS "Only admins can view correction reports" ON public.correction_reports;
CREATE POLICY "Only admins can view correction reports" ON public.correction_reports FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Only admins can update correction reports" ON public.correction_reports;
CREATE POLICY "Only admins can update correction reports" ON public.correction_reports FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Audit Logs policies
DROP POLICY IF EXISTS "Only admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Only admins can view audit logs" ON public.audit_logs FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Authenticated can insert audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ------------------------------------------------------------------------------
-- PART 6: TRIAL SEED DATA
-- ------------------------------------------------------------------------------
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

-- Sample demonstration timings (flagged as unverified trial sample)
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
