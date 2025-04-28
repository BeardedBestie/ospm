import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface Project {
  id: string;
  name: string;
  description: string;
  deadline: string | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
  memberCount: number;
  taskCount: number;
}

export function useProjects(userId?: string) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProjects() {
      setLoading(true);
      setError(null);

      if (!userId) {
        setProjects([]);
        setLoading(false);
        return;
      }

      try {
        const { data: memberships, error: memError } = await supabase
          .from('project_members')
          .select('project_id')
          .eq('user_id', userId);
        if (memError) throw memError;

        const projectIds = memberships?.map((m) => m.project_id) || [];
        if (projectIds.length === 0) {
          setProjects([]);
          return;
        }

        const { data: projectsData, error: projError } = await supabase
          .from('projects')
          .select('*')
          .in('id', projectIds)
          .order('created_at', { ascending: false });
        if (projError) throw projError;

        const memberCounts = await Promise.all(
          projectIds.map(async (id) => {
            const { count, error: countError } = await supabase
              .from('project_members')
              .select('*', { count: 'exact', head: true })
              .eq('project_id', id);
            if (countError) throw countError;
            return { project_id: id, count: count || 0 };
          })
        );

        const taskCounts = await Promise.all(
          projectIds.map(async (id) => {
            const { count, error: countError } = await supabase
              .from('tasks')
              .select('*', { count: 'exact', head: true })
              .eq('project_id', id);
            if (countError) throw countError;
            return { project_id: id, count: count || 0 };
          })
        );

        const projectsWithCounts = (projectsData || []).map((proj) => ({
          ...proj,
          memberCount:
            memberCounts.find((c) => c.project_id === proj.id)?.count || 0,
          taskCount:
            taskCounts.find((c) => c.project_id === proj.id)?.count || 0,
        }));

        setProjects(projectsWithCounts);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, [userId]);

  return { projects, loading, error };
}
