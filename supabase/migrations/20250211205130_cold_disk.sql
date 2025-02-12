/*
  # Add deadlines and make task description optional

  1. Changes
    - Add deadline field to projects table
    - Add deadline field to tasks table
    - Make task description optional
    - Add updated_at trigger functions

  2. Security
    - Maintain existing RLS policies
*/

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add deadline to projects
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS deadline timestamptz;

-- Add deadline to tasks
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS deadline timestamptz,
ALTER COLUMN description DROP NOT NULL;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();