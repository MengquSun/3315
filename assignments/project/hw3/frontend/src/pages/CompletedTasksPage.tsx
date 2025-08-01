/**
 * Completed Tasks Page Component
 * View and manage completed tasks
 */

import { format } from 'date-fns'
import React from 'react'
import { useQuery } from 'react-query'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { taskService } from '../services/taskService'

const CompletedTasksPage: React.FC = () => {
  // Fetch completed tasks
  const { data: completedTasksData, isLoading } = useQuery(
    'completedTasks',
    () => taskService.getCompletedTasks(100), // Get up to 100 completed tasks
    {
      refetchInterval: 60000, // Refetch every minute
    }
  )

  const completedTasks = completedTasksData?.tasks || []

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" text="Loading completed tasks..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Completed Tasks</h1>
        <p className="mt-1 text-sm text-gray-600">
          Review your completed tasks and track your progress
        </p>
      </div>

      {/* Stats */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="ml-5">
            <h3 className="text-lg font-medium text-gray-900">
              {completedTasks.length} Completed Tasks
            </h3>
            <p className="text-sm text-gray-600">
              Great job! Keep up the momentum.
            </p>
          </div>
        </div>
      </div>

      {/* Completed Tasks List */}
      <div className="bg-white shadow rounded-lg">
        {completedTasks.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {completedTasks.map((task) => (
              <div key={task.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900 line-through decoration-2 decoration-green-500">
                          {task.title}
                        </h3>
                        {task.description && (
                          <p className="mt-1 text-sm text-gray-600">{task.description}</p>
                        )}
                      </div>
                      <span className={`
                        inline-flex px-2 py-1 text-xs font-medium rounded-full
                        ${task.priority === 'high' ? 'bg-red-100 text-red-800' :
                          task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'}
                      `}>
                        {task.priority}
                      </span>
                    </div>
                    
                    <div className="mt-3 flex flex-wrap items-center text-sm text-gray-500 space-x-4">
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Created {format(new Date(task.createdAt), 'MMM d, yyyy')}
                      </span>
                      
                      {task.completedAt && (
                        <span className="flex items-center text-green-600">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Completed {format(new Date(task.completedAt), 'MMM d, yyyy')}
                        </span>
                      )}
                      
                      {task.dueDate && (
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Due {format(new Date(task.dueDate), 'MMM d, yyyy')}
                        </span>
                      )}
                    </div>

                    {/* Completion time indicator */}
                    {task.completedAt && task.dueDate && (
                      <div className="mt-2">
                        {new Date(task.completedAt) <= new Date(task.dueDate) ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Completed on time
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Completed late
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No completed tasks yet</h3>
            <p className="text-gray-600 mb-4">
              Complete some tasks to see them here and track your progress!
            </p>
            <a
              href="/tasks"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              View Active Tasks
            </a>
          </div>
        )}
      </div>

      {/* Productivity insights */}
      {completedTasks.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Productivity Insights</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {completedTasks.length}
              </div>
              <div className="text-sm text-gray-600">Total Completed</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {completedTasks.filter(task => 
                  task.completedAt && task.dueDate && 
                  new Date(task.completedAt) <= new Date(task.dueDate)
                ).length}
              </div>
              <div className="text-sm text-gray-600">On Time</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(
                  completedTasks.filter(task => task.priority === 'high').length / 
                  Math.max(completedTasks.length, 1) * 100
                )}%
              </div>
              <div className="text-sm text-gray-600">High Priority</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CompletedTasksPage