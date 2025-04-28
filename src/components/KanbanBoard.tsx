import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { GripVertical } from 'lucide-react';
import { useTasks } from '../lib/hooks/useTasks';
import Loader from './common/Loader';
import ErrorBanner from './common/ErrorBanner';
import TaskModal from './TaskModal';

const statusTitles: Record<string, string> = {
  ToDo: 'To Do',
  InProgress: 'In Progress',
  Blocked: 'Blocked',
  Finished: 'Finished',
};

export default function KanbanBoard({ projectId }: { projectId?: string }) {
  const { tasksByStatus, loading, error, updateTaskStatus } = useTasks(projectId);
  const [selectedTask, setSelectedTask] = useState<any>(null);

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    updateTaskStatus(draggableId, destination.droppableId);
  };

  if (loading) return <Loader />;
  if (error) return <ErrorBanner message={error} />;

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 p-4">
          {Object.entries(tasksByStatus).map(([status, tasks]) => (
            <div key={status} className="flex-1">
              <div className="rounded-t-lg p-3 bg-gray-100 dark:bg-gray-700">
                <h3 className="font-semibold">{statusTitles[status]}</h3>
              </div>
              <Droppable droppableId={status}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="bg-white dark:bg-gray-800 rounded-b-lg p-3 min-h-[500px]"
                  >
                    {tasks.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            onClick={() => setSelectedTask(task)}
                            className="group p-4 bg-white dark:bg-gray-700 rounded-lg shadow mb-3 cursor-pointer"
                          >
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100">
                              <GripVertical className="h-4 w-4 text-gray-400" />
                            </div>
                            <h4 className="font-medium">{task.title}</h4>
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
