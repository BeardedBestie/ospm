-- Drop and recreate the handle_new_user function with better error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert new profile
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
$$ language plpgsql security definer;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Add policy for admin user management
CREATE POLICY "admins_can_manage_users"
  ON auth.users FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'admin'
      AND status = 'active'
    )
  );

-- Add policy for admin profile management
CREATE POLICY "admins_can_manage_profiles"
  ON user_profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'admin'
      AND status = 'active'
    )
  );