-- Make password_hash nullable since we're using Supabase Auth
ALTER TABLE users
ALTER COLUMN password_hash DROP NOT NULL;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create a function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name, user_id)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'name', new.id)
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    user_id = EXCLUDED.user_id;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to automatically create a user record when a new auth user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Update existing users to set user_id if not set
UPDATE users
SET user_id = id
WHERE user_id IS NULL;

-- Make user_id NOT NULL after setting values
ALTER TABLE users
ALTER COLUMN user_id SET NOT NULL;

-- Drop existing policies for users
DROP POLICY IF EXISTS "Users can view users in their organization" ON users;
DROP POLICY IF EXISTS "Users can insert users in their organization" ON users;
DROP POLICY IF EXISTS "Users can update users in their organization" ON users;
DROP POLICY IF EXISTS "Users can delete users in their organization" ON users;

-- Create new policies for users that allow organization-based access
CREATE POLICY "Users can view users in their organization"
ON users FOR SELECT
USING (
    user_id = auth.uid() OR
    organization_id IN (
        SELECT id FROM organizations WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert users in their organization"
ON users FOR INSERT
WITH CHECK (
    user_id = auth.uid() OR
    organization_id IN (
        SELECT id FROM organizations WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can update users in their organization"
ON users FOR UPDATE
USING (
    user_id = auth.uid() OR
    organization_id IN (
        SELECT id FROM organizations WHERE user_id = auth.uid()
    )
)
WITH CHECK (
    user_id = auth.uid() OR
    organization_id IN (
        SELECT id FROM organizations WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can delete users in their organization"
ON users FOR DELETE
USING (
    user_id = auth.uid() OR
    organization_id IN (
        SELECT id FROM organizations WHERE user_id = auth.uid()
    )
); 