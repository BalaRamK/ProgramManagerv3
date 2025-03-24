-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own organizations" ON organizations;
DROP POLICY IF EXISTS "Users can insert their own organizations" ON organizations;
DROP POLICY IF EXISTS "Users can update their own organizations" ON organizations;
DROP POLICY IF EXISTS "Users can delete their own organizations" ON organizations;

DROP POLICY IF EXISTS "Users can view users in their organization" ON users;
DROP POLICY IF EXISTS "Users can insert users in their organization" ON users;
DROP POLICY IF EXISTS "Users can update users in their organization" ON users;
DROP POLICY IF EXISTS "Users can delete users in their organization" ON users;

DROP POLICY IF EXISTS "Users can view their own programs" ON programs;
DROP POLICY IF EXISTS "Users can insert their own programs" ON programs;
DROP POLICY IF EXISTS "Users can update their own programs" ON programs;
DROP POLICY IF EXISTS "Users can delete their own programs" ON programs;

DROP POLICY IF EXISTS "Users can view their own milestones" ON milestones;
DROP POLICY IF EXISTS "Users can insert their own milestones" ON milestones;
DROP POLICY IF EXISTS "Users can update their own milestones" ON milestones;
DROP POLICY IF EXISTS "Users can delete their own milestones" ON milestones;

DROP POLICY IF EXISTS "Users can view their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON tasks;

DROP POLICY IF EXISTS "Users can view their own comments" ON comments;
DROP POLICY IF EXISTS "Users can insert their own comments" ON comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON comments;

DROP POLICY IF EXISTS "Users can view their own resources" ON resources;
DROP POLICY IF EXISTS "Users can insert their own resources" ON resources;
DROP POLICY IF EXISTS "Users can update their own resources" ON resources;
DROP POLICY IF EXISTS "Users can delete their own resources" ON resources;

-- Create policies for organizations table
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

-- Create policies for users table
CREATE POLICY "Users can view users in their organization"
ON users FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM organizations
    WHERE organizations.id = users.organization_id
    AND organizations.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert users in their organization"
ON users FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM organizations
    WHERE organizations.id = users.organization_id
    AND organizations.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update users in their organization"
ON users FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM organizations
    WHERE organizations.id = users.organization_id
    AND organizations.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM organizations
    WHERE organizations.id = users.organization_id
    AND organizations.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete users in their organization"
ON users FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM organizations
    WHERE organizations.id = users.organization_id
    AND organizations.user_id = auth.uid()
  )
);

-- Create policies for programs table
CREATE POLICY "Users can view their own programs"
ON programs FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own programs"
ON programs FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own programs"
ON programs FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own programs"
ON programs FOR DELETE
USING (user_id = auth.uid());

-- Create policies for milestones table
CREATE POLICY "Users can view their own milestones"
ON milestones FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own milestones"
ON milestones FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own milestones"
ON milestones FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own milestones"
ON milestones FOR DELETE
USING (user_id = auth.uid());

-- Create policies for tasks table
CREATE POLICY "Users can view their own tasks"
ON tasks FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own tasks"
ON tasks FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own tasks"
ON tasks FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own tasks"
ON tasks FOR DELETE
USING (user_id = auth.uid());

-- Create policies for comments table
CREATE POLICY "Users can view their own comments"
ON comments FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own comments"
ON comments FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own comments"
ON comments FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own comments"
ON comments FOR DELETE
USING (user_id = auth.uid());

-- Create policies for resources table
CREATE POLICY "Users can view their own resources"
ON resources FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own resources"
ON resources FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own resources"
ON resources FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own resources"
ON resources FOR DELETE
USING (user_id = auth.uid()); 