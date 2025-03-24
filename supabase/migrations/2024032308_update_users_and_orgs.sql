-- Add description field to organizations
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS description text;

-- Drop existing dashboard_users table if exists
DROP TABLE IF EXISTS public.dashboard_users;

-- Create dashboard_users table
CREATE TABLE IF NOT EXISTS public.dashboard_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    organization_id UUID REFERENCES organizations(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_role CHECK (role IN ('user', 'admin')),
    CONSTRAINT unique_email UNIQUE (email)
);

-- Enable Row Level Security
ALTER TABLE public.dashboard_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read dashboard_users" ON dashboard_users;
DROP POLICY IF EXISTS "Allow admin to manage dashboard_users" ON dashboard_users;

-- Create policies for dashboard_users
CREATE POLICY "Allow authenticated users to read dashboard_users"
    ON public.dashboard_users
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow any authenticated user to insert into dashboard_users
CREATE POLICY "Allow authenticated users to insert dashboard_users"
    ON public.dashboard_users
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Allow admins to update and delete dashboard_users
CREATE POLICY "Allow admin to update and delete dashboard_users"
    ON public.dashboard_users
    FOR UPDATE
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Allow admin to delete dashboard_users"
    ON public.dashboard_users
    FOR DELETE
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $func$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$func$ LANGUAGE plpgsql;

-- Create trigger for dashboard_users
DROP TRIGGER IF EXISTS update_dashboard_users_updated_at ON dashboard_users;
CREATE TRIGGER update_dashboard_users_updated_at
    BEFORE UPDATE ON public.dashboard_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 