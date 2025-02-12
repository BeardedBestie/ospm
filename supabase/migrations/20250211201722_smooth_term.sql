/*
  # Fix Comments Table Structure

  1. Changes
    - Add project_id to comments table
    - Add proper foreign key relationships
    - Update RLS policies
*/

-- First, drop existing comments table if it exists
DROP TABLE IF EXISTS comments;

-- Recreate comments table with proper structure
CREATE TABLE comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT comments_target_check CHECK (
    (project_id IS NOT NULL AND task_id IS NULL) OR
    (project_id IS NULL AND task_id IS NOT NULL)
  )
);

-- Enable RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Comments policies
CREATE POLICY "Users can view comments on their projects"
  ON comments FOR SELECT
  USING (
    (project_id IN (
      SELECT project_id FROM project_members
      WHERE user_id = auth.uid()
    ))
    OR
    (task_id IN (
      SELECT tasks.id FROM tasks
      JOIN project_members ON project_members.project_id = tasks.project_id
      WHERE project_members.user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can create comments on their projects"
  ON comments FOR INSERT
  WITH CHECK (
    (project_id IN (
      SELECT project_id FROM project_members
      WHERE user_id = auth.uid()
    ))
    OR
    (task_id IN (
      SELECT tasks.id FROM tasks
      JOIN project_members ON project_members.project_id = tasks.project_id
      WHERE project_members.user_id = auth.uid()
    ))
  );