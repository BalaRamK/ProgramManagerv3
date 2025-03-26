-- Create reports table
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view reports from their organization"
    ON public.reports
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM public.users
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can create reports for their organization"
    ON public.reports
    FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM public.users
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update reports from their organization"
    ON public.reports
    FOR UPDATE
    USING (
        organization_id IN (
            SELECT organization_id FROM public.users
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can delete reports from their organization"
    ON public.reports
    FOR DELETE
    USING (
        organization_id IN (
            SELECT organization_id FROM public.users
            WHERE id = auth.uid()
        )
    );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_reports_user ON public.reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_organization ON public.reports(organization_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at);

-- Grant permissions
GRANT ALL ON public.reports TO authenticated;
