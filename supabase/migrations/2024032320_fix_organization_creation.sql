-- Drop existing policies for organizations
DROP POLICY IF EXISTS "Users can view their own organizations" ON organizations;
DROP POLICY IF EXISTS "Users can insert their own organizations" ON organizations;
DROP POLICY IF EXISTS "Users can update their own organizations" ON organizations;
DROP POLICY IF EXISTS "Users can delete their own organizations" ON organizations;

-- Create new policies for organizations that allow creation
CREATE POLICY "Users can view their own organizations"
ON organizations FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own organizations"
ON organizations FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own organizations"
ON organizations FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own organizations"
ON organizations FOR DELETE
USING (user_id = auth.uid());

-- Create a function to handle organization creation
CREATE OR REPLACE FUNCTION public.handle_organization_creation()
RETURNS trigger AS $$
BEGIN
  -- Set the user_id to the authenticated user's ID
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to automatically set user_id on organization creation
DROP TRIGGER IF EXISTS on_organization_created ON organizations;
CREATE TRIGGER on_organization_created
  BEFORE INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_organization_creation(); 