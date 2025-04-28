import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  deadline: string | null;
  assignee: { id: string; email: string; raw_user_meta_data: any } | null;
}

export function useTasks(projectId?: string) {
  const [columns, setColumns] = useState<Record<string, Task[]>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTasks() {
      setLoading(true);
      setError(null);

      if (!projectId) {
        setColumns({});
        setLoading(false);
        return;
      }

      try {
        const { data, error: tasksError } = await supabase
          .from('tasks')
          .select(`
            id,
            title,
            description,
            status,
            deadline,
            assignee_id,
            assignee:users!tasks_assignee_id_fkey (
              id,
              email,
              raw_user_meta_data
            )
          `)
          .eq('project_id', projectId)
          .order('created_at', { ascending: false });
        if (tasksError) throw tasksError;

        const cols: Record<string, Task[]> = {
          ToDo: [],
          InProgress: [],
          Blocked: [],
          Finished: [],
        };

        (data || []).forEach((task) => {
          const list = cols[task.status] || cols.ToDo;
          list.push({
            id: task.id,
            title: task.title,
            description: task.description,
            status: task.status,
            deadline: task.deadline,
            assignee: task.assignee || null,
          });
        });

        setColumns(cols);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    }

    fetchTasks();
  }, [projectId]);

  return { columns, loading, error };
}
