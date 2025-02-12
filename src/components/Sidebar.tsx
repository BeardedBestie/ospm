import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Folder, CheckSquare } from 'lucide-react';
import clsx from 'clsx';
import KanbanBoard from './KanbanBoard';

function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <>
      <aside className={clsx(
        "fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] transition-all duration-300",
        "border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800",
        isCollapsed ? "w-16" : "w-64"
      )}>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-2 p-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full"
        >
          {isCollapsed ? 
            <ChevronRight className="h-4 w-4" /> : 
            <ChevronLeft className="h-4 w-4" />
          }
        </button>
        
        <div className="h-full py-2 overflow-y-auto">
          {!isCollapsed && (
            <div className="space-y-2 px-2">
              <div>
                <h3 className="flex items-center justify-between mb-1 text-sm font-semibold text-gray-900 dark:text-white px-2">
                  Recent Projects
                  <ChevronRight className="h-4 w-4" />
                </h3>
                <ul>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <li key={`project-${i}`}>
                      <a href="#" className="flex items-center px-2 py-1.5 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                        <Folder className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">Project {i}</span>
                      </a>
                    </li>
                  ))}
                  <li>
                    <a href="#" className="flex items-center px-2 py-1.5 text-primary-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                      See more projects
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="flex items-center justify-between mb-1 text-sm font-semibold text-gray-900 dark:text-white px-2">
                  Recent Tasks
                  <ChevronRight className="h-4 w-4" />
                </h3>
                <ul>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <li key={`task-${i}`}>
                      <a href="#" className="flex items-center px-2 py-1.5 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                        <CheckSquare className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">Task {i}</span>
                      </a>
                    </li>
                  ))}
                  <li>
                    <a href="#" className="flex items-center px-2 py-1.5 text-primary-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                      See more tasks
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          )}
          
          {isCollapsed && (
            <div className="flex flex-col items-center space-y-4">
              <Folder className="h-5 w-5" />
              <CheckSquare className="h-5 w-5" />
            </div>
          )}
        </div>
      </aside>
      <div className={clsx(
        "transition-all duration-300 pt-16",
        isCollapsed ? "ml-16" : "ml-64"
      )}>
        <main className="p-4">
          <KanbanBoard />
        </main>
      </div>
    </>
  );
}

export default Sidebar;