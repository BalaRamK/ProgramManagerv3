-- Add user_id column to organizations table
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Add user_id column to milestones table
ALTER TABLE milestones 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Add user_id column to tasks table
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Add user_id column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Update existing records to set user_id based on auth.users
UPDATE organizations o
SET user_id = u.id
FROM users u
WHERE o.user_id IS NULL
AND u.email = (SELECT email FROM auth.users WHERE id = u.id);

UPDATE milestones m
SET user_id = p.user_id
FROM programs p
WHERE m.user_id IS NULL
AND m.program_id = p.id;

UPDATE tasks t
SET user_id = m.user_id
FROM milestones m
WHERE t.user_id IS NULL
AND t.milestone_id = m.id;

UPDATE users u
SET user_id = u.id
WHERE u.user_id IS NULL;

-- Make user_id NOT NULL after setting values
ALTER TABLE organizations 
ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE milestones 
ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE tasks 
ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE users 
ALTER COLUMN user_id SET NOT NULL; 