-- ==============================================================================
-- KALUPUR MASJID TIMINGS — ROW LEVEL SECURITY (RLS) POLICIES
-- Purpose: Strict row-level security for public visitors, imams, and administrators.
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.masjids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prayer_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timing_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.correction_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 1. MASJIDS TABLE POLICIES
-- ------------------------------------------------------------------------------

-- Public and authenticated users can view active masjids. Admins can view all masjids.
DROP POLICY IF EXISTS "Public can view active masjids" ON public.masjids;
CREATE POLICY "Public can view active masjids"
ON public.masjids FOR SELECT
USING (
    active = true OR public.is_admin()
);

-- Only admins can insert new masjids
DROP POLICY IF EXISTS "Admins can insert masjids" ON public.masjids;
CREATE POLICY "Admins can insert masjids"
ON public.masjids FOR INSERT
WITH CHECK (
    public.is_admin()
);

-- Only admins can update masjids
DROP POLICY IF EXISTS "Admins can update masjids" ON public.masjids;
CREATE POLICY "Admins can update masjids"
ON public.masjids FOR UPDATE
USING (
    public.is_admin()
)
WITH CHECK (
    public.is_admin()
);

-- Only admins can delete/deactivate masjids
DROP POLICY IF EXISTS "Admins can delete masjids" ON public.masjids;
CREATE POLICY "Admins can delete masjids"
ON public.masjids FOR DELETE
USING (
    public.is_admin()
);

-- ------------------------------------------------------------------------------
-- 2. PROFILES TABLE POLICIES
-- ------------------------------------------------------------------------------

-- Users can read their own profile. Admins can read all profiles.
DROP POLICY IF EXISTS "Users can read own profile or admin can read all" ON public.profiles;
CREATE POLICY "Users can read own profile or admin can read all"
ON public.profiles FOR SELECT
USING (
    auth.uid() = id OR public.is_admin()
);

-- Only admins can insert profiles (or the trigger on signup)
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
CREATE POLICY "Admins can insert profiles"
ON public.profiles FOR INSERT
WITH CHECK (
    public.is_admin() OR auth.uid() = id
);

-- Admins can update any profile; Users can only update their own display_name (cannot change role or masjid)
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile"
ON public.profiles FOR UPDATE
USING (
    public.is_admin()
)
WITH CHECK (
    public.is_admin()
);

DROP POLICY IF EXISTS "Users can update own display name only" ON public.profiles;
CREATE POLICY "Users can update own display name only"
ON public.profiles FOR UPDATE
USING (
    auth.uid() = id AND NOT public.is_admin()
)
WITH CHECK (
    auth.uid() = id
    -- Ensure role and assigned_masjid_id are unchanged by non-admins
    AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
    AND (
        (assigned_masjid_id IS NULL AND (SELECT p.assigned_masjid_id FROM public.profiles p WHERE p.id = auth.uid()) IS NULL)
        OR assigned_masjid_id = (SELECT p.assigned_masjid_id FROM public.profiles p WHERE p.id = auth.uid())
    )
);

-- ------------------------------------------------------------------------------
-- 3. PRAYER SCHEDULES TABLE POLICIES
-- ------------------------------------------------------------------------------

-- Public can view schedules of active masjids
DROP POLICY IF EXISTS "Public can view prayer schedules of active masjids" ON public.prayer_schedules;
CREATE POLICY "Public can view prayer schedules of active masjids"
ON public.prayer_schedules FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.masjids m
        WHERE m.id = prayer_schedules.masjid_id AND (m.active = true OR public.is_admin())
    )
);

-- Direct changes to prayer schedules are restricted to Admins only
-- (Imams must submit proposals via timing_updates table)
DROP POLICY IF EXISTS "Admins can insert prayer schedules" ON public.prayer_schedules;
CREATE POLICY "Admins can insert prayer schedules"
ON public.prayer_schedules FOR INSERT
WITH CHECK (
    public.is_admin()
);

DROP POLICY IF EXISTS "Admins can update prayer schedules" ON public.prayer_schedules;
CREATE POLICY "Admins can update prayer schedules"
ON public.prayer_schedules FOR UPDATE
USING (
    public.is_admin()
)
WITH CHECK (
    public.is_admin()
);

DROP POLICY IF EXISTS "Admins can delete prayer schedules" ON public.prayer_schedules;
CREATE POLICY "Admins can delete prayer schedules"
ON public.prayer_schedules FOR DELETE
USING (
    public.is_admin()
);

-- ------------------------------------------------------------------------------
-- 4. TIMING UPDATES TABLE POLICIES
-- ------------------------------------------------------------------------------

-- Admins can view all updates. Imams can view updates for their assigned masjid or submitted by them.
DROP POLICY IF EXISTS "View timing updates" ON public.timing_updates;
CREATE POLICY "View timing updates"
ON public.timing_updates FOR SELECT
USING (
    public.is_admin()
    OR (
        auth.uid() IS NOT NULL
        AND (
            submitted_by = auth.uid()
            OR masjid_id = public.get_assigned_masjid_id()
        )
    )
);

-- Imams can submit updates for their assigned masjid only, with status 'pending'
DROP POLICY IF EXISTS "Imams can insert timing updates" ON public.timing_updates;
CREATE POLICY "Imams can insert timing updates"
ON public.timing_updates FOR INSERT
WITH CHECK (
    auth.uid() IS NOT NULL
    AND submitted_by = auth.uid()
    AND status = 'pending'
    AND (
        public.is_admin()
        OR (
            masjid_id = public.get_assigned_masjid_id()
            AND EXISTS (
                SELECT 1 FROM public.profiles p
                WHERE p.id = auth.uid() AND p.role = 'imam' AND p.active = true
            )
        )
    )
);

-- Only Admins can update status, feedback, or review details on timing updates
DROP POLICY IF EXISTS "Only admins can update timing updates" ON public.timing_updates;
CREATE POLICY "Only admins can update timing updates"
ON public.timing_updates FOR UPDATE
USING (
    public.is_admin()
)
WITH CHECK (
    public.is_admin()
);

-- ------------------------------------------------------------------------------
-- 5. CORRECTION REPORTS TABLE POLICIES
-- ------------------------------------------------------------------------------

-- Anyone (public, anonymous, or logged in) can submit a correction report
DROP POLICY IF EXISTS "Anyone can insert correction reports" ON public.correction_reports;
CREATE POLICY "Anyone can insert correction reports"
ON public.correction_reports FOR INSERT
WITH CHECK (
    status = 'pending'
    AND category IN ('timing_incorrect', 'wrong_address', 'name_error', 'contact_issue', 'other')
    AND description IS NOT NULL
    AND length(trim(description)) >= 5
);

-- Only Admins can view correction reports
DROP POLICY IF EXISTS "Only admins can view correction reports" ON public.correction_reports;
CREATE POLICY "Only admins can view correction reports"
ON public.correction_reports FOR SELECT
USING (
    public.is_admin()
);

-- Only Admins can update correction reports (resolve/dismiss)
DROP POLICY IF EXISTS "Only admins can update correction reports" ON public.correction_reports;
CREATE POLICY "Only admins can update correction reports"
ON public.correction_reports FOR UPDATE
USING (
    public.is_admin()
)
WITH CHECK (
    public.is_admin()
);

-- ------------------------------------------------------------------------------
-- 6. AUDIT LOGS TABLE POLICIES
-- ------------------------------------------------------------------------------

-- Only Admins can view audit logs
DROP POLICY IF EXISTS "Only admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Only admins can view audit logs"
ON public.audit_logs FOR SELECT
USING (
    public.is_admin()
);

-- Authenticated users / procedures can append audit logs
DROP POLICY IF EXISTS "Authenticated can insert audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated can insert audit logs"
ON public.audit_logs FOR INSERT
WITH CHECK (
    auth.uid() IS NOT NULL
);

-- NO ONE CAN UPDATE OR DELETE AUDIT LOGS (Immutable record history)
-- (No UPDATE or DELETE policy defined = strictly prohibited)
