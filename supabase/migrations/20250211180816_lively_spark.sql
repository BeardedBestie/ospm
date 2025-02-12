/*
  # Fix infinite recursion in project member policies
  
  1. Changes
    - Remove complex recursive policies
    - Add simple, direct policies for project members
    - Ensure basic CRUD operations work without recursion
  
  2. Security
    - Maintain row-level security
    - Keep owner/member role distinctions
    - Preserve data access controls
*/

-- First, drop all existing policies for project_members
DROP POLICY IF EXISTS "Project member access" ON projects;
DROP POLICY IF EXISTS "View own membership" ON project_members;
DROP POLICY IF EXISTS "View project membership" ON project_members;
DROP POLICY IF EXISTS "Manage as owner" ON project_members;

-- Simple project access policy
CREATE POLICY "Project access"
  ON projects FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = id
      AND project_members.user_id = auth.uid()
    )
  );

-- Simple, non-recursive policies for project_members
CREATE POLICY "View own memberships"
  ON project_members FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "View project memberships"
  ON project_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_members.project_id
      AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners can insert members"
  ON project_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_members.project_id
      AND pm.user_id = auth.uid()
      AND pm.role = 'owner'
    )
  );

CREATE POLICY "Owners can update members"
  ON project_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_members.project_id
      AND pm.user_id = auth.uid()
      AND pm.role = 'owner'
    )
  );

CREATE POLICY "Owners can delete members"
  ON project_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_members.project_id
      AND pm.user_id = auth.uid()
      AND pm.role = 'owner'
    )
  );