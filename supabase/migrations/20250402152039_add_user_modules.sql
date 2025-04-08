-- Add missing columns to pending_users table
ALTER TABLE public.pending_users
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'free' CHECK (role IN ('free', 'pro', 'executive')),
ADD COLUMN IF NOT EXISTS modules TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS storage_used BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS storage_limit BIGINT DEFAULT 104857600; -- 100MB default

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_pending_users_role ON public.pending_users(role);

-- Update existing records to set default values
UPDATE public.pending_users
SET 
    role = 'free',
    modules = '{}',
    storage_used = 0,
    storage_limit = 104857600
WHERE role IS NULL; 