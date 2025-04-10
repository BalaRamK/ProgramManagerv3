-- Step 1: Enable RLS on all tables except pending_users
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename != 'pending_users'
    ) 
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tablename);
    END LOOP;
END $$;

-- Step 2: Add user_id column to tables that don't have it (excluding users, pending_users, and views)
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT IN ('users', 'pending_users')
    ) 
    LOOP
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
                NULL;
            WHEN others THEN
                RAISE;
            END;
        END IF;
    END LOOP;
END $$;

-- Step 3: Create basic RLS policies for regular tables
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- Handle tables
    FOR r IN (
        SELECT tablename as name, 'table' as type
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT IN ('users', 'pending_users')
    ) 
    LOOP
        -- Drop existing policies first
        EXECUTE format('DROP POLICY IF EXISTS "Users can view their own data" ON public.%I', r.name);
        EXECUTE format('DROP POLICY IF EXISTS "Users can insert their own data" ON public.%I', r.name);
        EXECUTE format('DROP POLICY IF EXISTS "Users can update their own data" ON public.%I', r.name);
        EXECUTE format('DROP POLICY IF EXISTS "Users can delete their own data" ON public.%I', r.name);

        -- Create basic policies
        EXECUTE format('
            CREATE POLICY "Users can view their own data" ON public.%I
            FOR SELECT USING (user_id = auth.uid())', r.name);

        EXECUTE format('
            CREATE POLICY "Users can insert their own data" ON public.%I
            FOR INSERT WITH CHECK (true)', r.name);

        EXECUTE format('
            CREATE POLICY "Users can update their own data" ON public.%I
            FOR UPDATE USING (user_id = auth.uid())', r.name);

        EXECUTE format('
            CREATE POLICY "Users can delete their own data" ON public.%I
            FOR DELETE USING (user_id = auth.uid())', r.name);
    END LOOP;
END $$;

-- Step 4: Create function to automatically set user_id on insert
CREATE OR REPLACE FUNCTION public.auto_set_user_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.user_id = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Apply the trigger to all tables (excluding views) with user_id
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT c.table_name 
        FROM information_schema.columns c
        JOIN pg_tables t ON c.table_name = t.tablename 
        WHERE c.table_schema = 'public' 
        AND c.column_name = 'user_id' 
        AND t.schemaname = 'public'
        AND c.table_name NOT IN ('users', 'pending_users')
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

-- Step 6: Grant permissions
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- Grant permissions on tables
    FOR r IN (
        SELECT tablename as name
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename != 'pending_users'
    ) 
    LOOP
        EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', r.name);
    END LOOP;

    -- Grant SELECT on views
    FOR r IN (
        SELECT viewname as name
        FROM pg_views 
        WHERE schemaname = 'public'
    ) 
    LOOP
        EXECUTE format('GRANT SELECT ON public.%I TO authenticated', r.name);
    END LOOP;
END $$; 