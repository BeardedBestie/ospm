-- First, drop all existing tables and types
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
  role user_role NOT NULL DEFAULT 'user'::user_role,
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
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
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

-- Create indexes
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_status ON user_profiles(status);
CREATE INDEX idx_projects_archived ON projects(archived);
CREATE INDEX idx_project_members_user ON project_members(user_id);
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX idx_comments_project ON comments(project_id);
CREATE INDEX idx_comments_task ON comments(task_id);
CREATE INDEX idx_comments_user ON comments(user_id);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Simple, non-recursive policies
-- User Profiles
CREATE POLICY "anyone_can_view_profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "admins_can_manage_profiles"
  ON user_profiles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'admin'::user_role
      AND status = 'active'::user_status
      LIMIT 1
    )
  );

-- Projects
CREATE POLICY "members_can_view_projects"
  ON projects FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "members_can_manage_projects"
  ON projects FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = id
      AND user_id = auth.uid()
      AND role = 'owner'
    )
  );

-- Project Members
CREATE POLICY "members_can_view_project_members"
  ON project_members FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT project_id FROM project_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "owners_can_manage_project_members"
  ON project_members FOR ALL
  TO authenticated
  USING (
    project_id IN (
      SELECT project_id FROM project_members
      WHERE user_id = auth.uid()
      AND role = 'owner'
    )
  );

-- Tasks
CREATE POLICY "members_can_view_tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT project_id FROM project_members
      WHERE user_id = auth.uid()
    )
    OR assignee_id = auth.uid()
  );

CREATE POLICY "members_can_manage_tasks"
  ON tasks FOR ALL
  TO authenticated
  USING (
    project_id IN (
      SELECT project_id FROM project_members
      WHERE user_id = auth.uid()
    )
  );

-- Comments
CREATE POLICY "members_can_view_comments"
  ON comments FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT project_id FROM project_members
      WHERE user_id = auth.uid()
    )
    OR task_id IN (
      SELECT id FROM tasks
      WHERE project_id IN (
        SELECT project_id FROM project_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "members_can_create_comments"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (
    (
      project_id IN (
        SELECT project_id FROM project_members
        WHERE user_id = auth.uid()
      )
      OR
      task_id IN (
        SELECT id FROM tasks
        WHERE project_id IN (
          SELECT project_id FROM project_members
          WHERE user_id = auth.uid()
        )
      )
    )
    AND user_id = auth.uid()
  );

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO user_profiles (id, role, status)
  VALUES (
    new.id,
    CASE 
      WHEN NOT EXISTS (SELECT 1 FROM user_profiles WHERE role = 'admin'::user_role)
      THEN 'admin'::user_role
      ELSE 'user'::user_role
    END,
    'active'::user_status
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Ensure all existing users have profiles
INSERT INTO user_profiles (id, role, status)
SELECT 
  users.id,
  CASE 
    WHEN NOT EXISTS (SELECT 1 FROM user_profiles WHERE role = 'admin'::user_role)
    THEN 'admin'::user_role
    ELSE 'user'::user_role
  END,
  'active'::user_status
FROM auth.users
LEFT JOIN user_profiles ON user_profiles.id = users.id
WHERE user_profiles.id IS NULL;

-- Ensure at least one admin exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE role = 'admin'::user_role) THEN
    UPDATE user_profiles
    SET role = 'admin'::user_role
    WHERE id = (
      SELECT id 
      FROM user_profiles 
      ORDER BY created_at ASC 
      LIMIT 1
    );
  END IF;
END $$;