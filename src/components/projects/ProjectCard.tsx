import React, { useState } from 'react';
import { Calendar, Users, CheckSquare, Pencil, Share2 } from 'lucide-react';
import { format, isPast } from 'date-fns';
import ShareProjectModal from './ShareProjectModal';

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    description: string;
    created_at: string;
    deadline?: string | null;
    taskCount?: number;
    memberCount?: number;
  };
  onClick: () => void;
  onEdit: () => void;
}

export default function ProjectCard({ project, onClick, onEdit }: ProjectCardProps) {
  const [showShareModal, setShowShareModal] = useState(false);

  return (
    <>
      <div
        className="group relative bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:border-primary-500 dark:hover:border-primary-500 transition-colors cursor-pointer"
      >
        {/* Action Buttons */}
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowShareModal(true);
            }}
            className="p-2 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
            title="Share Project"
          >
            <Share2 className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-2 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
            title="Edit Project"
          >
            <Pencil className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div onClick={onClick} className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2 pr-16">{project.name}</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
              {project.description}
            </p>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <CheckSquare className="h-4 w-4" />
                {project.taskCount || 0} tasks
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {project.memberCount || 1} members
              </span>
            </div>
            {project.deadline ? (
              <span className={`flex items-center gap-1 ${isPast(new Date(project.deadline)) ? 'text-red-500 dark:text-red-400' : ''}`}>
                <Calendar className="h-4 w-4" />
                Due {format(new Date(project.deadline), 'MMM d, yyyy')}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {showShareModal && (
        <ShareProjectModal
          projectId={project.id}
          projectName={project.name}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </>
  );
}