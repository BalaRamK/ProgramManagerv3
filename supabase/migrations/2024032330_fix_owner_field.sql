-- Drop existing policies
DROP POLICY IF EXISTS "Users can view milestones in their programs" ON milestones;
DROP POLICY IF EXISTS "Users can insert milestones in their programs" ON milestones;
DROP POLICY IF EXISTS "Users can update milestones in their programs" ON milestones;
DROP POLICY IF EXISTS "Users can delete milestones in their programs" ON milestones;

-- Drop the view first
DROP VIEW IF EXISTS milestone_view;

-- Drop the existing owner column if it exists
ALTER TABLE milestones DROP COLUMN IF EXISTS owner;

-- Add the owner column as text
ALTER TABLE milestones ADD COLUMN owner text DEFAULT 'Unassigned';

-- Recreate the view
CREATE OR REPLACE VIEW milestone_view AS
SELECT 
    id,
    program_id,
    title,
    description,
    due_date,
    status,
    owner,
    progress,
    tasks,
    dependencies,
    resources,
    user_id,
    created_at,
    updated_at
FROM milestones;

-- Recreate policies
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view milestones in their programs"
ON milestones FOR SELECT
USING (
    program_id IN (
        SELECT id FROM programs WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert milestones in their programs"
ON milestones FOR INSERT
WITH CHECK (
    program_id IN (
        SELECT id FROM programs WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can update milestones in their programs"
ON milestones FOR UPDATE
USING (
    program_id IN (
        SELECT id FROM programs WHERE user_id = auth.uid()
    )
)
WITH CHECK (
    program_id IN (
        SELECT id FROM programs WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can delete milestones in their programs"
ON milestones FOR DELETE
USING (
    program_id IN (
        SELECT id FROM programs WHERE user_id = auth.uid()
    )
);

-- Grant permissions on the view
GRANT SELECT ON milestone_view TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated; 