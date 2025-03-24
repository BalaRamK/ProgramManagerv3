-- Create user_logs table
CREATE TABLE IF NOT EXISTS public.user_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    action TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create RLS policies for user_logs
ALTER TABLE public.user_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin can read all logs" ON public.user_logs;
DROP POLICY IF EXISTS "Admin can insert logs" ON public.user_logs;

-- Allow admin to read all logs
CREATE POLICY "Admin can read all logs" ON public.user_logs
    FOR SELECT
    TO authenticated
    USING (
        auth.jwt() ->> 'email' = 'balaramakrishnasaikarumanchi0@gmail.com'
    );

-- Allow admin to insert logs
CREATE POLICY "Admin can insert logs" ON public.user_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.jwt() ->> 'email' = 'balaramakrishnasaikarumanchi0@gmail.com'
    );

-- Update pending_users table to include new fields
ALTER TABLE public.pending_users
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'free' CHECK (role IN ('free', 'pro', 'executive')),
ADD COLUMN IF NOT EXISTS modules TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS storage_used BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS storage_limit BIGINT DEFAULT 104857600; -- 100MB default

-- Create function to update storage usage
CREATE OR REPLACE FUNCTION update_user_storage_usage()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate total storage used from all user's files
    UPDATE public.pending_users
    SET storage_used = (
        SELECT COALESCE(SUM(size), 0)
        FROM storage.objects
        WHERE owner = NEW.owner
    )
    WHERE id = NEW.owner;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update storage usage
DROP TRIGGER IF EXISTS update_storage_usage_trigger ON storage.objects;
CREATE TRIGGER update_storage_usage_trigger
    AFTER INSERT OR UPDATE OR DELETE ON storage.objects
    FOR EACH ROW
    EXECUTE FUNCTION update_user_storage_usage();

-- Create RLS policies for storage
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Users can read their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can insert their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;

-- Allow users to read their own files
CREATE POLICY "Users can read their own files" ON storage.objects
    FOR SELECT
    TO authenticated
    USING (owner = auth.uid());

-- Allow users to insert their own files
CREATE POLICY "Users can insert their own files" ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (owner = auth.uid());

-- Allow users to update their own files
CREATE POLICY "Users can update their own files" ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (owner = auth.uid())
    WITH CHECK (owner = auth.uid());

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own files" ON storage.objects
    FOR DELETE
    TO authenticated
    USING (owner = auth.uid());

-- Create function to check storage limits
CREATE OR REPLACE FUNCTION check_storage_limit()
RETURNS TRIGGER AS $$
DECLARE
    user_role TEXT;
    storage_limit BIGINT;
    current_usage BIGINT;
BEGIN
    -- Get user's role and storage limit
    SELECT role, storage_limit
    INTO user_role, storage_limit
    FROM public.pending_users
    WHERE id = NEW.owner;

    -- Calculate current usage
    SELECT COALESCE(SUM(size), 0)
    INTO current_usage
    FROM storage.objects
    WHERE owner = NEW.owner;

    -- Check if user has exceeded their storage limit
    IF current_usage + NEW.size > storage_limit THEN
        RAISE EXCEPTION 'Storage limit exceeded for user role %', user_role;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to check storage limits
DROP TRIGGER IF EXISTS check_storage_limit_trigger ON storage.objects;
CREATE TRIGGER check_storage_limit_trigger
    BEFORE INSERT OR UPDATE ON storage.objects
    FOR EACH ROW
    EXECUTE FUNCTION check_storage_limit(); 