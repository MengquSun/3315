/**
 * Unit tests for TaskService
 * Tests task management client-side logic and API integration
 */

import { apiClient } from '../../../hw3/frontend/src/services/api';
import { taskService } from '../../../hw3/frontend/src/services/taskService';
import {
    CreateTaskRequest,
    Priority,
    SortCriteria,
    Task,
    TaskFilter,
    TaskStatus,
    UpdateTaskRequest
} from '../../../hw3/shared/types';

// Mock the API client
jest.mock('../../../hw3/frontend/src/services/api');
const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('TaskService', () => {
  const mockTask: Task = {
    id: 'task123',
    userId: 'user123',
    title: 'Test Task',
    description: 'Test task description',
    dueDate: new Date('2025-02-01'),
    priority: Priority.MEDIUM,
    status: TaskStatus.ACTIVE,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  };

  const mockTasks: Task[] = [
    mockTask,
    {
      ...mockTask,
      id: 'task456',
      title: 'Another Task',
      priority: Priority.HIGH
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTasks', () => {
    it('should get all tasks successfully', async () => {
      // Arrange
      mockedApiClient.get.mockResolvedValue({
        data: {
          success: true,
          data: { tasks: mockTasks, total: mockTasks.length }
        }
      });

      // Act
      const result = await taskService.getTasks();

      // Assert
      expect(result.tasks).toEqual(mockTasks);
      expect(result.total).toBe(mockTasks.length);
      expect(mockedApiClient.get).toHaveBeenCalledWith('/api/tasks', {
        params: {}
      });
    });

    it('should get tasks with filters', async () => {
      // Arrange
      const filter: TaskFilter = {
        status: [TaskStatus.ACTIVE],
        priority: [Priority.HIGH, Priority.MEDIUM],
        search: 'important'
      };
      mockedApiClient.get.mockResolvedValue({
        data: {
          success: true,
          data: { tasks: [mockTask], total: 1 }
        }
      });

      // Act
      const result = await taskService.getTasks(filter);

      // Assert
      expect(result.tasks).toEqual([mockTask]);
      expect(mockedApiClient.get).toHaveBeenCalledWith('/api/tasks', {
        params: {
          status: 'active',
          priority: 'high,medium',
          search: 'important'
        }
      });
    });

    it('should get tasks with sorting', async () => {
      // Arrange
      const sort: SortCriteria = {
        field: 'dueDate',
        order: 'asc'
      };
      mockedApiClient.get.mockResolvedValue({
        data: {
          success: true,
          data: { tasks: mockTasks, total: mockTasks.length }
        }
      });

      // Act
      await taskService.getTasks(undefined, sort);

      // Assert
      expect(mockedApiClient.get).toHaveBeenCalledWith('/api/tasks', {
        params: {
          sortBy: 'dueDate',
          order: 'asc'
        }
      });
    });

    it('should handle empty task list', async () => {
      // Arrange
      mockedApiClient.get.mockResolvedValue({
        data: {
          success: true,
          data: { tasks: [], total: 0 }
        }
      });

      // Act
      const result = await taskService.getTasks();

      // Assert
      expect(result.tasks).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should handle API errors', async () => {
      // Arrange
      const errorResponse = {
        response: {
          status: 500,
          data: {
            success: false,
            error: 'Internal server error'
          }
        }
      };
      mockedApiClient.get.mockRejectedValue(errorResponse);

      // Act & Assert
      await expect(taskService.getTasks()).rejects.toEqual(errorResponse);
    });
  });

  describe('getTaskById', () => {
    it('should get task by id successfully', async () => {
      // Arrange
      const taskId = 'task123';
      mockedApiClient.get.mockResolvedValue({
        data: {
          success: true,
          data: { task: mockTask }
        }
      });

      // Act
      const result = await taskService.getTaskById(taskId);

      // Assert
      expect(result).toEqual(mockTask);
      expect(mockedApiClient.get).toHaveBeenCalledWith(`/api/tasks/${taskId}`);
    });

    it('should handle task not found', async () => {
      // Arrange
      const taskId = 'nonexistent';
      const errorResponse = {
        response: {
          status: 404,
          data: {
            success: false,
            error: 'Task not found'
          }
        }
      };
      mockedApiClient.get.mockRejectedValue(errorResponse);

      // Act & Assert
      await expect(taskService.getTaskById(taskId)).rejects.toEqual(errorResponse);
    });
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
      const newTask = { ...mockTask, ...createTaskData, id: 'new-task-id' };
      mockedApiClient.post.mockResolvedValue({
        data: {
          success: true,
          data: { task: newTask }
        }
      });

      // Act
      const result = await taskService.createTask(createTaskData);

      // Assert
      expect(result).toEqual(newTask);
      expect(mockedApiClient.post).toHaveBeenCalledWith('/api/tasks', createTaskData);
    });

    it('should create minimal task without optional fields', async () => {
      // Arrange
      const minimalTask: CreateTaskRequest = {
        title: 'Minimal Task',
        priority: Priority.LOW
      };
      const createdTask = { ...mockTask, ...minimalTask };
      mockedApiClient.post.mockResolvedValue({
        data: {
          success: true,
          data: { task: createdTask }
        }
      });

      // Act
      const result = await taskService.createTask(minimalTask);

      // Assert
      expect(result).toEqual(createdTask);
      expect(mockedApiClient.post).toHaveBeenCalledWith('/api/tasks', minimalTask);
    });

    it('should handle validation errors', async () => {
      // Arrange
      const invalidTask: CreateTaskRequest = {
        title: '',
        priority: Priority.MEDIUM
      };
      const errorResponse = {
        response: {
          status: 400,
          data: {
            success: false,
            error: 'Title is required'
          }
        }
      };
      mockedApiClient.post.mockRejectedValue(errorResponse);

      // Act & Assert
      await expect(taskService.createTask(invalidTask)).rejects.toEqual(errorResponse);
    });

    it('should validate task data before API call', async () => {
      // Arrange
      const invalidTask: CreateTaskRequest = {
        title: '',
        priority: Priority.MEDIUM
      };

      // Act & Assert
      await expect(taskService.createTask(invalidTask)).rejects.toThrow('Title is required');
      expect(mockedApiClient.post).not.toHaveBeenCalled();
    });
  });

  describe('updateTask', () => {
    const updateData: UpdateTaskRequest = {
      title: 'Updated Task',
      priority: Priority.HIGH
    };

    it('should update task successfully', async () => {
      // Arrange
      const updatedTask = { ...mockTask, ...updateData };
      mockedApiClient.put.mockResolvedValue({
        data: {
          success: true,
          data: { task: updatedTask }
        }
      });

      // Act
      const result = await taskService.updateTask('task123', updateData);

      // Assert
      expect(result).toEqual(updatedTask);
      expect(mockedApiClient.put).toHaveBeenCalledWith('/api/tasks/task123', updateData);
    });

    it('should handle partial updates', async () => {
      // Arrange
      const partialUpdate: UpdateTaskRequest = {
        title: 'Only Title Updated'
      };
      const updatedTask = { ...mockTask, title: 'Only Title Updated' };
      mockedApiClient.put.mockResolvedValue({
        data: {
          success: true,
          data: { task: updatedTask }
        }
      });

      // Act
      const result = await taskService.updateTask('task123', partialUpdate);

      // Assert
      expect(result).toEqual(updatedTask);
      expect(mockedApiClient.put).toHaveBeenCalledWith('/api/tasks/task123', partialUpdate);
    });

    it('should handle task not found for update', async () => {
      // Arrange
      const errorResponse = {
        response: {
          status: 404,
          data: {
            success: false,
            error: 'Task not found'
          }
        }
      };
      mockedApiClient.put.mockRejectedValue(errorResponse);

      // Act & Assert
      await expect(taskService.updateTask('nonexistent', updateData)).rejects.toEqual(errorResponse);
    });
  });

  describe('deleteTask', () => {
    it('should delete task successfully', async () => {
      // Arrange
      mockedApiClient.delete.mockResolvedValue({
        data: {
          success: true,
          message: 'Task deleted successfully'
        }
      });

      // Act
      const result = await taskService.deleteTask('task123');

      // Assert
      expect(result).toBe(true);
      expect(mockedApiClient.delete).toHaveBeenCalledWith('/api/tasks/task123');
    });

    it('should handle task not found for deletion', async () => {
      // Arrange
      const errorResponse = {
        response: {
          status: 404,
          data: {
            success: false,
            error: 'Task not found'
          }
        }
      };
      mockedApiClient.delete.mockRejectedValue(errorResponse);

      // Act & Assert
      await expect(taskService.deleteTask('nonexistent')).rejects.toEqual(errorResponse);
    });
  });

  describe('markTaskComplete', () => {
    it('should mark task as complete successfully', async () => {
      // Arrange
      const completedTask = {
        ...mockTask,
        status: TaskStatus.COMPLETED,
        completedAt: new Date()
      };
      mockedApiClient.patch.mockResolvedValue({
        data: {
          success: true,
          data: { task: completedTask }
        }
      });

      // Act
      const result = await taskService.markTaskComplete('task123');

      // Assert
      expect(result).toEqual(completedTask);
      expect(mockedApiClient.patch).toHaveBeenCalledWith('/api/tasks/task123/complete');
    });

    it('should handle already completed task', async () => {
      // Arrange
      const errorResponse = {
        response: {
          status: 400,
          data: {
            success: false,
            error: 'Task already completed'
          }
        }
      };
      mockedApiClient.patch.mockRejectedValue(errorResponse);

      // Act & Assert
      await expect(taskService.markTaskComplete('task123')).rejects.toEqual(errorResponse);
    });
  });

  describe('getCompletedTasks', () => {
    it('should get completed tasks successfully', async () => {
      // Arrange
      const completedTasks = [
        { ...mockTask, status: TaskStatus.COMPLETED }
      ];
      mockedApiClient.get.mockResolvedValue({
        data: {
          success: true,
          data: { tasks: completedTasks, total: 1 }
        }
      });

      // Act
      const result = await taskService.getCompletedTasks();

      // Assert
      expect(result.tasks).toEqual(completedTasks);
      expect(mockedApiClient.get).toHaveBeenCalledWith('/api/tasks/completed');
    });
  });

  describe('searchTasks', () => {
    it('should search tasks successfully', async () => {
      // Arrange
      const searchQuery = 'important task';
      mockedApiClient.get.mockResolvedValue({
        data: {
          success: true,
          data: { tasks: [mockTask], total: 1, query: searchQuery }
        }
      });

      // Act
      const result = await taskService.searchTasks(searchQuery);

      // Assert
      expect(result.tasks).toEqual([mockTask]);
      expect(result.query).toBe(searchQuery);
      expect(mockedApiClient.get).toHaveBeenCalledWith('/api/tasks/search', {
        params: { q: searchQuery }
      });
    });

    it('should handle empty search results', async () => {
      // Arrange
      const searchQuery = 'nonexistent';
      mockedApiClient.get.mockResolvedValue({
        data: {
          success: true,
          data: { tasks: [], total: 0, query: searchQuery }
        }
      });

      // Act
      const result = await taskService.searchTasks(searchQuery);

      // Assert
      expect(result.tasks).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should handle empty search query', async () => {
      // Act & Assert
      await expect(taskService.searchTasks('')).rejects.toThrow('Search query cannot be empty');
      expect(mockedApiClient.get).not.toHaveBeenCalled();
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
      mockedApiClient.get.mockResolvedValue({
        data: {
          success: true,
          data: { counts: mockCounts }
        }
      });

      // Act
      const result = await taskService.getTaskCounts();

      // Assert
      expect(result).toEqual(mockCounts);
      expect(mockedApiClient.get).toHaveBeenCalledWith('/api/tasks/counts');
    });
  });

  describe('Client-side validation', () => {
    describe('validateTaskData', () => {
      it('should validate correct task data', () => {
        // Arrange
        const validTask: CreateTaskRequest = {
          title: 'Valid Task',
          description: 'Valid description',
          dueDate: '2025-03-01',
          priority: Priority.MEDIUM
        };

        // Act & Assert
        expect(() => taskService.validateTaskData(validTask)).not.toThrow();
      });

      it('should reject empty title', () => {
        // Arrange
        const invalidTask: CreateTaskRequest = {
          title: '',
          priority: Priority.MEDIUM
        };

        // Act & Assert
        expect(() => taskService.validateTaskData(invalidTask)).toThrow('Title is required');
      });

      it('should reject very long title', () => {
        // Arrange
        const invalidTask: CreateTaskRequest = {
          title: 'a'.repeat(201),
          priority: Priority.MEDIUM
        };

        // Act & Assert
        expect(() => taskService.validateTaskData(invalidTask)).toThrow('Title must be less than 200 characters');
      });

      it('should reject past due dates', () => {
        // Arrange
        const invalidTask: CreateTaskRequest = {
          title: 'Valid Task',
          dueDate: '2024-01-01',
          priority: Priority.MEDIUM
        };

        // Act & Assert
        expect(() => taskService.validateTaskData(invalidTask)).toThrow('Due date cannot be in the past');
      });

      it('should reject invalid priority', () => {
        // Arrange
        const invalidTask: CreateTaskRequest = {
          title: 'Valid Task',
          priority: 'invalid' as Priority
        };

        // Act & Assert
        expect(() => taskService.validateTaskData(invalidTask)).toThrow('Invalid priority value');
      });
    });

    describe('formatTasksForDisplay', () => {
      it('should format tasks with due dates correctly', () => {
        // Arrange
        const tasksWithDates = [
          { ...mockTask, dueDate: new Date('2025-02-01') }
        ];

        // Act
        const formatted = taskService.formatTasksForDisplay(tasksWithDates);

        // Assert
        expect(formatted[0].formattedDueDate).toBeDefined();
        expect(formatted[0].isOverdue).toBeDefined();
      });

      it('should handle tasks without due dates', () => {
        // Arrange
        const tasksWithoutDates = [
          { ...mockTask, dueDate: undefined }
        ];

        // Act
        const formatted = taskService.formatTasksForDisplay(tasksWithoutDates);

        // Assert
        expect(formatted[0].formattedDueDate).toBeNull();
        expect(formatted[0].isOverdue).toBe(false);
      });
    });

    describe('sortTasks', () => {
      const task1 = { ...mockTask, id: '1', title: 'A Task', priority: Priority.HIGH, dueDate: new Date('2025-02-01') };
      const task2 = { ...mockTask, id: '2', title: 'B Task', priority: Priority.LOW, dueDate: new Date('2025-01-01') };

      it('should sort by title ascending', () => {
        // Act
        const sorted = taskService.sortTasks([task2, task1], { field: 'title', order: 'asc' });

        // Assert
        expect(sorted[0].title).toBe('A Task');
        expect(sorted[1].title).toBe('B Task');
      });

      it('should sort by priority descending', () => {
        // Act
        const sorted = taskService.sortTasks([task2, task1], { field: 'priority', order: 'desc' });

        // Assert
        expect(sorted[0].priority).toBe(Priority.HIGH);
        expect(sorted[1].priority).toBe(Priority.LOW);
      });

      it('should sort by due date ascending', () => {
        // Act
        const sorted = taskService.sortTasks([task1, task2], { field: 'dueDate', order: 'asc' });

        // Assert
        expect(sorted[0].dueDate).toEqual(new Date('2025-01-01'));
        expect(sorted[1].dueDate).toEqual(new Date('2025-02-01'));
      });
    });
  });
});