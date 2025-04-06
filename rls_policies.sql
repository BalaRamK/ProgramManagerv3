-- Enable RLS on risks table (if not already enabled)
ALTER TABLE public.risks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view risks for programs in their organizations" ON public.risks;
DROP POLICY IF EXISTS "Users can insert risks for programs in their organizations" ON public.risks;
DROP POLICY IF EXISTS "Users can update risks for programs in their organizations" ON public.risks;
DROP POLICY IF EXISTS "Users can delete risks for programs in their organizations" ON public.risks;

-- Create policies for risks table
CREATE POLICY "Users can view risks for programs in their organizations" ON public.risks
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.programs p
            JOIN public.users u ON p.organization_id = u.organization_id
            WHERE p.id = risks.program_id
            AND u.id = auth.uid()
        )
        OR created_by = auth.uid()
    );

CREATE POLICY "Users can insert risks for programs in their organizations" ON public.risks
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.programs p
            JOIN public.users u ON p.organization_id = u.organization_id
            WHERE p.id = program_id
            AND u.id = auth.uid()
        )
    );

CREATE POLICY "Users can update risks for programs in their organizations" ON public.risks
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.programs p
            JOIN public.users u ON p.organization_id = u.organization_id
            WHERE p.id = risks.program_id
            AND u.id = auth.uid()
        )
        OR created_by = auth.uid()
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.programs p
            JOIN public.users u ON p.organization_id = u.organization_id
            WHERE p.id = program_id
            AND u.id = auth.uid()
        )
    );

CREATE POLICY "Users can delete risks for programs in their organizations" ON public.risks
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.programs p
            JOIN public.users u ON p.organization_id = u.organization_id
            WHERE p.id = risks.program_id
            AND u.id = auth.uid()
        )
        OR created_by = auth.uid()
    );

-- Drop and recreate both views with security barrier
DROP VIEW IF EXISTS public.risk_view;
DROP VIEW IF EXISTS public.risks_view;

-- Create risk_view with security barrier
CREATE VIEW public.risk_view WITH (security_barrier = true) AS
select
  r.id,
  r.program_id,
  r.milestone_id,
  r.description,
  r.probability,
  r.impact,
  r.mitigation_strategy,
  r.created_at,
  r.update,
  r.update_date,
  r.status,
  r.created_by,
  p.name as program_name,
  o.name as organization_name,
  m.title as milestone_title
from
  risks r
  left join programs p on r.program_id = p.id
  left join organizations o on p.organization_id = o.id
  left join milestones m on r.milestone_id = m.id;

-- Create risks_view with security barrier
CREATE VIEW public.risks_view WITH (security_barrier = true) AS
select
  r.id,
  r.program_id,
  r.milestone_id,
  r.description,
  r.probability,
  r.impact,
  r.mitigation_strategy,
  r.created_at,
  r.update,
  r.update_date,
  r.status,
  r.created_by,
  p.name as program_name,
  o.name as organization_name,
  m.title as milestone_title
from
  risks r
  left join programs p on r.program_id = p.id
  left join organizations o on p.organization_id = o.id
  left join milestones m on r.milestone_id = m.id;

-- Grant necessary permissions
GRANT SELECT ON public.risk_view TO authenticated;
GRANT SELECT ON public.risks_view TO authenticated;
GRANT ALL ON public.risks TO authenticated; 