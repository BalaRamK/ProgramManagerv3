-- Drop existing policies for pending_users
DROP POLICY IF EXISTS "Anyone can insert pending user requests" ON public.pending_users;
DROP POLICY IF EXISTS "Users can view their own pending status by email" ON public.pending_users;
DROP POLICY IF EXISTS "Admins can view all pending users" ON public.pending_users;
DROP POLICY IF EXISTS "Admins can update pending users" ON public.pending_users;
DROP POLICY IF EXISTS "Admins can delete pending users" ON public.pending_users;

-- Ensure RLS is enabled
ALTER TABLE public.pending_users ENABLE ROW LEVEL SECURITY;

-- Create a more permissive policy for pending_users
-- This allows anyone to insert a pending user request (for registration)
CREATE POLICY "Anyone can insert pending user requests" ON public.pending_users
FOR INSERT
WITH CHECK (true);

-- This allows anyone to view pending user requests by email
-- This is needed for the signup flow to check if an email is already pending
CREATE POLICY "Anyone can view pending users by email" ON public.pending_users
FOR SELECT
USING (true);

-- This allows admins to view all pending users
CREATE POLICY "Admins can view all pending users" ON public.pending_users
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() 
        AND is_admin = true
    )
);

-- This allows admins to update pending users (for approval/rejection)
CREATE POLICY "Admins can update pending users" ON public.pending_users
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() 
        AND is_admin = true
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() 
        AND is_admin = true
    )
);

-- This allows admins to delete pending users
CREATE POLICY "Admins can delete pending users" ON public.pending_users
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() 
        AND is_admin = true
    )
);

-- Grant necessary permissions
GRANT ALL ON public.pending_users TO authenticated;
GRANT ALL ON public.pending_users TO anon; 