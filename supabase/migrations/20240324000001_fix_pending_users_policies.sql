-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view pending users" ON public.pending_users;
DROP POLICY IF EXISTS "Authenticated users can insert pending users" ON public.pending_users;

-- Create new policies
CREATE POLICY "Allow users to check their own status"
  ON public.pending_users FOR SELECT
  TO anon, authenticated
  USING (email = current_user OR (auth.role() = 'authenticated' AND auth.email() = email));

CREATE POLICY "Allow authenticated users to insert pending users"
  ON public.pending_users FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow admins to manage pending users"
  ON public.pending_users
  TO authenticated
  USING (auth.email() IN (SELECT email FROM public.users WHERE role = 'admin'))
  WITH CHECK (auth.email() IN (SELECT email FROM public.users WHERE role = 'admin'));

-- Grant necessary permissions
GRANT SELECT ON public.pending_users TO anon;
GRANT ALL ON public.pending_users TO authenticated; 