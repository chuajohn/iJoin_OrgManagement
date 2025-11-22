-- This migration assigns roles to test users
-- Make sure the auth users exist before running this

-- Insert profiles for test users (will be created by trigger, but we ensure they exist)
-- The handle_new_user trigger should create these automatically when users sign up

-- Assign student role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'student'::app_role
FROM auth.users
WHERE email = 'student1@iacademy.edu.ph'
ON CONFLICT (user_id, role) DO NOTHING;

-- Assign member role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'member'::app_role
FROM auth.users
WHERE email = 'member@iacademy.edu.ph'
ON CONFLICT (user_id, role) DO NOTHING;

-- Assign officer role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'officer'::app_role
FROM auth.users
WHERE email = 'officer@iacademy.edu.ph'
ON CONFLICT (user_id, role) DO NOTHING;

-- Assign leader role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'leader'::app_role
FROM auth.users
WHERE email = 'leader@iacademy.edu.ph'
ON CONFLICT (user_id, role) DO NOTHING;

-- Assign SAO role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'sao'::app_role
FROM auth.users
WHERE email = 'sao@iacademy.edu.ph'
ON CONFLICT (user_id, role) DO NOTHING;

-- Assign admin role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'admin@iacademy.edu.ph'
ON CONFLICT (user_id, role) DO NOTHING;