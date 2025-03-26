-- Create scenarios table
CREATE TABLE IF NOT EXISTS public.scenarios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    parameter_changes JSONB NOT NULL,
    predicted_outcomes JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;

-- Create policies for scenarios
CREATE POLICY "Users can view scenarios for their programs"
    ON public.scenarios
    FOR SELECT
    USING (
        program_id IN (
            SELECT p.id FROM public.programs p
            INNER JOIN public.organizations o ON p.organization_id = o.id
            WHERE o.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert scenarios for their programs"
    ON public.scenarios
    FOR INSERT
    WITH CHECK (
        program_id IN (
            SELECT p.id FROM public.programs p
            INNER JOIN public.organizations o ON p.organization_id = o.id
            WHERE o.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update scenarios for their programs"
    ON public.scenarios
    FOR UPDATE
    USING (
        program_id IN (
            SELECT p.id FROM public.programs p
            INNER JOIN public.organizations o ON p.organization_id = o.id
            WHERE o.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete scenarios for their programs"
    ON public.scenarios
    FOR DELETE
    USING (
        program_id IN (
            SELECT p.id FROM public.programs p
            INNER JOIN public.organizations o ON p.organization_id = o.id
            WHERE o.user_id = auth.uid()
        )
    );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_scenarios_program_id ON public.scenarios(program_id);
CREATE INDEX IF NOT EXISTS idx_scenarios_created_at ON public.scenarios(created_at);

-- Grant necessary permissions
GRANT ALL ON public.scenarios TO authenticated;

-- Create trigger for updating updated_at
CREATE TRIGGER set_timestamp
    BEFORE UPDATE ON public.scenarios
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_set_timestamp(); 