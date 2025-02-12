/*
  # Add archive functionality to projects

  1. Changes
    - Add `archived` column to projects table
    - Update project policies to handle archived state
    - Add index on archived column for better performance

  2. Security
    - Only project members can archive/unarchive projects
*/

-- Add archived column to projects
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;

-- Add index for better performance when filtering archived projects
CREATE INDEX IF NOT EXISTS projects_archived_idx ON projects(archived);

-- Update project policies to handle archived state
DROP POLICY IF EXISTS "Project access" ON projects;
CREATE POLICY "Project access"
  ON projects FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = id
      AND project_members.user_id = auth.uid()
    )
  );