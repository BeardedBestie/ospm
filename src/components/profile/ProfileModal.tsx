import React, { useState, useEffect } from 'react';
import { X, User, Mail, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../lib/store';

interface ProfileModalProps {
  onClose: () => void;
}

export default function ProfileModal({ onClose }: ProfileModalProps) {
  const { user, userProfile, setUserProfile } = useStore();
  const [name, setName] = useState(user?.user_metadata?.full_name || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('role, status')
        .eq('id', user.id)
        .single();

      if (!error && profile) {
        setUserProfile(profile);
      }
    };

    fetchProfile();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      // Update user metadata
      const { error: userError } = await supabase.auth.updateUser({
        data: { full_name: name },
      });

      if (userError) throw userError;

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
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
            <h2 className="text-xl font-semibold">Profile Settings</h2>
            <button
              onClick={onClose}
              className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  value={user?.email}
                  disabled
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Role
              </label>
              <div className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                {userProfile?.role?.charAt(0).toUpperCase() + userProfile?.role?.slice(1) || 'Loading...'}
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-500 dark:text-red-400">
                {error}
              </div>
            )}

            {success && (
              <div className="text-sm text-green-500 dark:text-green-400">
                Profile updated successfully!
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4" />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}