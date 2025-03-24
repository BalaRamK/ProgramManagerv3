-- Drop existing policies that might interfere with user querying
DROP POLICY IF EXISTS "Users can view users in their organization" ON users;
DROP POLICY IF EXISTS "Users can view their own record by email" ON users;
DROP POLICY IF EXISTS "Users can view their own record by id" ON users;

-- Create a more permissive policy for user querying
CREATE POLICY "Enable read access for authenticated users"
ON users FOR SELECT
TO authenticated
USING (true);

-- Create a policy for user creation
CREATE POLICY "Enable insert for authenticated users"
ON users FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create a policy for user updates
CREATE POLICY "Enable update for users"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Ensure proper permissions
GRANT SELECT, INSERT, UPDATE ON users TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Create a function to ensure user exists
CREATE OR REPLACE FUNCTION public.ensure_user_exists(user_id uuid)
RETURNS void AS $$
BEGIN
  INSERT INTO public.users (id, email, name, user_id)
  SELECT id, email, raw_user_meta_data->>'name', id
  FROM auth.users
  WHERE id = user_id
  ON CONFLICT (id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to ensure user exists before program creation
CREATE OR REPLACE FUNCTION public.ensure_user_exists_before_program()
RETURNS trigger AS $$
BEGIN
  PERFORM public.ensure_user_exists(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS ensure_user_exists_before_program ON programs;
CREATE TRIGGER ensure_user_exists_before_program
  BEFORE INSERT ON programs
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_user_exists_before_program(); 