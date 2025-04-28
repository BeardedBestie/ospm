import React, { useState, useEffect } from 'react';
import { X, AlertCircle, UserPlus, User, Shield, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import UserSelect from '../users/UserSelect';

interface ShareProjectModalProps {
  projectId: string;
  projectName: string;
  onClose: () => void;
  onUpdated?: () => void;
}

interface ProjectMember {
  user_id: string;
  role: string;
  user: {
    email: string;
    raw_user_meta_data: {
      full_name: string;
    };
  };
}

export default function ShareProjectModal({ projectId, projectName, onClose, onUpdated }: ShareProjectModalProps) {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<'owner' | 'member'>('member');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('project_members')
        .select(`
          user_id,
          role,
          user:users!inner (
            email,
            raw_user_meta_data
          )
        `)
        .eq('project_id', projectId);

      if (fetchError) throw fetchError;
      setMembers(data || []);
    } catch (err) {
      console.error('Error fetching members:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch members');
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [projectId]);

  const handleAddMember = async () => {
    if (!selectedUserId) return;
    setError(null);
    setLoading(true);

    try {
      const { error: insertError } = await supabase
        .from('project_members')
        .insert({
          project_id: projectId,
          user_id: selectedUserId,
          role: selectedRole,
        });

      if (insertError) throw insertError;

      setSelectedUserId(null);
      setSelectedRole('member');
      await fetchMembers();
      onUpdated?.();
    } catch (err) {
      console.error('Error adding member:', err);
      setError(err instanceof Error ? err.message : 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    setError(null);
    setLoading(true);

    try {
      const { error: deleteError } = await supabase
        .from('project_members')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      await fetchMembers();
      onUpdated?.();
    } catch (err) {
      console.error('Error removing member:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove member');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: 'owner' | 'member') => {
    setError(null);
    setLoading(true);

    try {
      const { error: updateError } = await supabase
        .from('project_members')
        .update({ role: newRole })
        .eq('project_id', projectId)
        .eq('user_id', userId);

      if (updateError) throw updateError;

      await fetchMembers();
      onUpdated?.();
    } catch (err) {
      console.error('Error updating role:', err);
      setError(err instanceof Error ? err.message : 'Failed to update role');
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
            <h2 className="text-xl font-semibold">Share Project</h2>
            <button
              onClick={onClose}
              className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Share "{projectName}" with other users
            </p>

            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="flex-1">
                  <UserSelect
                    value={selectedUserId}
                    onChange={setSelectedUserId}
                    placeholder="Select user"
                  />
                </div>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as 'owner' | 'member')}
                  className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                >
                  <option value="member">Member</option>
                  <option value="owner">Owner</option>
                </select>
                <button
                  onClick={handleAddMember}
                  disabled={!selectedUserId || loading}
                  className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  <UserPlus className="h-5 w-5" />
                </button>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-500 dark:text-red-400">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h3 className="text-sm font-medium mb-2">Project Members</h3>
              <div className="space-y-2">
                {members.map((member) => (
                  <div
                    key={member.user_id}
                    className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-700"
                  >
                    <div className="flex items-center gap-2">
                      <div className="bg-gray-200 dark:bg-gray-600 rounded-full p-1">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium">
                          {member.user.raw_user_meta_data?.full_name || member.user.email}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {member.user.email}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={member.role}
                        onChange={(e) => handleUpdateRole(member.user_id, e.target.value as 'owner' | 'member')}
                        className="text-sm px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                      >
                        <option value="member">Member</option>
                        <option value="owner">Owner</option>
                      </select>
                      <button
                        onClick={() => handleRemoveMember(member.user_id)}
                        className="p-1 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {members.length === 0 && (
                  <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">
                    No members yet
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}