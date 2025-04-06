-- Enable RLS on communication_logs table
ALTER TABLE public.communication_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view logs from their organization" ON public.communication_logs;
DROP POLICY IF EXISTS "Users can insert logs in their organization" ON public.communication_logs;
DROP POLICY IF EXISTS "Users can update logs in their organization" ON public.communication_logs;
DROP POLICY IF EXISTS "Users can delete logs in their organization" ON public.communication_logs;

-- Create policies for communication_logs table
CREATE POLICY "Users can view logs from their organization" ON public.communication_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND u.organization_id = communication_logs.organization_id
        )
        OR user_id = auth.uid()
    );

CREATE POLICY "Users can insert logs in their organization" ON public.communication_logs
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND u.organization_id = organization_id
        )
    );

CREATE POLICY "Users can update logs in their organization" ON public.communication_logs
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND u.organization_id = communication_logs.organization_id
        )
        OR user_id = auth.uid()
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND u.organization_id = organization_id
        )
    );

CREATE POLICY "Users can delete logs in their organization" ON public.communication_logs
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND u.organization_id = communication_logs.organization_id
        )
        OR user_id = auth.uid()
    );

-- Grant necessary permissions
GRANT ALL ON public.communication_logs TO authenticated; 