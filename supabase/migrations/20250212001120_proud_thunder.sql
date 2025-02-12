-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create a more reliable function for handling new users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Only insert if profile doesn't exist
  INSERT INTO public.user_profiles (id, role, status)
  VALUES (
    new.id,
    'admin'::user_role,
    'active'::user_status
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Ensure all policies allow authenticated users to write
CREATE POLICY "authenticated_write"
  ON user_profiles FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Update all existing users to be admins
UPDATE user_profiles 
SET role = 'admin'::user_role,
    status = 'active'::user_status;