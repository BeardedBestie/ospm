-- 003_rls_policies.sql
-- Enable RLS and set up policies

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- User_profiles policies
CREATE POLICY "allow_read_profiles" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "allow_manage_profiles" ON user_profiles FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_profiles up WHERE up.id = auth.uid() AND up.role = 'admin' AND up.status = 'active'
  )
);

-- Projects policies
CREATE POLICY "members_can_view_projects" ON projects FOR SELECT USING (
  auth.uid() IN (SELECT user_id FROM project_members WHERE project_id = projects.id)
);
CREATE POLICY "owners_can_manage_projects" ON projects FOR ALL USING (
  auth.uid() IN (SELECT user_id FROM project_members WHERE project_id = projects.id AND role = 'owner')
);

-- Project_members policies
CREATE POLICY "members_can_view_members" ON project_members FOR SELECT USING (
  project_members.user_id = auth.uid()
);
CREATE POLICY "owners_can_manage_members" ON project_members FOR ALL USING (
  project_members.project_id IN (
    SELECT project_id FROM project_members WHERE user_id = auth.uid() AND role = 'owner'
  )
);

-- Tasks policies
CREATE POLICY "tasks_can_view" ON tasks FOR SELECT USING (
  auth.uid() = tasks.assignee_id OR auth.uid() IN (
    SELECT user_id FROM project_members WHERE project_id = tasks.project_id
  )
);
CREATE POLICY "tasks_can_manage" ON tasks FOR ALL USING (
  auth.uid() IN (SELECT user_id FROM project_members WHERE project_id = tasks.project_id)
);

-- Comments policies
CREATE POLICY "comments_can_view" ON comments FOR SELECT USING (
  auth.uid() IN (
    SELECT user_id FROM project_members WHERE project_id = comments.project_id
  ) OR auth.uid() IN (
    SELECT user_id FROM project_members WHERE project_id = (SELECT project_id FROM tasks WHERE id = comments.task_id)
  )
);
CREATE POLICY "comments_can_insert" ON comments FOR INSERT WITH CHECK (
  auth.uid() = user_id AND (
    project_id IS NOT NULL OR task_id IS NOT NULL
  )
);
