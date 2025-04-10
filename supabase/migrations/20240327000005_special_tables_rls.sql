-- Special handling for the users table
-- Enable RLS on the users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for the users table
DROP POLICY IF EXISTS "Users can view their own user data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own user data" ON public.users;
DROP POLICY IF EXISTS "Admins can manage users" ON public.users;
DROP POLICY IF EXISTS "Admins can select all users" ON public.users;
DROP POLICY IF EXISTS "Admins can insert users" ON public.users;
DROP POLICY IF EXISTS "Admins can update users" ON public.users;
DROP POLICY IF EXISTS "Admins can deletxe any user" ON public.users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Enable update for users" ON public.users;
DROP POLICY IF EXISTS "Internal users can select all users" ON public.users;
DROP POLICY IF EXISTS "Internal users can insert users" ON public.users;
DROP POLICY IF EXISTS "Internal users can update users" ON public.users;
DROP POLICY IF EXISTS "Internal users can delete any user" ON public.users;

-- Users can view their own record
CREATE POLICY "Users can view their own user data" ON public.users
FOR SELECT
USING (id = auth.uid());

-- Users can update their own record
CREATE POLICY "Users can update their own user data" ON public.users
FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Internal users can view all users
CREATE POLICY "Internal users can select all users" ON public.users
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND user_type = 'internal'
    )
);

-- Internal users can insert users
CREATE POLICY "Internal users can insert users" ON public.users
FOR INSERT
WITH CHECK (
    -- The user performing the action must be an internal user
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND user_type = 'internal'
    )
);

-- Internal users can update users
CREATE POLICY "Internal users can update users" ON public.users
FOR UPDATE
USING (
    -- The user performing the action must be an internal user
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND user_type = 'internal'
    )
);

-- Internal users can delete users
CREATE POLICY "Internal users can delete any user" ON public.users
FOR DELETE
USING (
    -- The user performing the action must be an internal user
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND user_type = 'internal'
    )
    AND
    -- Cannot delete the primary internal user
    id <> (SELECT id FROM public.users WHERE email = 'balaramakrishnasaikarumanchi0@gmail.com')
);

-- Special handling for the pending_users table
-- Enable RLS on the pending_users table
ALTER TABLE public.pending_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for the pending_users table
DROP POLICY IF EXISTS "Anyone can insert pending user requests" ON public.pending_users;
DROP POLICY IF EXISTS "Users can view their own pending status" ON public.pending_users;
DROP POLICY IF EXISTS "Internal users can view all pending users" ON public.pending_users;
DROP POLICY IF EXISTS "Internal users can update pending users" ON public.pending_users;
DROP POLICY IF EXISTS "Internal users can delete pending users" ON public.pending_users;

-- Anyone can insert pending user requests
CREATE POLICY "Anyone can insert pending user requests" ON public.pending_users
FOR INSERT
WITH CHECK (true);

-- Users can view their own pending status
CREATE POLICY "Users can view their own pending status" ON public.pending_users
FOR SELECT
USING (
    -- Match by email from JWT claims or the email in the table
    email = auth.jwt() ->> 'email' OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Internal users can view all pending users
CREATE POLICY "Internal users can view all pending users" ON public.pending_users
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND user_type = 'internal'
    )
);

-- Internal users can update pending users
CREATE POLICY "Internal users can update pending users" ON public.pending_users
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND user_type = 'internal'
    )
);

-- Internal users can delete pending users
CREATE POLICY "Internal users can delete pending users" ON public.pending_users
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND user_type = 'internal'
    )
);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pending_users TO authenticated; 