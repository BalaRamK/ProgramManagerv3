-- Drop the unique constraint on email temporarily
ALTER TABLE users
DROP CONSTRAINT IF EXISTS users_email_key;

-- Create a function to handle user creation with better conflict handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name, user_id)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'name', new.id)
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    user_id = EXCLUDED.user_id;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to ensure user exists with better conflict handling
CREATE OR REPLACE FUNCTION public.ensure_user_exists(user_id uuid)
RETURNS void AS $$
BEGIN
  INSERT INTO public.users (id, email, name, user_id)
  SELECT id, email, raw_user_meta_data->>'name', id
  FROM auth.users
  WHERE id = user_id
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    user_id = EXCLUDED.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to handle user creation from the application
CREATE OR REPLACE FUNCTION public.handle_app_user_creation()
RETURNS trigger AS $$
BEGIN
  -- Set user_id to the authenticated user's ID
  NEW.user_id = auth.uid();
  
  -- If email is not provided, try to get it from auth.users
  IF NEW.email IS NULL THEN
    SELECT email INTO NEW.email
    FROM auth.users
    WHERE id = auth.uid();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add a unique constraint on (id, email) instead of just email
ALTER TABLE users
ADD CONSTRAINT users_id_email_key UNIQUE (id, email);

-- Create a policy to allow users to update their own email
CREATE POLICY "Users can update their own email"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Ensure proper permissions
GRANT SELECT, INSERT, UPDATE ON users TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated; 