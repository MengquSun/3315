/**
 * Task Controller
 * Handles HTTP requests for task management operations
 */

import { Request, Response } from 'express';
import {
    AppError,
    ErrorType,
    GetTasksQuery,
    Priority,
    SortCriteria,
    Task,
    TaskFilter,
    TaskInput,
    TaskStatus
} from '../../shared/types';
import { asyncHandler } from '../middleware/errorHandler';
import { DatabaseService } from '../services/DatabaseService';
import { TaskService } from '../services/TaskService';

export class TaskController {
  private taskService: TaskService;

  constructor(databaseService: DatabaseService) {
    this.taskService = new TaskService(databaseService);
  }

  /**
   * Get all tasks for the authenticated user
   * GET /api/tasks
   */
  public getTasks = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated',
        code: 'NOT_AUTHENTICATED'
      });
      return;
    }

    try {
      const filter = this.buildFilter(req.query as GetTasksQuery);
      const tasks = await this.taskService.getTasks(req.userId, filter);

      // Apply sorting if specified
      const sortBy = this.buildSortCriteria(req.query as GetTasksQuery);
      const sortedTasks = sortBy ? this.sortTasks(tasks, sortBy) : tasks;

      // Get task statistics
      const stats = await this.taskService.getTaskStats(req.userId);

      res.status(200).json({
        success: true,
        data: {
          tasks: sortedTasks,
          stats,
          total: sortedTasks.length
        }
      });

    } catch (error) {
      this.handleError(error, res);
    }
  });

  /**
   * Get a specific task by ID
   * GET /api/tasks/:id
   */
  public getTask = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated',
        code: 'NOT_AUTHENTICATED'
      });
      return;
    }

    try {
      const taskId = req.params.id;
      const task = await this.taskService.getTaskById(req.userId, taskId);

      res.status(200).json({
        success: true,
        data: {
          task
        }
      });

    } catch (error) {
      this.handleError(error, res);
    }
  });

  /**
   * Create a new task
   * POST /api/tasks
   */
  public createTask = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated',
        code: 'NOT_AUTHENTICATED'
      });
      return;
    }

    try {
      const taskData: TaskInput = {
        title: req.body.title,
        description: req.body.description,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined,
        priority: req.body.priority
      };

      const task = await this.taskService.createTask(req.userId, taskData);

      res.status(201).json({
        success: true,
        message: 'Task created successfully',
        data: {
          task
        }
      });

    } catch (error) {
      this.handleError(error, res);
    }
  });

  /**
   * Update an existing task
   * PUT /api/tasks/:id
   */
  public updateTask = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated',
        code: 'NOT_AUTHENTICATED'
      });
      return;
    }

    try {
      const taskId = req.params.id;
      const updates: Partial<TaskInput> = {};

      // Only include provided fields in updates
      if (req.body.title !== undefined) {
        updates.title = req.body.title;
      }
      if (req.body.description !== undefined) {
        updates.description = req.body.description;
      }
      if (req.body.dueDate !== undefined) {
        updates.dueDate = req.body.dueDate ? new Date(req.body.dueDate) : undefined;
      }
      if (req.body.priority !== undefined) {
        updates.priority = req.body.priority;
      }

      const task = await this.taskService.updateTask(req.userId, taskId, updates);

      res.status(200).json({
        success: true,
        message: 'Task updated successfully',
        data: {
          task
        }
      });

    } catch (error) {
      this.handleError(error, res);
    }
  });

  /**
   * Delete a task
   * DELETE /api/tasks/:id
   */
  public deleteTask = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated',
        code: 'NOT_AUTHENTICATED'
      });
      return;
    }

    try {
      const taskId = req.params.id;
      await this.taskService.deleteTask(req.userId, taskId);

      res.status(200).json({
        success: true,
        message: 'Task deleted successfully'
      });

    } catch (error) {
      this.handleError(error, res);
    }
  });

  /**
   * Mark a task as complete
   * PATCH /api/tasks/:id/complete
   */
  public completeTask = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated',
        code: 'NOT_AUTHENTICATED'
      });
      return;
    }

    try {
      const taskId = req.params.id;
      const task = await this.taskService.completeTask(req.userId, taskId);

      res.status(200).json({
        success: true,
        message: 'Task marked as complete',
        data: {
          task
        }
      });

    } catch (error) {
      this.handleError(error, res);
    }
  });

  /**
   * Get completed tasks
   * GET /api/tasks/completed
   */
  public getCompletedTasks = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated',
        code: 'NOT_AUTHENTICATED'
      });
      return;
    }

    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const tasks = await this.taskService.getCompletedTasks(req.userId, limit);

      res.status(200).json({
        success: true,
        data: {
          tasks,
          total: tasks.length
        }
      });

    } catch (error) {
      this.handleError(error, res);
    }
  });

  /**
   * Get task statistics
   * GET /api/tasks/stats
   */
  public getTaskStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated',
        code: 'NOT_AUTHENTICATED'
      });
      return;
    }

    try {
      const stats = await this.taskService.getTaskStats(req.userId);

      res.status(200).json({
        success: true,
        data: {
          stats
        }
      });

    } catch (error) {
      this.handleError(error, res);
    }
  });

  /**
   * Build filter object from query parameters
   */
  private buildFilter(query: GetTasksQuery): TaskFilter {
    const filter: TaskFilter = {};

    // Status filter
    if (query.status) {
      const statuses = Array.isArray(query.status) ? query.status : [query.status];
      filter.status = statuses.map(status => status as TaskStatus);
    }

    // Priority filter
    if (query.priority) {
      const priorities = Array.isArray(query.priority) ? query.priority : [query.priority];
      filter.priority = priorities.map(priority => priority as Priority);
    }

    // Search filter
    if (query.search && query.search.trim()) {
      filter.search = query.search.trim();
    }

    return filter;
  }

  /**
   * Build sort criteria from query parameters
   */
  private buildSortCriteria(query: GetTasksQuery): SortCriteria | null {
    if (!query.sortBy) {
      return null;
    }

    return {
      field: query.sortBy as 'dueDate' | 'priority' | 'createdAt' | 'title',
      order: (query.order as 'asc' | 'desc') || 'asc'
    };
  }

  /**
   * Sort tasks array by criteria
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

  /**
   * Extract user ID from request
   */
  private extractUserId(req: Request): string {
    if (!req.userId) {
      throw new AppError({
        type: ErrorType.AUTHENTICATION_ERROR,
        message: 'User not authenticated',
        code: 'NOT_AUTHENTICATED'
      });
    }
    return req.userId;
  }

  /**
   * Validate request data
   */
  private validateRequest(req: Request): boolean {
    return !!req.userId;
  }

  /**
   * Handle errors consistently
   */
  private handleError(error: any, res: Response): void {
    if (error instanceof AppError) {
      const statusCode = this.getStatusCode(error.type);
      res.status(statusCode).json({
        success: false,
        error: error.message,
        code: error.code,
        ...(error.details && { details: error.details })
      });
    } else {
      console.error('Unexpected error in TaskController:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * Map error types to HTTP status codes
   */
  private getStatusCode(errorType: ErrorType): number {
    switch (errorType) {
      case ErrorType.VALIDATION_ERROR:
        return 400;
      case ErrorType.AUTHENTICATION_ERROR:
        return 401;
      case ErrorType.AUTHORIZATION_ERROR:
        return 403;
      case ErrorType.NOT_FOUND_ERROR:
        return 404;
      case ErrorType.DATABASE_ERROR:
        return 500;
      case ErrorType.NETWORK_ERROR:
        return 503;
      default:
        return 500;
    }
  }
}