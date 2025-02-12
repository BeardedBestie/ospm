import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Plus, Loader2, CheckSquare, AlertCircle, Calendar, GripVertical, Trash2 } from 'lucide-react';
import { format, isPast } from 'date-fns';
import { supabase } from '../../lib/supabase';
import CreateTaskModal from './CreateTaskModal';
import EditTaskModal from './EditTaskModal';
import DeleteTaskModal from './DeleteTaskModal';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
  deadline: string | null;
  assignee_id: string | null;
  assignee: {
    id: string;
    email: string;
    raw_user_meta_data: {
      full_name: string;
    };
  } | null;
}

interface Column {
  id: string;
  title: string;
  tasks: Task[];
}

interface TaskListProps {
  projectId: string;
}

const COLUMN_CONFIG = {
  ToDo: {
    title: 'To Do',
    color: 'border-gray-200 dark:border-gray-700',
    headerColor: 'bg-gray-50 dark:bg-gray-800',
  },
  InProgress: {
    title: 'In Progress',
    color: 'border-blue-200 dark:border-blue-800',
    headerColor: 'bg-blue-50 dark:bg-blue-900/30',
  },
  Blocked: {
    title: 'Blocked',
    color: 'border-red-200 dark:border-red-800',
    headerColor: 'bg-red-50 dark:bg-red-900/30',
  },
  Finished: {
    title: 'Finished',
    color: 'border-green-200 dark:border-green-800',
    headerColor: 'bg-green-50 dark:bg-green-900/30',
  },
};

function TaskList({ projectId }: TaskListProps) {
  const [columns, setColumns] = useState<{ [key: string]: Column }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const fetchTasks = async () => {
    try {
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          description,
          status,
          created_at,
          deadline,
          assignee_id,
          project_id,
          assignee:users!tasks_assignee_id_fkey (
            id,
            email,
            raw_user_meta_data
          )
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (tasksError) throw tasksError;

      // Initialize all columns first
      const newColumns: { [key: string]: Column } = {
        ToDo: { id: 'ToDo', title: 'To Do', tasks: [] },
        InProgress: { id: 'InProgress', title: 'In Progress', tasks: [] },
        Blocked: { id: 'Blocked', title: 'Blocked', tasks: [] },
        Finished: { id: 'Finished', title: 'Finished', tasks: [] },
      };

      // Group tasks by status
      (tasksData || []).forEach((task) => {
        const status = task.status || 'ToDo'; // Ensure there's always a valid status
        if (newColumns[status]) {
          newColumns[status].tasks.push(task);
        } else {
          newColumns.ToDo.tasks.push({ ...task, status: 'ToDo' }); // Fallback to ToDo if invalid status
        }
      });

      setColumns(newColumns);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [projectId]);

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const sourceColumn = columns[source.droppableId];
    const destColumn = columns[destination.droppableId];
    
    if (!sourceColumn || !destColumn) return;
    
    const task = sourceColumn.tasks.find(t => t.id === draggableId);
    if (!task) return;

    try {
      // Create new arrays
      const newSourceTasks = Array.from(sourceColumn.tasks);
      const newDestTasks = Array.from(destColumn.tasks);

      // Remove from source
      newSourceTasks.splice(source.index, 1);

      // Add to destination
      const updatedTask = { ...task, status: destination.droppableId };
      newDestTasks.splice(destination.index, 0, updatedTask);

      // Update local state first for immediate feedback
      const newColumns = {
        ...columns,
        [source.droppableId]: {
          ...sourceColumn,
          tasks: newSourceTasks,
        },
        [destination.droppableId]: {
          ...destColumn,
          tasks: newDestTasks,
        },
      };
      setColumns(newColumns);

      // Then update in Supabase
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ status: destination.droppableId })
        .eq('id', draggableId)
        .eq('project_id', projectId);

      if (updateError) throw updateError;
    } catch (err) {
      console.error('Failed to update task status:', err);
      // Revert to original state on error
      fetchTasks();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500">
        <AlertCircle className="h-5 w-5 mr-2" />
        {error}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Tasks</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          New Task
        </button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(columns).map(([columnId, column]) => (
            <div key={columnId} className="flex flex-col">
              <div className={`p-3 rounded-t-lg ${COLUMN_CONFIG[columnId as keyof typeof COLUMN_CONFIG].headerColor}`}>
                <h3 className="font-semibold flex items-center justify-between">
                  {COLUMN_CONFIG[columnId as keyof typeof COLUMN_CONFIG].title}
                  <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
                    {column.tasks.length}
                  </span>
                </h3>
              </div>
              
              <Droppable droppableId={columnId}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 p-2 min-h-[500px] rounded-b-lg bg-white dark:bg-gray-800 relative ${
                      snapshot.isDraggingOver ? 'bg-gray-50 dark:bg-gray-700/50' : ''
                    }`}
                  >
                    {column.tasks.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`group relative mb-2 p-3 rounded-lg bg-white dark:bg-gray-700 border ${
                              COLUMN_CONFIG[columnId as keyof typeof COLUMN_CONFIG].color
                            } shadow-sm hover:shadow-md transition-all cursor-pointer ${
                              snapshot.isDragging ? 'shadow-lg ring-2 ring-primary-500 rotate-1' : ''
                            }`}
                          >
                            {/* Drag Handle */}
                            <div
                              {...provided.dragHandleProps}
                              className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <GripVertical className="h-4 w-4 text-gray-400 hover:text-primary-600 dark:text-gray-500 dark:hover:text-primary-400" />
                            </div>

                            {/* Task Content */}
                            <div
                              onClick={() => setSelectedTask(task)}
                              className="pr-8"
                            >
                              <h4 className="font-medium mb-2">{task.title}</h4>
                              {task.description && (
                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                                  {task.description}
                                </p>
                              )}
                              
                              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                {task.assignee && (
                                  <div className="flex items-center gap-1">
                                    <CheckSquare className="h-3 w-3" />
                                    <span>{task.assignee.raw_user_meta_data?.full_name || task.assignee.email}</span>
                                  </div>
                                )}
                                {task.deadline ? (
                                  <div className={`flex items-center gap-1 ${
                                    isPast(new Date(task.deadline)) ? 'text-red-500 dark:text-red-400' : ''
                                  }`}>
                                    <Calendar className="h-3 w-3" />
                                    <span>Due {format(new Date(task.deadline), 'MMM d')}</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>No deadline</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Delete Button */}
                            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTask(task);
                                  setShowDeleteModal(true);
                                }}
                                className="p-1 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {snapshot.isDraggingOver && (
                      <div className="absolute inset-2 border-2 border-dashed border-primary-400 dark:border-primary-600 rounded-lg pointer-events-none" />
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      {showCreateModal && (
        <CreateTaskModal
          projectId={projectId}
          onClose={() => setShowCreateModal(false)}
          onTaskCreated={fetchTasks}
        />
      )}

      {selectedTask && !showDeleteModal && (
        <EditTaskModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onTaskUpdated={fetchTasks}
        />
      )}

      {selectedTask && showDeleteModal && (
        <DeleteTaskModal
          taskId={selectedTask.id}
          taskTitle={selectedTask.title}
          onClose={() => {
            setSelectedTask(null);
            setShowDeleteModal(false);
          }}
          onDeleted={fetchTasks}
        />
      )}
    </div>
  );
}

export default TaskList;