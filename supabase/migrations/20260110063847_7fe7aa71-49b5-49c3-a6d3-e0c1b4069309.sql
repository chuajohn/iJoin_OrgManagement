-- Update announcements DELETE policy to include admin/SAO
DROP POLICY IF EXISTS "Officers can delete announcements " ON public.announcements;
CREATE POLICY "Officers, admin and SAO can delete announcements"
ON public.announcements
FOR DELETE
USING (
  is_org_officer(auth.uid(), org_id) 
  OR has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'sao'::app_role)
);

-- Update announcements UPDATE policy to include admin/SAO
DROP POLICY IF EXISTS "Officers can update their announcements " ON public.announcements;
CREATE POLICY "Officers, admin and SAO can update announcements"
ON public.announcements
FOR UPDATE
USING (
  is_org_officer(auth.uid(), org_id) 
  OR has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'sao'::app_role)
);

-- Update events DELETE policy to include admin/SAO
DROP POLICY IF EXISTS "Leaders can delete events " ON public.events;
CREATE POLICY "Leaders, admin and SAO can delete events"
ON public.events
FOR DELETE
USING (
  (EXISTS (
    SELECT 1 FROM memberships
    WHERE memberships.user_id = auth.uid()
    AND memberships.org_id = events.org_id
    AND memberships.status = 'accepted'::membership_status
    AND memberships.role = 'leader'::app_role
  ))
  OR has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'sao'::app_role)
);

-- Create events UPDATE policy for officers and admin/SAO
CREATE POLICY "Officers, admin and SAO can update events"
ON public.events
FOR UPDATE
USING (
  is_org_officer(auth.uid(), org_id) 
  OR has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'sao'::app_role)
);