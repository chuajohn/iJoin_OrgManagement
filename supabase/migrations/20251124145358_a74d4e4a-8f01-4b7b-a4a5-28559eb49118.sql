-- Insert sample events with PDFs for the organization
INSERT INTO public.events (
  name,
  description,
  event_date,
  location,
  org_id,
  created_by,
  document_url,
  status,
  visibility
)
SELECT
  'Annual General Meeting',
  'AGM for all members to discuss organizational matters',
  now() + interval '30 days',
  'Main Auditorium',
  'c6798e09-fb51-4cf6-8b4d-6c48b8dfc7f0'::uuid,
  (SELECT id FROM public.profiles LIMIT 1),
  '/documents/PDF1.pdf',
  'approved'::event_status,
  'public'::visibility_type
WHERE EXISTS (SELECT 1 FROM public.organizations WHERE id = 'c6798e09-fb51-4cf6-8b4d-6c48b8dfc7f0'::uuid)

UNION ALL

SELECT
  'Workshop: Technical Skills',
  'Technical skills development workshop for members',
  now() + interval '45 days',
  'Computer Lab',
  'c6798e09-fb51-4cf6-8b4d-6c48b8dfc7f0'::uuid,
  (SELECT id FROM public.profiles LIMIT 1),
  '/documents/PDF2.pdf',
  'approved'::event_status,
  'public'::visibility_type
WHERE EXISTS (SELECT 1 FROM public.organizations WHERE id = 'c6798e09-fb51-4cf6-8b4d-6c48b8dfc7f0'::uuid)

UNION ALL

SELECT
  'Semester Planning Session',
  'Planning session for upcoming semester activities',
  now() + interval '15 days',
  'Conference Room B',
  'c6798e09-fb51-4cf6-8b4d-6c48b8dfc7f0'::uuid,
  (SELECT id FROM public.profiles LIMIT 1),
  '/documents/PDF3.pdf',
  'approved'::event_status,
  'public'::visibility_type
WHERE EXISTS (SELECT 1 FROM public.organizations WHERE id = 'c6798e09-fb51-4cf6-8b4d-6c48b8dfc7f0'::uuid);