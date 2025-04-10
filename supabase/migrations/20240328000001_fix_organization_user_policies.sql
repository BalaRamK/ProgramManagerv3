-- Drop existing organization policies
DROP POLICY IF EXISTS "Users can view their own organization" ON public.organizations;
DROP POLICY IF EXISTS "Users can insert their own organization" ON public.organizations;
DROP POLICY IF EXISTS "Users can update their own organization" ON public.organizations;
DROP POLICY IF EXISTS "Users can delete their own organization" ON public.organizations;

-- Drop existing user policies
DROP POLICY IF EXISTS "Users can view users in their organization" ON public.users;
DROP POLICY IF EXISTS "Users can insert users in their organization" ON public.users;
DROP POLICY IF EXISTS "Users can update users in their organization" ON public.users;
DROP POLICY IF EXISTS "Users can delete users in their organization" ON public.users;

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create organization policies
CREATE POLICY "Users can view their own organization"
  ON public.organizations FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own organization"
  ON public.organizations FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own organization"
  ON public.organizations FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own organization"
  ON public.organizations FOR DELETE
  USING (user_id = auth.uid());

-- Create user policies
CREATE POLICY "Users can view their own user data"
  ON public.users FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update their own user data"
  ON public.users FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Create view for organizations with security barrier
DROP VIEW IF EXISTS public.organization_view CASCADE;
CREATE VIEW public.organization_view WITH (security_barrier = true) AS
SELECT 
    o.*,
    u.email as user_email,
    u.full_name as user_full_name
FROM organizations o
LEFT JOIN users u ON o.user_id = u.id;

-- Create view for users with security barrier
DROP VIEW IF EXISTS public.user_view CASCADE;
CREATE VIEW public.user_view WITH (security_barrier = true) AS
SELECT 
    u.*,
    o.name as organization_name
FROM users u
LEFT JOIN organizations o ON u.organization_id = o.id;

-- Grant necessary permissions
GRANT SELECT ON public.organization_view TO authenticated;
GRANT SELECT ON public.user_view TO authenticated;
GRANT ALL ON public.organizations TO authenticated;
GRANT ALL ON public.users TO authenticated; 