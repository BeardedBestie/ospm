-- Drop all existing policies
DROP POLICY IF EXISTS "anyone_can_view_profiles" ON user_profiles;
DROP POLICY IF EXISTS "admins_can_manage_profiles" ON user_profiles;
DROP POLICY IF EXISTS "members_can_view_projects" ON projects;
DROP POLICY IF EXISTS "members_can_manage_projects" ON projects;
DROP POLICY IF EXISTS "members_can_view_project_members" ON project_members;
DROP POLICY IF EXISTS "owners_can_manage_project_members" ON project_members;
DROP POLICY IF EXISTS "members_can_view_tasks" ON tasks;
DROP POLICY IF EXISTS "members_can_manage_tasks" ON tasks;
DROP POLICY IF EXISTS "members_can_view_comments" ON comments;
DROP POLICY IF EXISTS "members_can_create_comments" ON comments;

-- Create simplified policies that avoid recursion
-- User Profiles - Allow all authenticated users to read, admins to write
CREATE POLICY "read_profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "admin_write_profiles"
  ON user_profiles FOR ALL
  TO authenticated
  USING (auth.uid() IN (
    SELECT id FROM user_profiles 
    WHERE role = 'admin'::user_role 
    AND status = 'active'::user_status
  ));

-- Projects - Simple membership check
CREATE POLICY "view_projects"
  ON projects FOR SELECT
  TO authenticated
  USING (id IN (
    SELECT project_id FROM project_members
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "manage_projects"
  ON projects FOR ALL
  TO authenticated
  USING (id IN (
    SELECT project_id FROM project_members
    WHERE user_id = auth.uid()
    AND role = 'owner'
  ));

-- Project Members - Direct access check
CREATE POLICY "view_members"
  ON project_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "manage_members"
  ON project_members FOR ALL
  TO authenticated
  USING (project_id IN (
    SELECT project_id FROM project_members
    WHERE user_id = auth.uid()
    AND role = 'owner'
  ));

-- Tasks - Direct project membership or assignee check
CREATE POLICY "view_tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT project_id FROM project_members
      WHERE user_id = auth.uid()
    )
    OR assignee_id = auth.uid()
  );

CREATE POLICY "manage_tasks"
  ON tasks FOR ALL
  TO authenticated
  USING (
    project_id IN (
      SELECT project_id FROM project_members
      WHERE user_id = auth.uid()
    )
  );

-- Comments - Direct access check based on project or task
CREATE POLICY "view_comments"
  ON comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "create_comments"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());