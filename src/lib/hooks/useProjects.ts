import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export interface Project {
  id: string;
  name: string;
  description: string;
  deadline: string | null;
  archived: boolean;
  created_at: string;
}

export function useProjects(userId?: string) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
    if (!userId) {
      setProjects([]);
      return;
    }
    setLoading(true);
    try {
      const { data: memberships, error: mError } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', userId);
      if (mError) throw mError;

      const ids = memberships?.map((m) => m.project_id) || [];
      if (ids.length === 0) {
        setProjects([]);
        return;
      }

      const { data: projectsData, error: pError } = await supabase
        .from('projects')
        .select('*')
        .in('id', ids)
        .order('created_at', { ascending: false });
      if (pError) throw pError;

      setProjects(projectsData || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [userId]);

  return { projects, loading, error, refetch: fetchProjects };
}
