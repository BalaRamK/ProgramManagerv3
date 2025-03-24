-- Add organization_id column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Update existing users to have an organization if they don't have one
-- This creates a default organization for users without one
INSERT INTO organizations (name, user_id, created_at)
SELECT 'Default Organization', u.id, NOW()
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM organizations o WHERE o.user_id = u.id
)
ON CONFLICT DO NOTHING;

-- Update users to link them to their organizations
UPDATE users u
SET organization_id = o.id
FROM organizations o
WHERE u.organization_id IS NULL
AND o.user_id = u.id; 