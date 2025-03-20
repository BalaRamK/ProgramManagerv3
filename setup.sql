-- Drop existing table and policies if they exist
DROP POLICY IF EXISTS "Allow admin to see all pending users" ON public.pending_users;
DROP POLICY IF EXISTS "Allow admin to update pending users" ON public.pending_users;
DROP POLICY IF EXISTS "Allow public insert during signup" ON public.pending_users;
DROP POLICY IF EXISTS "Allow users to see their own status" ON public.pending_users;
DROP TABLE IF EXISTS public.pending_users;

-- Create pending_users table
CREATE TABLE public.pending_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending_admin_approval',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_status CHECK (status IN ('pending_admin_approval', 'approved', 'rejected'))
);

-- Enable Row Level Security
ALTER TABLE public.pending_users ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows anyone to insert
CREATE POLICY "Allow public insert during signup"
    ON public.pending_users
    FOR INSERT
    TO PUBLIC
    WITH CHECK (true);

-- Create a policy that allows anyone to select their own records
CREATE POLICY "Allow users to see their own status"
    ON public.pending_users
    FOR SELECT
    TO PUBLIC
    USING (true);

-- Create a policy that allows admin to see all records
CREATE POLICY "Allow admin to see all pending users"
    ON public.pending_users
    FOR SELECT
    TO authenticated
    USING (auth.jwt() ->> 'email' = 'balaramakrishnasaikarumanchi0@gmail.com');

-- Create a policy that allows admin to update records
CREATE POLICY "Allow admin to update pending users"
    ON public.pending_users
    FOR UPDATE
    TO authenticated
    USING (auth.jwt() ->> 'email' = 'balaramakrishnasaikarumanchi0@gmail.com');

-- Grant necessary permissions
GRANT ALL ON public.pending_users TO postgres, anon, authenticated; 