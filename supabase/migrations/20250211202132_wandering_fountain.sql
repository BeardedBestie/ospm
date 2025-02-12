/*
  # Fix Foreign Key Relationships

  1. Changes
    - Add explicit foreign key references to auth.users
    - Update comments table structure
    - Fix project members foreign key
    - Add proper RLS policies

  2. Security
    - Maintain RLS policies
    - Ensure proper access control
*/

-- First ensure we have the proper foreign key references
ALTER TABLE project_members
DROP CONSTRAINT IF EXISTS project_members_user_id_fkey,
ADD CONSTRAINT project_members_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- Drop and recreate comments table with proper structure
DROP TABLE IF EXISTS comments;

CREATE TABLE comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT comments_target_check CHECK (
    (project_id IS NOT NULL AND task_id IS NULL) OR
    (project_id IS NULL AND task_id IS NOT NULL)
  )
);

-- Enable RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Comments policies
CREATE POLICY "view_comments"
  ON comments FOR SELECT
  USING (
    project_id IN (
      SELECT project_id FROM project_members
      WHERE user_id = auth.uid()
    )
    OR
    task_id IN (
      SELECT tasks.id FROM tasks
      JOIN project_members ON project_members.project_id = tasks.project_id
      WHERE project_members.user_id = auth.uid()
    )
  );

CREATE POLICY "create_comments"
  ON comments FOR INSERT
  WITH CHECK (
    (
      project_id IN (
        SELECT project_id FROM project_members
        WHERE user_id = auth.uid()
      )
      OR
      task_id IN (
        SELECT tasks.id FROM tasks
        JOIN project_members ON project_members.project_id = tasks.project_id
        WHERE project_members.user_id = auth.uid()
      )
    )
    AND
    user_id = auth.uid()
  );