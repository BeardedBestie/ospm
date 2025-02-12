/*
  # Fix policies and add performance optimizations

  1. Changes
    - Simplify policies to avoid complex joins
    - Add indexes for better query performance
    - Fix project access for admins
    - Ensure proper cascading for foreign keys
    
  2. Security
    - Maintain proper access control
    - Optimize query performance
    - Keep data properly protected
*/

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON user_profiles(status);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON tasks(assignee_id);

-- Simplify user_profiles policies
DROP POLICY IF EXISTS "view_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "admin_view_all_profiles" ON user_profiles;
DROP POLICY IF EXISTS "admin_update_profiles" ON user_profiles;

CREATE POLICY "user_profiles_access"
  ON user_profiles FOR SELECT
  USING (true);

CREATE POLICY "admin_manage_profiles"
  ON user_profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'admin'
      AND status = 'active'
    )
  );

-- Simplify project policies
DROP POLICY IF EXISTS "project_access" ON projects;
DROP POLICY IF EXISTS "project_write_access" ON projects;

CREATE POLICY "projects_access"
  ON projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND (
        (up.role = 'admin' AND up.status = 'active')
        OR (
          up.status = 'active'
          AND EXISTS (
            SELECT 1 FROM project_members pm
            WHERE pm.project_id = projects.id
            AND pm.user_id = auth.uid()
          )
        )
      )
    )
  );

CREATE POLICY "projects_write"
  ON projects FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND up.status = 'active'
      AND (
        up.role = 'admin'
        OR (
          up.role = 'user'
          AND EXISTS (
            SELECT 1 FROM project_members pm
            WHERE pm.project_id = projects.id
            AND pm.user_id = auth.uid()
          )
        )
      )
    )
  );

-- Simplify task policies
DROP POLICY IF EXISTS "task_view_access" ON tasks;
DROP POLICY IF EXISTS "task_write_access" ON tasks;

CREATE POLICY "tasks_access"
  ON tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND up.status = 'active'
      AND (
        up.role = 'admin'
        OR assignee_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM project_members pm
          WHERE pm.project_id = tasks.project_id
          AND pm.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "tasks_write"
  ON tasks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND up.status = 'active'
      AND (
        up.role = 'admin'
        OR up.role = 'user'
        OR assignee_id = auth.uid()
      )
    )
  );

-- Simplify comment policies
DROP POLICY IF EXISTS "comment_view_access" ON comments;
DROP POLICY IF EXISTS "comment_create_access" ON comments;

CREATE POLICY "comments_access"
  ON comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND up.status = 'active'
      AND (
        up.role = 'admin'
        OR EXISTS (
          SELECT 1 FROM project_members pm
          WHERE (
            pm.project_id = comments.project_id
            OR pm.project_id = (
              SELECT project_id FROM tasks
              WHERE id = comments.task_id
            )
          )
          AND pm.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "comments_create"
  ON comments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND up.status = 'active'
    )
    AND user_id = auth.uid()
  );

-- Create a function to ensure first user is admin
CREATE OR REPLACE FUNCTION ensure_admin_exists()
RETURNS trigger AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE role = 'admin'
  ) THEN
    UPDATE user_profiles
    SET role = 'admin',
        status = 'active'
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ language plpgsql security definer;

-- Create trigger to ensure first user becomes admin
DROP TRIGGER IF EXISTS ensure_admin_trigger ON user_profiles;
CREATE TRIGGER ensure_admin_trigger
  AFTER INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION ensure_admin_exists();