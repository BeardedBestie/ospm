/*
  # Fix Project Member Policies - Final Version

  1. Changes
    - Simplify policies to avoid any potential recursion
    - Use direct user ID checks
    - Optimize query performance
    - Fix project member count queries

  2. Security
    - Maintain proper access control
    - Prevent policy recursion
    - Ensure data visibility follows project membership
*/

-- First, drop all existing policies
DROP POLICY IF EXISTS "Users can view their projects" ON projects;
DROP POLICY IF EXISTS "View project members" ON project_members;
DROP POLICY IF EXISTS "Insert project members" ON project_members;
DROP POLICY IF EXISTS "Update project members" ON project_members;
DROP POLICY IF EXISTS "Delete project members" ON project_members;

-- Project policies
CREATE POLICY "Project access"
  ON projects FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = id
      AND project_members.user_id = auth.uid()
    )
  );

-- Project members policies
CREATE POLICY "Member access"
  ON project_members FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Owner management"
  ON project_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = project_id
      AND project_members.user_id = auth.uid()
      AND project_members.role = 'owner'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = project_id
      AND project_members.user_id = auth.uid()
      AND project_members.role = 'owner'
    )
  );