-- Create organization_documents table for managing org-specific documents
CREATE TABLE public.organization_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  document_url TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id),
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.organization_documents ENABLE ROW LEVEL SECURITY;

-- Officers can manage documents
CREATE POLICY "Officers can insert documents"
ON public.organization_documents
FOR INSERT
TO authenticated
WITH CHECK (is_org_officer(auth.uid(), org_id));

-- Officers can view their org documents
CREATE POLICY "Officers can view org documents"
ON public.organization_documents
FOR SELECT
TO authenticated
USING (is_org_officer(auth.uid(), org_id));

-- Officers can delete documents
CREATE POLICY "Officers can delete documents"
ON public.organization_documents
FOR DELETE
TO authenticated
USING (is_org_officer(auth.uid(), org_id));

-- Insert PDFs for all organizations
INSERT INTO public.organization_documents (org_id, title, document_url, uploaded_by)
SELECT 
  o.id,
  'Annual General Meeting Guidelines',
  '/documents/PDF1.pdf',
  (SELECT id FROM public.profiles LIMIT 1)
FROM public.organizations o
WHERE o.status = 'active'

UNION ALL

SELECT 
  o.id,
  'Technical Workshop Materials',
  '/documents/PDF2.pdf',
  (SELECT id FROM public.profiles LIMIT 1)
FROM public.organizations o
WHERE o.status = 'active'

UNION ALL

SELECT 
  o.id,
  'Semester Planning Guide',
  '/documents/PDF3.pdf',
  (SELECT id FROM public.profiles LIMIT 1)
FROM public.organizations o
WHERE o.status = 'active';