import React, { useState, useEffect } from 'react';
import { MessageSquare, User, Send } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../lib/store';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  users: {
    id: string;
    email: string;
    raw_user_meta_data: {
      full_name: string;
    };
  };
}

interface CommentListProps {
  projectId?: string;
  taskId?: string;
  className?: string;
}

export default function CommentList({ projectId, taskId, className = '' }: CommentListProps) {
  const { user } = useStore();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = async () => {
    try {
      let query = supabase
        .from('comments')
        .select(`
          id,
          content,
          created_at,
          users!inner (
            id,
            email,
            raw_user_meta_data
          )
        `)
        .order('created_at', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }
      if (taskId) {
        query = query.eq('task_id', taskId);
      }

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      setComments(data || []);
    } catch (err) {
      console.error('Error fetching comments:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch comments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [projectId, taskId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    try {
      const { error: insertError } = await supabase
        .from('comments')
        .insert({
          content: newComment.trim(),
          project_id: projectId || null,
          task_id: taskId || null,
          user_id: user.id,
        });

      if (insertError) throw insertError;

      setNewComment('');
      await fetchComments();
    } catch (err) {
      console.error('Error adding comment:', err);
      setError(err instanceof Error ? err.message : 'Failed to add comment');
    }
  };

  if (loading) {
    return <div className="animate-pulse">Loading comments...</div>;
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="h-5 w-5" />
        <h3 className="font-medium">Comments</h3>
      </div>

      <div className="space-y-4 mb-4">
        {comments.map((comment) => (
          <div
            key={comment.id}
            className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="bg-gray-200 dark:bg-gray-600 rounded-full p-1">
                  <User className="h-4 w-4" />
                </div>
                <span className="font-medium">
                  {comment.users.raw_user_meta_data?.full_name || comment.users.email}
                </span>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {format(new Date(comment.created_at), 'MMM d, yyyy h:mm a')}
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-300">{comment.content}</p>
          </div>
        ))}

        {comments.length === 0 && (
          <p className="text-center text-gray-500 dark:text-gray-400 py-4">
            No comments yet. Be the first to comment!
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="w-full pr-12 pl-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
        />
        <button
          type="submit"
          disabled={!newComment.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-primary-600 hover:text-primary-700 disabled:text-gray-400"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>

      {error && (
        <p className="text-sm text-red-500 dark:text-red-400 mt-2">{error}</p>
      )}
    </div>
  );
}