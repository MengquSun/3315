/**
 * Unit tests for TaskService
 * Tests task management business logic and CRUD operations
 */

import { DatabaseService } from '../../../hw3/backend/src/services/DatabaseService';
import { TaskService } from '../../../hw3/backend/src/services/TaskService';
import {
    AppError,
    ErrorType,
    Priority,
    SortCriteria,
    Task,
    TaskFilter,
    TaskInput,
    TaskStatus
} from '../../../hw3/shared/types';

describe('TaskService', () => {
  let taskService: TaskService;
  let mockDatabaseService: jest.Mocked<DatabaseService>;
  
  const mockUserId = 'user123';
  const mockTask: Task = {
    id: 'task123',
    userId: mockUserId,
    title: 'Test Task',
    description: 'Test task description',
    dueDate: new Date('2025-02-01'),
    priority: Priority.MEDIUM,
    status: TaskStatus.ACTIVE,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  };

  const mockTaskInput: TaskInput = {
    title: 'New Task',
    description: 'New task description',
    dueDate: new Date('2025-02-15'),
    priority: Priority.HIGH
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
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

    taskService = new TaskService(mockDatabaseService);
  });

  describe('createTask', () => {
    it('should create a new task successfully', async () => {
      // Arrange
      mockDatabaseService.create.mockResolvedValue(mockTask);

      // Act
      const result = await taskService.createTask(mockUserId, mockTaskInput);

      // Assert
      expect(result).toEqual(mockTask);
      expect(mockDatabaseService.create).toHaveBeenCalledWith('tasks', expect.objectContaining({
        userId: mockUserId,
        title: mockTaskInput.title.trim(),
        description: mockTaskInput.description?.trim(),
        dueDate: mockTaskInput.dueDate,
        priority: mockTaskInput.priority,
        status: TaskStatus.ACTIVE,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      }));
    });

    it('should trim whitespace from title and description', async () => {
      // Arrange
      const taskWithWhitespace: TaskInput = {
        title: '  Whitespace Task  ',
        description: '  Description with spaces  ',
        priority: Priority.LOW
      };
      mockDatabaseService.create.mockResolvedValue(mockTask);

      // Act
      await taskService.createTask(mockUserId, taskWithWhitespace);

      // Assert
      expect(mockDatabaseService.create).toHaveBeenCalledWith('tasks', expect.objectContaining({
        title: 'Whitespace Task',
        description: 'Description with spaces'
      }));
    });

    it('should throw error for empty title', async () => {
      // Arrange
      const invalidTask: TaskInput = {
        title: '',
        priority: Priority.MEDIUM
      };

      // Act & Assert
      await expect(taskService.createTask(mockUserId, invalidTask)).rejects.toThrow(AppError);
      await expect(taskService.createTask(mockUserId, invalidTask)).rejects.toMatchObject({
        type: ErrorType.VALIDATION_ERROR,
        code: 'INVALID_TASK_DATA'
      });
    });

    it('should throw error for title longer than 200 characters', async () => {
      // Arrange
      const invalidTask: TaskInput = {
        title: 'a'.repeat(201),
        priority: Priority.MEDIUM
      };

      // Act & Assert
      await expect(taskService.createTask(mockUserId, invalidTask)).rejects.toThrow(AppError);
    });

    it('should throw error for past due date', async () => {
      // Arrange
      const invalidTask: TaskInput = {
        title: 'Past Due Task',
        dueDate: new Date('2024-01-01'), // Past date
        priority: Priority.MEDIUM
      };

      // Act & Assert
      await expect(taskService.createTask(mockUserId, invalidTask)).rejects.toThrow(AppError);
    });

    it('should accept task without description and due date', async () => {
      // Arrange
      const minimalTask: TaskInput = {
        title: 'Minimal Task',
        priority: Priority.LOW
      };
      mockDatabaseService.create.mockResolvedValue(mockTask);

      // Act
      const result = await taskService.createTask(mockUserId, minimalTask);

      // Assert
      expect(result).toEqual(mockTask);
      expect(mockDatabaseService.create).toHaveBeenCalledWith('tasks', expect.objectContaining({
        title: 'Minimal Task',
        description: undefined,
        dueDate: undefined,
        priority: Priority.LOW
      }));
    });
  });

  describe('getTasks', () => {
    const mockTasks: Task[] = [
      mockTask,
      { ...mockTask, id: 'task456', title: 'Another Task', priority: Priority.HIGH }
    ];

    it('should get all tasks for user', async () => {
      // Arrange
      mockDatabaseService.find.mockResolvedValue(mockTasks);

      // Act
      const result = await taskService.getTasks(mockUserId);

      // Assert
      expect(result).toEqual(mockTasks);
      expect(mockDatabaseService.find).toHaveBeenCalledWith('tasks', 
        { userId: mockUserId, status: { $ne: TaskStatus.DELETED } },
        expect.any(Object)
      );
    });

    it('should filter tasks by status', async () => {
      // Arrange
      const filter: TaskFilter = { status: [TaskStatus.COMPLETED] };
      mockDatabaseService.find.mockResolvedValue([]);

      // Act
      await taskService.getTasks(mockUserId, filter);

      // Assert
      expect(mockDatabaseService.find).toHaveBeenCalledWith('tasks',
        expect.objectContaining({
          userId: mockUserId,
          status: { $in: [TaskStatus.COMPLETED] }
        }),
        expect.any(Object)
      );
    });

    it('should filter tasks by priority', async () => {
      // Arrange
      const filter: TaskFilter = { priority: [Priority.HIGH, Priority.MEDIUM] };
      mockDatabaseService.find.mockResolvedValue([]);

      // Act
      await taskService.getTasks(mockUserId, filter);

      // Assert
      expect(mockDatabaseService.find).toHaveBeenCalledWith('tasks',
        expect.objectContaining({
          userId: mockUserId,
          priority: { $in: [Priority.HIGH, Priority.MEDIUM] }
        }),
        expect.any(Object)
      );
    });

    it('should search tasks by title and description', async () => {
      // Arrange
      const filter: TaskFilter = { search: 'important task' };
      mockDatabaseService.find.mockResolvedValue([]);

      // Act
      await taskService.getTasks(mockUserId, filter);

      // Assert
      expect(mockDatabaseService.find).toHaveBeenCalledWith('tasks',
        expect.objectContaining({
          userId: mockUserId,
          $or: [
            { title: { $regex: 'important task', $options: 'i' } },
            { description: { $regex: 'important task', $options: 'i' } }
          ]
        }),
        expect.any(Object)
      );
    });

    it('should sort tasks by due date ascending', async () => {
      // Arrange
      const sort: SortCriteria = { field: 'dueDate', order: 'asc' };
      mockDatabaseService.find.mockResolvedValue([]);

      // Act
      await taskService.getTasks(mockUserId, undefined, sort);

      // Assert
      expect(mockDatabaseService.find).toHaveBeenCalledWith('tasks',
        expect.any(Object),
        expect.objectContaining({
          sort: { dueDate: 1 }
        })
      );
    });

    it('should sort tasks by priority descending', async () => {
      // Arrange
      const sort: SortCriteria = { field: 'priority', order: 'desc' };
      mockDatabaseService.find.mockResolvedValue([]);

      // Act
      await taskService.getTasks(mockUserId, undefined, sort);

      // Assert
      expect(mockDatabaseService.find).toHaveBeenCalledWith('tasks',
        expect.any(Object),
        expect.objectContaining({
          sort: { priority: -1 }
        })
      );
    });
  });

  describe('getTaskById', () => {
    it('should get task by id for correct user', async () => {
      // Arrange
      const taskId = 'task123';
      mockDatabaseService.findOne.mockResolvedValue(mockTask);

      // Act
      const result = await taskService.getTaskById(taskId, mockUserId);

      // Assert
      expect(result).toEqual(mockTask);
      expect(mockDatabaseService.findOne).toHaveBeenCalledWith('tasks', {
        id: taskId,
        userId: mockUserId,
        status: { $ne: TaskStatus.DELETED }
      });
    });

    it('should throw error if task not found', async () => {
      // Arrange
      const taskId = 'nonexistent';
      mockDatabaseService.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(taskService.getTaskById(taskId, mockUserId)).rejects.toThrow(AppError);
      await expect(taskService.getTaskById(taskId, mockUserId)).rejects.toMatchObject({
        type: ErrorType.NOT_FOUND_ERROR,
        code: 'TASK_NOT_FOUND'
      });
    });

    it('should throw error if user tries to access another users task', async () => {
      // Arrange
      const taskId = 'task123';
      const wrongUserId = 'wronguser';
      mockDatabaseService.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(taskService.getTaskById(taskId, wrongUserId)).rejects.toThrow(AppError);
    });
  });

  describe('updateTask', () => {
    const updateData: Partial<TaskInput> = {
      title: 'Updated Task',
      priority: Priority.HIGH
    };

    it('should update task successfully', async () => {
      // Arrange
      const updatedTask = { ...mockTask, ...updateData, updatedAt: new Date() };
      mockDatabaseService.findOne.mockResolvedValue(mockTask);
      mockDatabaseService.update.mockResolvedValue(updatedTask);

      // Act
      const result = await taskService.updateTask('task123', mockUserId, updateData);

      // Assert
      expect(result).toEqual(updatedTask);
      expect(mockDatabaseService.update).toHaveBeenCalledWith('tasks',
        { id: 'task123', userId: mockUserId },
        expect.objectContaining({
          title: 'Updated Task',
          priority: Priority.HIGH,
          updatedAt: expect.any(Date)
        })
      );
    });

    it('should throw error if task not found for update', async () => {
      // Arrange
      mockDatabaseService.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(taskService.updateTask('task123', mockUserId, updateData)).rejects.toThrow(AppError);
    });

    it('should validate updated data', async () => {
      // Arrange
      const invalidUpdate = { title: '' }; // Empty title
      mockDatabaseService.findOne.mockResolvedValue(mockTask);

      // Act & Assert
      await expect(taskService.updateTask('task123', mockUserId, invalidUpdate)).rejects.toThrow(AppError);
    });
  });

  describe('deleteTask', () => {
    it('should soft delete task (mark as deleted)', async () => {
      // Arrange
      const deletedTask = { ...mockTask, status: TaskStatus.DELETED, updatedAt: new Date() };
      mockDatabaseService.findOne.mockResolvedValue(mockTask);
      mockDatabaseService.update.mockResolvedValue(deletedTask);

      // Act
      const result = await taskService.deleteTask('task123', mockUserId);

      // Assert
      expect(result).toBe(true);
      expect(mockDatabaseService.update).toHaveBeenCalledWith('tasks',
        { id: 'task123', userId: mockUserId },
        expect.objectContaining({
          status: TaskStatus.DELETED,
          updatedAt: expect.any(Date)
        })
      );
    });

    it('should throw error if task not found for deletion', async () => {
      // Arrange
      mockDatabaseService.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(taskService.deleteTask('task123', mockUserId)).rejects.toThrow(AppError);
    });
  });

  describe('markTaskComplete', () => {
    it('should mark task as completed', async () => {
      // Arrange
      const completedTask = { 
        ...mockTask, 
        status: TaskStatus.COMPLETED, 
        completedAt: new Date(),
        updatedAt: new Date()
      };
      mockDatabaseService.findOne.mockResolvedValue(mockTask);
      mockDatabaseService.update.mockResolvedValue(completedTask);

      // Act
      const result = await taskService.markTaskComplete('task123', mockUserId);

      // Assert
      expect(result).toEqual(completedTask);
      expect(mockDatabaseService.update).toHaveBeenCalledWith('tasks',
        { id: 'task123', userId: mockUserId },
        expect.objectContaining({
          status: TaskStatus.COMPLETED,
          completedAt: expect.any(Date),
          updatedAt: expect.any(Date)
        })
      );
    });

    it('should throw error if task already completed', async () => {
      // Arrange
      const completedTask = { ...mockTask, status: TaskStatus.COMPLETED };
      mockDatabaseService.findOne.mockResolvedValue(completedTask);

      // Act & Assert
      await expect(taskService.markTaskComplete('task123', mockUserId)).rejects.toThrow(AppError);
      await expect(taskService.markTaskComplete('task123', mockUserId)).rejects.toMatchObject({
        type: ErrorType.VALIDATION_ERROR,
        code: 'TASK_ALREADY_COMPLETED'
      });
    });
  });

  describe('getTaskCounts', () => {
    it('should return task counts for user', async () => {
      // Arrange
      const activeTasks = [mockTask];
      const completedTasks = [{ ...mockTask, status: TaskStatus.COMPLETED }];
      const overdueTasks = [{ ...mockTask, dueDate: new Date('2025-01-01') }];

      mockDatabaseService.find
        .mockResolvedValueOnce(activeTasks)      // Active tasks
        .mockResolvedValueOnce(completedTasks)   // Completed tasks
        .mockResolvedValueOnce(overdueTasks);    // Overdue tasks

      // Act
      const result = await taskService.getTaskCounts(mockUserId);

      // Assert
      expect(result).toEqual({
        active: 1,
        completed: 1,
        overdue: 1,
        total: 2
      });
    });
  });

  describe('searchTasks', () => {
    it('should search tasks with case-insensitive matching', async () => {
      // Arrange
      const searchQuery = 'Important';
      const matchingTasks = [mockTask];
      mockDatabaseService.find.mockResolvedValue(matchingTasks);

      // Act
      const result = await taskService.searchTasks(mockUserId, searchQuery);

      // Assert
      expect(result).toEqual(matchingTasks);
      expect(mockDatabaseService.find).toHaveBeenCalledWith('tasks',
        expect.objectContaining({
          userId: mockUserId,
          $or: [
            { title: { $regex: searchQuery, $options: 'i' } },
            { description: { $regex: searchQuery, $options: 'i' } }
          ]
        }),
        expect.any(Object)
      );
    });

    it('should return empty array for no matches', async () => {
      // Arrange
      const searchQuery = 'nonexistent';
      mockDatabaseService.find.mockResolvedValue([]);

      // Act
      const result = await taskService.searchTasks(mockUserId, searchQuery);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('validateTaskData', () => {
    it('should validate correct task data', () => {
      // Act
      const result = taskService.validateTaskData(mockTaskInput);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should reject empty title', () => {
      // Arrange
      const invalidTask = { ...mockTaskInput, title: '' };

      // Act
      const result = taskService.validateTaskData(invalidTask);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.title).toContain('Title is required');
    });

    it('should reject too long title', () => {
      // Arrange
      const invalidTask = { ...mockTaskInput, title: 'a'.repeat(201) };

      // Act
      const result = taskService.validateTaskData(invalidTask);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.title).toContain('Title must be less than 200 characters');
    });

    it('should reject invalid priority', () => {
      // Arrange
      const invalidTask = { ...mockTaskInput, priority: 'invalid' as Priority };

      // Act
      const result = taskService.validateTaskData(invalidTask);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.priority).toContain('Invalid priority value');
    });

    it('should reject past due dates', () => {
      // Arrange
      const invalidTask = { ...mockTaskInput, dueDate: new Date('2024-01-01') };

      // Act
      const result = taskService.validateTaskData(invalidTask);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.dueDate).toContain('Due date cannot be in the past');
    });
  });
});