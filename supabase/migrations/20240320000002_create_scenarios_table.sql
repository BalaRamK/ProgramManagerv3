-- Create programs table if it doesn't exist (since scenarios references it)
CREATE TABLE IF NOT EXISTS public.programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS for programs
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;

-- Create programs policies
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view their own programs" ON public.programs;
    DROP POLICY IF EXISTS "Users can insert their own programs" ON public.programs;
    DROP POLICY IF EXISTS "Users can update their own programs" ON public.programs;
    DROP POLICY IF EXISTS "Users can delete their own programs" ON public.programs;
EXCEPTION
    WHEN undefined_object THEN
END $$;

CREATE POLICY "Users can view their own programs"
  ON public.programs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own programs"
  ON public.programs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own programs"
  ON public.programs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own programs"
  ON public.programs FOR DELETE
  USING (auth.uid() = user_id);

-- Now create scenarios table
CREATE TABLE IF NOT EXISTS public.scenarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parameter_changes JSONB DEFAULT '{}',
  predicted_outcomes JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS for scenarios
ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;

-- Create scenarios policies
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view their own scenarios" ON public.scenarios;
    DROP POLICY IF EXISTS "Users can insert their own scenarios" ON public.scenarios;
    DROP POLICY IF EXISTS "Users can update their own scenarios" ON public.scenarios;
    DROP POLICY IF EXISTS "Users can delete their own scenarios" ON public.scenarios;
EXCEPTION
    WHEN undefined_object THEN
END $$;

CREATE POLICY "Users can view their own scenarios"
  ON public.scenarios FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scenarios"
  ON public.scenarios FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scenarios"
  ON public.scenarios FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scenarios"
  ON public.scenarios FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at trigger function for programs
CREATE OR REPLACE FUNCTION public.handle_programs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create updated_at trigger function for scenarios
CREATE OR REPLACE FUNCTION public.handle_scenarios_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS set_programs_updated_at ON public.programs;
CREATE TRIGGER set_programs_updated_at
    BEFORE UPDATE ON public.programs
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_programs_updated_at();

DROP TRIGGER IF EXISTS set_scenarios_updated_at ON public.scenarios;
CREATE TRIGGER set_scenarios_updated_at
    BEFORE UPDATE ON public.scenarios
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_scenarios_updated_at(); 