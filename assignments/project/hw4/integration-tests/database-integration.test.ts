/**
 * Database Integration Tests
 * Tests database operations with Firebase Firestore
 */

import { DatabaseService } from '../../hw3/backend/src/services/DatabaseService';
import {
    Priority,
    TaskStatus,
    UserSchema
} from '../../hw3/shared/types';

describe('Database Integration Tests', () => {
  let databaseService: DatabaseService;
  let testUserId: string;
  let testTaskId: string;

  beforeAll(async () => {
    // Initialize database connection
    databaseService = new DatabaseService();
    await databaseService.connect();
  });

  afterAll(async () => {
    // Clean up test data
    if (testUserId) {
      await databaseService.delete('users', { id: testUserId });
    }
    if (testTaskId) {
      await databaseService.delete('tasks', { id: testTaskId });
    }
    
    // Close database connection
    await databaseService.disconnect();
  });

  beforeEach(async () => {
    // Clean up any existing test data
    await databaseService.delete('users', { email: 'db-test@example.com' });
    await databaseService.delete('tasks', { title: 'Database Test Task' });
  });

  describe('Connection Management', () => {
    it('should connect to database successfully', async () => {
      // Act
      const isConnected = await databaseService.connect();

      // Assert
      expect(isConnected).toBe(true);
    });

    it('should get database statistics', async () => {
      // Act
      const stats = await databaseService.getStats();

      // Assert
      expect(stats).toBeDefined();
      expect(stats.connectionCount).toBeGreaterThanOrEqual(0);
      expect(stats.uptime).toBeGreaterThan(0);
      expect(stats.version).toBeDefined();
    });

    it('should handle multiple connection attempts gracefully', async () => {
      // Act
      const connection1 = await databaseService.connect();
      const connection2 = await databaseService.connect();

      // Assert
      expect(connection1).toBe(true);
      expect(connection2).toBe(true);
    });
  });

  describe('User Collection Operations', () => {
    const testUser: UserSchema = {
      id: 'test-user-id',
      email: 'db-test@example.com',
      passwordHash: 'hashed-password',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    describe('CREATE operations', () => {
      it('should create user successfully', async () => {
        // Act
        const createdUser = await databaseService.create('users', testUser);

        // Assert
        expect(createdUser).toBeDefined();
        expect(createdUser.email).toBe(testUser.email);
        expect(createdUser.id).toBeDefined();
        
        testUserId = createdUser.id;
      });

      it('should generate unique ID if not provided', async () => {
        // Arrange
        const userWithoutId = { ...testUser };
        delete userWithoutId.id;

        // Act
        const createdUser = await databaseService.create('users', userWithoutId);

        // Assert
        expect(createdUser.id).toBeDefined();
        expect(createdUser.id).toMatch(/^[a-zA-Z0-9]+$/);
        
        // Clean up
        await databaseService.delete('users', { id: createdUser.id });
      });

      it('should set timestamps automatically', async () => {
        // Arrange
        const userWithoutTimestamps = {
          email: 'timestamp-test@example.com',
          passwordHash: 'hashed-password',
          isActive: true
        };

        // Act
        const createdUser = await databaseService.create('users', userWithoutTimestamps);

        // Assert
        expect(createdUser.createdAt).toBeDefined();
        expect(createdUser.updatedAt).toBeDefined();
        expect(createdUser.createdAt).toBeInstanceOf(Date);
        expect(createdUser.updatedAt).toBeInstanceOf(Date);
        
        // Clean up
        await databaseService.delete('users', { id: createdUser.id });
      });
    });

    describe('READ operations', () => {
      beforeEach(async () => {
        // Create test user for read operations
        const createdUser = await databaseService.create('users', testUser);
        testUserId = createdUser.id;
      });

      it('should find user by id', async () => {
        // Act
        const foundUser = await databaseService.findOne('users', { id: testUserId });

        // Assert
        expect(foundUser).toBeDefined();
        expect(foundUser!.id).toBe(testUserId);
        expect(foundUser!.email).toBe(testUser.email);
      });

      it('should find user by email', async () => {
        // Act
        const foundUser = await databaseService.findOne('users', { email: testUser.email });

        // Assert
        expect(foundUser).toBeDefined();
        expect(foundUser!.email).toBe(testUser.email);
        expect(foundUser!.id).toBe(testUserId);
      });

      it('should return null for non-existent user', async () => {
        // Act
        const foundUser = await databaseService.findOne('users', { id: 'non-existent-id' });

        // Assert
        expect(foundUser).toBeNull();
      });

      it('should find multiple users with criteria', async () => {
        // Arrange
        await databaseService.create('users', {
          ...testUser,
          id: 'second-user',
          email: 'second-user@example.com'
        });

        // Act
        const users = await databaseService.find('users', { isActive: true });

        // Assert
        expect(users).toBeDefined();
        expect(users.length).toBeGreaterThanOrEqual(2);
        
        // Clean up
        await databaseService.delete('users', { id: 'second-user' });
      });

      it('should support query options (limit, sort)', async () => {
        // Act
        const users = await databaseService.find(
          'users', 
          { isActive: true },
          { limit: 1, sort: { createdAt: -1 } }
        );

        // Assert
        expect(users).toBeDefined();
        expect(users.length).toBeLessThanOrEqual(1);
      });
    });

    describe('UPDATE operations', () => {
      beforeEach(async () => {
        const createdUser = await databaseService.create('users', testUser);
        testUserId = createdUser.id;
      });

      it('should update user successfully', async () => {
        // Arrange
        const updateData = {
          email: 'updated-email@example.com',
          isActive: false
        };

        // Act
        const updatedUser = await databaseService.update(
          'users',
          { id: testUserId },
          updateData
        );

        // Assert
        expect(updatedUser).toBeDefined();
        expect(updatedUser!.email).toBe(updateData.email);
        expect(updatedUser!.isActive).toBe(updateData.isActive);
        expect(updatedUser!.updatedAt).not.toEqual(testUser.updatedAt);
      });

      it('should update only specified fields', async () => {
        // Arrange
        const partialUpdate = { isActive: false };
        const originalEmail = testUser.email;

        // Act
        const updatedUser = await databaseService.update(
          'users',
          { id: testUserId },
          partialUpdate
        );

        // Assert
        expect(updatedUser!.isActive).toBe(false);
        expect(updatedUser!.email).toBe(originalEmail); // Unchanged
      });

      it('should update updatedAt timestamp automatically', async () => {
        // Arrange
        const originalUpdatedAt = testUser.updatedAt;
        await new Promise(resolve => setTimeout(resolve, 10)); // Small delay

        // Act
        const updatedUser = await databaseService.update(
          'users',
          { id: testUserId },
          { isActive: false }
        );

        // Assert
        expect(updatedUser!.updatedAt).not.toEqual(originalUpdatedAt);
        expect(updatedUser!.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      });

      it('should handle update of non-existent record', async () => {
        // Act
        const updatedUser = await databaseService.update(
          'users',
          { id: 'non-existent' },
          { isActive: false }
        );

        // Assert
        expect(updatedUser).toBeNull();
      });
    });

    describe('DELETE operations', () => {
      beforeEach(async () => {
        const createdUser = await databaseService.create('users', testUser);
        testUserId = createdUser.id;
      });

      it('should delete user successfully', async () => {
        // Act
        const deleted = await databaseService.delete('users', { id: testUserId });

        // Assert
        expect(deleted).toBe(true);

        // Verify user is deleted
        const foundUser = await databaseService.findOne('users', { id: testUserId });
        expect(foundUser).toBeNull();
      });

      it('should delete multiple users by criteria', async () => {
        // Arrange
        await databaseService.create('users', {
          ...testUser,
          id: 'user-to-delete-1',
          email: 'delete1@example.com'
        });
        await databaseService.create('users', {
          ...testUser,
          id: 'user-to-delete-2',
          email: 'delete2@example.com'
        });

        // Act
        const deleted = await databaseService.delete('users', { 
          email: { $in: ['delete1@example.com', 'delete2@example.com'] }
        });

        // Assert
        expect(deleted).toBe(true);

        // Verify users are deleted
        const user1 = await databaseService.findOne('users', { id: 'user-to-delete-1' });
        const user2 = await databaseService.findOne('users', { id: 'user-to-delete-2' });
        expect(user1).toBeNull();
        expect(user2).toBeNull();
      });

      it('should handle delete of non-existent record', async () => {
        // Act
        const deleted = await databaseService.delete('users', { id: 'non-existent' });

        // Assert
        expect(deleted).toBe(false);
      });
    });
  });

  describe('Task Collection Operations', () => {
    let userId: string;

    beforeEach(async () => {
      // Create a user for task operations
      const user = await databaseService.create('users', {
        email: 'task-user@example.com',
        passwordHash: 'password',
        isActive: true
      });
      userId = user.id;
    });

    afterEach(async () => {
      // Clean up user and their tasks
      await databaseService.delete('tasks', { userId });
      await databaseService.delete('users', { id: userId });
    });

    const testTask = {
      userId: '', // Will be set in tests
      title: 'Database Test Task',
      description: 'Test task for database operations',
      dueDate: new Date('2025-03-01'),
      priority: Priority.HIGH,
      status: TaskStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should create task with user relationship', async () => {
      // Arrange
      const taskData = { ...testTask, userId };

      // Act
      const createdTask = await databaseService.create('tasks', taskData);

      // Assert
      expect(createdTask).toBeDefined();
      expect(createdTask.userId).toBe(userId);
      expect(createdTask.title).toBe(testTask.title);
      expect(createdTask.status).toBe(TaskStatus.ACTIVE);
      
      testTaskId = createdTask.id;
    });

    it('should find tasks by user', async () => {
      // Arrange
      await databaseService.create('tasks', { ...testTask, userId, title: 'Task 1' });
      await databaseService.create('tasks', { ...testTask, userId, title: 'Task 2' });

      // Act
      const userTasks = await databaseService.find('tasks', { userId });

      // Assert
      expect(userTasks).toBeDefined();
      expect(userTasks.length).toBe(2);
      userTasks.forEach(task => {
        expect(task.userId).toBe(userId);
      });
    });

    it('should support complex queries with multiple conditions', async () => {
      // Arrange
      await databaseService.create('tasks', {
        ...testTask,
        userId,
        title: 'High Priority Active Task',
        priority: Priority.HIGH,
        status: TaskStatus.ACTIVE
      });
      await databaseService.create('tasks', {
        ...testTask,
        userId,
        title: 'Low Priority Active Task',
        priority: Priority.LOW,
        status: TaskStatus.ACTIVE
      });
      await databaseService.create('tasks', {
        ...testTask,
        userId,
        title: 'High Priority Completed Task',
        priority: Priority.HIGH,
        status: TaskStatus.COMPLETED
      });

      // Act
      const highPriorityActiveTasks = await databaseService.find('tasks', {
        userId,
        priority: Priority.HIGH,
        status: TaskStatus.ACTIVE
      });

      // Assert
      expect(highPriorityActiveTasks).toBeDefined();
      expect(highPriorityActiveTasks.length).toBe(1);
      expect(highPriorityActiveTasks[0].title).toBe('High Priority Active Task');
    });

    it('should support text search operations', async () => {
      // Arrange
      await databaseService.create('tasks', {
        ...testTask,
        userId,
        title: 'Important meeting preparation',
        description: 'Prepare slides for the client meeting'
      });
      await databaseService.create('tasks', {
        ...testTask,
        userId,
        title: 'Grocery shopping',
        description: 'Buy fruits and vegetables'
      });

      // Act
      const searchResults = await databaseService.find('tasks', {
        userId,
        $or: [
          { title: { $regex: 'meeting', $options: 'i' } },
          { description: { $regex: 'meeting', $options: 'i' } }
        ]
      });

      // Assert
      expect(searchResults).toBeDefined();
      expect(searchResults.length).toBe(1);
      expect(searchResults[0].title).toContain('meeting');
    });

    it('should support sorting and pagination', async () => {
      // Arrange
      const now = new Date();
      await databaseService.create('tasks', {
        ...testTask,
        userId,
        title: 'Task A',
        createdAt: new Date(now.getTime() - 3000)
      });
      await databaseService.create('tasks', {
        ...testTask,
        userId,
        title: 'Task B',
        createdAt: new Date(now.getTime() - 2000)
      });
      await databaseService.create('tasks', {
        ...testTask,
        userId,
        title: 'Task C',
        createdAt: new Date(now.getTime() - 1000)
      });

      // Act - Get latest 2 tasks
      const latestTasks = await databaseService.find(
        'tasks',
        { userId },
        {
          sort: { createdAt: -1 },
          limit: 2
        }
      );

      // Assert
      expect(latestTasks).toBeDefined();
      expect(latestTasks.length).toBe(2);
      expect(latestTasks[0].title).toBe('Task C');
      expect(latestTasks[1].title).toBe('Task B');
    });
  });

  describe('Transaction Operations', () => {
    it('should handle atomic operations', async () => {
      // Arrange
      const userData = {
        email: 'transaction-user@example.com',
        passwordHash: 'password',
        isActive: true
      };

      // Act - Create user and their first task atomically
      let userId: string;
      let taskId: string;

      try {
        const user = await databaseService.create('users', userData);
        userId = user.id;

        const task = await databaseService.create('tasks', {
          userId: user.id,
          title: 'First Task',
          priority: Priority.MEDIUM,
          status: TaskStatus.ACTIVE
        });
        taskId = task.id;

        // Assert
        expect(user).toBeDefined();
        expect(task).toBeDefined();
        expect(task.userId).toBe(user.id);

        // Verify both records exist
        const foundUser = await databaseService.findOne('users', { id: user.id });
        const foundTask = await databaseService.findOne('tasks', { id: task.id });
        expect(foundUser).toBeDefined();
        expect(foundTask).toBeDefined();

      } finally {
        // Clean up
        if (taskId) await databaseService.delete('tasks', { id: taskId });
        if (userId) await databaseService.delete('users', { id: userId });
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed queries gracefully', async () => {
      // Act & Assert
      await expect(
        databaseService.findOne('users', { id: null as any })
      ).rejects.toThrow();
    });

    it('should handle database connection errors', async () => {
      // Arrange
      const disconnectedService = new DatabaseService();
      // Don't connect

      // Act & Assert
      await expect(
        disconnectedService.findOne('users', { id: 'test' })
      ).rejects.toThrow();
    });

    it('should validate collection names', async () => {
      // Act & Assert
      await expect(
        databaseService.findOne('invalid_collection', { id: 'test' })
      ).rejects.toThrow();
    });
  });

  describe('Performance', () => {
    it('should handle concurrent operations', async () => {
      // Arrange
      const operations = Array.from({ length: 10 }, (_, i) => 
        databaseService.create('users', {
          email: `concurrent-${i}@example.com`,
          passwordHash: 'password',
          isActive: true
        })
      );

      // Act
      const results = await Promise.all(operations);

      // Assert
      expect(results).toHaveLength(10);
      results.forEach((user, index) => {
        expect(user.email).toBe(`concurrent-${index}@example.com`);
      });

      // Clean up
      await Promise.all(
        results.map(user => databaseService.delete('users', { id: user.id }))
      );
    });

    it('should handle large result sets efficiently', async () => {
      // This test would be more meaningful with a larger dataset
      // For now, just verify the query doesn't crash
      
      // Act
      const startTime = Date.now();
      const users = await databaseService.find('users', {}, { limit: 1000 });
      const endTime = Date.now();

      // Assert
      expect(users).toBeDefined();
      expect(Array.isArray(users)).toBe(true);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});