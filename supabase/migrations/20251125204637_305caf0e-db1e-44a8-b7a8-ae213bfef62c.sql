-- Add image_url column to announcements table
ALTER TABLE public.announcements ADD COLUMN image_url text;

-- Create storage bucket for announcement images
INSERT INTO storage.buckets (id, name, public)
VALUES ('announcement-images', 'announcement-images', true);

-- Storage policies for announcement images
CREATE POLICY "Anyone can view announcement images"
ON storage.objects FOR SELECT
USING (bucket_id = 'announcement-images');

CREATE POLICY "Officers can upload announcement images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'announcement-images' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Officers can update their announcement images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'announcement-images'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Officers can delete their announcement images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'announcement-images'
  AND auth.uid() IS NOT NULL
);

-- Add DELETE policy for announcements (officers and leaders can delete)
CREATE POLICY "Officers can delete announcements"
ON public.announcements FOR DELETE
USING (is_org_officer(auth.uid(), org_id));

-- Add DELETE policy for events (only leaders can delete)
CREATE POLICY "Leaders can delete events"
ON public.events FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.memberships
    WHERE user_id = auth.uid()
    AND org_id = events.org_id
    AND status = 'accepted'
    AND role = 'leader'
  )
);