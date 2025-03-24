-- Drop existing milestones table if it exists
DROP TABLE IF EXISTS milestones CASCADE;

-- Create milestones table with all required columns
CREATE TABLE milestones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'not_started',
    owner UUID REFERENCES users(id),
    progress INTEGER DEFAULT 0,
    tasks JSONB DEFAULT '[]'::jsonb,
    dependencies JSONB DEFAULT '[]'::jsonb,
    resources JSONB DEFAULT '[]'::jsonb,
    user_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a trigger to ensure user exists before milestone creation
CREATE OR REPLACE FUNCTION public.ensure_user_exists_before_milestone()
RETURNS trigger AS $$
BEGIN
  PERFORM public.ensure_user_exists(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER ensure_user_exists_before_milestone
  BEFORE INSERT ON milestones
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_user_exists_before_milestone();

-- Create RLS policies for milestones
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

-- Policy for viewing milestones
CREATE POLICY "Users can view milestones in their programs"
ON milestones FOR SELECT
USING (
    program_id IN (
        SELECT id FROM programs WHERE user_id = auth.uid()
    )
);

-- Policy for inserting milestones
CREATE POLICY "Users can insert milestones in their programs"
ON milestones FOR INSERT
WITH CHECK (
    program_id IN (
        SELECT id FROM programs WHERE user_id = auth.uid()
    )
);

-- Policy for updating milestones
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

-- Policy for deleting milestones
CREATE POLICY "Users can delete milestones in their programs"
ON milestones FOR DELETE
USING (
    program_id IN (
        SELECT id FROM programs WHERE user_id = auth.uid()
    )
);

-- Grant necessary permissions
GRANT ALL ON milestones TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Create an updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON milestones
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at(); 