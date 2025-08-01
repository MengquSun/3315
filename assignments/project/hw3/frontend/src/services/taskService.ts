/**
 * Task Service
 * Handles all task-related API calls
 */

import {
    ApiResponse,
    CreateTaskRequest,
    GetTasksQuery,
    SortCriteria,
    Task,
    TaskCounts,
    TaskFilter,
    TaskInput,
    UpdateTaskRequest
} from '@/types'
import { apiClient } from './api'

class TaskService {
  /**
   * Get all tasks for the authenticated user
   */
  async getTasks(filter?: TaskFilter, sortBy?: SortCriteria): Promise<{
    tasks: Task[]
    stats: TaskCounts
    total: number
  }> {
    const params: GetTasksQuery = {}

    // Build query parameters from filter
    if (filter) {
      if (filter.status && filter.status.length > 0) {
        params.status = filter.status.join(',')
      }
      if (filter.priority && filter.priority.length > 0) {
        params.priority = filter.priority.join(',')
      }
      if (filter.search) {
        params.search = filter.search
      }
    }

    // Add sorting parameters
    if (sortBy) {
      params.sortBy = sortBy.field
      params.order = sortBy.order
    }

    const response = await apiClient.get<ApiResponse<{
      tasks: Task[]
      stats: TaskCounts
      total: number
    }>>('/tasks', { params })

    if (response.success && response.data) {
      return response.data
    }

    throw new Error(response.error || 'Failed to fetch tasks')
  }

  /**
   * Get a specific task by ID
   */
  async getTask(id: string): Promise<Task> {
    const response = await apiClient.get<ApiResponse<{ task: Task }>>(`/tasks/${id}`)

    if (response.success && response.data) {
      return response.data.task
    }

    throw new Error(response.error || 'Failed to fetch task')
  }

  /**
   * Create a new task
   */
  async createTask(taskData: TaskInput): Promise<Task> {
    const request: CreateTaskRequest = {
      title: taskData.title,
      description: taskData.description,
      dueDate: taskData.dueDate?.toISOString(),
      priority: taskData.priority,
    }

    const response = await apiClient.post<ApiResponse<{ task: Task }>>('/tasks', request)

    if (response.success && response.data) {
      return response.data.task
    }

    throw new Error(response.error || 'Failed to create task')
  }

  /**
   * Update an existing task
   */
  async updateTask(id: string, updates: Partial<TaskInput>): Promise<Task> {
    const request: UpdateTaskRequest = {}

    // Only include defined values in the request
    if (updates.title !== undefined) {
      request.title = updates.title
    }
    if (updates.description !== undefined) {
      request.description = updates.description
    }
    if (updates.dueDate !== undefined) {
      request.dueDate = updates.dueDate?.toISOString()
    }
    if (updates.priority !== undefined) {
      request.priority = updates.priority
    }

    const response = await apiClient.put<ApiResponse<{ task: Task }>>(`/tasks/${id}`, request)

    if (response.success && response.data) {
      return response.data.task
    }

    throw new Error(response.error || 'Failed to update task')
  }

  /**
   * Delete a task
   */
  async deleteTask(id: string): Promise<void> {
    const response = await apiClient.delete<ApiResponse<void>>(`/tasks/${id}`)

    if (!response.success) {
      throw new Error(response.error || 'Failed to delete task')
    }
  }

  /**
   * Mark a task as complete
   */
  async completeTask(id: string): Promise<Task> {
    const response = await apiClient.patch<ApiResponse<{ task: Task }>>(`/tasks/${id}/complete`)

    if (response.success && response.data) {
      return response.data.task
    }

    throw new Error(response.error || 'Failed to complete task')
  }

  /**
   * Get completed tasks
   */
  async getCompletedTasks(limit?: number): Promise<{
    tasks: Task[]
    total: number
  }> {
    const params: any = {}
    if (limit) {
      params.limit = limit
    }

    const response = await apiClient.get<ApiResponse<{
      tasks: Task[]
      total: number
    }>>('/tasks/completed', { params })

    if (response.success && response.data) {
      return response.data
    }

    throw new Error(response.error || 'Failed to fetch completed tasks')
  }

  /**
   * Get task statistics
   */
  async getTaskStats(): Promise<TaskCounts> {
    const response = await apiClient.get<ApiResponse<{ stats: TaskCounts }>>('/tasks/stats')

    if (response.success && response.data) {
      return response.data.stats
    }

    throw new Error(response.error || 'Failed to fetch task statistics')
  }

  /**
   * Search tasks
   */
  async searchTasks(query: string): Promise<Task[]> {
    const filter: TaskFilter = { search: query }
    const result = await this.getTasks(filter)
    return result.tasks
  }

  /**
   * Get tasks by priority
   */
  async getTasksByPriority(priority: string): Promise<Task[]> {
    const filter: TaskFilter = { priority: [priority as any] }
    const result = await this.getTasks(filter)
    return result.tasks
  }

  /**
   * Get overdue tasks
   */
  async getOverdueTasks(): Promise<Task[]> {
    const result = await this.getTasks()
    const now = new Date()
    
    return result.tasks.filter(task => 
      task.dueDate && 
      new Date(task.dueDate) < now &&
      task.status === 'active'
    )
  }
}

// Export singleton instance
export const taskService = new TaskService()
export default taskService