/**
 * Task Service
 * Handles all task-related business logic for the Personal Task Management Application
 */

import {
    AppError,
    ErrorType,
    Priority,
    SortCriteria,
    Task,
    TaskFilter,
    TaskInput,
    TaskStatus,
    ValidationErrors,
    ValidationResult
} from '../../shared/types';
import { DatabaseService } from './DatabaseService';

export class TaskService {
  private db: DatabaseService;
  private readonly TASKS_COLLECTION = 'tasks';

  constructor(databaseService: DatabaseService) {
    this.db = databaseService;
  }

  /**
   * Create a new task
   */
  public async createTask(userId: string, taskData: TaskInput): Promise<Task> {
    try {
      // Validate task data
      const validation = this.validateTaskData(taskData);
      if (!validation.isValid) {
        throw new AppError({
          type: ErrorType.VALIDATION_ERROR,
          message: 'Invalid task data',
          code: 'INVALID_TASK_DATA',
          details: validation.errors
        });
      }

      // Prepare task data
      const task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> = {
        userId,
        title: taskData.title.trim(),
        description: taskData.description?.trim(),
        dueDate: taskData.dueDate,
        priority: taskData.priority,
        status: TaskStatus.ACTIVE,
        completedAt: undefined
      };

      // Create task in database
      const newTask = await this.db.createOne<Task>(this.TASKS_COLLECTION, task);
      return newTask;

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError({
        type: ErrorType.DATABASE_ERROR,
        message: 'Failed to create task',
        code: 'TASK_CREATION_FAILED',
        details: error
      });
    }
  }

  /**
   * Get tasks for a user with optional filtering
   */
  public async getTasks(userId: string, filter?: TaskFilter): Promise<Task[]> {
    try {
      // Build query criteria
      const criteria: any = { userId };
      
      // Apply status filter (default to active tasks only)
      if (filter?.status && filter.status.length > 0) {
        criteria.status = filter.status;
      } else {
        criteria.status = [TaskStatus.ACTIVE];
      }

      // Get tasks from database
      let tasks = await this.db.findMany<Task>(
        this.TASKS_COLLECTION,
        criteria,
        { sort: { createdAt: -1 } } // Default sort by creation date, newest first
      );

      // Apply additional filters
      if (filter) {
        tasks = this.applyFilter(tasks, filter);
      }

      // Apply default sorting
      tasks = this.sortTasks(tasks, { field: 'createdAt', order: 'desc' });

      return tasks;

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError({
        type: ErrorType.DATABASE_ERROR,
        message: 'Failed to retrieve tasks',
        code: 'TASKS_RETRIEVAL_FAILED',
        details: error
      });
    }
  }

  /**
   * Get a specific task by ID
   */
  public async getTaskById(userId: string, taskId: string): Promise<Task> {
    try {
      const task = await this.db.findOne<Task>(
        this.TASKS_COLLECTION,
        { id: taskId, userId }
      );

      if (!task) {
        throw new AppError({
          type: ErrorType.NOT_FOUND_ERROR,
          message: 'Task not found',
          code: 'TASK_NOT_FOUND'
        });
      }

      return task;

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError({
        type: ErrorType.DATABASE_ERROR,
        message: 'Failed to retrieve task',
        code: 'TASK_RETRIEVAL_FAILED',
        details: error
      });
    }
  }

  /**
   * Update an existing task
   */
  public async updateTask(
    userId: string, 
    taskId: string, 
    updates: Partial<TaskInput>
  ): Promise<Task> {
    try {
      // Validate updates
      if (Object.keys(updates).length === 0) {
        throw new AppError({
          type: ErrorType.VALIDATION_ERROR,
          message: 'No updates provided',
          code: 'NO_UPDATES_PROVIDED'
        });
      }

      // Validate update data
      const validation = this.validateTaskData(updates as TaskInput, true);
      if (!validation.isValid) {
        throw new AppError({
          type: ErrorType.VALIDATION_ERROR,
          message: 'Invalid update data',
          code: 'INVALID_UPDATE_DATA',
          details: validation.errors
        });
      }

      // Check if task exists and belongs to user
      await this.getTaskById(userId, taskId);

      // Prepare update data
      const updateData: any = {};
      if (updates.title !== undefined) {
        updateData.title = updates.title.trim();
      }
      if (updates.description !== undefined) {
        updateData.description = updates.description?.trim();
      }
      if (updates.dueDate !== undefined) {
        updateData.dueDate = updates.dueDate;
      }
      if (updates.priority !== undefined) {
        updateData.priority = updates.priority;
      }

      // Update task in database
      const updatedTask = await this.db.updateOne<Task>(
        this.TASKS_COLLECTION,
        taskId,
        updateData
      );

      return updatedTask;

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError({
        type: ErrorType.DATABASE_ERROR,
        message: 'Failed to update task',
        code: 'TASK_UPDATE_FAILED',
        details: error
      });
    }
  }

  /**
   * Delete a task
   */
  public async deleteTask(userId: string, taskId: string): Promise<void> {
    try {
      // Check if task exists and belongs to user
      await this.getTaskById(userId, taskId);

      // Delete task from database
      await this.db.deleteOne(this.TASKS_COLLECTION, taskId);

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError({
        type: ErrorType.DATABASE_ERROR,
        message: 'Failed to delete task',
        code: 'TASK_DELETE_FAILED',
        details: error
      });
    }
  }

  /**
   * Mark a task as complete
   */
  public async completeTask(userId: string, taskId: string): Promise<Task> {
    try {
      // Check if task exists and belongs to user
      const task = await this.getTaskById(userId, taskId);

      if (task.status === TaskStatus.COMPLETED) {
        return task; // Already completed
      }

      // Update task status
      const updatedTask = await this.db.updateOne<Task>(
        this.TASKS_COLLECTION,
        taskId,
        {
          status: TaskStatus.COMPLETED,
          completedAt: new Date()
        }
      );

      return updatedTask;

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError({
        type: ErrorType.DATABASE_ERROR,
        message: 'Failed to complete task',
        code: 'TASK_COMPLETE_FAILED',
        details: error
      });
    }
  }

  /**
   * Get completed tasks for a user
   */
  public async getCompletedTasks(userId: string, limit: number = 50): Promise<Task[]> {
    try {
      const tasks = await this.db.findMany<Task>(
        this.TASKS_COLLECTION,
        { userId, status: TaskStatus.COMPLETED },
        { 
          sort: { completedAt: -1 },
          limit 
        }
      );

      return tasks;

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError({
        type: ErrorType.DATABASE_ERROR,
        message: 'Failed to retrieve completed tasks',
        code: 'COMPLETED_TASKS_RETRIEVAL_FAILED',
        details: error
      });
    }
  }

  /**
   * Get task statistics for a user
   */
  public async getTaskStats(userId: string): Promise<{
    active: number;
    completed: number;
    overdue: number;
    total: number;
  }> {
    try {
      const allTasks = await this.db.findMany<Task>(
        this.TASKS_COLLECTION,
        { userId }
      );

      const now = new Date();
      
      const stats = {
        active: allTasks.filter(task => task.status === TaskStatus.ACTIVE).length,
        completed: allTasks.filter(task => task.status === TaskStatus.COMPLETED).length,
        overdue: allTasks.filter(task => 
          task.status === TaskStatus.ACTIVE && 
          task.dueDate && 
          new Date(task.dueDate) < now
        ).length,
        total: allTasks.length
      };

      return stats;

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError({
        type: ErrorType.DATABASE_ERROR,
        message: 'Failed to retrieve task statistics',
        code: 'TASK_STATS_FAILED',
        details: error
      });
    }
  }

  /**
   * Validate task data
   */
  private validateTaskData(taskData: Partial<TaskInput>, isUpdate: boolean = false): ValidationResult {
    const errors: ValidationErrors = {};

    // Title validation
    if (!isUpdate || taskData.title !== undefined) {
      if (!taskData.title || typeof taskData.title !== 'string') {
        errors.title = ['Title is required'];
      } else if (taskData.title.trim().length === 0) {
        errors.title = ['Title cannot be empty'];
      } else if (taskData.title.trim().length > 200) {
        errors.title = ['Title must be less than 200 characters'];
      }
    }

    // Description validation
    if (taskData.description !== undefined) {
      if (taskData.description && typeof taskData.description !== 'string') {
        errors.description = ['Description must be a string'];
      } else if (taskData.description && taskData.description.length > 1000) {
        errors.description = ['Description must be less than 1000 characters'];
      }
    }

    // Due date validation
    if (taskData.dueDate !== undefined && taskData.dueDate !== null) {
      const dueDate = new Date(taskData.dueDate);
      if (isNaN(dueDate.getTime())) {
        errors.dueDate = ['Invalid due date format'];
      }
    }

    // Priority validation
    if (!isUpdate || taskData.priority !== undefined) {
      if (!taskData.priority || !Object.values(Priority).includes(taskData.priority)) {
        errors.priority = ['Priority must be one of: low, medium, high'];
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * Apply filters to task list
   */
  private applyFilter(tasks: Task[], filter: TaskFilter): Task[] {
    let filteredTasks = [...tasks];

    // Priority filter
    if (filter.priority && filter.priority.length > 0) {
      filteredTasks = filteredTasks.filter(task => 
        filter.priority!.includes(task.priority)
      );
    }

    // Date range filter
    if (filter.dueDateRange) {
      filteredTasks = filteredTasks.filter(task => {
        if (!task.dueDate) return false;
        const taskDate = new Date(task.dueDate);
        return taskDate >= filter.dueDateRange!.start && 
               taskDate <= filter.dueDateRange!.end;
      });
    }

    // Search filter
    if (filter.search && filter.search.trim().length > 0) {
      const searchTerm = filter.search.toLowerCase().trim();
      filteredTasks = filteredTasks.filter(task =>
        task.title.toLowerCase().includes(searchTerm) ||
        (task.description && task.description.toLowerCase().includes(searchTerm))
      );
    }

    return filteredTasks;
  }

  /**
   * Sort tasks by specified criteria
   */
  private sortTasks(tasks: Task[], sortBy: SortCriteria): Task[] {
    return [...tasks].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy.field) {
        case 'dueDate':
          aValue = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
          bValue = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
          break;
        case 'priority':
          const priorityOrder = { [Priority.HIGH]: 3, [Priority.MEDIUM]: 2, [Priority.LOW]: 1 };
          aValue = priorityOrder[a.priority];
          bValue = priorityOrder[b.priority];
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        default:
          return 0;
      }

      if (sortBy.order === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }
}