-- Backfill null user_id values with the admin user ID
DO $$ 
DECLARE 
    r RECORD;
    admin_user_id UUID;
BEGIN
    -- Get the UUID for the admin email
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'balaramakrishnasaikarumanchi0@gmail.com' 
    LIMIT 1;

    -- Check if the admin user was found
    IF admin_user_id IS NULL THEN
        RAISE WARNING 'Admin user with email % not found in auth.users. Skipping user_id backfill.', 'balaramakrishnasaikarumanchi0@gmail.com';
        RETURN;
    END IF;

    -- Loop through tables that have a user_id column
    FOR r IN (
        SELECT table_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND column_name = 'user_id' 
        AND table_name NOT IN ('users', 'pending_users') -- Exclude tables without standard user_id RLS
    ) 
    LOOP
        BEGIN
            -- Update records with null user_id to use the admin user ID
            EXECUTE format('UPDATE public.%I SET user_id = %L WHERE user_id IS NULL', r.table_name, admin_user_id);
            
            -- Log the number of updated rows
            GET DIAGNOSTICS r.row_count = ROW_COUNT;
            RAISE NOTICE 'Updated % rows in table %', r.row_count, r.table_name;
        EXCEPTION WHEN OTHERS THEN
            -- Log warning if update fails for a specific table
            RAISE WARNING 'Failed to backfill user_id for table %. Error: %', r.table_name, SQLERRM;
        END;
    END LOOP;
END $$; 