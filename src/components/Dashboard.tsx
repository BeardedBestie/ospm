import React, { useState, useEffect } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ProjectCard from './projects/ProjectCard';
import CreateProjectModal from './projects/CreateProjectModal';
import EditProjectModal from './projects/EditProjectModal';
import TaskList from './tasks/TaskList';
import CommentList from './comments/CommentList';
import { useStore } from '../lib/store';

interface Project {
  id: string;
  name: string;
  description: string;
  deadline: string | null;
  created_at: string;
  taskCount?: number;
  memberCount?: number;
}

export default function Dashboard() {
  const { user } = useStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);

  const fetchProjects = async () => {
    if (!user?.id) {
      setProjects([]);
      setLoading(false);
      return;
    }

    try {
      // Get user's project memberships first
      const { data: memberships, error: membershipError } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', user.id);

      if (membershipError) throw membershipError;

      // Get projects the user is a member of
      const projectIds = memberships?.map(m => m.project_id) || [];
      
      if (projectIds.length === 0) {
        setProjects([]);
        setLoading(false);
        return;
      }

      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .in('id', projectIds)
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;

      // Get member counts
      const memberCounts = await Promise.all(
        projectIds.map(async (projectId) => {
          const { count } = await supabase
            .from('project_members')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', projectId);
          return { project_id: projectId, count: count || 0 };
        })
      );

      // Get task counts
      const taskCounts = await Promise.all(
        projectIds.map(async (projectId) => {
          const { count } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', projectId);
          return { project_id: projectId, count: count || 0 };
        })
      );

      // Combine the data
      const projectsWithCounts = projectsData.map(project => ({
        ...project,
        memberCount: memberCounts.find(c => c.project_id === project.id)?.count || 0,
        taskCount: taskCounts.find(c => c.project_id === project.id)?.count || 0,
      }));

      setProjects(projectsWithCounts);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchProjects();
    }
  }, [user?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <p className="text-red-500 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {selectedProject ? (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <button
                onClick={() => setSelectedProject(null)}
                className="text-sm text-primary-600 hover:text-primary-700 mb-2"
              >
                ← Back to Projects
              </button>
              <h1 className="text-2xl font-bold">{selectedProject.name}</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                {selectedProject.description}
              </p>
            </div>
          </div>
          
          <div className="space-y-8">
            <TaskList projectId={selectedProject.id} />
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <CommentList projectId={selectedProject.id} />
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">My Projects</h1>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
            >
              <Plus className="h-4 w-4" />
              New Project
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => setSelectedProject(project)}
                onEdit={() => setProjectToEdit(project)}
              />
            ))}
            {projects.length === 0 && (
              <div className="col-span-3 text-center py-12 text-gray-500 dark:text-gray-400">
                No projects yet. Click "New Project" to create one.
              </div>
            )}
          </div>
        </>
      )}

      {showCreateModal && (
        <CreateProjectModal
          onClose={() => setShowCreateModal(false)}
          onProjectCreated={() => {
            fetchProjects();
            setShowCreateModal(false);
          }}
        />
      )}

      {projectToEdit && (
        <EditProjectModal
          project={projectToEdit}
          onClose={() => setProjectToEdit(null)}
          onProjectUpdated={() => {
            fetchProjects();
            setProjectToEdit(null);
          }}
        />
      )}
    </div>
  );
}