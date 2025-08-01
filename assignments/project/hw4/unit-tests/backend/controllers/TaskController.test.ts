/**
 * Unit tests for TaskController
 * Tests HTTP request/response handling for task management endpoints
 */

import { Request, Response } from 'express';
import { TaskController } from '../../../hw3/backend/src/controllers/TaskController';
import { DatabaseService } from '../../../hw3/backend/src/services/DatabaseService';
import { TaskService } from '../../../hw3/backend/src/services/TaskService';
import {
    AppError,
    CreateTaskRequest,
    ErrorType,
    Priority,
    Task,
    TaskStatus,
    UpdateTaskRequest,
    User
} from '../../../hw3/shared/types';

// Mock the TaskService
jest.mock('../../../hw3/backend/src/services/TaskService');

describe('TaskController', () => {
  let taskController: TaskController;
  let mockTaskService: jest.Mocked<TaskService>;
  let mockDatabaseService: jest.Mocked<DatabaseService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  const mockUser: User = {
    id: 'user123',
    email: 'test@example.com',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  };

  const mockTask: Task = {
    id: 'task123',
    userId: mockUser.id,
    title: 'Test Task',
    description: 'Test task description',
    dueDate: new Date('2025-02-01'),
    priority: Priority.MEDIUM,
    status: TaskStatus.ACTIVE,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock DatabaseService
    mockDatabaseService = {
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      find: jest.fn(),
      connect: jest.fn(),
      disconnect: jest.fn(),
      getStats: jest.fn()
    } as jest.Mocked<DatabaseService>;

    // Mock TaskService
    mockTaskService = {
      createTask: jest.fn(),
      getTasks: jest.fn(),
      getTaskById: jest.fn(),
      updateTask: jest.fn(),
      deleteTask: jest.fn(),
      markTaskComplete: jest.fn(),
      getTaskCounts: jest.fn(),
      searchTasks: jest.fn(),
      validateTaskData: jest.fn()
    } as jest.Mocked<TaskService>;

    // Create controller instance
    taskController = new TaskController(mockDatabaseService);
    // Replace the taskService with our mock
    (taskController as any).taskService = mockTaskService;

    // Mock Express Request and Response
    mockRequest = {
      body: {},
      params: {},
      query: {},
      user: mockUser
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('createTask', () => {
    const createTaskData: CreateTaskRequest = {
      title: 'New Task',
      description: 'New task description',
      dueDate: '2025-02-15',
      priority: Priority.HIGH
    };

    it('should create task successfully', async () => {
      // Arrange
      mockRequest.body = createTaskData;
      mockTaskService.createTask.mockResolvedValue(mockTask);

      // Act
      await taskController.createTask(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockTaskService.createTask).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({
          title: createTaskData.title,
          description: createTaskData.description,
          dueDate: new Date(createTaskData.dueDate!),
          priority: createTaskData.priority
        })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Task created successfully',
        data: { task: mockTask }
      });
    });

    it('should create task without optional fields', async () => {
      // Arrange
      const minimalTask: CreateTaskRequest = {
        title: 'Minimal Task',
        priority: Priority.LOW
      };
      mockRequest.body = minimalTask;
      mockTaskService.createTask.mockResolvedValue(mockTask);

      // Act
      await taskController.createTask(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockTaskService.createTask).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({
          title: minimalTask.title,
          priority: minimalTask.priority,
          description: undefined,
          dueDate: undefined
        })
      );
    });

    it('should handle validation errors', async () => {
      // Arrange
      mockRequest.body = { ...createTaskData, title: '' };
      const validationError = new AppError({
        type: ErrorType.VALIDATION_ERROR,
        message: 'Invalid task data',
        code: 'INVALID_TASK_DATA'
      });
      mockTaskService.createTask.mockRejectedValue(validationError);

      // Act & Assert
      await expect(
        taskController.createTask(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(AppError);
    });

    it('should handle missing user', async () => {
      // Arrange
      mockRequest.user = undefined;
      mockRequest.body = createTaskData;

      // Act & Assert
      await expect(
        taskController.createTask(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(AppError);
    });
  });

  describe('getTasks', () => {
    const mockTasks = [mockTask];

    it('should get all tasks successfully', async () => {
      // Arrange
      mockRequest.query = {};
      mockTaskService.getTasks.mockResolvedValue(mockTasks);

      // Act
      await taskController.getTasks(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockTaskService.getTasks).toHaveBeenCalledWith(
        mockUser.id,
        undefined,
        undefined
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          tasks: mockTasks,
          total: mockTasks.length
        }
      });
    });

    it('should get tasks with filters and sorting', async () => {
      // Arrange
      mockRequest.query = {
        status: 'active',
        priority: 'high,medium',
        search: 'important',
        sortBy: 'dueDate',
        order: 'asc'
      };
      mockTaskService.getTasks.mockResolvedValue(mockTasks);

      // Act
      await taskController.getTasks(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockTaskService.getTasks).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({
          status: [TaskStatus.ACTIVE],
          priority: [Priority.HIGH, Priority.MEDIUM],
          search: 'important'
        }),
        expect.objectContaining({
          field: 'dueDate',
          order: 'asc'
        })
      );
    });

    it('should handle empty results', async () => {
      // Arrange
      mockRequest.query = {};
      mockTaskService.getTasks.mockResolvedValue([]);

      // Act
      await taskController.getTasks(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          tasks: [],
          total: 0
        }
      });
    });
  });

  describe('getTaskById', () => {
    it('should get task by id successfully', async () => {
      // Arrange
      mockRequest.params = { id: 'task123' };
      mockTaskService.getTaskById.mockResolvedValue(mockTask);

      // Act
      await taskController.getTaskById(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockTaskService.getTaskById).toHaveBeenCalledWith('task123', mockUser.id);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: { task: mockTask }
      });
    });

    it('should handle task not found', async () => {
      // Arrange
      mockRequest.params = { id: 'nonexistent' };
      const notFoundError = new AppError({
        type: ErrorType.NOT_FOUND_ERROR,
        message: 'Task not found',
        code: 'TASK_NOT_FOUND'
      });
      mockTaskService.getTaskById.mockRejectedValue(notFoundError);

      // Act & Assert
      await expect(
        taskController.getTaskById(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(AppError);
    });
  });

  describe('updateTask', () => {
    const updateData: UpdateTaskRequest = {
      title: 'Updated Task',
      priority: Priority.HIGH
    };

    it('should update task successfully', async () => {
      // Arrange
      mockRequest.params = { id: 'task123' };
      mockRequest.body = updateData;
      const updatedTask = { ...mockTask, ...updateData };
      mockTaskService.updateTask.mockResolvedValue(updatedTask);

      // Act
      await taskController.updateTask(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockTaskService.updateTask).toHaveBeenCalledWith(
        'task123',
        mockUser.id,
        expect.objectContaining({
          title: updateData.title,
          priority: updateData.priority
        })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Task updated successfully',
        data: { task: updatedTask }
      });
    });

    it('should update task with due date conversion', async () => {
      // Arrange
      mockRequest.params = { id: 'task123' };
      mockRequest.body = { ...updateData, dueDate: '2025-03-01' };
      const updatedTask = { ...mockTask, dueDate: new Date('2025-03-01') };
      mockTaskService.updateTask.mockResolvedValue(updatedTask);

      // Act
      await taskController.updateTask(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockTaskService.updateTask).toHaveBeenCalledWith(
        'task123',
        mockUser.id,
        expect.objectContaining({
          dueDate: new Date('2025-03-01')
        })
      );
    });

    it('should handle task not found for update', async () => {
      // Arrange
      mockRequest.params = { id: 'nonexistent' };
      mockRequest.body = updateData;
      const notFoundError = new AppError({
        type: ErrorType.NOT_FOUND_ERROR,
        message: 'Task not found',
        code: 'TASK_NOT_FOUND'
      });
      mockTaskService.updateTask.mockRejectedValue(notFoundError);

      // Act & Assert
      await expect(
        taskController.updateTask(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(AppError);
    });
  });

  describe('deleteTask', () => {
    it('should delete task successfully', async () => {
      // Arrange
      mockRequest.params = { id: 'task123' };
      mockTaskService.deleteTask.mockResolvedValue(true);

      // Act
      await taskController.deleteTask(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockTaskService.deleteTask).toHaveBeenCalledWith('task123', mockUser.id);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Task deleted successfully'
      });
    });

    it('should handle task not found for deletion', async () => {
      // Arrange
      mockRequest.params = { id: 'nonexistent' };
      const notFoundError = new AppError({
        type: ErrorType.NOT_FOUND_ERROR,
        message: 'Task not found',
        code: 'TASK_NOT_FOUND'
      });
      mockTaskService.deleteTask.mockRejectedValue(notFoundError);

      // Act & Assert
      await expect(
        taskController.deleteTask(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(AppError);
    });
  });

  describe('markTaskComplete', () => {
    it('should mark task as complete successfully', async () => {
      // Arrange
      mockRequest.params = { id: 'task123' };
      const completedTask = { 
        ...mockTask, 
        status: TaskStatus.COMPLETED,
        completedAt: new Date()
      };
      mockTaskService.markTaskComplete.mockResolvedValue(completedTask);

      // Act
      await taskController.markTaskComplete(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockTaskService.markTaskComplete).toHaveBeenCalledWith('task123', mockUser.id);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Task marked as complete',
        data: { task: completedTask }
      });
    });

    it('should handle already completed task', async () => {
      // Arrange
      mockRequest.params = { id: 'task123' };
      const alreadyCompletedError = new AppError({
        type: ErrorType.VALIDATION_ERROR,
        message: 'Task already completed',
        code: 'TASK_ALREADY_COMPLETED'
      });
      mockTaskService.markTaskComplete.mockRejectedValue(alreadyCompletedError);

      // Act & Assert
      await expect(
        taskController.markTaskComplete(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(AppError);
    });
  });

  describe('getTaskCounts', () => {
    it('should get task counts successfully', async () => {
      // Arrange
      const mockCounts = {
        active: 5,
        completed: 3,
        overdue: 2,
        total: 8
      };
      mockTaskService.getTaskCounts.mockResolvedValue(mockCounts);

      // Act
      await taskController.getTaskCounts(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockTaskService.getTaskCounts).toHaveBeenCalledWith(mockUser.id);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: { counts: mockCounts }
      });
    });
  });

  describe('searchTasks', () => {
    it('should search tasks successfully', async () => {
      // Arrange
      mockRequest.query = { q: 'important task' };
      mockTaskService.searchTasks.mockResolvedValue([mockTask]);

      // Act
      await taskController.searchTasks(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockTaskService.searchTasks).toHaveBeenCalledWith(mockUser.id, 'important task');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          tasks: [mockTask],
          query: 'important task',
          total: 1
        }
      });
    });

    it('should handle empty search query', async () => {
      // Arrange
      mockRequest.query = {};

      // Act & Assert
      await expect(
        taskController.searchTasks(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(AppError);
    });

    it('should handle no search results', async () => {
      // Arrange
      mockRequest.query = { q: 'nonexistent' };
      mockTaskService.searchTasks.mockResolvedValue([]);

      // Act
      await taskController.searchTasks(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          tasks: [],
          query: 'nonexistent',
          total: 0
        }
      });
    });
  });

  describe('getCompletedTasks', () => {
    it('should get completed tasks successfully', async () => {
      // Arrange
      const completedTask = { ...mockTask, status: TaskStatus.COMPLETED };
      mockTaskService.getTasks.mockResolvedValue([completedTask]);

      // Act
      await taskController.getCompletedTasks(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockTaskService.getTasks).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({
          status: [TaskStatus.COMPLETED]
        }),
        expect.objectContaining({
          field: 'completedAt',
          order: 'desc'
        })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          tasks: [completedTask],
          total: 1
        }
      });
    });
  });

  describe('Error handling', () => {
    it('should handle database errors', async () => {
      // Arrange
      mockRequest.query = {};
      const dbError = new AppError({
        type: ErrorType.DATABASE_ERROR,
        message: 'Database connection failed',
        code: 'DB_CONNECTION_ERROR'
      });
      mockTaskService.getTasks.mockRejectedValue(dbError);

      // Act & Assert
      await expect(
        taskController.getTasks(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(AppError);
    });

    it('should handle authorization errors', async () => {
      // Arrange
      mockRequest.user = undefined;

      // Act & Assert
      await expect(
        taskController.getTasks(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(AppError);
    });
  });
});