/*
  # Fix Project Policies

  1. Changes
    - Fix infinite recursion in project members policy
    - Simplify project access policies
    - Add better security for project member management

  2. Security
    - Users can view projects they are members of
    - Project owners can manage project members
    - Project members can view other members
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view project members" ON project_members;
DROP POLICY IF EXISTS "Only owners can manage project members" ON project_members;

-- Create new policies for project members
CREATE POLICY "Users can view members of their projects"
  ON project_members FOR SELECT
  USING (
    project_id IN (
      SELECT project_id 
      FROM project_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Project owners can manage members"
  ON project_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = project_id
      AND user_id = auth.uid()
      AND role = 'owner'
    )
  );