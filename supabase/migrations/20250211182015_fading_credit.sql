/*
  # Fix Tasks Foreign Key Relationship

  1. Changes
    - Add explicit foreign key reference to auth.users for assignee_id
    - Update task policies to handle assignee relationships

  2. Security
    - Add policies for task management
*/

-- Add explicit foreign key reference to auth.users
ALTER TABLE tasks
DROP CONSTRAINT IF EXISTS tasks_assignee_id_fkey,
ADD CONSTRAINT tasks_assignee_id_fkey
  FOREIGN KEY (assignee_id)
  REFERENCES auth.users(id)
  ON DELETE SET NULL;

-- Drop existing task policies if any
DROP POLICY IF EXISTS "Users can view tasks in their projects" ON tasks;
DROP POLICY IF EXISTS "Project members can create and update tasks" ON tasks;

-- Create new task policies
CREATE POLICY "view_project_tasks"
  ON tasks FOR SELECT
  USING (
    project_id IN (
      SELECT project_id
      FROM project_members
      WHERE user_id = auth.uid()
    )
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