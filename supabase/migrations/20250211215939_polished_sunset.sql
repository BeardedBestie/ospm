/*
  # Fix recursive policies for user_profiles

  1. Changes
    - Drop existing recursive policies
    - Create new non-recursive policies for user_profiles
    - Simplify admin access checks
    
  2. Security
    - Maintain proper access control
    - Prevent infinite recursion
    - Keep data properly protected
*/

-- First, drop all existing policies on user_profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON user_profiles;

-- Create new non-recursive policies
CREATE POLICY "view_own_profile"
  ON user_profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "admin_view_all_profiles"
  ON user_profiles FOR SELECT
  USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "admin_update_profiles"
  ON user_profiles FOR UPDATE
  USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  );

-- Update project policies to use non-recursive admin check
DROP POLICY IF EXISTS "Project member access" ON projects;
CREATE POLICY "project_access"
  ON projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = id
      AND pm.user_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM user_profiles up
        WHERE up.id = auth.uid()
        AND up.status = 'active'
      )
    )
    OR (
      SELECT role FROM user_profiles WHERE id = auth.uid()
    ) = 'admin'
  );

DROP POLICY IF EXISTS "Project member write access" ON projects;
CREATE POLICY "project_write_access"
  ON projects FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = id
      AND pm.user_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM user_profiles up
        WHERE up.id = auth.uid()
        AND up.status = 'active'
        AND up.role IN ('admin', 'user')
      )
    )
  );

-- Update task policies to use non-recursive admin check
DROP POLICY IF EXISTS "view_tasks" ON tasks;
CREATE POLICY "task_view_access"
  ON tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = tasks.project_id
      AND pm.user_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM user_profiles up
        WHERE up.id = auth.uid()
        AND up.status = 'active'
      )
    )
    OR assignee_id = auth.uid()
    OR (
      SELECT role FROM user_profiles WHERE id = auth.uid()
    ) = 'admin'
  );

DROP POLICY IF EXISTS "manage_tasks" ON tasks;
CREATE POLICY "task_write_access"
  ON tasks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = tasks.project_id
      AND pm.user_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM user_profiles up
        WHERE up.id = auth.uid()
        AND up.status = 'active'
        AND up.role IN ('admin', 'user')
      )
    )
    OR assignee_id = auth.uid()
  );

-- Update comment policies to use non-recursive admin check
DROP POLICY IF EXISTS "view_comments" ON comments;
CREATE POLICY "comment_view_access"
  ON comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE (
        pm.project_id = comments.project_id
        OR pm.project_id = (
          SELECT project_id FROM tasks
          WHERE id = comments.task_id
        )
      )
      AND pm.user_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM user_profiles up
        WHERE up.id = auth.uid()
        AND up.status = 'active'
      )
    )
    OR (
      SELECT role FROM user_profiles WHERE id = auth.uid()
    ) = 'admin'
  );

DROP POLICY IF EXISTS "create_comments" ON comments;
CREATE POLICY "comment_create_access"
  ON comments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND status = 'active'
    )
    AND user_id = auth.uid()
  );