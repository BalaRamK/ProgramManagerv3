-- Drop existing policies
DROP POLICY IF EXISTS "Users can view milestones in their programs" ON milestones;
DROP POLICY IF EXISTS "Users can insert milestones in their programs" ON milestones;
DROP POLICY IF EXISTS "Users can update milestones in their programs" ON milestones;
DROP POLICY IF EXISTS "Users can delete milestones in their programs" ON milestones;

-- Ensure the milestones table has the correct structure
ALTER TABLE milestones
ADD COLUMN IF NOT EXISTS tasks jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS dependencies jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS resources jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS progress integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS owner text,
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Create policies on the base table
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

-- Create a view that matches the frontend interface
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

-- Grant permissions on the view
GRANT SELECT ON milestone_view TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Create a function to handle milestone creation
CREATE OR REPLACE FUNCTION public.handle_milestone_creation()
RETURNS trigger AS $$
BEGIN
  -- Set default values if not provided
  IF NEW.tasks IS NULL THEN
    NEW.tasks = '[]'::jsonb;
  END IF;
  
  IF NEW.dependencies IS NULL THEN
    NEW.dependencies = '[]'::jsonb;
  END IF;
  
  IF NEW.resources IS NULL THEN
    NEW.resources = '[]'::jsonb;
  END IF;
  
  IF NEW.progress IS NULL THEN
    NEW.progress = 0;
  END IF;

  -- Set user_id from the program's user_id
  SELECT user_id INTO NEW.user_id
  FROM programs
  WHERE id = NEW.program_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to handle milestone creation
DROP TRIGGER IF EXISTS on_milestone_creation ON milestones;
CREATE TRIGGER on_milestone_creation
  BEFORE INSERT ON milestones
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_milestone_creation(); 