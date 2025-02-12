import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { supabase } from '../../lib/supabase';
import { Loader2, AlertCircle } from 'lucide-react';

interface ArchivedProject {
  id: string;
  name: string;
  description: string;
  created_at: string;
  archived_at: string;
}

export default function ArchivedProjects() {
  const [projects, setProjects] = useState<ArchivedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
    try {
      const { data, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('archived', true)
        .order('updated_at', { ascending: false });

      if (projectsError) throw projectsError;
      setProjects(data || []);
    } catch (err) {
      console.error('Error fetching archived projects:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch archived projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const unarchiveProject = async (projectId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('projects')
        .update({ archived: false })
        .eq('id', projectId);

      if (updateError) throw updateError;
      await fetchProjects();
    } catch (err) {
      console.error('Error unarchiving project:', err);
      setError(err instanceof Error ? err.message : 'Failed to unarchive project');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg flex items-center gap-2">
        <AlertCircle className="h-5 w-5" />
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Archived Projects</h2>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Project
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Archived Date
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {projects.map((project) => (
              <tr key={project.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium">{project.name}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                    {project.description}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {format(new Date(project.updated_at), 'MMM d, yyyy')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => unarchiveProject(project.id)}
                    className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                  >
                    Unarchive
                  </button>
                </td>
              </tr>
            ))}
            {projects.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                  No archived projects found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}