-- Create pending_users table if not exists
CREATE TABLE IF NOT EXISTS public.pending_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- Enable Row Level Security
ALTER TABLE public.pending_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access to pending_users" ON pending_users;
DROP POLICY IF EXISTS "Allow public insert to pending_users" ON pending_users;
DROP POLICY IF EXISTS "Allow admins to manage pending_users" ON pending_users;

-- Create policies for pending_users
CREATE POLICY "Allow public read access to pending_users"
    ON public.pending_users
    FOR SELECT
    TO PUBLIC
    USING (true);

CREATE POLICY "Allow public insert to pending_users"
    ON public.pending_users
    FOR INSERT
    TO PUBLIC
    WITH CHECK (true);

CREATE POLICY "Allow admins to manage pending_users"
    ON public.pending_users
    FOR ALL
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin');

-- Create or update auth trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the user is in pending_users and approved
    IF EXISTS (
        SELECT 1 FROM public.pending_users 
        WHERE email = NEW.email 
        AND status = 'approved'
    ) THEN
        -- If approved, allow the sign up
        RETURN NEW;
    ELSE
        -- If not approved or not in pending_users, raise an error
        RAISE EXCEPTION 'User registration not allowed. Please request access first.';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
    BEFORE INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Enable email confirmations in auth.users
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create auth.config table if it doesn't exist
CREATE TABLE IF NOT EXISTS auth.config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- Update auth settings
BEGIN;
INSERT INTO auth.config (key, value)
  VALUES
    ('SECURITY_EMAIL_CONFIRMATION_REQUIRED', 'true'),
    ('MAILER_SECURE_EMAIL_CHANGE_ENABLED', 'true'),
    ('SECURITY_UPDATE_PASSWORD_REQUIRE_REAUTHENTICATION', 'true')
  ON CONFLICT (key) DO UPDATE
  SET value = EXCLUDED.value;
COMMIT; 