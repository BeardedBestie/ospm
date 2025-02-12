-- Ensure RLS is enabled
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Drop and recreate all policies to ensure they are correct
DROP POLICY IF EXISTS "allow_read" ON user_profiles;
DROP POLICY IF EXISTS "allow_write" ON user_profiles;
DROP POLICY IF EXISTS "allow_read" ON projects;
DROP POLICY IF EXISTS "allow_write" ON projects;
DROP POLICY IF EXISTS "allow_read" ON project_members;
DROP POLICY IF EXISTS "allow_write" ON project_members;
DROP POLICY IF EXISTS "allow_read" ON tasks;
DROP POLICY IF EXISTS "allow_write" ON tasks;
DROP POLICY IF EXISTS "allow_read" ON comments;
DROP POLICY IF EXISTS "allow_write" ON comments;

-- Create new simplified policies
CREATE POLICY "allow_read" ON user_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "allow_write" ON user_profiles FOR ALL TO authenticated USING (true);

CREATE POLICY "allow_read" ON projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "allow_write" ON projects FOR ALL TO authenticated USING (true);

CREATE POLICY "allow_read" ON project_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "allow_write" ON project_members FOR ALL TO authenticated USING (true);

CREATE POLICY "allow_read" ON tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "allow_write" ON tasks FOR ALL TO authenticated USING (true);

CREATE POLICY "allow_read" ON comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "allow_write" ON comments FOR ALL TO authenticated USING (true);

-- Ensure handle_new_user function is correct
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO user_profiles (id, role, status)
  VALUES (new.id, 'admin'::user_role, 'active'::user_status)
  ON CONFLICT (id) DO UPDATE
  SET role = 'admin'::user_role,
      status = 'active'::user_status;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Update all existing users to be admins
UPDATE user_profiles 
SET role = 'admin'::user_role,
    status = 'active'::user_status;