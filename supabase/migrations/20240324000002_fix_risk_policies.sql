-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own risks" ON public.risks;
DROP POLICY IF EXISTS "Users can insert their own risks" ON public.risks;
DROP POLICY IF EXISTS "Users can update their own risks" ON public.risks;
DROP POLICY IF EXISTS "Users can view their risks through view" ON public.risk_view;

-- Enable RLS on risks table if not already enabled
ALTER TABLE public.risks ENABLE ROW LEVEL SECURITY;

-- Add created_by column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'risks' 
                  AND column_name = 'created_by') THEN
        -- Add the column as nullable first
        ALTER TABLE public.risks ADD COLUMN created_by UUID;
        -- Add the foreign key reference
        ALTER TABLE public.risks 
        ADD CONSTRAINT risks_created_by_fkey 
        FOREIGN KEY (created_by) 
        REFERENCES auth.users(id);
    END IF;
END $$;

-- Drop and recreate the risk_view to ensure it inherits RLS from the base table
DROP VIEW IF EXISTS public.risk_view;
CREATE VIEW public.risk_view AS
SELECT 
    r.*,
    p.name as program_name,
    o.name as organization_name,
    m.title as milestone_title
FROM public.risks r
LEFT JOIN public.programs p ON r.program_id = p.id
LEFT JOIN public.organizations o ON p.organization_id = o.id
LEFT JOIN public.milestones m ON r.milestone_id = m.id;

-- Create policies for the risks table
CREATE POLICY "Users can view risks in their organization"
  ON public.risks FOR SELECT
  TO authenticated
  USING (
    program_id IN (
      SELECT p.id 
      FROM public.programs p
      JOIN public.organizations o ON p.organization_id = o.id
      WHERE o.id = (
        SELECT organization_id 
        FROM public.users 
        WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert risks in their organization"
  ON public.risks FOR INSERT
  TO authenticated
  WITH CHECK (
    program_id IN (
      SELECT p.id 
      FROM public.programs p
      JOIN public.organizations o ON p.organization_id = o.id
      WHERE o.id = (
        SELECT organization_id 
        FROM public.users 
        WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update risks in their organization"
  ON public.risks FOR UPDATE
  TO authenticated
  USING (
    program_id IN (
      SELECT p.id 
      FROM public.programs p
      JOIN public.organizations o ON p.organization_id = o.id
      WHERE o.id = (
        SELECT organization_id 
        FROM public.users 
        WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete risks in their organization"
  ON public.risks FOR DELETE
  TO authenticated
  USING (
    program_id IN (
      SELECT p.id 
      FROM public.programs p
      JOIN public.organizations o ON p.organization_id = o.id
      WHERE o.id = (
        SELECT organization_id 
        FROM public.users 
        WHERE id = auth.uid()
      )
    )
  );

-- Grant necessary permissions
GRANT SELECT ON public.risk_view TO authenticated;
GRANT ALL ON public.risks TO authenticated; 