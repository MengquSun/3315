/**
 * Unit tests for AuthService
 * Tests authentication business logic and user management
 */

import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { AuthService } from '../../../hw3/backend/src/services/AuthService';
import { DatabaseService } from '../../../hw3/backend/src/services/DatabaseService';
import { AppError, ErrorType, User, UserSchema } from '../../../hw3/shared/types';

// Mock dependencies
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('AuthService', () => {
  let authService: AuthService;
  let mockDatabaseService: jest.Mocked<DatabaseService>;
  
  const mockUser: User = {
    id: 'user123',
    email: 'test@example.com',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  };

  const mockUserSchema: UserSchema = {
    ...mockUser,
    passwordHash: 'hashedPassword123',
    isActive: true
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create mock database service
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

    authService = new AuthService(mockDatabaseService);
  });

  describe('signup', () => {
    beforeEach(() => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword123');
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt123');
    });

    it('should create a new user successfully', async () => {
      // Arrange
      const email = 'newuser@example.com';
      const password = 'password123';
      
      mockDatabaseService.findOne.mockResolvedValue(null); // User doesn't exist
      mockDatabaseService.create.mockResolvedValue(mockUser);

      // Act
      const result = await authService.signup(email, password);

      // Assert
      expect(result).toEqual(mockUser);
      expect(mockDatabaseService.findOne).toHaveBeenCalledWith('users', { email });
      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 'salt123');
      expect(mockDatabaseService.create).toHaveBeenCalledWith('users', expect.objectContaining({
        email,
        passwordHash: 'hashedPassword123',
        isActive: true
      }));
    });

    it('should throw error if user already exists', async () => {
      // Arrange
      const email = 'existing@example.com';
      const password = 'password123';
      
      mockDatabaseService.findOne.mockResolvedValue(mockUserSchema);

      // Act & Assert
      await expect(authService.signup(email, password)).rejects.toThrow(AppError);
      await expect(authService.signup(email, password)).rejects.toMatchObject({
        type: ErrorType.VALIDATION_ERROR,
        code: 'USER_ALREADY_EXISTS'
      });
    });

    it('should validate email format', async () => {
      // Arrange
      const invalidEmail = 'invalid-email';
      const password = 'password123';

      // Act & Assert
      await expect(authService.signup(invalidEmail, password)).rejects.toThrow(AppError);
      await expect(authService.signup(invalidEmail, password)).rejects.toMatchObject({
        type: ErrorType.VALIDATION_ERROR,
        code: 'INVALID_EMAIL'
      });
    });

    it('should validate password strength', async () => {
      // Arrange
      const email = 'test@example.com';
      const weakPassword = '123';

      // Act & Assert
      await expect(authService.signup(email, weakPassword)).rejects.toThrow(AppError);
      await expect(authService.signup(email, weakPassword)).rejects.toMatchObject({
        type: ErrorType.VALIDATION_ERROR,
        code: 'WEAK_PASSWORD'
      });
    });
  });

  describe('login', () => {
    beforeEach(() => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('mockAccessToken');
      process.env.JWT_SECRET = 'test-secret';
      process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
    });

    it('should login user successfully with correct credentials', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'password123';
      
      mockDatabaseService.findOne.mockResolvedValue(mockUserSchema);
      mockDatabaseService.update.mockResolvedValue(mockUser);

      // Act
      const result = await authService.login(email, password);

      // Assert
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('expiresIn');
      expect(result.user.email).toBe(email);
      expect(mockDatabaseService.findOne).toHaveBeenCalledWith('users', { email });
      expect(bcrypt.compare).toHaveBeenCalledWith(password, mockUserSchema.passwordHash);
    });

    it('should throw error for non-existent user', async () => {
      // Arrange
      const email = 'nonexistent@example.com';
      const password = 'password123';
      
      mockDatabaseService.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.login(email, password)).rejects.toThrow(AppError);
      await expect(authService.login(email, password)).rejects.toMatchObject({
        type: ErrorType.AUTHENTICATION_ERROR,
        code: 'INVALID_CREDENTIALS'
      });
    });

    it('should throw error for incorrect password', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'wrongpassword';
      
      mockDatabaseService.findOne.mockResolvedValue(mockUserSchema);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Act & Assert
      await expect(authService.login(email, password)).rejects.toThrow(AppError);
      await expect(authService.login(email, password)).rejects.toMatchObject({
        type: ErrorType.AUTHENTICATION_ERROR,
        code: 'INVALID_CREDENTIALS'
      });
    });

    it('should throw error for inactive user', async () => {
      // Arrange
      const email = 'inactive@example.com';
      const password = 'password123';
      const inactiveUser = { ...mockUserSchema, isActive: false };
      
      mockDatabaseService.findOne.mockResolvedValue(inactiveUser);

      // Act & Assert
      await expect(authService.login(email, password)).rejects.toThrow(AppError);
      await expect(authService.login(email, password)).rejects.toMatchObject({
        type: ErrorType.AUTHENTICATION_ERROR,
        code: 'ACCOUNT_INACTIVE'
      });
    });
  });

  describe('verifyToken', () => {
    beforeEach(() => {
      process.env.JWT_SECRET = 'test-secret';
    });

    it('should verify valid token successfully', async () => {
      // Arrange
      const token = 'validToken123';
      const mockPayload = { userId: 'user123', email: 'test@example.com' };
      
      (jwt.verify as jest.Mock).mockReturnValue(mockPayload);
      mockDatabaseService.findOne.mockResolvedValue(mockUserSchema);

      // Act
      const result = await authService.verifyToken(token);

      // Assert
      expect(result).toEqual(mockUser);
      expect(jwt.verify).toHaveBeenCalledWith(token, 'test-secret');
      expect(mockDatabaseService.findOne).toHaveBeenCalledWith('users', { id: 'user123' });
    });

    it('should throw error for invalid token', async () => {
      // Arrange
      const token = 'invalidToken123';
      
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act & Assert
      await expect(authService.verifyToken(token)).rejects.toThrow(AppError);
      await expect(authService.verifyToken(token)).rejects.toMatchObject({
        type: ErrorType.AUTHENTICATION_ERROR,
        code: 'INVALID_TOKEN'
      });
    });

    it('should throw error for expired token', async () => {
      // Arrange
      const token = 'expiredToken123';
      
      (jwt.verify as jest.Mock).mockImplementation(() => {
        const error = new Error('Token expired');
        error.name = 'TokenExpiredError';
        throw error;
      });

      // Act & Assert
      await expect(authService.verifyToken(token)).rejects.toThrow(AppError);
      await expect(authService.verifyToken(token)).rejects.toMatchObject({
        type: ErrorType.AUTHENTICATION_ERROR,
        code: 'TOKEN_EXPIRED'
      });
    });
  });

  describe('refreshToken', () => {
    beforeEach(() => {
      process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
      process.env.JWT_SECRET = 'test-secret';
    });

    it('should refresh token successfully', async () => {
      // Arrange
      const refreshToken = 'validRefreshToken123';
      const mockPayload = { userId: 'user123' };
      
      (jwt.verify as jest.Mock).mockReturnValue(mockPayload);
      (jwt.sign as jest.Mock).mockReturnValue('newAccessToken123');
      mockDatabaseService.findOne.mockResolvedValue(mockUserSchema);

      // Act
      const result = await authService.refreshToken(refreshToken);

      // Assert
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('expiresIn');
      expect(jwt.verify).toHaveBeenCalledWith(refreshToken, 'test-refresh-secret');
      expect(jwt.sign).toHaveBeenCalled();
    });

    it('should throw error for invalid refresh token', async () => {
      // Arrange
      const refreshToken = 'invalidRefreshToken123';
      
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act & Assert
      await expect(authService.refreshToken(refreshToken)).rejects.toThrow(AppError);
      await expect(authService.refreshToken(refreshToken)).rejects.toMatchObject({
        type: ErrorType.AUTHENTICATION_ERROR,
        code: 'INVALID_REFRESH_TOKEN'
      });
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      // Arrange
      const userId = 'user123';
      mockDatabaseService.update.mockResolvedValue(mockUser);

      // Act
      const result = await authService.logout(userId);

      // Assert
      expect(result).toBe(true);
      expect(mockDatabaseService.update).toHaveBeenCalledWith(
        'users',
        { id: userId },
        { lastLoginAt: expect.any(Date) }
      );
    });

    it('should handle logout for non-existent user', async () => {
      // Arrange
      const userId = 'nonexistent123';
      mockDatabaseService.update.mockRejectedValue(new Error('User not found'));

      // Act & Assert
      await expect(authService.logout(userId)).rejects.toThrow(AppError);
    });
  });

  describe('validatePassword', () => {
    it('should accept strong passwords', () => {
      const strongPasswords = [
        'Password123!',
        'MySecurePass1',
        'ComplexPassword2023',
        'P@ssw0rd123'
      ];

      strongPasswords.forEach(password => {
        expect(() => authService.validatePassword(password)).not.toThrow();
      });
    });

    it('should reject weak passwords', () => {
      const weakPasswords = [
        '123',           // Too short
        'password',      // No numbers/uppercase
        'PASSWORD',      // No numbers/lowercase
        '12345678',      // No letters
        'Pass1',         // Too short
        ''               // Empty
      ];

      weakPasswords.forEach(password => {
        expect(() => authService.validatePassword(password)).toThrow(AppError);
      });
    });
  });

  describe('validateEmail', () => {
    it('should accept valid email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'firstname+lastname@example.org',
        'user123@test-domain.com'
      ];

      validEmails.forEach(email => {
        expect(() => authService.validateEmail(email)).not.toThrow();
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'plainaddress',
        '@missingdomain.com',
        'missing@.com',
        'missing.domain@.com',
        'two@@domains.com',
        ''
      ];

      invalidEmails.forEach(email => {
        expect(() => authService.validateEmail(email)).toThrow(AppError);
      });
    });
  });
});