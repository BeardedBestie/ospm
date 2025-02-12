/*
  # Fix Tasks Assignee Relationship

  1. Changes
    - Add proper foreign key relationship for tasks.assignee_id
    - Update task policies to handle assignee relationship
*/

-- First ensure the foreign key is properly set up
ALTER TABLE tasks
DROP CONSTRAINT IF EXISTS tasks_assignee_id_fkey,
ADD CONSTRAINT tasks_assignee_id_fkey
  FOREIGN KEY (assignee_id)
  REFERENCES auth.users(id)
  ON DELETE SET NULL;

-- Update task policies to include assignee access
DROP POLICY IF EXISTS "view_project_tasks" ON tasks;
DROP POLICY IF EXISTS "manage_project_tasks" ON tasks;

CREATE POLICY "view_project_tasks"
  ON tasks FOR SELECT
  USING (
    project_id IN (
      SELECT project_id
      FROM project_members
      WHERE user_id = auth.uid()
    )
    OR assignee_id = auth.uid()
  );

CREATE POLICY "manage_project_tasks"
  ON tasks FOR ALL
  USING (
    project_id IN (
      SELECT project_id
      FROM project_members
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT project_id
      FROM project_members
      WHERE user_id = auth.uid()
    )
  );