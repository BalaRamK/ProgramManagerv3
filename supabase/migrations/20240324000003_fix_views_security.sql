-- Drop existing views
DROP VIEW IF EXISTS public.milestone_view CASCADE;
DROP VIEW IF EXISTS public.goal_progress_view CASCADE;
DROP VIEW IF EXISTS public.risk_view CASCADE;
DROP VIEW IF EXISTS public.risks_view CASCADE;
DROP VIEW IF EXISTS public.profits_monthly CASCADE;

-- Recreate milestone_view with security barrier
CREATE VIEW public.milestone_view WITH (security_barrier = true) AS
SELECT 
    m.*,
    g.program_id,
    g.name as goal_name,
    p.name as program_name
FROM milestones m
JOIN goals g ON g.id = m.goal_id
JOIN programs p ON p.id = g.program_id;

-- Recreate goal_progress_view with security barrier
CREATE VIEW public.goal_progress_view WITH (security_barrier = true) AS
SELECT 
    g.*,
    p.name as program_name,
    COUNT(m.id) as total_milestones,
    COUNT(CASE WHEN m.status = 'completed' THEN 1 END) as completed_milestones,
    COALESCE(AVG(m.progress), 0) as average_progress
FROM goals g
LEFT JOIN milestones m ON m.goal_id = g.id
JOIN programs p ON p.id = g.program_id
GROUP BY g.id, p.name;

-- Recreate risk_view with security barrier
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

-- Recreate risks_view with security barrier (alias for risk_view)
CREATE VIEW public.risks_view WITH (security_barrier = true) AS
SELECT * FROM public.risk_view;

-- Recreate profits_monthly view with security barrier
CREATE VIEW public.profits_monthly WITH (security_barrier = true) AS
SELECT 
    DATE_TRUNC('month', r.created_at) as month,
    r.organization_id,
    o.name as organization_name,
    SUM(r.revenue_amount) as revenue,
    COALESCE(SUM(vc.cost), 0) as vendor_costs,
    SUM(r.revenue_amount) - COALESCE(SUM(vc.cost), 0) as profit
FROM revenues r
LEFT JOIN vendor_costs vc ON 
    DATE_TRUNC('month', vc.start_date) = DATE_TRUNC('month', r.created_at) 
    AND vc.organization_id = r.organization_id
JOIN organizations o ON o.id = r.organization_id
GROUP BY 
    DATE_TRUNC('month', r.created_at),
    r.organization_id,
    o.name
ORDER BY 
    DATE_TRUNC('month', r.created_at) DESC,
    r.organization_id;

-- Grant necessary permissions
GRANT SELECT ON public.milestone_view TO authenticated;
GRANT SELECT ON public.goal_progress_view TO authenticated;
GRANT SELECT ON public.risk_view TO authenticated;
GRANT SELECT ON public.risks_view TO authenticated;
GRANT SELECT ON public.profits_monthly TO authenticated; 