-- Add auth_user_id column to pending_users table
ALTER TABLE public.pending_users
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_pending_users_auth_user_id ON public.pending_users(auth_user_id);

-- Update existing records to set auth_user_id
UPDATE public.pending_users pu
SET auth_user_id = au.id
FROM auth.users au
WHERE pu.email = au.email
AND pu.auth_user_id IS NULL; 