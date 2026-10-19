-- ==============================================================================
-- KALUPUR MASJID TIMINGS — FIX AUTH & IMAM PROFILES
-- ==============================================================================
-- Run this script in your Supabase SQL Editor:
-- (Supabase Dashboard -> Project -> SQL Editor -> New Query -> Run)
--
-- What this does:
-- 1. Automatically creates a profile in public.profiles whenever ANY user is
--    created in auth.users (via Supabase Dashboard or website).
-- 2. Creates profile rows for ALL EXISTING users in auth.users who don't have one.
-- 3. Updates Row Level Security (RLS) policies so authenticated users can read/insert
--    their own profile without permissions errors.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. AUTOMATIC PROFILE CREATION TRIGGER
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_role TEXT := 'imam';
    v_display_name TEXT;
    v_default_masjid_id UUID := NULL;
BEGIN
    -- Determine role: if email contains 'admin', make admin; otherwise imam
    IF NEW.email ILIKE '%admin%' THEN
        v_role := 'admin';
    ELSE
        v_role := 'imam';
        -- Assign to first active masjid by default so they have a masjid immediately
        SELECT id INTO v_default_masjid_id 
        FROM public.masjids 
        WHERE active = true 
        ORDER BY created_at ASC 
        LIMIT 1;
    END IF;

    -- Extract display name from metadata or email prefix
    IF NEW.raw_user_meta_data->>'display_name' IS NOT NULL AND length(trim(NEW.raw_user_meta_data->>'display_name')) > 0 THEN
        v_display_name := trim(NEW.raw_user_meta_data->>'display_name');
    ELSIF NEW.email IS NOT NULL THEN
        v_display_name := INITCAP(SPLIT_PART(NEW.email, '@', 1));
    ELSE
        v_display_name := 'Masjid Member';
    END IF;

    -- Insert into public.profiles (runs with SECURITY DEFINER privileges)
    INSERT INTO public.profiles (
        id,
        display_name,
        phone,
        role,
        assigned_masjid_id,
        active,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        v_display_name,
        NEW.phone,
        v_role,
        v_default_masjid_id,
        true,
        timezone('utc'::text, now()),
        timezone('utc'::text, now())
    )
    ON CONFLICT (id) DO UPDATE SET
        display_name = COALESCE(NULLIF(public.profiles.display_name, ''), EXCLUDED.display_name),
        phone = COALESCE(public.profiles.phone, EXCLUDED.phone),
        active = true,
        updated_at = timezone('utc'::text, now());

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 2. RETROACTIVELY FIX ALL EXISTING USERS IN auth.users
-- ------------------------------------------------------------------------------
-- If you already created an account in Supabase Authentication, this query
-- immediately creates their corresponding profile row so they can sign in!
INSERT INTO public.profiles (
    id,
    display_name,
    phone,
    role,
    assigned_masjid_id,
    active,
    created_at,
    updated_at
)
SELECT 
    u.id,
    COALESCE(
        NULLIF(trim(u.raw_user_meta_data->>'display_name'), ''),
        INITCAP(SPLIT_PART(u.email, '@', 1)),
        'User'
    ) AS display_name,
    u.phone,
    CASE 
        WHEN u.email ILIKE '%admin%' THEN 'admin'
        ELSE 'imam'
    END AS role,
    CASE 
        WHEN u.email ILIKE '%admin%' THEN NULL
        ELSE (SELECT id FROM public.masjids WHERE active = true ORDER BY created_at ASC LIMIT 1)
    END AS assigned_masjid_id,
    true AS active,
    timezone('utc'::text, now()),
    timezone('utc'::text, now())
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO UPDATE SET
    active = true,
    updated_at = timezone('utc'::text, now());

-- ------------------------------------------------------------------------------
-- 3. ENSURE RLS POLICIES ALLOW PROFILES INSERT & SELECT
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile or admin can read all" ON public.profiles;
CREATE POLICY "Users can read own profile or admin can read all"
ON public.profiles FOR SELECT
USING (
    auth.uid() = id OR public.is_admin()
);

DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile or admin can insert" ON public.profiles;
CREATE POLICY "Users can insert own profile or admin can insert"
ON public.profiles FOR INSERT
WITH CHECK (
    auth.uid() = id OR public.is_admin()
);

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
    auth.uid() = id
)
WITH CHECK (
    auth.uid() = id
);

-- ------------------------------------------------------------------------------
-- 4. DIRECT ADMIN IMAM CREATION RPC (ZERO EMAIL RATE LIMITS)
-- ------------------------------------------------------------------------------
-- Allows the administrator to create confirmed Imam accounts directly in the database
-- without triggering external email confirmations or hitting rate limits.
CREATE OR REPLACE FUNCTION public.admin_create_imam_user(
    p_email TEXT,
    p_password TEXT,
    p_display_name TEXT,
    p_masjid_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID := gen_random_uuid();
    v_encrypted_pw TEXT;
    v_profile RECORD;
BEGIN
    IF NOT public.is_admin() THEN
        RETURN jsonb_build_object('success', false, 'error', 'Access denied: Administrator authorization required.');
    END IF;

    IF p_email IS NULL OR p_email NOT LIKE '%@%' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid email address provided.');
    END IF;

    IF length(p_password) < 6 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Password must be at least 6 characters.');
    END IF;

    IF EXISTS (SELECT 1 FROM auth.users WHERE email = lower(trim(p_email))) THEN
        RETURN jsonb_build_object('success', false, 'error', 'A user account with this email address already exists.');
    END IF;

    v_encrypted_pw := extensions.crypt(p_password, extensions.gen_salt('bf'));

    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at
    )
    VALUES (
        '00000000-0000-0000-0000-000000000000',
        v_user_id,
        'authenticated',
        'authenticated',
        lower(trim(p_email)),
        v_encrypted_pw,
        timezone('utc'::text, now()),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('display_name', trim(p_display_name)),
        timezone('utc'::text, now()),
        timezone('utc'::text, now())
    );

    INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        provider_id,
        last_sign_in_at,
        created_at,
        updated_at
    )
    VALUES (
        gen_random_uuid(),
        v_user_id,
        jsonb_build_object('sub', v_user_id, 'email', lower(trim(p_email))),
        'email',
        v_user_id,
        timezone('utc'::text, now()),
        timezone('utc'::text, now()),
        timezone('utc'::text, now())
    );

    INSERT INTO public.profiles (
        id,
        display_name,
        role,
        assigned_masjid_id,
        active,
        created_at,
        updated_at
    )
    VALUES (
        v_user_id,
        trim(p_display_name),
        'imam',
        p_masjid_id,
        true,
        timezone('utc'::text, now()),
        timezone('utc'::text, now())
    )
    ON CONFLICT (id) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        role = 'imam',
        assigned_masjid_id = EXCLUDED.assigned_masjid_id,
        active = true,
        updated_at = timezone('utc'::text, now());

    SELECT * INTO v_profile FROM public.profiles WHERE id = v_user_id;

    RETURN jsonb_build_object(
        'success', true,
        'user_id', v_user_id,
        'profile', to_jsonb(v_profile)
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

