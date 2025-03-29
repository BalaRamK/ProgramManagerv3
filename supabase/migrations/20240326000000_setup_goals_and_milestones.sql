-- Drop everything that might reference program_id first
DROP VIEW IF EXISTS milestone_view CASCADE;
DROP VIEW IF EXISTS goal_progress_view CASCADE;

-- Drop only custom triggers on milestones (not constraint triggers)
DO $$
DECLARE
    trigger_rec RECORD;
BEGIN
    FOR trigger_rec IN 
        SELECT tgname 
        FROM pg_trigger 
        WHERE tgrelid = 'milestones'::regclass
        AND tgname NOT LIKE 'RI_ConstraintTrigger_%'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON milestones CASCADE', trigger_rec.tgname);
    END LOOP;
END $$;

-- Drop ALL functions that might use milestones
DROP FUNCTION IF EXISTS calculate_goal_progress CASCADE;
DROP FUNCTION IF EXISTS update_milestone_status CASCADE;
DROP FUNCTION IF EXISTS update_milestone_progress CASCADE;

-- Drop ALL existing milestone policies
DROP POLICY IF EXISTS "Users can view milestones in their programs" ON milestones;
DROP POLICY IF EXISTS "Users can insert milestones in their programs" ON milestones;
DROP POLICY IF EXISTS "Users can update milestones in their programs" ON milestones;
DROP POLICY IF EXISTS "Users can delete milestones in their programs" ON milestones;

-- Drop existing goal policies
DROP POLICY IF EXISTS "Users can view their own goals" ON goals;
DROP POLICY IF EXISTS "Users can insert their own goals" ON goals;
DROP POLICY IF EXISTS "Users can update their own goals" ON goals;
DROP POLICY IF EXISTS "Users can delete their own goals" ON goals;

-- Check for other triggers/functions that might reference program_id
DO $$
DECLARE
    func_rec RECORD;
    trigger_rec RECORD;
    func_def TEXT;
BEGIN
    -- Check trigger functions for program_id references
    FOR func_rec IN
        SELECT p.proname, p.oid
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.prokind = 'f'
    LOOP
        -- Get function definition
        SELECT pg_get_functiondef(func_rec.oid) INTO func_def;
        
        -- If function references program_id, drop it
        IF func_def LIKE '%program_id%' AND func_def LIKE '%milestones%' THEN
            EXECUTE format('DROP FUNCTION IF EXISTS %I CASCADE', func_rec.proname);
        END IF;
    END LOOP;
END $$;

-- Create goals table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.goals (
    id uuid not null default gen_random_uuid(),
    program_id uuid not null,
    name text not null,
    description text,
    start_date timestamp with time zone,
    end_date timestamp with time zone,
    status text DEFAULT 'not_started',
    progress integer DEFAULT 0,
    owner text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    user_id uuid not null,
    constraint goals_pkey primary key (id),
    constraint goals_program_id_fkey foreign key (program_id) references programs(id) on delete cascade,
    constraint goals_user_id_fkey foreign key (user_id) references auth.users(id)
);

-- Enable RLS on goals
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- Create policies for goals
CREATE POLICY "Users can view their own goals"
    ON public.goals FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goals"
    ON public.goals FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals"
    ON public.goals FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals"
    ON public.goals FOR DELETE
    USING (auth.uid() = user_id);

-- Drop program_id from milestones if it exists
ALTER TABLE milestones DROP COLUMN IF EXISTS program_id CASCADE;

-- Add goal_id to milestones if it doesn't exist
ALTER TABLE public.milestones 
ADD COLUMN IF NOT EXISTS goal_id UUID REFERENCES goals(id) ON DELETE CASCADE;

-- Create milestone view without program_id dependency
CREATE OR REPLACE VIEW milestone_view AS
SELECT 
    m.*,
    g.program_id,
    g.name as goal_name,
    p.name as program_name
FROM milestones m
JOIN goals g ON g.id = m.goal_id
JOIN programs p ON p.id = g.program_id;

-- Create function to calculate goal progress (completely new version without any program_id reference)
CREATE OR REPLACE FUNCTION calculate_goal_progress()
RETURNS TRIGGER AS $$
DECLARE
    goal_id_val UUID;
BEGIN
    -- Get the goal_id directly - don't use record NEW which might have unexpected structure
    goal_id_val := NEW.goal_id;
    
    IF goal_id_val IS NOT NULL THEN
        -- Update the goal's progress
        UPDATE goals
        SET progress = (
            SELECT COALESCE(AVG(progress), 0)
            FROM milestones
            WHERE goal_id = goal_id_val
        )
        WHERE id = goal_id_val;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_goals_program_id ON goals(program_id);
CREATE INDEX IF NOT EXISTS idx_milestones_goal_id ON milestones(goal_id);

-- Create trigger for milestone progress updates
CREATE TRIGGER update_goal_progress
AFTER INSERT OR UPDATE OF progress ON milestones
FOR EACH ROW
EXECUTE FUNCTION calculate_goal_progress();

-- Create view for goals with progress
CREATE OR REPLACE VIEW goal_progress_view AS
SELECT 
    g.*,
    p.name as program_name,
    COUNT(m.id) as total_milestones,
    COUNT(CASE WHEN m.status = 'completed' THEN 1 END) as completed_milestones,
    COALESCE(AVG(m.progress), 0) as average_progress
FROM goals g
LEFT JOIN milestones m ON m.goal_id = g.id
JOIN programs p ON p.id = g.program_id
GROUP BY g.id, p.name;

-- Drop existing RLS policies for milestones
DROP POLICY IF EXISTS "Users can view milestones in their goals" ON milestones;
DROP POLICY IF EXISTS "Users can insert milestones in their goals" ON milestones;
DROP POLICY IF EXISTS "Users can update milestones in their goals" ON milestones;
DROP POLICY IF EXISTS "Users can delete milestones in their goals" ON milestones;

-- Create simplified RLS policies for milestones
CREATE POLICY "Users can view milestones in their goals"
ON milestones FOR SELECT
USING (
    goal_id IN (
        SELECT g.id FROM goals g
        WHERE g.user_id = auth.uid()
    )
);

-- Simplified insertion policy
CREATE POLICY "Users can insert milestones in their goals"
ON milestones FOR INSERT
WITH CHECK (
    -- Only check goal_id
    goal_id IN (
        SELECT g.id FROM goals g
        WHERE g.user_id = auth.uid()
    )
);

CREATE POLICY "Users can update milestones in their goals"
ON milestones FOR UPDATE
USING (
    goal_id IN (
        SELECT g.id FROM goals g
        WHERE g.user_id = auth.uid()
    )
);

CREATE POLICY "Users can delete milestones in their goals"
ON milestones FOR DELETE
USING (
    goal_id IN (
        SELECT g.id FROM goals g
        WHERE g.user_id = auth.uid()
    )
); 