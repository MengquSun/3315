/**
 * Authentication Service
 * Handles all authentication operations for the Personal Task Management Application
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {
    AppError,
    AuthResult,
    AuthTokens,
    ErrorType,
    User,
    UserSchema
} from '../../shared/types';
import { DatabaseService } from './DatabaseService';

export class AuthService {
  private db: DatabaseService;
  private readonly USERS_COLLECTION = 'users';
  private readonly SESSIONS_COLLECTION = 'sessions';

  constructor(databaseService: DatabaseService) {
    this.db = databaseService;
  }

  /**
   * Register a new user
   */
  public async signup(email: string, password: string): Promise<User> {
    try {
      // Check if user already exists
      const existingUser = await this.db.findOne<UserSchema>(
        this.USERS_COLLECTION, 
        { email }
      );

      if (existingUser) {
        throw new AppError({
          type: ErrorType.VALIDATION_ERROR,
          message: 'User with this email already exists',
          code: 'USER_ALREADY_EXISTS'
        });
      }

      // Hash password
      const passwordHash = await this.hashPassword(password);

      // Create user data
      const userData: Omit<UserSchema, 'id' | 'createdAt' | 'updatedAt'> = {
        email: email.toLowerCase().trim(),
        passwordHash,
        isActive: true
      };

      // Save user to database
      const newUser = await this.db.createOne<UserSchema>(
        this.USERS_COLLECTION,
        userData
      );

      // Return user without password hash
      const { passwordHash: _, ...userWithoutPassword } = newUser;
      return userWithoutPassword as User;

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError({
        type: ErrorType.DATABASE_ERROR,
        message: 'Failed to create user account',
        code: 'USER_CREATION_FAILED',
        details: error
      });
    }
  }

  /**
   * Authenticate user and return tokens
   */
  public async login(email: string, password: string): Promise<AuthResult> {
    try {
      // Find user by email
      const user = await this.db.findOne<UserSchema>(
        this.USERS_COLLECTION,
        { email: email.toLowerCase().trim() }
      );

      if (!user) {
        throw new AppError({
          type: ErrorType.AUTHENTICATION_ERROR,
          message: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS'
        });
      }

      if (!user.isActive) {
        throw new AppError({
          type: ErrorType.AUTHENTICATION_ERROR,
          message: 'Account is disabled',
          code: 'ACCOUNT_DISABLED'
        });
      }

      // Verify password
      const isValidPassword = await this.verifyPassword(password, user.passwordHash);
      if (!isValidPassword) {
        throw new AppError({
          type: ErrorType.AUTHENTICATION_ERROR,
          message: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Update last login time
      await this.db.updateOne<UserSchema>(
        this.USERS_COLLECTION,
        user.id,
        { lastLoginAt: new Date() }
      );

      // Generate tokens
      const { passwordHash: _, ...userWithoutPassword } = user;
      const tokens = this.generateTokens(userWithoutPassword as User);

      // Store refresh token
      await this.storeRefreshToken(user.id, tokens.refreshToken);

      return {
        user: userWithoutPassword as User,
        ...tokens
      };

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError({
        type: ErrorType.AUTHENTICATION_ERROR,
        message: 'Login failed',
        code: 'LOGIN_FAILED',
        details: error
      });
    }
  }

  /**
   * Logout user and invalidate tokens
   */
  public async logout(token: string): Promise<void> {
    try {
      const decoded = jwt.decode(token) as any;
      if (decoded?.userId) {
        // Remove refresh token from database
        await this.revokeRefreshToken(decoded.userId);
      }
    } catch (error) {
      // Silent fail - token might be invalid but logout should still succeed
      console.warn('Error during logout:', error);
    }
  }

  /**
   * Validate JWT token and return user
   */
  public async validateToken(token: string): Promise<User> {
    try {
      if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET not configured');
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;
      
      const user = await this.db.findOne<UserSchema>(
        this.USERS_COLLECTION,
        { id: decoded.userId }
      );

      if (!user) {
        throw new AppError({
          type: ErrorType.AUTHENTICATION_ERROR,
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      if (!user.isActive) {
        throw new AppError({
          type: ErrorType.AUTHENTICATION_ERROR,
          message: 'Account is disabled',
          code: 'ACCOUNT_DISABLED'
        });
      }

      const { passwordHash: _, ...userWithoutPassword } = user;
      return userWithoutPassword as User;

    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError({
          type: ErrorType.AUTHENTICATION_ERROR,
          message: 'Invalid token',
          code: 'INVALID_TOKEN'
        });
      }
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError({
        type: ErrorType.AUTHENTICATION_ERROR,
        message: 'Token validation failed',
        code: 'TOKEN_VALIDATION_FAILED',
        details: error
      });
    }
  }

  /**
   * Refresh access token using refresh token
   */
  public async refreshToken(refreshToken: string): Promise<AuthResult> {
    try {
      if (!process.env.JWT_REFRESH_SECRET) {
        throw new Error('JWT_REFRESH_SECRET not configured');
      }

      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET) as any;
      
      // Check if refresh token exists in database
      const session = await this.db.findOne(
        this.SESSIONS_COLLECTION,
        { userId: decoded.userId, refreshToken }
      );

      if (!session) {
        throw new AppError({
          type: ErrorType.AUTHENTICATION_ERROR,
          message: 'Invalid refresh token',
          code: 'INVALID_REFRESH_TOKEN'
        });
      }

      // Get user
      const user = await this.db.findOne<UserSchema>(
        this.USERS_COLLECTION,
        { id: decoded.userId }
      );

      if (!user || !user.isActive) {
        throw new AppError({
          type: ErrorType.AUTHENTICATION_ERROR,
          message: 'User not found or inactive',
          code: 'USER_INACTIVE'
        });
      }

      // Generate new tokens
      const { passwordHash: _, ...userWithoutPassword } = user;
      const tokens = this.generateTokens(userWithoutPassword as User);

      // Update stored refresh token
      await this.storeRefreshToken(user.id, tokens.refreshToken);

      return {
        user: userWithoutPassword as User,
        ...tokens
      };

    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError({
          type: ErrorType.AUTHENTICATION_ERROR,
          message: 'Invalid refresh token',
          code: 'INVALID_REFRESH_TOKEN'
        });
      }
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError({
        type: ErrorType.AUTHENTICATION_ERROR,
        message: 'Token refresh failed',
        code: 'TOKEN_REFRESH_FAILED',
        details: error
      });
    }
  }

  /**
   * Reset user password (placeholder for future implementation)
   */
  public async resetPassword(email: string): Promise<void> {
    // This would typically send a password reset email
    // For now, it's a placeholder
    console.log(`Password reset requested for ${email}`);
    
    throw new AppError({
      type: ErrorType.VALIDATION_ERROR,
      message: 'Password reset not implemented yet',
      code: 'NOT_IMPLEMENTED'
    });
  }

  /**
   * Hash password using bcrypt
   */
  private async hashPassword(password: string): Promise<string> {
    const rounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
    return bcrypt.hash(password, rounds);
  }

  /**
   * Verify password against hash
   */
  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate JWT access and refresh tokens
   */
  private generateTokens(user: User): AuthTokens {
    if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
      throw new Error('JWT secrets not configured');
    }

    const payload = {
      userId: user.id,
      email: user.email,
      iat: Math.floor(Date.now() / 1000)
    };

    const accessToken = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { 
        expiresIn: process.env.JWT_EXPIRES_IN || '1h',
        issuer: 'task-management-api',
        audience: 'task-management-app'
      }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET,
      { 
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
        issuer: 'task-management-api',
        audience: 'task-management-app'
      }
    );

    // Calculate expiration time in seconds
    const expiresIn = this.parseExpiresIn(process.env.JWT_EXPIRES_IN || '1h');

    return {
      accessToken,
      refreshToken,
      expiresIn
    };
  }

  /**
   * Store refresh token in database
   */
  private async storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const sessionData = {
      userId,
      refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      createdAt: new Date()
    };

    // Remove any existing refresh tokens for this user
    await this.revokeRefreshToken(userId);

    // Store new refresh token
    await this.db.createOne(this.SESSIONS_COLLECTION, sessionData);
  }

  /**
   * Revoke refresh token from database
   */
  private async revokeRefreshToken(userId: string): Promise<void> {
    try {
      const sessions = await this.db.findMany(
        this.SESSIONS_COLLECTION,
        { userId }
      );

      for (const session of sessions) {
        await this.db.deleteOne(this.SESSIONS_COLLECTION, session.id);
      }
    } catch (error) {
      // Silent fail - not critical if this fails
      console.warn('Error revoking refresh tokens:', error);
    }
  }

  /**
   * Parse expires in string to seconds
   */
  private parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return 3600; // Default to 1 hour

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 60 * 60;
      case 'd': return value * 24 * 60 * 60;
      default: return 3600;
    }
  }
}