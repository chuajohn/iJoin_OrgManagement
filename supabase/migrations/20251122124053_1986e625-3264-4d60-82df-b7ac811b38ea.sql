-- Insert 5 organizations that can be joined
-- Using the leader user as the creator

INSERT INTO public.organizations (name, description, status, created_by)
SELECT 
  'Compile' as name,
  'Computer Club - Join us to explore technology, coding, and innovation' as description,
  'active'::org_status as status,
  id as created_by
FROM auth.users
WHERE email = 'leader@iacademy.edu.ph'
LIMIT 1;

INSERT INTO public.organizations (name, description, status, created_by)
SELECT 
  'Wonder' as name,
  'Business Club - Discover entrepreneurship, leadership, and business strategies' as description,
  'active'::org_status as status,
  id as created_by
FROM auth.users
WHERE email = 'leader@iacademy.edu.ph'
LIMIT 1;

INSERT INTO public.organizations (name, description, status, created_by)
SELECT 
  'Elix' as name,
  'Gaming Club - Level up your gaming skills and connect with fellow gamers' as description,
  'active'::org_status as status,
  id as created_by
FROM auth.users
WHERE email = 'leader@iacademy.edu.ph'
LIMIT 1;

INSERT INTO public.organizations (name, description, status, created_by)
SELECT 
  'Vox Volare' as name,
  'Singing Club - Express yourself through music and vocal performance' as description,
  'active'::org_status as status,
  id as created_by
FROM auth.users
WHERE email = 'leader@iacademy.edu.ph'
LIMIT 1;

INSERT INTO public.organizations (name, description, status, created_by)
SELECT 
  'Octave' as name,
  'Dance Club - Move to the rhythm and master the art of dance' as description,
  'active'::org_status as status,
  id as created_by
FROM auth.users
WHERE email = 'leader@iacademy.edu.ph'
LIMIT 1;