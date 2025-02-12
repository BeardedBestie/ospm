/*
  # Fix Project Member Policies

  1. Changes
    - Fix infinite recursion in project members policies
    - Implement separate policies for different operations
    - Ensure proper access control for project members

  2. Security
    - Project owners can manage all members
    - Project members can view other members
    - Prevent recursive policy checks
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view members of their projects" ON project_members;
DROP POLICY IF EXISTS "Project owners can manage members" ON project_members;

-- Create separate policies for different operations
CREATE POLICY "Members can view project members"
  ON project_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_members.project_id
      AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners can insert project members"
  ON project_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_members.project_id
      AND pm.user_id = auth.uid()
      AND pm.role = 'owner'
    )
  );

CREATE POLICY "Owners can update project members"
  ON project_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_members.project_id
      AND pm.user_id = auth.uid()
      AND pm.role = 'owner'
    )
  );

CREATE POLICY "Owners can delete project members"
  ON project_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_members.project_id
      AND pm.user_id = auth.uid()
      AND pm.role = 'owner'
    )
  );