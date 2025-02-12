import React, { useState } from 'react';
import { X, AlertCircle, Archive } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ArchiveProjectModalProps {
  projectId: string;
  projectName: string;
  onClose: () => void;
  onArchived?: () => void;
}

export default function ArchiveProjectModal({ projectId, projectName, onClose, onArchived }: ArchiveProjectModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleArchive = async () => {
    setError(null);
    setLoading(true);

    try {
      const { error: archiveError } = await supabase
        .from('projects')
        .update({ archived: true })
        .eq('id', projectId);

      if (archiveError) throw archiveError;
      onArchived?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive project');
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
            <h2 className="text-xl font-semibold text-amber-600 dark:text-amber-500">Archive Project</h2>
            <button
              onClick={onClose}
              className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            <p className="text-gray-600 dark:text-gray-300">
              Are you sure you want to archive the project <strong>"{projectName}"</strong>? 
              The project and its data will be preserved but hidden from the main view.
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
                onClick={handleArchive}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Archive className="h-4 w-4" />
                {loading ? 'Archiving...' : 'Archive Project'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}