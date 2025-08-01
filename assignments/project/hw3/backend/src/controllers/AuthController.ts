/**
 * Authentication Controller
 * Handles HTTP requests for user authentication operations
 */

import { Request, Response } from 'express';
import {
    AppError,
    AuthResult,
    ErrorType,
    LoginRequest,
    SignupRequest
} from '../../shared/types';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthService } from '../services/AuthService';
import { DatabaseService } from '../services/DatabaseService';

export class AuthController {
  private authService: AuthService;

  constructor(databaseService: DatabaseService) {
    this.authService = new AuthService(databaseService);
  }

  /**
   * User signup
   * POST /api/auth/signup
   */
  public signup = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body as SignupRequest;

    try {
      // Create new user
      const user = await this.authService.signup(email, password);

      // Login the user to get tokens
      const authResult = await this.authService.login(email, password);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: authResult.user,
          accessToken: authResult.accessToken,
          refreshToken: authResult.refreshToken,
          expiresIn: authResult.expiresIn
        }
      });

    } catch (error) {
      if (error instanceof AppError) {
        const statusCode = this.getStatusCode(error.type);
        res.status(statusCode).json({
          success: false,
          error: error.message,
          code: error.code
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Registration failed',
          code: 'SIGNUP_FAILED'
        });
      }
    }
  });

  /**
   * User login
   * POST /api/auth/login
   */
  public login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body as LoginRequest;

    try {
      const authResult = await this.authService.login(email, password);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: authResult.user,
          accessToken: authResult.accessToken,
          refreshToken: authResult.refreshToken,
          expiresIn: authResult.expiresIn
        }
      });

    } catch (error) {
      if (error instanceof AppError) {
        const statusCode = this.getStatusCode(error.type);
        res.status(statusCode).json({
          success: false,
          error: error.message,
          code: error.code
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Login failed',
          code: 'LOGIN_FAILED'
        });
      }
    }
  });

  /**
   * User logout
   * POST /api/auth/logout
   */
  public logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      const token = this.extractToken(req);
      
      if (token) {
        await this.authService.logout(token);
      }

      res.status(200).json({
        success: true,
        message: 'Logout successful'
      });

    } catch (error) {
      // Even if logout fails, return success to client
      res.status(200).json({
        success: true,
        message: 'Logout successful'
      });
    }
  });

  /**
   * Refresh access token
   * POST /api/auth/refresh
   */
  public refresh = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({
        success: false,
        error: 'Refresh token is required',
        code: 'REFRESH_TOKEN_REQUIRED'
      });
      return;
    }

    try {
      const authResult = await this.authService.refreshToken(refreshToken);

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          user: authResult.user,
          accessToken: authResult.accessToken,
          refreshToken: authResult.refreshToken,
          expiresIn: authResult.expiresIn
        }
      });

    } catch (error) {
      if (error instanceof AppError) {
        const statusCode = this.getStatusCode(error.type);
        res.status(statusCode).json({
          success: false,
          error: error.message,
          code: error.code
        });
      } else {
        res.status(401).json({
          success: false,
          error: 'Token refresh failed',
          code: 'REFRESH_FAILED'
        });
      }
    }
  });

  /**
   * Get user profile
   * GET /api/auth/profile
   */
  public profile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // User is attached to request by auth middleware
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated',
        code: 'NOT_AUTHENTICATED'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        user: req.user
      }
    });
  });

  /**
   * Reset password (placeholder)
   * POST /api/auth/reset-password
   */
  public resetPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        error: 'Email is required',
        code: 'EMAIL_REQUIRED'
      });
      return;
    }

    try {
      await this.authService.resetPassword(email);

      res.status(200).json({
        success: true,
        message: 'Password reset email sent'
      });

    } catch (error) {
      if (error instanceof AppError) {
        const statusCode = this.getStatusCode(error.type);
        res.status(statusCode).json({
          success: false,
          error: error.message,
          code: error.code
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Password reset failed',
          code: 'RESET_FAILED'
        });
      }
    }
  });

  /**
   * Validate token endpoint
   * GET /api/auth/validate
   */
  public validateToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const token = this.extractToken(req);

    if (!token) {
      res.status(400).json({
        success: false,
        error: 'Token is required',
        code: 'TOKEN_REQUIRED'
      });
      return;
    }

    try {
      const user = await this.authService.validateToken(token);

      res.status(200).json({
        success: true,
        data: {
          user,
          valid: true
        }
      });

    } catch (error) {
      res.status(401).json({
        success: false,
        error: 'Invalid token',
        code: 'INVALID_TOKEN',
        data: {
          valid: false
        }
      });
    }
  });

  /**
   * Extract JWT token from Authorization header
   */
  private extractToken(req: Request): string | null {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return null;
    }

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

  /**
   * Send standardized auth response
   */
  private sendAuthResponse(res: Response, authResult: AuthResult): void {
    res.status(200).json({
      success: true,
      data: {
        user: authResult.user,
        accessToken: authResult.accessToken,
        refreshToken: authResult.refreshToken,
        expiresIn: authResult.expiresIn
      }
    });
  }

  /**
   * Handle authentication errors consistently
   */
  private handleError(error: any, res: Response): void {
    if (error instanceof AppError) {
      const statusCode = this.getStatusCode(error.type);
      res.status(statusCode).json({
        success: false,
        error: error.message,
        code: error.code
      });
    } else {
      console.error('Unexpected error in AuthController:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
}