-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public read access to pending_users" ON pending_users;
DROP POLICY IF EXISTS "Allow public insert to pending_users" ON pending_users;
DROP POLICY IF EXISTS "Allow admins to manage pending_users" ON pending_users;
DROP POLICY IF EXISTS "Allow users to see their own status" ON pending_users;

-- Recreate the pending_users table with correct structure
DROP TABLE IF EXISTS public.pending_users CASCADE;
CREATE TABLE public.pending_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending_admin_approval',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_status CHECK (status IN ('pending_admin_approval', 'approved', 'rejected'))
);

-- Enable RLS
ALTER TABLE public.pending_users ENABLE ROW LEVEL SECURITY;

-- Create new policies
CREATE POLICY "Allow public insert during signup"
ON public.pending_users
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Allow public read own status"
ON public.pending_users
FOR SELECT
TO public
USING (email = current_setting('request.jwt.claims')::json->>'email');

CREATE POLICY "Allow admin full access"
ON public.pending_users
FOR ALL
TO authenticated
USING (current_setting('request.jwt.claims')::json->>'email' = 'balaramakrishnasaikarumanchi0@gmail.com')
WITH CHECK (current_setting('request.jwt.claims')::json->>'email' = 'balaramakrishnasaikarumanchi0@gmail.com');

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_pending_users_updated_at
    BEFORE UPDATE ON public.pending_users
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- Grant necessary permissions
GRANT ALL ON public.pending_users TO authenticated;
GRANT ALL ON public.pending_users TO anon;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Create function to handle user approval
CREATE OR REPLACE FUNCTION public.handle_user_approval()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'approved' AND OLD.status = 'pending_admin_approval' THEN
        -- Enable the user's account in auth.users
        UPDATE auth.users
        SET raw_user_meta_data = jsonb_set(
            raw_user_meta_data,
            '{status}',
            '"approved"'
        )
        WHERE email = NEW.email;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for user approval
CREATE TRIGGER on_user_approval
    AFTER UPDATE ON public.pending_users
    FOR EACH ROW
    WHEN (NEW.status = 'approved' AND OLD.status = 'pending_admin_approval')
    EXECUTE FUNCTION public.handle_user_approval();
