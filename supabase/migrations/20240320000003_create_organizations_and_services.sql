-- Create organization types enum
CREATE TYPE org_type AS ENUM ('client', 'internal_team', 'vendor');

-- Create user types enum
CREATE TYPE user_type AS ENUM ('internal', 'vendor', 'external');

-- Create regions enum
CREATE TYPE region AS ENUM (
  'asia_pacific',
  'europe',
  'mea',
  'africa',
  'australia',
  'usa',
  'north_america',
  'south_america',
  'uk'
);

-- Create services table
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  technology_used TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS for services
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Create organization_services junction table
CREATE TABLE IF NOT EXISTS public.organization_services (
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (organization_id, service_id)
);

-- Enable RLS for organization_services
ALTER TABLE public.organization_services ENABLE ROW LEVEL SECURITY;

-- Modify existing organizations table
ALTER TABLE public.organizations 
  ADD COLUMN IF NOT EXISTS type org_type,
  ADD COLUMN IF NOT EXISTS project_start_date DATE,
  ADD COLUMN IF NOT EXISTS project_end_date DATE,
  ADD COLUMN IF NOT EXISTS region region,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Modify existing users table
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS user_type user_type DEFAULT 'external',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Create policies for services
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Everyone can view services" ON public.services;
    DROP POLICY IF EXISTS "Admins can manage services" ON public.services;
    DROP POLICY IF EXISTS "Everyone can view organization_services" ON public.organization_services;
    DROP POLICY IF EXISTS "Admins can manage organization_services" ON public.organization_services;
EXCEPTION
    WHEN undefined_object THEN
END $$;

CREATE POLICY "Everyone can view services"
  ON public.services FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage services"
  ON public.services
  USING (auth.jwt() ->> 'email' = 'balaramakrishnasaikarumanchi0@gmail.com');

CREATE POLICY "Everyone can view organization_services"
  ON public.organization_services FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage organization_services"
  ON public.organization_services
  USING (auth.jwt() ->> 'email' = 'balaramakrishnasaikarumanchi0@gmail.com');

-- Update policies for organizations
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view organizations" ON public.organizations;
    DROP POLICY IF EXISTS "Admins can manage organizations" ON public.organizations;
EXCEPTION
    WHEN undefined_object THEN
END $$;

CREATE POLICY "Users can view organizations"
  ON public.organizations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage organizations"
  ON public.organizations
  USING (auth.jwt() ->> 'email' = 'balaramakrishnasaikarumanchi0@gmail.com');

-- Create or replace trigger functions for updated_at
CREATE OR REPLACE FUNCTION public.handle_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.handle_organizations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS set_services_updated_at ON public.services;
CREATE TRIGGER set_services_updated_at
    BEFORE UPDATE ON public.services
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_services_updated_at();

DROP TRIGGER IF EXISTS set_organizations_updated_at ON public.organizations;
CREATE TRIGGER set_organizations_updated_at
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_organizations_updated_at();

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_organizations_type ON public.organizations(type);
CREATE INDEX IF NOT EXISTS idx_organizations_region ON public.organizations(region);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON public.users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON public.users(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_services_org_id ON public.organization_services(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_services_service_id ON public.organization_services(service_id);

-- Create initial services
INSERT INTO public.services (name, description, technology_used) VALUES
('Software Development', 'Custom software development services', ARRAY['JavaScript', 'TypeScript', 'React', 'Node.js']),
('Cloud Infrastructure', 'Cloud infrastructure and DevOps services', ARRAY['AWS', 'Azure', 'Docker', 'Kubernetes']),
('Data Analytics', 'Data analytics and visualization services', ARRAY['Python', 'R', 'Tableau', 'PowerBI']),
('Cybersecurity', 'Security assessment and implementation', ARRAY['Security Tools', 'Penetration Testing', 'Compliance']),
('Digital Transformation', 'Digital transformation consulting', ARRAY['Strategy', 'Process Optimization', 'Change Management'])
ON CONFLICT (name) DO NOTHING;

-- Create policies for services
CREATE POLICY "Users can view services"
  ON public.services FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage services"
  ON public.services FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'balaramakrishnasaikarumanchi0@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'balaramakrishnasaikarumanchi0@gmail.com'); 