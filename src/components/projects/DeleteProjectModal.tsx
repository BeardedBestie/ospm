import React, { useState } from 'react';
import { X, AlertCircle, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface DeleteProjectModalProps {
  projectId: string;
  projectName: string;
  onClose: () => void;
  onDeleted?: () => void;
}

export default function DeleteProjectModal({ projectId, projectName, onClose, onDeleted }: DeleteProjectModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setError(null);
    setLoading(true);

    try {
      const { error: deleteError } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (deleteError) throw deleteError;
      onDeleted?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        
        <div className="relative w-full max-w-md rounded-lg bg-white dark:bg-gray-800 shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 p-4">
            <h2 className="text-xl font-semibold text-red-600 dark:text-red-500">Delete Project</h2>
            <button
              onClick={onClose}
              className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            <p className="text-gray-600 dark:text-gray-300">
              Are you sure you want to delete the project <strong>"{projectName}"</strong>? This action cannot be undone and will delete all associated tasks and comments.
            </p>

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
                onClick={handleDelete}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="h-4 w-4" />
                {loading ? 'Deleting...' : 'Delete Project'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}