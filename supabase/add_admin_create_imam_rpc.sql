-- ==============================================================================
-- KALUPUR MASJID TIMINGS — DIRECT ADMIN IMAM CREATION RPC (ZERO RATE LIMITS)
-- ==============================================================================
-- Paste and Run this in your Supabase SQL Editor:
-- (Supabase Dashboard -> Project -> SQL Editor -> New Query -> Run)
--
-- Why run this:
-- Supabase free tier rate limits signup confirmation emails to 3 per hour.
-- This RPC runs directly inside PostgreSQL to create confirmed Imam accounts
-- without sending emails or hitting external rate limits!
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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
    -- Verify caller is an active administrator
    IF NOT public.is_admin() THEN
        RETURN jsonb_build_object('success', false, 'error', 'Access denied: Administrator authorization required.');
    END IF;

    -- Validate email
    IF p_email IS NULL OR p_email NOT LIKE '%@%' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid email address provided.');
    END IF;

    -- Validate password length
    IF length(p_password) < 6 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Password must be at least 6 characters.');
    END IF;

    -- Check if user already exists
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = lower(trim(p_email))) THEN
        RETURN jsonb_build_object('success', false, 'error', 'A user account with this email address already exists.');
    END IF;

    -- Hash password with pgcrypto Blowfish
    v_encrypted_pw := extensions.crypt(p_password, extensions.gen_salt('bf'));

    -- 1. Insert into auth.users (already confirmed, no email sent)
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

    -- 2. Insert into auth.identities
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

    -- 3. Insert profile into public.profiles
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
