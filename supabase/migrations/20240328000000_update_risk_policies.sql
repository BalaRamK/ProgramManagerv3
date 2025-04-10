-- Drop existing policies
DROP POLICY IF EXISTS "Users can view risks in their organization" ON public.risks;
DROP POLICY IF EXISTS "Users can insert risks in their organization" ON public.risks;
DROP POLICY IF EXISTS "Users can update risks in their organization" ON public.risks;
DROP POLICY IF EXISTS "Users can delete risks in their organization" ON public.risks;

-- Create new policies that only allow users to see their own risks
CREATE POLICY "Users can view their own risks"
  ON public.risks FOR SELECT
  USING (created_by = auth.uid());

CREATE POLICY "Users can insert their own risks"
  ON public.risks FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own risks"
  ON public.risks FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own risks"
  ON public.risks FOR DELETE
  USING (created_by = auth.uid());

-- Update risk_view to ensure it inherits RLS from the base table
DROP VIEW IF EXISTS public.risk_view;
CREATE VIEW public.risk_view WITH (security_barrier = true) AS
SELECT 
    r.*,
    p.name as program_name,
    o.name as organization_name,
    m.title as milestone_title
FROM risks r
LEFT JOIN programs p ON r.program_id = p.id
LEFT JOIN organizations o ON p.organization_id = o.id
LEFT JOIN milestones m ON r.milestone_id = m.id;

-- Grant necessary permissions
GRANT SELECT ON public.risk_view TO authenticated;
GRANT ALL ON public.risks TO authenticated; 