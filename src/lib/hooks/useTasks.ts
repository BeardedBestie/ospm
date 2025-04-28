import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export interface Task {
  id: string;
  title: string;
  status: string;
}

export function useTasks(projectId?: string) {
  const [tasksByStatus, setTasksByStatus] = useState<Record<string, Task[]>>({
    ToDo: [],
    InProgress: [],
    Blocked: [],
    Finished: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('tasks')
        .select('id, title, status')
        .order('created_at', { ascending: false });
      if (projectId) {
        query = query.eq('project_id', projectId);
      }
      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      const grouped: Record<string, Task[]> = {
        ToDo: [],
        InProgress: [],
        Blocked: [],
        Finished: [],
      };
      (data || []).forEach((task: Task) => {
        if (grouped[task.status]) {
          grouped[task.status].push(task);
        }
      });
      setTasksByStatus(grouped);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [projectId]);

  const updateTaskStatus = async (id: string, status: string) => {
    await supabase.from('tasks').update({ status }).eq('id', id);
    fetchTasks();
  };

  return { tasksByStatus, loading, error, updateTaskStatus };
}
