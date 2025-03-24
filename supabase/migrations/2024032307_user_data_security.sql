-- Enable RLS on all tables
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE financials ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;

-- Add user_id columns if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'programs' AND column_name = 'user_id') THEN
        ALTER TABLE programs ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'milestones' AND column_name = 'user_id') THEN
        ALTER TABLE milestones ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kpis' AND column_name = 'user_id') THEN
        ALTER TABLE kpis ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'financials' AND column_name = 'user_id') THEN
        ALTER TABLE financials ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scenarios' AND column_name = 'user_id') THEN
        ALTER TABLE scenarios ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communications' AND column_name = 'user_id') THEN
        ALTER TABLE communications ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'user_id') THEN
        ALTER TABLE documents ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'insights' AND column_name = 'user_id') THEN
        ALTER TABLE insights ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own programs" ON programs;
DROP POLICY IF EXISTS "Users can insert their own programs" ON programs;
DROP POLICY IF EXISTS "Users can update their own programs" ON programs;
DROP POLICY IF EXISTS "Users can delete their own programs" ON programs;

DROP POLICY IF EXISTS "Users can view their own milestones" ON milestones;
DROP POLICY IF EXISTS "Users can insert their own milestones" ON milestones;
DROP POLICY IF EXISTS "Users can update their own milestones" ON milestones;
DROP POLICY IF EXISTS "Users can delete their own milestones" ON milestones;

DROP POLICY IF EXISTS "Users can view their own kpis" ON kpis;
DROP POLICY IF EXISTS "Users can insert their own kpis" ON kpis;
DROP POLICY IF EXISTS "Users can update their own kpis" ON kpis;
DROP POLICY IF EXISTS "Users can delete their own kpis" ON kpis;

DROP POLICY IF EXISTS "Users can view their own financials" ON financials;
DROP POLICY IF EXISTS "Users can insert their own financials" ON financials;
DROP POLICY IF EXISTS "Users can update their own financials" ON financials;
DROP POLICY IF EXISTS "Users can delete their own financials" ON financials;

DROP POLICY IF EXISTS "Users can view their own scenarios" ON scenarios;
DROP POLICY IF EXISTS "Users can insert their own scenarios" ON scenarios;
DROP POLICY IF EXISTS "Users can update their own scenarios" ON scenarios;
DROP POLICY IF EXISTS "Users can delete their own scenarios" ON scenarios;

DROP POLICY IF EXISTS "Users can view their own communications" ON communications;
DROP POLICY IF EXISTS "Users can insert their own communications" ON communications;
DROP POLICY IF EXISTS "Users can update their own communications" ON communications;
DROP POLICY IF EXISTS "Users can delete their own communications" ON communications;

DROP POLICY IF EXISTS "Users can view their own documents" ON documents;
DROP POLICY IF EXISTS "Users can insert their own documents" ON documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON documents;

DROP POLICY IF EXISTS "Users can view their own insights" ON insights;
DROP POLICY IF EXISTS "Users can insert their own insights" ON insights;
DROP POLICY IF EXISTS "Users can update their own insights" ON insights;
DROP POLICY IF EXISTS "Users can delete their own insights" ON insights;

-- Create policies for programs
CREATE POLICY "Users can view their own programs" ON programs
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own programs" ON programs
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own programs" ON programs
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own programs" ON programs
    FOR DELETE USING (user_id = auth.uid());

-- Create policies for milestones
CREATE POLICY "Users can view their own milestones" ON milestones
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own milestones" ON milestones
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own milestones" ON milestones
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own milestones" ON milestones
    FOR DELETE USING (user_id = auth.uid());

-- Create policies for kpis
CREATE POLICY "Users can view their own kpis" ON kpis
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own kpis" ON kpis
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own kpis" ON kpis
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own kpis" ON kpis
    FOR DELETE USING (user_id = auth.uid());

-- Create policies for financials
CREATE POLICY "Users can view their own financials" ON financials
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own financials" ON financials
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own financials" ON financials
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own financials" ON financials
    FOR DELETE USING (user_id = auth.uid());

-- Create policies for scenarios
CREATE POLICY "Users can view their own scenarios" ON scenarios
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own scenarios" ON scenarios
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own scenarios" ON scenarios
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own scenarios" ON scenarios
    FOR DELETE USING (user_id = auth.uid());

-- Create policies for communications
CREATE POLICY "Users can view their own communications" ON communications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own communications" ON communications
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own communications" ON communications
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own communications" ON communications
    FOR DELETE USING (user_id = auth.uid());

-- Create policies for documents
CREATE POLICY "Users can view their own documents" ON documents
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own documents" ON documents
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own documents" ON documents
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own documents" ON documents
    FOR DELETE USING (user_id = auth.uid());

-- Create policies for insights
CREATE POLICY "Users can view their own insights" ON insights
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own insights" ON insights
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own insights" ON insights
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own insights" ON insights
    FOR DELETE USING (user_id = auth.uid());

-- Create a function to automatically set user_id on insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    NEW.user_id = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for each table
CREATE TRIGGER set_user_id_programs
    BEFORE INSERT ON programs
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER set_user_id_milestones
    BEFORE INSERT ON milestones
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER set_user_id_kpis
    BEFORE INSERT ON kpis
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER set_user_id_financials
    BEFORE INSERT ON financials
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER set_user_id_scenarios
    BEFORE INSERT ON scenarios
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER set_user_id_communications
    BEFORE INSERT ON communications
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER set_user_id_documents
    BEFORE INSERT ON documents
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER set_user_id_insights
    BEFORE INSERT ON insights
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user(); 