import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { User, Clock, MoreVertical } from 'lucide-react';
import TaskModal from './TaskModal';

interface Column {
  id: string;
  title: string;
  color: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  assignee: string;
}

type Tasks = {
  [key: string]: Task[];
};

const COLUMNS: Column[] = [
  { id: 'todo', title: 'To Do', color: 'bg-gray-100 dark:bg-gray-700' },
  { id: 'inProgress', title: 'In Progress', color: 'bg-blue-100 dark:bg-blue-900' },
  { id: 'blocked', title: 'Blocked', color: 'bg-red-100 dark:bg-red-900' },
  { id: 'finished', title: 'Finished', color: 'bg-green-100 dark:bg-green-900' },
];

// Temporary mock data
const MOCK_TASKS: Tasks = {
  todo: [
    { id: '1', title: 'Design system', description: 'Create a design system for the platform', assignee: 'John Doe' },
    { id: '2', title: 'API integration', description: 'Integrate with external APIs', assignee: 'Jane Smith' },
  ],
  inProgress: [
    { id: '3', title: 'User authentication', description: 'Implement user authentication flow', assignee: 'Mike Johnson' },
  ],
  blocked: [
    { id: '4', title: 'Database migration', description: 'Migrate to new database schema', assignee: 'Sarah Wilson' },
  ],
  finished: [
    { id: '5', title: 'Project setup', description: 'Initial project setup and configuration', assignee: 'Tom Brown' },
  ],
};

function KanbanBoard() {
  const [tasks, setTasks] = useState<Tasks>(MOCK_TASKS);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) {
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const sourceColumn = tasks[source.droppableId];
    const destColumn = tasks[destination.droppableId];
    const task = sourceColumn[source.index];

    // Create new arrays
    const newSourceColumn = [...sourceColumn];
    newSourceColumn.splice(source.index, 1);

    const newDestColumn = [...destColumn];
    newDestColumn.splice(destination.index, 0, task);

    // Update state
    setTasks({
      ...tasks,
      [source.droppableId]: newSourceColumn,
      [destination.droppableId]: newDestColumn,
    });

    // TODO: Update task status in Supabase
    console.log({
      taskId: draggableId,
      fromColumn: source.droppableId,
      toColumn: destination.droppableId,
      fromIndex: source.index,
      toIndex: destination.index,
    });
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
  };

  return (
    <>
      <div className="h-[calc(100vh-5rem)] overflow-x-auto">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-4 p-4 min-w-[1000px]">
            {COLUMNS.map((column) => (
              <div key={column.id} className="flex-1">
                <div className={`rounded-t-lg p-3 ${column.color}`}>
                  <h3 className="font-semibold">{column.title}</h3>
                </div>
                <Droppable droppableId={column.id}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="bg-white dark:bg-gray-800 rounded-b-lg p-3 min-h-[500px]"
                    >
                      {tasks[column.id]?.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => handleTaskClick(task)}
                              className="group bg-white dark:bg-gray-700 p-4 rounded-lg shadow mb-3 border border-gray-200 dark:border-gray-600 cursor-pointer hover:border-primary-500 dark:hover:border-primary-500 transition-colors"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium">{task.title}</h4>
                                <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                                  <MoreVertical className="h-4 w-4" />
                                </button>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                                {task.description}
                              </p>
                              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                <User className="h-4 w-4 mr-1" />
                                <span>{task.assignee}</span>
                                <Clock className="h-4 w-4 ml-3 mr-1" />
                                <span>2d</span>
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
      </div>

      {selectedTask && (
        <TaskModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </>
  );
}

export default KanbanBoard;