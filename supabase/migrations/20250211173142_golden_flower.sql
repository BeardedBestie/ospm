/*
  # Initial Schema Setup for Project Management Platform

  1. New Tables
    - users (managed by Supabase Auth)
    - projects
      - id (uuid, primary key)
      - name (text)
      - description (text)
      - created_at (timestamp)
      - updated_at (timestamp)
    - tasks
      - id (uuid, primary key)
      - title (text)
      - description (text)
      - status (text) - ToDo, InProgress, Blocked, Finished
      - project_id (uuid, foreign key)
      - assignee_id (uuid, foreign key)
      - created_at (timestamp)
      - updated_at (timestamp)
    - comments
      - id (uuid, primary key)
      - content (text)
      - task_id (uuid, foreign key)
      - user_id (uuid, foreign key)
      - created_at (timestamp)
    - project_members
      - project_id (uuid, foreign key)
      - user_id (uuid, foreign key)
      - role (text) - owner, member
      - joined_at (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Projects table
CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tasks table
CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'ToDo' CHECK (status IN ('ToDo', 'InProgress', 'Blocked', 'Finished')),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  assignee_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Comments table
CREATE TABLE comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Project members table
CREATE TABLE project_members (
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY (project_id, user_id)
);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- Project policies
CREATE POLICY "Users can view projects they are members of"
  ON projects FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM project_members
    WHERE project_members.project_id = projects.id
    AND project_members.user_id = auth.uid()
  ));

CREATE POLICY "Project owners can update their projects"
  ON projects FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM project_members
    WHERE project_members.project_id = projects.id
    AND project_members.user_id = auth.uid()
    AND project_members.role = 'owner'
  ));

-- Task policies
CREATE POLICY "Users can view tasks in their projects"
  ON tasks FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM project_members
    WHERE project_members.project_id = tasks.project_id
    AND project_members.user_id = auth.uid()
  ));

CREATE POLICY "Project members can create and update tasks"
  ON tasks FOR ALL
  USING (EXISTS (
    SELECT 1 FROM project_members
    WHERE project_members.project_id = tasks.project_id
    AND project_members.user_id = auth.uid()
  ));

-- Comment policies
CREATE POLICY "Users can view comments on tasks in their projects"
  ON comments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM tasks
    JOIN project_members ON project_members.project_id = tasks.project_id
    WHERE tasks.id = comments.task_id
    AND project_members.user_id = auth.uid()
  ));

CREATE POLICY "Users can create comments on tasks in their projects"
  ON comments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      JOIN project_members ON project_members.project_id = tasks.project_id
      WHERE tasks.id = comments.task_id
      AND project_members.user_id = auth.uid()
    )
  );

-- Project members policies
CREATE POLICY "Users can view project members"
  ON project_members FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM project_members pm
    WHERE pm.project_id = project_members.project_id
    AND pm.user_id = auth.uid()
  ));

CREATE POLICY "Only owners can manage project members"
  ON project_members FOR ALL
  USING (EXISTS (
    SELECT 1 FROM project_members pm
    WHERE pm.project_id = project_members.project_id
    AND pm.user_id = auth.uid()
    AND pm.role = 'owner'
  ));