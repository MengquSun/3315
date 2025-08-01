/**
 * Authentication Routes
 * Defines all authentication-related API endpoints
 */

import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { createAuthMiddleware } from '../middleware/authMiddleware';
import { ValidationMiddleware } from '../middleware/validationMiddleware';
import { DatabaseService } from '../services/DatabaseService';

// Create router instance
export const authRoutes = Router();

// Create database service instance
const databaseService = new DatabaseService();

// Create controller and middleware instances
const authController = new AuthController(databaseService);
const authMiddleware = createAuthMiddleware(databaseService);

/**
 * Public routes (no authentication required)
 */

// User registration
authRoutes.post(
  '/signup',
  ValidationMiddleware.sanitizeInput,
  ValidationMiddleware.validateAuthInput,
  authController.signup
);

// User login
authRoutes.post(
  '/login',
  ValidationMiddleware.sanitizeInput,
  ValidationMiddleware.validateAuthInput,
  authController.login
);

// Refresh access token
authRoutes.post(
  '/refresh',
  ValidationMiddleware.sanitizeInput,
  authController.refresh
);

// Password reset request
authRoutes.post(
  '/reset-password',
  ValidationMiddleware.sanitizeInput,
  authController.resetPassword
);

// Token validation (for client-side checks)
authRoutes.get(
  '/validate',
  authController.validateToken
);

/**
 * Protected routes (authentication required)
 */

// User logout
authRoutes.post(
  '/logout',
  authMiddleware.authenticate,
  authController.logout
);

// Get user profile
authRoutes.get(
  '/profile',
  authMiddleware.authenticate,
  authController.profile
);

/**
 * Health check for auth service
 */
authRoutes.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Auth service is healthy',
    timestamp: new Date().toISOString()
  });
});

export default authRoutes;