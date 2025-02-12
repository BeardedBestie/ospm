-- Drop everything and start fresh
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS project_members CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS user_status CASCADE;

-- Create types
CREATE TYPE user_role AS ENUM ('admin', 'user', 'viewer');
CREATE TYPE user_status AS ENUM ('active', 'disabled');

-- Create tables
CREATE TABLE user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'admin'::user_role,
  status user_status NOT NULL DEFAULT 'active'::user_status,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  deadline timestamptz,
  archived boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE project_members (
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'member')),
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY (project_id, user_id)
);

CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'ToDo' CHECK (status IN ('ToDo', 'InProgress', 'Blocked', 'Finished')),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  assignee_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  deadline timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT comments_target_check CHECK (
    (project_id IS NOT NULL AND task_id IS NULL) OR
    (project_id IS NULL AND task_id IS NOT NULL)
  )
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Create maximally simplified policies
-- Make everything readable by default during development
CREATE POLICY "allow_read" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "allow_read" ON projects FOR SELECT USING (true);
CREATE POLICY "allow_read" ON project_members FOR SELECT USING (true);
CREATE POLICY "allow_read" ON tasks FOR SELECT USING (true);
CREATE POLICY "allow_read" ON comments FOR SELECT USING (true);

-- Allow all authenticated users to write during development
CREATE POLICY "allow_write" ON user_profiles FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "allow_write" ON projects FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "allow_write" ON project_members FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "allow_write" ON tasks FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "allow_write" ON comments FOR ALL USING (auth.uid() IS NOT NULL);

-- Create function to handle new user registration
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

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Ensure all existing users are admins
INSERT INTO user_profiles (id, role, status)
SELECT 
  id,
  'admin'::user_role,
  'active'::user_status
FROM auth.users
ON CONFLICT (id) DO UPDATE
SET role = 'admin'::user_role,
    status = 'active'::user_status;