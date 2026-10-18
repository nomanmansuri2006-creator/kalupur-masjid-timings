-- ==============================================================================
-- KALUPUR MASJID TIMINGS — DATABASE FUNCTIONS & PROCEDURES
-- Purpose: Security definer functions for role verification, approval workflow,
--          rejection, and atomic transactional schedule publishing.
-- ==============================================================================

-- 1. Helper function: Check if current authenticated user is an active Administrator
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

-- 2. Helper function: Get assigned masjid id for current authenticated user
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

-- 3. Stored Procedure: Approve Timing Update
-- Runs as SECURITY DEFINER to atomically update schedules, mark update as approved,
-- and append an immutable audit log entry.
CREATE OR REPLACE FUNCTION public.approve_timing_update(p_update_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_update RECORD;
    v_prayer_record RECORD;
    v_prayer_name TEXT;
    v_azaan TEXT;
    v_jamaat TEXT;
    v_admin_profile RECORD;
    v_old_timings JSONB;
BEGIN
    -- Verify administrator authorization
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied: Only active administrators can approve timing updates.';
    END IF;

    -- Fetch the pending update
    SELECT * INTO v_update
    FROM public.timing_updates
    WHERE id = p_update_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Timing update not found with ID %', p_update_id;
    END IF;

    IF v_update.status <> 'pending' THEN
        RAISE EXCEPTION 'This timing update is already processed (Status: %).', v_update.status;
    END IF;

    -- Capture current schedules for audit log before updating
    SELECT jsonb_object_agg(prayer_name, jsonb_build_object('azaan', azaan_time, 'jamaat', jamaat_time))
    INTO v_old_timings
    FROM public.prayer_schedules
    WHERE masjid_id = v_update.masjid_id;

    -- Iterate through the 5 daily prayers in proposed_timings
    FOR v_prayer_name IN SELECT UNNEST(ARRAY['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'])
    LOOP
        IF v_update.proposed_timings ? v_prayer_name THEN
            v_azaan := v_update.proposed_timings -> v_prayer_name ->> 'azaan';
            v_jamaat := v_update.proposed_timings -> v_prayer_name ->> 'jamaat';

            IF v_azaan IS NOT NULL AND v_jamaat IS NOT NULL THEN
                -- Upsert into prayer_schedules
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

    -- Create audit log entry
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

-- 4. Stored Procedure: Reject Timing Update
CREATE OR REPLACE FUNCTION public.reject_timing_update(
    p_update_id UUID,
    p_rejection_reason TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_update RECORD;
BEGIN
    -- Verify administrator authorization
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

    -- Update status to rejected
    UPDATE public.timing_updates
    SET
        status = 'rejected',
        reviewed_by = auth.uid(),
        reviewed_at = timezone('utc'::text, now()),
        rejection_reason = TRIM(p_rejection_reason)
    WHERE id = p_update_id;

    -- Record in audit logs
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

-- 5. Stored Procedure: Submit Timing Update (Called by Imam)
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

    -- Admin can submit for any masjid; Imam can only submit for assigned masjid
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

    -- Log action
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
