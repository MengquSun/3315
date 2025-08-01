/**
 * Task Routes
 * Defines all task management API endpoints
 */

import { Router } from 'express';
import { TaskController } from '../controllers/TaskController';
import { createAuthMiddleware } from '../middleware/authMiddleware';
import { ValidationMiddleware } from '../middleware/validationMiddleware';
import { DatabaseService } from '../services/DatabaseService';

// Create router instance
export const taskRoutes = Router();

// Create database service instance
const databaseService = new DatabaseService();

// Create controller and middleware instances
const taskController = new TaskController(databaseService);
const authMiddleware = createAuthMiddleware(databaseService);

/**
 * All task routes require authentication
 */
taskRoutes.use(authMiddleware.authenticate);

/**
 * Task management endpoints
 */

// Get task statistics (must come before /:id route)
taskRoutes.get(
  '/stats',
  taskController.getTaskStats
);

// Get completed tasks (must come before /:id route)
taskRoutes.get(
  '/completed',
  ValidationMiddleware.validateTaskQuery,
  taskController.getCompletedTasks
);

// Get all tasks for user
taskRoutes.get(
  '/',
  ValidationMiddleware.validateTaskQuery,
  taskController.getTasks
);

// Get specific task by ID
taskRoutes.get(
  '/:id',
  ValidationMiddleware.validateObjectId('id'),
  taskController.getTask
);

// Create new task
taskRoutes.post(
  '/',
  ValidationMiddleware.sanitizeInput,
  ValidationMiddleware.validateTaskInput,
  taskController.createTask
);

// Update existing task
taskRoutes.put(
  '/:id',
  ValidationMiddleware.validateObjectId('id'),
  ValidationMiddleware.sanitizeInput,
  ValidationMiddleware.validateTaskUpdateInput,
  taskController.updateTask
);

// Mark task as complete
taskRoutes.patch(
  '/:id/complete',
  ValidationMiddleware.validateObjectId('id'),
  taskController.completeTask
);

// Delete task
taskRoutes.delete(
  '/:id',
  ValidationMiddleware.validateObjectId('id'),
  taskController.deleteTask
);

/**
 * Health check for task service
 */
taskRoutes.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Task service is healthy',
    timestamp: new Date().toISOString()
  });
});

export default taskRoutes;