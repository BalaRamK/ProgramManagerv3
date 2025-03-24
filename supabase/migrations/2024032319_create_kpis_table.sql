-- Create kpis table
CREATE TABLE kpis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    target_value NUMERIC,
    current_value NUMERIC,
    unit TEXT,
    program_id UUID REFERENCES programs(id),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE kpis ENABLE ROW LEVEL SECURITY;

-- Create trigger for updated_at
CREATE TRIGGER update_kpis_updated_at
    BEFORE UPDATE ON kpis
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies for kpis
CREATE POLICY "Users can view their own kpis"
ON kpis FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own kpis"
ON kpis FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own kpis"
ON kpis FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own kpis"
ON kpis FOR DELETE
USING (user_id = auth.uid()); 