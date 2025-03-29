-- First, drop the existing foreign key constraint if it exists
ALTER TABLE milestones DROP CONSTRAINT IF EXISTS milestones_program_id_fkey;

-- Add goal_id column to milestones table
ALTER TABLE milestones 
ADD COLUMN IF NOT EXISTS goal_id UUID REFERENCES goals(id) ON DELETE CASCADE;

-- Update existing milestones to link to goals
-- This creates a goal for each program and links existing milestones to it
DO $$
DECLARE
    program_record RECORD;
    new_goal_id UUID;
BEGIN
    FOR program_record IN SELECT DISTINCT program_id FROM milestones LOOP
        -- Create a goal for the program
        INSERT INTO goals (
            id,
            program_id,
            name,
            description,
            start_date,
            end_date,
            progress,
            owner,
            user_id
        )
        SELECT
            gen_random_uuid(),
            m.program_id,
            p.name || ' Default Goal',
            'Automatically created goal for existing program',
            p.start_date,
            p.end_date,
            0,
            NULL,
            p.user_id
        FROM milestones m
        JOIN programs p ON p.id = m.program_id
        WHERE m.program_id = program_record.program_id
        LIMIT 1
        RETURNING id INTO new_goal_id;

        -- Update milestones to reference the new goal
        UPDATE milestones
        SET goal_id = new_goal_id
        WHERE program_id = program_record.program_id;
    END LOOP;
END $$;

-- Drop the program_id column from milestones
ALTER TABLE milestones DROP COLUMN IF EXISTS program_id;

-- Ensure RLS policies are updated
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view milestones in their goals" ON milestones;
CREATE POLICY "Users can view milestones in their goals"
ON milestones FOR SELECT
USING (
    goal_id IN (
        SELECT g.id FROM goals g
        JOIN programs p ON p.id = g.program_id
        WHERE p.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can insert milestones in their goals" ON milestones;
CREATE POLICY "Users can insert milestones in their goals"
ON milestones FOR INSERT
WITH CHECK (
    goal_id IN (
        SELECT g.id FROM goals g
        JOIN programs p ON p.id = g.program_id
        WHERE p.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can update milestones in their goals" ON milestones;
CREATE POLICY "Users can update milestones in their goals"
ON milestones FOR UPDATE
USING (
    goal_id IN (
        SELECT g.id FROM goals g
        JOIN programs p ON p.id = g.program_id
        WHERE p.user_id = auth.uid()
    )
)
WITH CHECK (
    goal_id IN (
        SELECT g.id FROM goals g
        JOIN programs p ON p.id = g.program_id
        WHERE p.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can delete milestones in their goals" ON milestones;
CREATE POLICY "Users can delete milestones in their goals"
ON milestones FOR DELETE
USING (
    goal_id IN (
        SELECT g.id FROM goals g
        JOIN programs p ON p.id = g.program_id
        WHERE p.user_id = auth.uid()
    )
); 