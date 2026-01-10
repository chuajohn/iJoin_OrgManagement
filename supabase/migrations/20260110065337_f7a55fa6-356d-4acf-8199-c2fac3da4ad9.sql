-- Create storage bucket for organization documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('organization-documents', 'organization-documents', true);

-- Allow officers to upload documents
CREATE POLICY "Officers can upload org documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'organization-documents' 
  AND is_org_officer(auth.uid(), (storage.foldername(name))[1]::uuid)
);

-- Allow officers to view org documents
CREATE POLICY "Officers can view org documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'organization-documents'
  AND is_org_officer(auth.uid(), (storage.foldername(name))[1]::uuid)
);

-- Allow officers to delete org documents
CREATE POLICY "Officers can delete org documents"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'organization-documents'
  AND is_org_officer(auth.uid(), (storage.foldername(name))[1]::uuid)
);

-- Allow officers to update org documents
CREATE POLICY "Officers can update org documents"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'organization-documents'
  AND is_org_officer(auth.uid(), (storage.foldername(name))[1]::uuid)
);

-- Add update policy for organization_documents table
CREATE POLICY "Officers can update documents"
ON public.organization_documents
FOR UPDATE
USING (is_org_officer(auth.uid(), org_id));