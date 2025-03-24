-- Create risks table
CREATE TABLE IF NOT EXISTS risks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
    milestone_id UUID REFERENCES milestones(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    probability DECIMAL CHECK (probability >= 0 AND probability <= 1),
    impact INTEGER CHECK (impact >= 1 AND impact <= 10),
    mitigation_strategy TEXT,
    updates TEXT[] DEFAULT ARRAY[]::TEXT[],
    update_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view risks in their organization" ON public.risks;
DROP POLICY IF EXISTS "Users can insert risks in their organization" ON public.risks;
DROP POLICY IF EXISTS "Users can update risks in their organization" ON public.risks;
DROP POLICY IF EXISTS "Users can delete risks in their organization" ON public.risks;

-- Drop the existing view
DROP VIEW IF EXISTS public.risk_view;

-- Disable RLS first to ensure clean state
ALTER TABLE public.risks DISABLE ROW LEVEL SECURITY;

-- Enable RLS
ALTER TABLE public.risks ENABLE ROW LEVEL SECURITY;

-- Create view for risks with program and organization info
CREATE VIEW public.risk_view AS
SELECT 
    r.*,
    p.name as program_name,
    p.organization_id,
    o.name as organization_name,
    o.user_id as organization_user_id,
    m.title as milestone_title
FROM public.risks r
JOIN public.programs p ON r.program_id = p.id
JOIN public.organizations o ON p.organization_id = o.id
LEFT JOIN public.milestones m ON r.milestone_id = m.id;

-- First, let's create a basic policy just for SELECT to test
CREATE POLICY "Users can view risks in their organization"
    ON public.risks
    FOR SELECT
    USING (
        program_id IN (
            SELECT p.id 
            FROM public.programs p
            JOIN public.organizations o ON p.organization_id = o.id
            WHERE o.user_id = auth.uid()
        )
    );

-- Basic insert policy
CREATE POLICY "Users can insert risks in their organization"
    ON public.risks
    FOR INSERT
    WITH CHECK (
        program_id IN (
            SELECT p.id 
            FROM public.programs p
            JOIN public.organizations o ON p.organization_id = o.id
            WHERE o.user_id = auth.uid()
        )
    );

-- Basic update policy
CREATE POLICY "Users can update risks in their organization"
    ON public.risks
    FOR UPDATE
    USING (
        program_id IN (
            SELECT p.id 
            FROM public.programs p
            JOIN public.organizations o ON p.organization_id = o.id
            WHERE o.user_id = auth.uid()
        )
    );

-- Basic delete policy
CREATE POLICY "Users can delete risks in their organization"
    ON public.risks
    FOR DELETE
    USING (
        program_id IN (
            SELECT p.id 
            FROM public.programs p
            JOIN public.organizations o ON p.organization_id = o.id
            WHERE o.user_id = auth.uid()
        )
    );

-- Create indexes for better query performance
DROP INDEX IF EXISTS public.risks_program_id_idx;
CREATE INDEX risks_program_id_idx ON public.risks(program_id);

-- Grant necessary permissions
GRANT SELECT ON public.risk_view TO authenticated;
GRANT ALL ON public.risks TO authenticated;

-- Add a trigger to log auth.uid() for debugging
CREATE OR REPLACE FUNCTION public.log_auth_uid()
RETURNS TRIGGER AS $$
BEGIN
    RAISE NOTICE 'Current auth.uid(): %', auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_auth_uid_trigger
    BEFORE INSERT OR UPDATE OR DELETE ON public.risks
    FOR EACH ROW
    EXECUTE FUNCTION public.log_auth_uid(); 