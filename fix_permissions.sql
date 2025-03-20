-- Drop existing table and policies
DROP TABLE IF EXISTS public.pending_users CASCADE;

-- Create the table
CREATE TABLE public.pending_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending_admin_approval',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.pending_users ENABLE ROW LEVEL SECURITY;

-- Create admin policy
CREATE POLICY "Enable all for admin"
ON public.pending_users
FOR ALL
TO authenticated
USING (auth.jwt() ->> 'email' = 'balaramakrishnasaikarumanchi0@gmail.com');

-- Create insert policy for public
CREATE POLICY "Enable insert for public"
ON public.pending_users
FOR INSERT
TO public
WITH CHECK (true);

-- Grant permissions
GRANT ALL ON public.pending_users TO authenticated;
GRANT INSERT ON public.pending_users TO anon;

-- Insert test data
INSERT INTO public.pending_users (email, status)
VALUES ('test@example.com', 'pending_admin_approval');

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_pending_users_email ON public.pending_users(email);
CREATE INDEX IF NOT EXISTS idx_pending_users_status ON public.pending_users(status); 