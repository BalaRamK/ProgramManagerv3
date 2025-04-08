-- Drop existing policies
DROP POLICY IF EXISTS "Allow public insert during signup" ON public.pending_users;
DROP POLICY IF EXISTS "Allow public read own status" ON public.pending_users;
DROP POLICY IF EXISTS "Allow admin full access" ON public.pending_users;
DROP POLICY IF EXISTS "Allow authenticated users to insert pending users" ON public.pending_users;
DROP POLICY IF EXISTS "Allow users to check their own status" ON public.pending_users;
DROP POLICY IF EXISTS "Allow admins to manage pending users" ON public.pending_users;

-- Create new policies
CREATE POLICY "Allow public insert during signup"
ON public.pending_users
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow public read own status"
ON public.pending_users
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow admin full access"
ON public.pending_users
FOR ALL
TO authenticated
USING (current_setting('request.jwt.claims')::json->>'email' = 'balaramakrishnasaikarumanchi0@gmail.com')
WITH CHECK (current_setting('request.jwt.claims')::json->>'email' = 'balaramakrishnasaikarumanchi0@gmail.com');

-- Grant necessary permissions
GRANT ALL ON public.pending_users TO authenticated;
GRANT INSERT, SELECT ON public.pending_users TO anon;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated; 