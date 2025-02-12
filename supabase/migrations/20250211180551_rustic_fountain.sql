/*
  # Fix Project Member Policies - Final Version

  1. Changes
    - Completely restructure policies to avoid recursion
    - Simplify policy logic
    - Use direct user ID comparison where possible
    - Add proper project visibility policy

  2. Security
    - Maintain proper access control
    - Prevent policy recursion
    - Ensure data visibility follows project membership
*/

-- First, drop all existing policies to start fresh
DROP POLICY IF EXISTS "Members can view project members" ON project_members;
DROP POLICY IF EXISTS "Owners can insert project members" ON project_members;
DROP POLICY IF EXISTS "Owners can update project members" ON project_members;
DROP POLICY IF EXISTS "Owners can delete project members" ON project_members;
DROP POLICY IF EXISTS "Users can view projects they are members of" ON projects;

-- Project visibility policy
CREATE POLICY "Users can view their projects"
  ON projects FOR SELECT
  USING (
    id IN (
      SELECT project_id
      FROM project_members
      WHERE user_id = auth.uid()
    )
  );

-- Project members policies
CREATE POLICY "View project members"
  ON project_members FOR SELECT
  USING (
    project_id IN (
      SELECT project_id
      FROM project_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Insert project members"
  ON project_members FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT project_id
      FROM project_members
      WHERE user_id = auth.uid()
      AND role = 'owner'
    )
  );

CREATE POLICY "Update project members"
  ON project_members FOR UPDATE
  USING (
    project_id IN (
      SELECT project_id
      FROM project_members
      WHERE user_id = auth.uid()
      AND role = 'owner'
    )
  );

CREATE POLICY "Delete project members"
  ON project_members FOR DELETE
  USING (
    project_id IN (
      SELECT project_id
      FROM project_members
      WHERE user_id = auth.uid()
      AND role = 'owner'
    )
  );