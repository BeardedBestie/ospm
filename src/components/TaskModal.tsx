import React, { useState } from 'react';
import { X, MessageSquare, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';

interface Comment {
  id: string;
  content: string;
  user: string;
  createdAt: Date;
}

interface Task {
  id: string;
  title: string;
  description: string;
  assignee: string;
  comments?: Comment[];
}

interface TaskModalProps {
  task: Task | null;
  onClose: () => void;
}

export default function TaskModal({ task, onClose }: TaskModalProps) {
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<Comment[]>([
    {
      id: '1',
      content: 'Let\'s prioritize this for next sprint',
      user: 'Sarah Wilson',
      createdAt: new Date('2024-02-10T10:00:00'),
    },
    {
      id: '2',
      content: 'I\'ve started working on this',
      user: 'John Doe',
      createdAt: new Date('2024-02-11T15:30:00'),
    },
  ]);

  if (!task) return null;

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: Date.now().toString(),
      content: newComment,
      user: 'Current User', // TODO: Replace with actual user
      createdAt: new Date(),
    };

    setComments([...comments, comment]);
    setNewComment('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        
        <div className="relative w-full max-w-2xl rounded-lg bg-white dark:bg-gray-800 shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 p-4">
            <h2 className="text-xl font-semibold">{task.title}</h2>
            <button
              onClick={onClose}
              className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            <div className="mb-6">
              <h3 className="font-medium mb-2">Description</h3>
              <p className="text-gray-600 dark:text-gray-300">{task.description}</p>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="text-sm">{task.assignee}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">Created on {format(new Date(), 'MMM d, yyyy')}</span>
              </div>
            </div>

            {/* Comments Section */}
            <div>
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Comments
              </h3>

              <div className="space-y-4 mb-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{comment.user}</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {format(comment.createdAt, 'MMM d, yyyy h:mm a')}
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300">{comment.content}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSubmitComment}>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2"
                  />
                  <button
                    type="submit"
                    disabled={!newComment.trim()}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Comment
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}