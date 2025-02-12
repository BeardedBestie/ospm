-- Add role type
CREATE TYPE user_role AS ENUM ('admin', 'user', 'viewer');

-- Add status type
CREATE TYPE user_status AS ENUM ('pending', 'active', 'disabled');

-- Create user profiles table
CREATE TABLE user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'viewer',
  status user_status NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profiles
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update profiles"
  ON user_profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create function to handle user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO user_profiles (id, role, status)
  VALUES (new.id, 'viewer', 'pending');
  RETURN new;
END;
$$ language plpgsql security definer;

-- Create trigger for new user registration
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update project member policies
DROP POLICY IF EXISTS "Project access" ON projects;
CREATE POLICY "Project member access"
  ON projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      JOIN user_profiles up ON up.id = auth.uid()
      WHERE pm.project_id = id
      AND pm.user_id = auth.uid()
      AND up.status = 'active'
    )
    OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Project member write access"
  ON projects FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      JOIN user_profiles up ON up.id = auth.uid()
      WHERE pm.project_id = id
      AND pm.user_id = auth.uid()
      AND up.status = 'active'
      AND up.role IN ('admin', 'user')
    )
  );

-- Update task policies
DROP POLICY IF EXISTS "view_project_tasks" ON tasks;
DROP POLICY IF EXISTS "manage_project_tasks" ON tasks;

CREATE POLICY "view_tasks"
  ON tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      JOIN user_profiles up ON up.id = auth.uid()
      WHERE pm.project_id = tasks.project_id
      AND pm.user_id = auth.uid()
      AND up.status = 'active'
    )
    OR assignee_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "manage_tasks"
  ON tasks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      JOIN user_profiles up ON up.id = auth.uid()
      WHERE pm.project_id = tasks.project_id
      AND pm.user_id = auth.uid()
      AND up.status = 'active'
      AND up.role IN ('admin', 'user')
    )
    OR assignee_id = auth.uid()
  );

-- Update comment policies
DROP POLICY IF EXISTS "view_comments" ON comments;
DROP POLICY IF EXISTS "create_comments" ON comments;

CREATE POLICY "view_comments"
  ON comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      JOIN user_profiles up ON up.id = auth.uid()
      WHERE (
        pm.project_id = comments.project_id
        OR pm.project_id = (
          SELECT project_id FROM tasks
          WHERE id = comments.task_id
        )
      )
      AND pm.user_id = auth.uid()
      AND up.status = 'active'
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "create_comments"
  ON comments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND status = 'active'
    )
    AND user_id = auth.uid()
  );

-- Create admin user function
CREATE OR REPLACE FUNCTION create_admin_user(email text, password text)
RETURNS void AS $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Create user in auth.users
  INSERT INTO auth.users (
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data
  ) VALUES (
    email,
    crypt(password, gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Admin User"}'
  ) RETURNING id INTO new_user_id;

  -- Set role to admin
  UPDATE user_profiles
  SET role = 'admin', status = 'active'
  WHERE id = new_user_id;
END;
$$ language plpgsql security definer;