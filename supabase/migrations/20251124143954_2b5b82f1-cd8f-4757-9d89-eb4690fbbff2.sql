-- Create storage bucket for event PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-documents', 'event-documents', true);

-- Add document_url column to events table
ALTER TABLE public.events
ADD COLUMN document_url text;

-- Create RLS policies for event documents bucket
CREATE POLICY "Leaders can upload event documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT org_id::text 
    FROM public.memberships 
    WHERE user_id = auth.uid() 
    AND status = 'accepted' 
    AND role IN ('officer', 'leader')
  )
);

CREATE POLICY "Anyone can view event documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'event-documents');

CREATE POLICY "Leaders can delete their org's event documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'event-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT org_id::text 
    FROM public.memberships 
    WHERE user_id = auth.uid() 
    AND status = 'accepted' 
    AND role IN ('officer', 'leader')
  )
);