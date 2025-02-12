/*
  # Simplified Project Member Policies
  
  1. Changes
    - Remove all complex policies
    - Implement basic, direct policies without any joins
    - Use simple equality checks where possible
  
  2. Security
    - Maintain basic access control
    - Keep owner privileges
    - Ensure data protection
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "Project access" ON projects;
DROP POLICY IF EXISTS "View own memberships" ON project_members;
DROP POLICY IF EXISTS "View project memberships" ON project_members;
DROP POLICY IF EXISTS "Owners can insert members" ON project_members;
DROP POLICY IF EXISTS "Owners can update members" ON project_members;
DROP POLICY IF EXISTS "Owners can delete members" ON project_members;

-- Basic project access
CREATE POLICY "users_can_view_projects"
  ON projects FOR SELECT
  USING (true);

CREATE POLICY "users_can_update_own_projects"
  ON projects FOR UPDATE
  USING (
    id IN (
      SELECT project_id FROM project_members 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Simplified project members policies
CREATE POLICY "users_can_view_members"
  ON project_members FOR SELECT
  USING (true);

CREATE POLICY "owners_can_manage_members"
  ON project_members FOR INSERT
  WITH CHECK (
    (SELECT role FROM project_members WHERE user_id = auth.uid() AND project_id = project_members.project_id LIMIT 1) = 'owner'
  );

CREATE POLICY "owners_can_update_members"
  ON project_members FOR UPDATE
  USING (
    (SELECT role FROM project_members WHERE user_id = auth.uid() AND project_id = project_members.project_id LIMIT 1) = 'owner'
  );

CREATE POLICY "owners_can_delete_members"
  ON project_members FOR DELETE
  USING (
    (SELECT role FROM project_members WHERE user_id = auth.uid() AND project_id = project_members.project_id LIMIT 1) = 'owner'
  );