-- Drop existing foreign key constraint if it exists
ALTER TABLE milestones DROP CONSTRAINT IF EXISTS milestones_goal_id_fkey;

-- Ensure goals table has correct structure
ALTER TABLE goals
ADD COLUMN IF NOT EXISTS status text DEFAULT 'not_started',
ADD COLUMN IF NOT EXISTS progress integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS owner text;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_goals_program_id ON goals(program_id);
CREATE INDEX IF NOT EXISTS idx_milestones_goal_id ON milestones(goal_id);

-- Add foreign key constraint with cascade delete
ALTER TABLE milestones
ADD CONSTRAINT milestones_goal_id_fkey 
FOREIGN KEY (goal_id) 
REFERENCES goals(id) 
ON DELETE CASCADE;

-- Create a function to calculate goal progress based on milestone progress
CREATE OR REPLACE FUNCTION calculate_goal_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Update goal progress when milestone progress changes
  IF TG_OP = 'UPDATE' OR TG_OP = 'INSERT' THEN
    UPDATE goals g
    SET progress = (
      SELECT COALESCE(AVG(m.progress), 0)
      FROM milestones m
      WHERE m.goal_id = g.id
    )
    WHERE g.id = NEW.goal_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for milestone progress updates
DROP TRIGGER IF EXISTS update_goal_progress ON milestones;
CREATE TRIGGER update_goal_progress
AFTER INSERT OR UPDATE OF progress ON milestones
FOR EACH ROW
EXECUTE FUNCTION calculate_goal_progress();

-- Create view for goals with progress information
CREATE OR REPLACE VIEW goal_progress_view AS
SELECT 
  g.*,
  COUNT(m.id) as total_milestones,
  COUNT(CASE WHEN m.status = 'completed' THEN 1 END) as completed_milestones,
  COALESCE(AVG(m.progress), 0) as average_progress
FROM goals g
LEFT JOIN milestones m ON m.goal_id = g.id
GROUP BY g.id; 