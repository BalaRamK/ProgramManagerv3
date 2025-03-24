-- Add missing columns to kpis table
ALTER TABLE kpis
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS target_value NUMERIC,
ADD COLUMN IF NOT EXISTS current_value NUMERIC,
ADD COLUMN IF NOT EXISTS unit TEXT,
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Rename value to current_value for existing records
UPDATE kpis
SET current_value = value
WHERE current_value IS NULL AND value IS NOT NULL;

-- Drop old value column
ALTER TABLE kpis
DROP COLUMN IF EXISTS value;

-- Enable RLS if not already enabled
ALTER TABLE kpis ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own kpis" ON kpis;
DROP POLICY IF EXISTS "Users can insert their own kpis" ON kpis;
DROP POLICY IF EXISTS "Users can update their own kpis" ON kpis;
DROP POLICY IF EXISTS "Users can delete their own kpis" ON kpis;

-- Create RLS policies for kpis
CREATE POLICY "Users can view their own kpis"
ON kpis FOR SELECT
USING (
    user_id = auth.uid() OR 
    program_id IN (
        SELECT id FROM programs WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert their own kpis"
ON kpis FOR INSERT
WITH CHECK (
    user_id = auth.uid() OR 
    program_id IN (
        SELECT id FROM programs WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can update their own kpis"
ON kpis FOR UPDATE
USING (
    user_id = auth.uid() OR 
    program_id IN (
        SELECT id FROM programs WHERE user_id = auth.uid()
    )
)
WITH CHECK (
    user_id = auth.uid() OR 
    program_id IN (
        SELECT id FROM programs WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can delete their own kpis"
ON kpis FOR DELETE
USING (
    user_id = auth.uid() OR 
    program_id IN (
        SELECT id FROM programs WHERE user_id = auth.uid()
    )
);

-- Update existing records to set user_id based on program ownership
UPDATE kpis k
SET user_id = p.user_id
FROM programs p
WHERE k.user_id IS NULL
AND k.program_id = p.id; 