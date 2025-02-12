-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "admins_can_manage_users" ON auth.users;
DROP POLICY IF EXISTS "admins_can_manage_profiles" ON user_profiles;

-- Create a simpler policy structure for user_profiles
CREATE POLICY "users_can_view_own_profile"
  ON user_profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "admins_can_view_all_profiles"
  ON user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
      AND status = 'active'
    )
  );

CREATE POLICY "admins_can_update_profiles"
  ON user_profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
      AND status = 'active'
    )
  );

-- Create a function to safely check admin status
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = user_id
    AND role = 'admin'
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the handle_new_user function to be more robust
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, role, status)
  VALUES (
    new.id,
    CASE 
      WHEN NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE role = 'admin')
      THEN 'admin'::user_role
      ELSE 'user'::user_role
    END,
    'active'::user_status
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_role_status ON user_profiles(role, status);

-- Ensure all existing users have profiles
INSERT INTO public.user_profiles (id, role, status)
SELECT 
  users.id,
  CASE 
    WHEN NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE role = 'admin')
    THEN 'admin'::user_role
    ELSE 'user'::user_role
  END as role,
  'active'::user_status as status
FROM auth.users
LEFT JOIN public.user_profiles ON user_profiles.id = users.id
WHERE user_profiles.id IS NULL;

-- Ensure at least one admin exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE role = 'admin' AND status = 'active') THEN
    UPDATE user_profiles
    SET role = 'admin',
        status = 'active'
    WHERE id = (
      SELECT id 
      FROM user_profiles 
      ORDER BY created_at ASC 
      LIMIT 1
    );
  END IF;
END $$;