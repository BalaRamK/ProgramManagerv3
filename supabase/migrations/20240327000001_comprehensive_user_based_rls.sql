-- Drop existing policies
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Users can view their own data" ON public.%I', r.tablename);
        EXECUTE format('DROP POLICY IF EXISTS "Users can insert their own data" ON public.%I', r.tablename);
        EXECUTE format('DROP POLICY IF EXISTS "Users can update their own data" ON public.%I', r.tablename);
        EXECUTE format('DROP POLICY IF EXISTS "Users can delete their own data" ON public.%I', r.tablename);
    END LOOP;
END $$;

-- Enable RLS on all tables
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') 
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tablename);
    END LOOP;
END $$;

-- Add user_id column to tables that don't have it
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT IN ('users', 'pending_users', 'documentation')
    ) 
    LOOP
        BEGIN
            EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id)', r.tablename);
        EXCEPTION WHEN OTHERS THEN
            -- Skip if column already exists or other errors
            NULL;
        END;
    END LOOP;
END $$;

-- Create user-based policies for all tables
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT IN ('users', 'pending_users', 'documentation')
    ) 
    LOOP
        -- View policy
        EXECUTE format('
            CREATE POLICY "Users can view their own data" ON public.%I
            FOR SELECT
            USING (user_id = auth.uid())', r.tablename);

        -- Insert policy
        EXECUTE format('
            CREATE POLICY "Users can insert their own data" ON public.%I
            FOR INSERT
            WITH CHECK (user_id = auth.uid())', r.tablename);

        -- Update policy
        EXECUTE format('
            CREATE POLICY "Users can update their own data" ON public.%I
            FOR UPDATE
            USING (user_id = auth.uid())
            WITH CHECK (user_id = auth.uid())', r.tablename);

        -- Delete policy
        EXECUTE format('
            CREATE POLICY "Users can delete their own data" ON public.%I
            FOR DELETE
            USING (user_id = auth.uid())', r.tablename);
    END LOOP;
END $$;

-- Special handling for users table
CREATE POLICY "Users can view their own user data" ON public.users
FOR SELECT
USING (id = auth.uid());

CREATE POLICY "Users can update their own user data" ON public.users
FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Special handling for organizations table
CREATE POLICY "Users can view their own organization" ON public.organizations
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own organization" ON public.organizations
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own organization" ON public.organizations
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own organization" ON public.organizations
FOR DELETE
USING (user_id = auth.uid());

-- Special handling for pending_users table
-- Allow anyone to insert a pending user request (for registration)
CREATE POLICY "Anyone can insert pending user requests" ON public.pending_users
FOR INSERT
WITH CHECK (true);

-- Allow users to view their own pending status by email (for checking status)
CREATE POLICY "Users can view their own pending status by email" ON public.pending_users
FOR SELECT
USING (email = current_setting('request.jwt.claims', true)::json->>'email' OR 
       email = auth.jwt() ->> 'email');

-- Allow admins to view all pending users
CREATE POLICY "Admins can view all pending users" ON public.pending_users
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() 
        AND is_admin = true
    )
);

-- Allow admins to update pending users (for approval/rejection)
CREATE POLICY "Admins can update pending users" ON public.pending_users
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() 
        AND is_admin = true
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() 
        AND is_admin = true
    )
);

-- Allow admins to delete pending users
CREATE POLICY "Admins can delete pending users" ON public.pending_users
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() 
        AND is_admin = true
    )
);

-- Special handling for documentation table (public read-only)
CREATE POLICY "Anyone can view documentation" ON public.documentation
FOR SELECT
USING (true);

-- Special handling for reports table
CREATE POLICY "Users can view their own reports" ON public.reports
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own reports" ON public.reports
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own reports" ON public.reports
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own reports" ON public.reports
FOR DELETE
USING (user_id = auth.uid());

-- Special handling for chats table
CREATE POLICY "Users can view their own chats" ON public.chats
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own chats" ON public.chats
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own chats" ON public.chats
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own chats" ON public.chats
FOR DELETE
USING (user_id = auth.uid());

-- Create triggers to automatically set user_id on insert
CREATE OR REPLACE FUNCTION public.set_user_id_on_insert()
RETURNS TRIGGER AS $$
BEGIN
    NEW.user_id = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply the trigger to all tables with user_id column
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT IN ('users', 'pending_users', 'documentation')
    ) 
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS set_user_id_trigger ON public.%I;
            CREATE TRIGGER set_user_id_trigger
            BEFORE INSERT ON public.%I
            FOR EACH ROW
            EXECUTE FUNCTION public.set_user_id_on_insert();', 
            r.tablename, r.tablename);
    END LOOP;
END $$;

-- Grant necessary permissions
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') 
    LOOP
        EXECUTE format('GRANT ALL ON public.%I TO authenticated', r.tablename);
    END LOOP;
END $$; 