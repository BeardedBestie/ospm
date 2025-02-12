import React, { useState, useEffect } from 'react';
import { User, AlertCircle, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface UserProfile {
  id: string;
  email: string;
  role: 'admin' | 'user' | 'viewer';
  raw_user_meta_data: {
    full_name?: string;
  };
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);
  const [addingUser, setAddingUser] = useState(false);

  const fetchUsers = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('users')
        .select(`
          id,
          email,
          raw_user_meta_data,
          user_profiles!inner (
            role
          )
        `)
        .order('email');

      if (fetchError) throw fetchError;

      const formattedUsers = (data || []).map(user => ({
        id: user.id,
        email: user.email,
        role: user.user_profiles[0]?.role || 'user',
        raw_user_meta_data: user.raw_user_meta_data
      }));

      setUsers(formattedUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();

    // Set up real-time subscription for profile changes
    const profilesSubscription = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_profiles'
        },
        () => {
          fetchUsers();
        }
      )
      .subscribe();

    return () => {
      profilesSubscription.unsubscribe();
    };
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (addingUser) return;

    setAddingUser(true);
    setError(null);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: newUserEmail,
        password: newUserPassword,
        options: {
          data: {
            full_name: newUserName,
          },
        },
      });

      if (signUpError) throw signUpError;

      // Wait for the trigger to create the profile
      await new Promise(resolve => setTimeout(resolve, 2000));

      setShowAddUser(false);
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserName('');
      await fetchUsers();
    } catch (err) {
      console.error('Error adding user:', err);
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setAddingUser(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">User Management</h2>
        <button
          onClick={() => setShowAddUser(!showAddUser)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          Add User
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {showAddUser && (
        <form onSubmit={handleAddUser} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={newUserPassword}
              onChange={(e) => setNewUserPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
              required
              minLength={6}
            />
          </div>
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddUser(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addingUser}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {addingUser ? 'Adding...' : 'Add User'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Role
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <User className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium">
                        {user.raw_user_meta_data?.full_name || 'Unnamed User'}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {user.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm">
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}