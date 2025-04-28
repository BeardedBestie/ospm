import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { User, Clock, MoreVertical } from 'lucide-react';
import TaskModal from './TaskModal';
import { useTasks } from '../hooks/useTasks';
import ErrorBanner from './ErrorBanner';
import Spinner from './Spinner';

export default function KanbanBoard() {
  const { columns, loading, error } = useTasks();
  const [selectedTask, setSelectedTask] = useState<any>(null);

  if (loading) return <Spinner />;
  if (error) return <ErrorBanner message={error} />;

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) return;

    const sourceList = [...(columns[source.droppableId] || [])];
    const destList = [...(columns[destination.droppableId] || [])];
    const [moved] = sourceList.splice(source.index, 1);
    destList.splice(destination.index, 0, moved);

    // update local state
    setColumns({
      ...columns,
      [source.droppableId]: sourceList,
      [destination.droppableId]: destList,
    });

    // TODO: persist status change via Supabase
  };

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto p-4">
          {Object.entries(columns).map(([columnId, tasks]) => (
            <div key={columnId} className="flex-1">
              <div className="rounded-t-lg p-3 bg-gray-100 dark:bg-gray-700">
                <h3 className="font-semibold">{columnId}</h3>
              </div>
              <Droppable droppableId={columnId}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="bg-white dark:bg-gray-800 rounded-b-lg p-3 min-h-[200px]"
                  >
                    {tasks.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(prov) => (
                          <div
                            ref={prov.innerRef}
                            {...prov.draggableProps}
                            {...prov.dragHandleProps}
                            onClick={() => setSelectedTask(task)}
                            className="group bg-white dark:bg-gray-700 p-4 rounded-lg shadow mb-3 cursor-pointer"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">{task.title}</h4>
                              <MoreVertical className="opacity-0 group-hover:opacity-100" />
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                              {task.description}
                            </p>
                            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                              <User className="h-4 w-4 mr-1" />
                              <span>{task.assignee?.raw_user_meta_data?.full_name || task.assignee?.email || 'Unassigned'}</span>
                              <Clock className="h-4 w-4 ml-3 mr-1" />
                              <span>{task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No due date'}</span>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      {selectedTask && <TaskModal task={selectedTask} onClose={() => setSelectedTask(null)} />}
    </>
  );
}
