-- Create pending_users table
CREATE TABLE IF NOT EXISTS public.pending_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending_admin_approval',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_status CHECK (status IN ('pending_admin_approval', 'approved', 'rejected'))
);

-- Enable Row Level Security
ALTER TABLE public.pending_users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow admin to see all pending users"
    ON public.pending_users
    FOR SELECT
    TO authenticated
    USING (auth.jwt() ->> 'email' = 'balaramakrishnasaikarumanchi0@gmail.com');

CREATE POLICY "Allow admin to update pending users"
    ON public.pending_users
    FOR UPDATE
    TO authenticated
    USING (auth.jwt() ->> 'email' = 'balaramakrishnasaikarumanchi0@gmail.com');

-- Allow anyone to insert during signup
CREATE POLICY "Allow public insert during signup"
    ON public.pending_users
    FOR INSERT
    TO anon
    WITH CHECK (true);

CREATE POLICY "Allow users to see their own status"
    ON public.pending_users
    FOR SELECT
    TO authenticated
    USING (auth.jwt() ->> 'email' = email); 