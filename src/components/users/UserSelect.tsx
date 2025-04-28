import React, { useState, useEffect } from 'react';
import { User, ChevronDown, X, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface UserData {
  id: string;
  email: string;
  raw_user_meta_data: {
    full_name: string;
  };
}

interface UserSelectProps {
  value: string | null;
  onChange: (userId: string | null) => void;
  projectId?: string;
  className?: string;
  placeholder?: string;
}

export default function UserSelect({ value, onChange, projectId, className = '', placeholder = 'Select user' }: UserSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

  const fetchUsers = async () => {
    try {
      // Directly fetch from users view
      const { data, error: usersError } = await supabase
        .from('users')
        .select('id, email, raw_user_meta_data');

      if (usersError) throw usersError;

      // Filter out duplicates
      const uniqueUsers = Array.from(
        new Map(
          (data || []).map(user => [user.id, user])
        ).values()
      );

      setUsers(uniqueUsers);

      if (value) {
        const selected = uniqueUsers.find(u => u.id === value);
        if (selected) {
          setSelectedUser(selected);
        }
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading users...
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className={`relative ${className}`}>
      <div
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls="user-select-dropdown"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer"
      >
        <div className="flex items-center gap-2 min-w-0">
          <User className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">
            {selectedUser ? (
              selectedUser.raw_user_meta_data?.full_name || selectedUser.email
            ) : (
              <span className="text-gray-500">{placeholder}</span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {selectedUser && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
                setSelectedUser(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onChange(null);
                  setSelectedUser(null);
                }
              }}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-full cursor-pointer"
            >
              <X className="h-3 w-3" />
            </span>
          )}
          <ChevronDown className="h-4 w-4" />
        </div>
      </div>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <ul
            id="user-select-dropdown"
            role="listbox"
            className="absolute z-20 w-full mt-1 py-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto"
          >
            {users.map((user) => (
              <li key={user.id} role="option" aria-selected={user.id === value}>
                <div
                  onClick={() => {
                    onChange(user.id);
                    setSelectedUser(user);
                    setIsOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2 cursor-pointer"
                >
                  <User className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">
                    {user.raw_user_meta_data?.full_name || user.email}
                  </span>
                </div>
              </li>
            ))}
            {users.length === 0 && (
              <li className="px-3 py-2 text-gray-500">
                No users found
              </li>
            )}
          </ul>
        </>
      )}
    </div>
  );
}