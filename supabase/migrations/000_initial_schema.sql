-- Consolidated initial schema for ospm

-- Types
CREATE TYPE user_role AS ENUM ('admin', 'user', 'viewer');
CREATE TYPE user_status AS ENUM ('pending', 'active', 'disabled');

-- user_profiles table
CREATE TABLE user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'viewer',
  status user_status NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- projects table
CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  deadline timestamptz,
  archived boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- project_members table
CREATE TABLE project_members (
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY (project_id, user_id)
);

-- tasks table
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

-- comments table
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

-- Trigger function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER trg_update_user_profiles
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_update_projects
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_update_tasks
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Public view of users
CREATE OR REPLACE VIEW public.users AS
SELECT id, email, raw_user_meta_data FROM auth.users;
GRANT SELECT ON public.users TO authenticated;

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- RLS policies

-- user_profiles
CREATE POLICY "profiles_read_own"
  ON user_profiles FOR SELECT
  USING (id = auth.uid());
CREATE POLICY "profiles_write_admin"
  ON user_profiles FOR ALL
  USING (
    EXISTS (SELECT 1 FROM user_profiles up WHERE up.id = auth.uid() AND up.role = 'admin' AND up.status = 'active')
  );

-- projects
CREATE POLICY "projects_select"
  ON projects FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = projects.id AND pm.user_id = auth.uid())
  );
CREATE POLICY "projects_modify"
  ON projects FOR ALL
  USING (
    EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = projects.id AND pm.user_id = auth.uid() AND pm.role = 'owner')
  );

-- project_members
CREATE POLICY "members_read"
  ON project_members FOR SELECT
  USING (project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid()));
CREATE POLICY "members_manage"
  ON project_members FOR ALL
  USING (
    project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid() AND role = 'owner')
  );

-- tasks
CREATE POLICY "tasks_select"
  ON tasks FOR SELECT
  USING (
    project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
    OR assignee_id = auth.uid()
  );
CREATE POLICY "tasks_modify"
  ON tasks FOR ALL
  USING (
    project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
  );

-- comments
CREATE POLICY "comments_select"
  ON comments FOR SELECT
  USING (
    (project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid()))
    OR (task_id IN (SELECT id FROM tasks WHERE project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())))
  );
CREATE POLICY "comments_insert"
  ON comments FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND (
      project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
      OR task_id IN (SELECT id FROM tasks WHERE project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid()))
    )
  );
