-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create a more reliable function for handling new users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Create user profile immediately
  INSERT INTO public.user_profiles (id, role, status)
  VALUES (
    new.id,
    'admin'::user_role,
    'active'::user_status
  );
  
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail
  RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger that runs BEFORE insert
CREATE TRIGGER on_auth_user_created
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Ensure RLS is enabled
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create simple RLS policy that allows all operations
CREATE POLICY "allow_all"
  ON user_profiles
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Update all existing users to be admins
UPDATE user_profiles 
SET role = 'admin'::user_role,
    status = 'active'::user_status;