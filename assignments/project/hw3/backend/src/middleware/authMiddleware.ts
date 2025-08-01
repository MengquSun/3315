/**
 * Authentication Middleware
 * JWT token validation and user authentication for protected routes
 */

import { NextFunction, Request, Response } from 'express';
import { AppError, ErrorType, User } from '../../shared/types';
import { AuthService } from '../services/AuthService';
import { DatabaseService } from '../services/DatabaseService';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
      userId?: string;
    }
  }
}

export class AuthMiddleware {
  private authService: AuthService;

  constructor(databaseService: DatabaseService) {
    this.authService = new AuthService(databaseService);
  }

  /**
   * Authenticate user from JWT token
   */
  public authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = this.extractToken(req);
      
      if (!token) {
        throw new AppError({
          type: ErrorType.AUTHENTICATION_ERROR,
          message: 'Access token is required',
          code: 'TOKEN_REQUIRED'
        });
      }

      // Validate token and get user
      const user = await this.authService.validateToken(token);
      
      // Attach user to request object
      req.user = user;
      req.userId = user.id;
      
      next();

    } catch (error) {
      if (error instanceof AppError) {
        res.status(this.getStatusCode(error.type)).json({
          success: false,
          error: error.message,
          code: error.code
        });
      } else {
        res.status(401).json({
          success: false,
          error: 'Authentication failed',
          code: 'AUTH_FAILED'
        });
      }
    }
  };

  /**
   * Optional authentication - doesn't fail if no token
   */
  public optionalAuthenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = this.extractToken(req);
      
      if (token) {
        const user = await this.authService.validateToken(token);
        req.user = user;
        req.userId = user.id;
      }
      
      next();

    } catch (error) {
      // Continue without authentication for optional auth
      next();
    }
  };

  /**
   * Authorize specific roles (future enhancement)
   */
  public authorize = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
        return;
      }

      // For now, all authenticated users have access
      // In the future, this could check user roles
      next();
    };
  };

  /**
   * Extract JWT token from request headers
   */
  private extractToken(req: Request): string | null {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return null;
    }

    // Check for Bearer token format
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }

    return parts[1];
  }

  /**
   * Map error types to HTTP status codes
   */
  private getStatusCode(errorType: ErrorType): number {
    switch (errorType) {
      case ErrorType.AUTHENTICATION_ERROR:
        return 401;
      case ErrorType.AUTHORIZATION_ERROR:
        return 403;
      case ErrorType.VALIDATION_ERROR:
        return 400;
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

// Create middleware instance
let authMiddlewareInstance: AuthMiddleware;

export const createAuthMiddleware = (databaseService: DatabaseService): AuthMiddleware => {
  if (!authMiddlewareInstance) {
    authMiddlewareInstance = new AuthMiddleware(databaseService);
  }
  return authMiddlewareInstance;
};

export const getAuthMiddleware = (): AuthMiddleware => {
  if (!authMiddlewareInstance) {
    throw new Error('Auth middleware not initialized. Call createAuthMiddleware first.');
  }
  return authMiddlewareInstance;
};