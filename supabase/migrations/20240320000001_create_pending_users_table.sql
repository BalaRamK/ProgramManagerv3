-- Create pending_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.pending_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.pending_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Anyone can view pending users" ON public.pending_users;
    DROP POLICY IF EXISTS "Authenticated users can insert pending users" ON public.pending_users;
EXCEPTION
    WHEN undefined_object THEN
END $$;

-- Create policies
CREATE POLICY "Anyone can view pending users"
  ON public.pending_users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert pending users"
  ON public.pending_users FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create or replace the function to automatically update updated_at
CREATE OR REPLACE FUNCTION public.handle_pending_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists and create it again
DROP TRIGGER IF EXISTS set_pending_users_updated_at ON public.pending_users;
CREATE TRIGGER set_pending_users_updated_at
    BEFORE UPDATE ON public.pending_users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_pending_users_updated_at(); 