import React, { useState } from 'react';
import { Users, Archive } from 'lucide-react';
import UserManagement from './UserManagement';
import ArchivedProjects from './ArchivedProjects';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<'users' | 'archived'>('users');

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Admin Panel</h1>

      <div className="mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Users
              </div>
            </button>
            <button
              onClick={() => setActiveTab('archived')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'archived'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Archive className="h-4 w-4" />
                Archived Projects
              </div>
            </button>
          </nav>
        </div>
      </div>

      {activeTab === 'users' ? (
        <UserManagement />
      ) : (
        <ArchivedProjects />
      )}
    </div>
  );
}