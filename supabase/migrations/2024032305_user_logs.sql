-- Create user_logs table
CREATE TABLE IF NOT EXISTS public.user_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS policies
ALTER TABLE public.user_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin can read all logs" ON public.user_logs;
DROP POLICY IF EXISTS "Admin can insert logs" ON public.user_logs;

-- Allow admin to read all logs
CREATE POLICY "Admin can read all logs"
    ON public.user_logs
    FOR SELECT
    TO authenticated
    USING (
        auth.jwt() ->> 'email' = 'balaramakrishnasaikarumanchi0@gmail.com'
    );

-- Allow admin to insert logs
CREATE POLICY "Admin can insert logs"
    ON public.user_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.jwt() ->> 'email' = 'balaramakrishnasaikarumanchi0@gmail.com'
    );

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_user_logs_user_id ON public.user_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_logs_created_at ON public.user_logs(created_at DESC); 