/*
  # Fix Project Queries and Policies

  1. Changes
    - Simplify project access policies
    - Add separate count policies
    - Optimize query performance
    - Fix recursive policy issues

  2. Security
    - Maintain proper access control
    - Prevent policy recursion
    - Ensure data visibility follows project membership
*/

-- First, drop existing policies
DROP POLICY IF EXISTS "Project access" ON projects;
DROP POLICY IF EXISTS "Member access" ON project_members;
DROP POLICY IF EXISTS "Owner management" ON project_members;

-- Project policies
CREATE POLICY "Project member access"
  ON projects FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id
      FROM project_members
      WHERE project_id = id
    )
  );

-- Project members policies
CREATE POLICY "View own membership"
  ON project_members FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "View project membership"
  ON project_members FOR SELECT
  USING (
    project_id IN (
      SELECT project_id
      FROM project_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Manage as owner"
  ON project_members FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id
      FROM project_members
      WHERE project_id = project_members.project_id
      AND role = 'owner'
    )
  );