-- Allow users to delete their own membership (leave organization)
CREATE POLICY "Users can delete own membership"
ON public.memberships
FOR DELETE
USING (user_id = auth.uid());