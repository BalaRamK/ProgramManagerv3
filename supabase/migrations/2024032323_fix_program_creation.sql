-- Drop existing policies for programs
DROP POLICY IF EXISTS "Users can view their own programs" ON programs;
DROP POLICY IF EXISTS "Users can insert their own programs" ON programs;
DROP POLICY IF EXISTS "Users can update their own programs" ON programs;
DROP POLICY IF EXISTS "Users can delete their own programs" ON programs;

-- Create new policies for programs that allow organization-based access
CREATE POLICY "Users can view programs in their organization"
ON programs FOR SELECT
USING (
    user_id = auth.uid() OR
    organization_id IN (
        SELECT id FROM organizations WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert programs in their organization"
ON programs FOR INSERT
WITH CHECK (
    user_id = auth.uid() OR
    organization_id IN (
        SELECT id FROM organizations WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can update programs in their organization"
ON programs FOR UPDATE
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

CREATE POLICY "Users can delete programs in their organization"
ON programs FOR DELETE
USING (
    user_id = auth.uid() OR
    organization_id IN (
        SELECT id FROM organizations WHERE user_id = auth.uid()
    )
);

-- Drop existing policies for users
DROP POLICY IF EXISTS "Users can view users in their organization" ON users;
DROP POLICY IF EXISTS "Users can insert users in their organization" ON users;
DROP POLICY IF EXISTS "Users can update users in their organization" ON users;
DROP POLICY IF EXISTS "Users can delete users in their organization" ON users;

-- Create new policies for users that allow organization-based access
CREATE POLICY "Users can view users in their organization"
ON users FOR SELECT
USING (
    id = auth.uid() OR
    organization_id IN (
        SELECT id FROM organizations WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert users in their organization"
ON users FOR INSERT
WITH CHECK (
    id = auth.uid() OR
    organization_id IN (
        SELECT id FROM organizations WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can update users in their organization"
ON users FOR UPDATE
USING (
    id = auth.uid() OR
    organization_id IN (
        SELECT id FROM organizations WHERE user_id = auth.uid()
    )
)
WITH CHECK (
    id = auth.uid() OR
    organization_id IN (
        SELECT id FROM organizations WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can delete users in their organization"
ON users FOR DELETE
USING (
    id = auth.uid() OR
    organization_id IN (
        SELECT id FROM organizations WHERE user_id = auth.uid()
    )
);

-- Create a function to handle program creation
CREATE OR REPLACE FUNCTION public.handle_program_creation()
RETURNS trigger AS $$
BEGIN
  -- Set the user_id to the authenticated user's ID
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to automatically set user_id on program creation
DROP TRIGGER IF EXISTS on_program_created ON programs;
CREATE TRIGGER on_program_created
  BEFORE INSERT ON programs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_program_creation(); 