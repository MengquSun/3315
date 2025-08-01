/**
 * API Integration Tests
 * Tests complete API workflows with real database interactions
 */

import request from 'supertest';
import { app } from '../../hw3/backend/src/app';
import { DatabaseService } from '../../hw3/backend/src/services/DatabaseService';
import {
    LoginRequest,
    Priority,
    SignupRequest,
    Task,
    TaskStatus,
    User
} from '../../hw3/shared/types';

describe('API Integration Tests', () => {
  let databaseService: DatabaseService;
  let authToken: string;
  let testUser: User;
  let testTask: Task;

  beforeAll(async () => {
    // Initialize test database connection
    databaseService = new DatabaseService();
    await databaseService.connect();
  });

  afterAll(async () => {
    // Clean up test data and close connections
    if (testUser) {
      await databaseService.delete('users', { id: testUser.id });
    }
    await databaseService.disconnect();
  });

  beforeEach(async () => {
    // Clean up any existing test data
    await databaseService.delete('users', { email: 'integration-test@example.com' });
    await databaseService.delete('tasks', { userId: testUser?.id });
  });

  describe('Authentication Flow', () => {
    describe('POST /api/auth/signup', () => {
      it('should create a new user successfully', async () => {
        // Arrange
        const signupData: SignupRequest = {
          email: 'integration-test@example.com',
          password: 'TestPassword123!'
        };

        // Act
        const response = await request(app)
          .post('/api/auth/signup')
          .send(signupData)
          .expect(201);

        // Assert
        expect(response.body.success).toBe(true);
        expect(response.body.data.user).toBeDefined();
        expect(response.body.data.user.email).toBe(signupData.email);
        expect(response.body.data.accessToken).toBeDefined();
        expect(response.body.data.refreshToken).toBeDefined();

        // Store for later tests
        testUser = response.body.data.user;
        authToken = response.body.data.accessToken;
      });

      it('should reject duplicate email registration', async () => {
        // Arrange
        const signupData: SignupRequest = {
          email: 'integration-test@example.com',
          password: 'TestPassword123!'
        };

        // Create first user
        await request(app)
          .post('/api/auth/signup')
          .send(signupData)
          .expect(201);

        // Act & Assert
        const response = await request(app)
          .post('/api/auth/signup')
          .send(signupData)
          .expect(409);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('already exists');
      });

      it('should validate email format', async () => {
        // Arrange
        const invalidSignupData = {
          email: 'invalid-email',
          password: 'TestPassword123!'
        };

        // Act & Assert
        const response = await request(app)
          .post('/api/auth/signup')
          .send(invalidSignupData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('email');
      });

      it('should validate password strength', async () => {
        // Arrange
        const weakPasswordData = {
          email: 'test@example.com',
          password: '123'
        };

        // Act & Assert
        const response = await request(app)
          .post('/api/auth/signup')
          .send(weakPasswordData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('password');
      });
    });

    describe('POST /api/auth/login', () => {
      beforeEach(async () => {
        // Create test user for login tests
        const signupData: SignupRequest = {
          email: 'integration-test@example.com',
          password: 'TestPassword123!'
        };

        const signupResponse = await request(app)
          .post('/api/auth/signup')
          .send(signupData)
          .expect(201);

        testUser = signupResponse.body.data.user;
      });

      it('should login with valid credentials', async () => {
        // Arrange
        const loginData: LoginRequest = {
          email: 'integration-test@example.com',
          password: 'TestPassword123!'
        };

        // Act
        const response = await request(app)
          .post('/api/auth/login')
          .send(loginData)
          .expect(200);

        // Assert
        expect(response.body.success).toBe(true);
        expect(response.body.data.user.email).toBe(loginData.email);
        expect(response.body.data.accessToken).toBeDefined();
        expect(response.body.data.refreshToken).toBeDefined();

        authToken = response.body.data.accessToken;
      });

      it('should reject invalid credentials', async () => {
        // Arrange
        const invalidLoginData: LoginRequest = {
          email: 'integration-test@example.com',
          password: 'WrongPassword'
        };

        // Act & Assert
        const response = await request(app)
          .post('/api/auth/login')
          .send(invalidLoginData)
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('credentials');
      });

      it('should reject non-existent user', async () => {
        // Arrange
        const nonExistentUserData: LoginRequest = {
          email: 'nonexistent@example.com',
          password: 'TestPassword123!'
        };

        // Act & Assert
        const response = await request(app)
          .post('/api/auth/login')
          .send(nonExistentUserData)
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('credentials');
      });
    });

    describe('GET /api/auth/profile', () => {
      beforeEach(async () => {
        await setupAuthenticatedUser();
      });

      it('should get user profile with valid token', async () => {
        // Act
        const response = await request(app)
          .get('/api/auth/profile')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        // Assert
        expect(response.body.success).toBe(true);
        expect(response.body.data.user.email).toBe(testUser.email);
        expect(response.body.data.user.id).toBe(testUser.id);
      });

      it('should reject request without token', async () => {
        // Act & Assert
        const response = await request(app)
          .get('/api/auth/profile')
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('token');
      });

      it('should reject request with invalid token', async () => {
        // Act & Assert
        const response = await request(app)
          .get('/api/auth/profile')
          .set('Authorization', 'Bearer invalid-token')
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('token');
      });
    });
  });

  describe('Task Management Flow', () => {
    beforeEach(async () => {
      await setupAuthenticatedUser();
    });

    describe('POST /api/tasks', () => {
      it('should create a new task successfully', async () => {
        // Arrange
        const taskData = {
          title: 'Integration Test Task',
          description: 'Test task for integration testing',
          dueDate: new Date('2025-03-01').toISOString(),
          priority: Priority.HIGH
        };

        // Act
        const response = await request(app)
          .post('/api/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .send(taskData)
          .expect(201);

        // Assert
        expect(response.body.success).toBe(true);
        expect(response.body.data.task.title).toBe(taskData.title);
        expect(response.body.data.task.description).toBe(taskData.description);
        expect(response.body.data.task.priority).toBe(taskData.priority);
        expect(response.body.data.task.status).toBe(TaskStatus.ACTIVE);
        expect(response.body.data.task.userId).toBe(testUser.id);

        testTask = response.body.data.task;
      });

      it('should create minimal task without optional fields', async () => {
        // Arrange
        const minimalTaskData = {
          title: 'Minimal Task',
          priority: Priority.LOW
        };

        // Act
        const response = await request(app)
          .post('/api/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .send(minimalTaskData)
          .expect(201);

        // Assert
        expect(response.body.success).toBe(true);
        expect(response.body.data.task.title).toBe(minimalTaskData.title);
        expect(response.body.data.task.priority).toBe(minimalTaskData.priority);
        expect(response.body.data.task.description).toBeUndefined();
        expect(response.body.data.task.dueDate).toBeUndefined();
      });

      it('should validate required fields', async () => {
        // Arrange
        const invalidTaskData = {
          description: 'Task without title',
          priority: Priority.MEDIUM
        };

        // Act & Assert
        const response = await request(app)
          .post('/api/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .send(invalidTaskData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('title');
      });

      it('should require authentication', async () => {
        // Arrange
        const taskData = {
          title: 'Unauthorized Task',
          priority: Priority.MEDIUM
        };

        // Act & Assert
        const response = await request(app)
          .post('/api/tasks')
          .send(taskData)
          .expect(401);

        expect(response.body.success).toBe(false);
      });
    });

    describe('GET /api/tasks', () => {
      beforeEach(async () => {
        // Create test tasks
        await createTestTask('First Task', Priority.HIGH);
        await createTestTask('Second Task', Priority.MEDIUM);
        await createTestTask('Third Task', Priority.LOW);
      });

      it('should get all user tasks', async () => {
        // Act
        const response = await request(app)
          .get('/api/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        // Assert
        expect(response.body.success).toBe(true);
        expect(response.body.data.tasks).toHaveLength(3);
        expect(response.body.data.total).toBe(3);
        
        // Verify all tasks belong to the user
        response.body.data.tasks.forEach((task: Task) => {
          expect(task.userId).toBe(testUser.id);
        });
      });

      it('should filter tasks by priority', async () => {
        // Act
        const response = await request(app)
          .get('/api/tasks')
          .query({ priority: 'high,medium' })
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        // Assert
        expect(response.body.success).toBe(true);
        expect(response.body.data.tasks).toHaveLength(2);
        
        const priorities = response.body.data.tasks.map((task: Task) => task.priority);
        expect(priorities).toContain(Priority.HIGH);
        expect(priorities).toContain(Priority.MEDIUM);
        expect(priorities).not.toContain(Priority.LOW);
      });

      it('should search tasks by title', async () => {
        // Act
        const response = await request(app)
          .get('/api/tasks')
          .query({ search: 'First' })
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        // Assert
        expect(response.body.success).toBe(true);
        expect(response.body.data.tasks).toHaveLength(1);
        expect(response.body.data.tasks[0].title).toContain('First');
      });

      it('should sort tasks by priority', async () => {
        // Act
        const response = await request(app)
          .get('/api/tasks')
          .query({ sortBy: 'priority', order: 'desc' })
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        // Assert
        expect(response.body.success).toBe(true);
        const tasks = response.body.data.tasks;
        expect(tasks[0].priority).toBe(Priority.HIGH);
        expect(tasks[1].priority).toBe(Priority.MEDIUM);
        expect(tasks[2].priority).toBe(Priority.LOW);
      });
    });

    describe('PUT /api/tasks/:id', () => {
      beforeEach(async () => {
        testTask = await createTestTask('Task to Update', Priority.MEDIUM);
      });

      it('should update task successfully', async () => {
        // Arrange
        const updateData = {
          title: 'Updated Task Title',
          priority: Priority.HIGH,
          description: 'Updated description'
        };

        // Act
        const response = await request(app)
          .put(`/api/tasks/${testTask.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(200);

        // Assert
        expect(response.body.success).toBe(true);
        expect(response.body.data.task.title).toBe(updateData.title);
        expect(response.body.data.task.priority).toBe(updateData.priority);
        expect(response.body.data.task.description).toBe(updateData.description);
        expect(response.body.data.task.updatedAt).not.toBe(testTask.updatedAt);
      });

      it('should handle partial updates', async () => {
        // Arrange
        const partialUpdate = {
          priority: Priority.HIGH
        };

        // Act
        const response = await request(app)
          .put(`/api/tasks/${testTask.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(partialUpdate)
          .expect(200);

        // Assert
        expect(response.body.success).toBe(true);
        expect(response.body.data.task.priority).toBe(Priority.HIGH);
        expect(response.body.data.task.title).toBe(testTask.title); // Unchanged
      });

      it('should prevent updating other users tasks', async () => {
        // Arrange - Create another user's task
        const otherUser = await createOtherUser();
        const otherUserTask = await createTaskForUser(otherUser.id, 'Other User Task');

        // Act & Assert
        const response = await request(app)
          .put(`/api/tasks/${otherUserTask.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ title: 'Hacked Task' })
          .expect(404);

        expect(response.body.success).toBe(false);
      });
    });

    describe('DELETE /api/tasks/:id', () => {
      beforeEach(async () => {
        testTask = await createTestTask('Task to Delete', Priority.MEDIUM);
      });

      it('should delete task successfully', async () => {
        // Act
        const response = await request(app)
          .delete(`/api/tasks/${testTask.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        // Assert
        expect(response.body.success).toBe(true);

        // Verify task is soft deleted (not visible in normal queries)
        const getResponse = await request(app)
          .get('/api/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        const visibleTasks = getResponse.body.data.tasks.filter(
          (task: Task) => task.id === testTask.id
        );
        expect(visibleTasks).toHaveLength(0);
      });

      it('should prevent deleting other users tasks', async () => {
        // Arrange
        const otherUser = await createOtherUser();
        const otherUserTask = await createTaskForUser(otherUser.id, 'Other User Task');

        // Act & Assert
        const response = await request(app)
          .delete(`/api/tasks/${otherUserTask.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);

        expect(response.body.success).toBe(false);
      });
    });

    describe('PATCH /api/tasks/:id/complete', () => {
      beforeEach(async () => {
        testTask = await createTestTask('Task to Complete', Priority.MEDIUM);
      });

      it('should mark task as complete', async () => {
        // Act
        const response = await request(app)
          .patch(`/api/tasks/${testTask.id}/complete`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        // Assert
        expect(response.body.success).toBe(true);
        expect(response.body.data.task.status).toBe(TaskStatus.COMPLETED);
        expect(response.body.data.task.completedAt).toBeDefined();
      });

      it('should handle already completed task', async () => {
        // Arrange - First complete the task
        await request(app)
          .patch(`/api/tasks/${testTask.id}/complete`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        // Act & Assert - Try to complete again
        const response = await request(app)
          .patch(`/api/tasks/${testTask.id}/complete`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('already completed');
      });
    });
  });

  // Helper functions
  async function setupAuthenticatedUser() {
    const signupData: SignupRequest = {
      email: 'integration-test@example.com',
      password: 'TestPassword123!'
    };

    const response = await request(app)
      .post('/api/auth/signup')
      .send(signupData)
      .expect(201);

    testUser = response.body.data.user;
    authToken = response.body.data.accessToken;
  }

  async function createTestTask(title: string, priority: Priority): Promise<Task> {
    const taskData = {
      title,
      priority,
      description: `Description for ${title}`
    };

    const response = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .send(taskData)
      .expect(201);

    return response.body.data.task;
  }

  async function createOtherUser(): Promise<User> {
    const otherUserData: SignupRequest = {
      email: 'other-user@example.com',
      password: 'TestPassword123!'
    };

    const response = await request(app)
      .post('/api/auth/signup')
      .send(otherUserData)
      .expect(201);

    return response.body.data.user;
  }

  async function createTaskForUser(userId: string, title: string): Promise<Task> {
    const taskData = {
      userId,
      title,
      priority: Priority.MEDIUM,
      status: TaskStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return await databaseService.create('tasks', taskData);
  }
});