import React, { useState } from 'react';
import { X, Calendar, AlertCircle, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import UserSelect from '../users/UserSelect';
import CommentList from '../comments/CommentList';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  deadline: string | null;
  assignee_id: string | null;
  project_id: string;
}

interface EditTaskModalProps {
  task: Task;
  onClose: () => void;
  onTaskUpdated?: () => void;
}

export default function EditTaskModal({ task, onClose, onTaskUpdated }: EditTaskModalProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [status, setStatus] = useState(task.status);
  const [deadline, setDeadline] = useState(task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : '');
  const [assigneeId, setAssigneeId] = useState<string | null>(task.assignee_id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error: updateError } = await supabase
        .from('tasks')
        .update({
          title,
          description: description || null,
          status,
          deadline: deadline || null,
          assignee_id: assigneeId,
        })
        .eq('id', task.id);

      if (updateError) throw updateError;
      onTaskUpdated?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        
        <div className="relative w-full max-w-2xl rounded-lg bg-white dark:bg-gray-800 shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 p-4">
            <h2 className="text-xl font-semibold">Edit Task</h2>
            <button
              onClick={onClose}
              className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-4">
            <form onSubmit={handleSubmit} className="space-y-4 mb-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium mb-1">
                  Title
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                  placeholder="Task title"
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-1">
                  Description (Optional)
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 min-h-[100px]"
                  placeholder="Task description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="status" className="block text-sm font-medium mb-1">
                    Status
                  </label>
                  <select
                    id="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                  >
                    <option value="ToDo">To Do</option>
                    <option value="InProgress">In Progress</option>
                    <option value="Blocked">Blocked</option>
                    <option value="Finished">Finished</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="deadline" className="block text-sm font-medium mb-1">
                    Deadline
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      id="deadline"
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Assignee
                </label>
                <UserSelect
                  value={assigneeId}
                  onChange={setAssigneeId}
                  projectId={task.project_id}
                  placeholder="Select assignee"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-500 dark:text-red-400">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="h-4 w-4" />
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <CommentList taskId={task.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}