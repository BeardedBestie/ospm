/*
  # Fix Project Creation and Add Sample Data
  
  1. Changes
    - Add INSERT policy for projects
    - Add sample project and tasks using a function
  
  2. Security
    - Allow authenticated users to create projects
    - Maintain existing access controls
*/

-- Add INSERT policy for projects
CREATE POLICY "users_can_create_projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Create function to add sample data
CREATE OR REPLACE FUNCTION add_sample_project()
RETURNS void AS $$
DECLARE
  v_project_id uuid;
  v_user_id uuid;
BEGIN
  -- Get the first user from auth.users (for demo purposes)
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;
  
  -- Create project
  INSERT INTO projects (name, description)
  VALUES (
    'Intern Training System',
    'A comprehensive system to manage and track intern onboarding, training modules, and progress assessments.'
  )
  RETURNING id INTO v_project_id;

  -- Add project owner
  INSERT INTO project_members (project_id, user_id, role)
  VALUES (v_project_id, v_user_id, 'owner');

  -- Insert sample tasks
  INSERT INTO tasks (title, description, status, project_id, assignee_id)
  VALUES
    (
      'Set up onboarding documentation',
      'Create comprehensive documentation covering company policies, procedures, and getting started guides',
      'InProgress',
      v_project_id,
      v_user_id
    ),
    (
      'Design training modules',
      'Create structured learning modules covering essential skills and technologies',
      'ToDo',
      v_project_id,
      v_user_id
    ),
    (
      'Implement progress tracking',
      'Develop a system to track and evaluate intern progress through training modules',
      'ToDo',
      v_project_id,
      v_user_id
    ),
    (
      'Create mentor assignment system',
      'Build functionality to assign mentors to interns and manage mentor-intern relationships',
      'Blocked',
      v_project_id,
      v_user_id
    );
END;
$$ LANGUAGE plpgsql;

-- Execute the function to add sample data
SELECT add_sample_project();

-- Clean up
DROP FUNCTION add_sample_project();