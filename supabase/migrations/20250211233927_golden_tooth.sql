-- Drop all existing policies
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

-- Create final, stable policies
CREATE POLICY "read_all"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "write_all"
  ON user_profiles FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "read_all"
  ON projects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "write_all"
  ON projects FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "read_all"
  ON project_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "write_all"
  ON project_members FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "read_all"
  ON tasks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "write_all"
  ON tasks FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "read_all"
  ON comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "write_all"
  ON comments FOR ALL
  TO authenticated
  USING (true);

-- Update handle_new_user function to be maximally stable
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

-- Ensure all users are admins
UPDATE user_profiles 
SET role = 'admin'::user_role,
    status = 'active'::user_status;