-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create a simpler function for handling new users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Create user profile with a delay to ensure auth.users row exists
  PERFORM pg_sleep(0.1);
  
  INSERT INTO public.user_profiles (id, role, status)
  VALUES (
    new.id,
    'admin'::user_role,
    'active'::user_status
  );
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger that runs AFTER insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Drop all existing policies
DROP POLICY IF EXISTS "allow_all" ON user_profiles;
DROP POLICY IF EXISTS "authenticated_write" ON user_profiles;
DROP POLICY IF EXISTS "read_all" ON user_profiles;
DROP POLICY IF EXISTS "write_all" ON user_profiles;

-- Create a single, simple policy for user_profiles
CREATE POLICY "allow_all_operations"
  ON user_profiles
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Update all existing users to be admins
UPDATE user_profiles 
SET role = 'admin'::user_role,
    status = 'active'::user_status;