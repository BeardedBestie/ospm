import React, { useState } from 'react';
import { X, AlertCircle, Archive } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ArchiveUserModalProps {
  userId: string;
  userName: string;
  userEmail: string;
  onClose: () => void;
  onArchived?: () => void;
}

export default function ArchiveUserModal({ userId, userName, userEmail, onClose, onArchived }: ArchiveUserModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleArchive = async () => {
    if (loading) return;
    
    setLoading(true);
    setError(null);

    try {
      // Simple, direct update
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ 
          status: 'disabled',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Verify the update
      const { data: profile, error: verifyError } = await supabase
        .from('user_profiles')
        .select('status')
        .eq('id', userId)
        .single();

      if (verifyError) throw verifyError;

      if (profile?.status !== 'disabled') {
        throw new Error('Failed to archive user');
      }

      onArchived?.();
      onClose();
    } catch (err) {
      console.error('Error archiving user:', err);
      setError('Failed to archive user. Please try again.');
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
            <h2 className="text-xl font-semibold text-amber-600 dark:text-amber-500">Archive User</h2>
            <button
              onClick={onClose}
              className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            <p className="text-gray-600 dark:text-gray-300">
              Are you sure you want to archive <strong>{userName}</strong> ({userEmail})?
              This user will be disabled and hidden from the system.
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
                {loading ? 'Archiving...' : 'Archive User'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}