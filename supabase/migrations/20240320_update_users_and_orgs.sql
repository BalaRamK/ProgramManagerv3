-- Add description field to organizations
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS description text;

-- Create dashboard_users table
CREATE TABLE IF NOT EXISTS public.dashboard_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    organization_id UUID REFERENCES organizations(id),
    role TEXT NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_role CHECK (role IN ('user', 'admin')),
    CONSTRAINT unique_user_org UNIQUE (user_id, organization_id)
);

-- Enable Row Level Security
ALTER TABLE public.dashboard_users ENABLE ROW LEVEL SECURITY;

-- Create policies for dashboard_users
CREATE POLICY "Allow authenticated users to read dashboard_users"
    ON public.dashboard_users
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow admin to manage dashboard_users"
    ON public.dashboard_users
    FOR ALL
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