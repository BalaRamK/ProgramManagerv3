-- Drop existing policies on relevant tables
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename != 'pending_users') 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Users can view their own data" ON public.%I CASCADE', r.tablename);
        EXECUTE format('DROP POLICY IF EXISTS "Users can insert their own data" ON public.%I CASCADE', r.tablename);
        EXECUTE format('DROP POLICY IF EXISTS "Users can update their own data" ON public.%I CASCADE', r.tablename);
        EXECUTE format('DROP POLICY IF EXISTS "Users can delete their own data" ON public.%I CASCADE', r.tablename);
        -- Drop specific users table policies if they exist from previous attempts
        IF r.tablename = 'users' THEN
            EXECUTE format('DROP POLICY IF EXISTS "Users can view their own user data" ON public.%I CASCADE', r.tablename);
            EXECUTE format('DROP POLICY IF EXISTS "Users can update their own user data" ON public.%I CASCADE', r.tablename);
            EXECUTE format('DROP POLICY IF EXISTS "Admins can manage users" ON public.%I CASCADE', r.tablename);
            EXECUTE format('DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.%I CASCADE', r.tablename);
             EXECUTE format('DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.%I CASCADE', r.tablename);
             EXECUTE format('DROP POLICY IF EXISTS "Enable update for users" ON public.%I CASCADE', r.tablename);
        END IF;
         -- Drop specific organizations table policies if they exist from previous attempts
        IF r.tablename = 'organizations' THEN
             EXECUTE format('DROP POLICY IF EXISTS "Users can view their own organization" ON public.%I CASCADE', r.tablename);
             EXECUTE format('DROP POLICY IF EXISTS "Users can insert their own organization" ON public.%I CASCADE', r.tablename);
             EXECUTE format('DROP POLICY IF EXISTS "Users can update their own organization" ON public.%I CASCADE', r.tablename);
             EXECUTE format('DROP POLICY IF EXISTS "Users can delete their own organization" ON public.%I CASCADE', r.tablename);
        END IF;
    END LOOP;
END $$;

-- Enable RLS on all tables except pending_users
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename != 'pending_users') 
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tablename);
    END LOOP;
END $$;

-- Add user_id column to tables that don't have it (excluding users and pending_users)
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT IN ('users', 'pending_users') -- Exclude users and pending_users
    ) 
    LOOP
        -- Check if user_id column exists before attempting to add it
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = r.tablename 
            AND column_name = 'user_id'
        ) THEN
            BEGIN
                EXECUTE format('ALTER TABLE public.%I ADD COLUMN user_id UUID REFERENCES auth.users(id)', r.tablename);
            EXCEPTION WHEN duplicate_column THEN
                -- Column already exists, ignore the error
                NULL;
            WHEN others THEN
                -- Re-raise other errors
                RAISE;
            END;
        END IF;
    END LOOP;
END $$;

-- Backfill user_id for existing rows with a default admin user
DO $$ 
DECLARE 
    r RECORD;
    admin_user_id UUID;
BEGIN
    -- Get the UUID for the specified admin email
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'balaramakrishnasaikarumanchi0@gmail.com' 
    LIMIT 1;

    -- Check if the admin user was found
    IF admin_user_id IS NULL THEN
        RAISE WARNING 'Admin user with email % not found in auth.users. Skipping user_id backfill.', 'balaramakrishnasaikarumanchi0@gmail.com';
        RETURN;
    END IF;

    -- Loop through tables that potentially had user_id added or already existed
    FOR r IN (
        SELECT table_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND column_name = 'user_id' 
        AND table_name NOT IN ('users', 'pending_users') -- Exclude tables without standard user_id RLS
    ) 
    LOOP
        BEGIN
            EXECUTE format('UPDATE public.%I SET user_id = %L WHERE user_id IS NULL', r.table_name, admin_user_id);
        EXCEPTION WHEN OTHERS THEN
            -- Log warning if update fails for a specific table
            RAISE WARNING 'Failed to backfill user_id for table %. Error: %', r.table_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- Create generic user-based policies for all tables except users and pending_users
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT IN ('users', 'pending_users') -- Exclude users and pending_users
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

-- Special handling for the public.users table
-- Users can view their own record
DROP POLICY IF EXISTS "Users can view their own user data" ON public.users;
CREATE POLICY "Users can view their own user data" ON public.users
FOR SELECT
USING (id = auth.uid());

-- Users can update their own record (Simplest Check)
DROP POLICY IF EXISTS "Users can update their own user data" ON public.users;
CREATE POLICY "Users can update their own user data" ON public.users
FOR UPDATE
USING (id = auth.uid())
WITH CHECK (
    NEW.id = auth.uid() -- Simplest check: Ensure they are updating their own ID
);

-- Admin Policies (using user_type = 'admin')
DROP POLICY IF EXISTS "Admins can manage users" ON public.users; -- Drop old combined policy
DROP POLICY IF EXISTS "Admins can select all users" ON public.users;
DROP POLICY IF EXISTS "Admins can insert users" ON public.users;
DROP POLICY IF EXISTS "Admins can update users" ON public.users;
DROP POLICY IF EXISTS "Admins can delete any user" ON public.users;

-- Admins SELECT Policy: Admins can view any user
CREATE POLICY "Admins can select all users" ON public.users
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND user_type = 'admin'
    )
);

-- Admins INSERT Policy: Admins can insert users (WITH CHECK commented out for debugging)
DROP POLICY IF EXISTS "Admins can insert users" ON public.users;
CREATE POLICY "Admins can insert users" ON public.users
FOR INSERT;

-- Admins UPDATE Policy: Admins can update users (WITH CHECK commented out for debugging)
DROP POLICY IF EXISTS "Admins can update users" ON public.users;
CREATE POLICY "Admins can update users" ON public.users
FOR UPDATE
USING (
    -- The user performing the action must be an admin (determines WHICH rows can be updated)
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND user_type = 'admin'
    )
);
-- WITH CHECK (
--      -- The user performing the action must be an admin (redundant check for safety)
--     EXISTS (
--         SELECT 1 FROM public.users
--         WHERE id = auth.uid() AND user_type = 'admin'
--     )
--     AND
--     -- Restriction: If the updated user type is 'admin', the updater must be the primary admin
--     (NEW.user_type <> 'admin' OR auth.jwt() ->> 'email' = 'balaramakrishnasaikarumanchi0@gmail.com')
-- );

-- Admins DELETE Policy: Admins can delete any user
CREATE POLICY "Admins can delete any user" ON public.users
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND user_type = 'admin'
    )
);

-- Create function to automatically set user_id on insert
CREATE OR REPLACE FUNCTION public.auto_set_user_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user_id column exists in the target table
  IF EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_schema = TG_TABLE_SCHEMA 
      AND table_name = TG_TABLE_NAME 
      AND column_name = 'user_id'
  ) THEN
    -- Set user_id to the authenticated user's ID
    NEW.user_id = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply the trigger to all tables with a user_id column (excluding users and pending_users)
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT table_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND column_name = 'user_id' 
        AND table_name NOT IN ('users', 'pending_users')
    ) 
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trigger_auto_set_user_id ON public.%I', r.table_name);
        EXECUTE format('
            CREATE TRIGGER trigger_auto_set_user_id
            BEFORE INSERT ON public.%I
            FOR EACH ROW
            EXECUTE FUNCTION public.auto_set_user_id()', r.table_name);
    END LOOP;
END $$;

-- Grant necessary permissions to authenticated users
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename != 'pending_users') 
    LOOP
        EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', r.tablename);
    END LOOP;
END $$; 