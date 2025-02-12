-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create a more robust function for handling new users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  max_attempts INTEGER := 3;
  current_attempt INTEGER := 0;
  success BOOLEAN := false;
BEGIN
  -- Try multiple times to create the profile
  WHILE current_attempt < max_attempts AND NOT success LOOP
    BEGIN
      -- Add a small delay that increases with each attempt
      PERFORM pg_sleep(current_attempt * 0.5);
      
      INSERT INTO public.user_profiles (id, role, status)
      VALUES (
        new.id,
        'admin'::user_role,
        'active'::user_status
      );
      
      success := true;
    EXCEPTION WHEN OTHERS THEN
      current_attempt := current_attempt + 1;
      IF current_attempt = max_attempts THEN
        RAISE WARNING 'Failed to create user profile after % attempts: %', max_attempts, SQLERRM;
      END IF;
    END;
  END LOOP;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger that runs AFTER insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Ensure RLS is enabled
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create a simple policy that allows all operations
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