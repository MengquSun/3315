/**
 * Unit tests for AuthController
 * Tests HTTP request/response handling for authentication endpoints
 */

import { Request, Response } from 'express';
import { AuthController } from '../../../hw3/backend/src/controllers/AuthController';
import { AuthService } from '../../../hw3/backend/src/services/AuthService';
import { DatabaseService } from '../../../hw3/backend/src/services/DatabaseService';
import {
    AppError,
    AuthResult,
    ErrorType,
    LoginRequest,
    SignupRequest,
    User
} from '../../../hw3/shared/types';

// Mock the AuthService
jest.mock('../../../hw3/backend/src/services/AuthService');

describe('AuthController', () => {
  let authController: AuthController;
  let mockAuthService: jest.Mocked<AuthService>;
  let mockDatabaseService: jest.Mocked<DatabaseService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  const mockUser: User = {
    id: 'user123',
    email: 'test@example.com',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  };

  const mockAuthResult: AuthResult = {
    user: mockUser,
    accessToken: 'access-token-123',
    refreshToken: 'refresh-token-123',
    expiresIn: 3600
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock DatabaseService
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

    // Mock AuthService
    mockAuthService = {
      signup: jest.fn(),
      login: jest.fn(),
      verifyToken: jest.fn(),
      refreshToken: jest.fn(),
      logout: jest.fn(),
      validateEmail: jest.fn(),
      validatePassword: jest.fn()
    } as jest.Mocked<AuthService>;

    // Create controller instance
    authController = new AuthController(mockDatabaseService);
    // Replace the authService with our mock
    (authController as any).authService = mockAuthService;

    // Mock Express Request and Response
    mockRequest = {
      body: {},
      headers: {},
      user: undefined
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis()
    };
  });

  describe('signup', () => {
    const signupData: SignupRequest = {
      email: 'newuser@example.com',
      password: 'password123'
    };

    it('should create user and return auth tokens successfully', async () => {
      // Arrange
      mockRequest.body = signupData;
      mockAuthService.signup.mockResolvedValue(mockUser);
      mockAuthService.login.mockResolvedValue(mockAuthResult);

      // Act
      await authController.signup(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockAuthService.signup).toHaveBeenCalledWith(signupData.email, signupData.password);
      expect(mockAuthService.login).toHaveBeenCalledWith(signupData.email, signupData.password);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'User registered successfully',
        data: {
          user: mockAuthResult.user,
          accessToken: mockAuthResult.accessToken,
          refreshToken: mockAuthResult.refreshToken,
          expiresIn: mockAuthResult.expiresIn
        }
      });
    });

    it('should handle duplicate email error', async () => {
      // Arrange
      mockRequest.body = signupData;
      const duplicateError = new AppError({
        type: ErrorType.VALIDATION_ERROR,
        message: 'User already exists',
        code: 'USER_ALREADY_EXISTS'
      });
      mockAuthService.signup.mockRejectedValue(duplicateError);

      // Act & Assert
      await expect(
        authController.signup(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(AppError);
    });

    it('should handle invalid email format', async () => {
      // Arrange
      mockRequest.body = { ...signupData, email: 'invalid-email' };
      const validationError = new AppError({
        type: ErrorType.VALIDATION_ERROR,
        message: 'Invalid email format',
        code: 'INVALID_EMAIL'
      });
      mockAuthService.signup.mockRejectedValue(validationError);

      // Act & Assert
      await expect(
        authController.signup(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(AppError);
    });

    it('should handle weak password error', async () => {
      // Arrange
      mockRequest.body = { ...signupData, password: '123' };
      const passwordError = new AppError({
        type: ErrorType.VALIDATION_ERROR,
        message: 'Password too weak',
        code: 'WEAK_PASSWORD'
      });
      mockAuthService.signup.mockRejectedValue(passwordError);

      // Act & Assert
      await expect(
        authController.signup(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(AppError);
    });
  });

  describe('login', () => {
    const loginData: LoginRequest = {
      email: 'test@example.com',
      password: 'password123',
      rememberMe: false
    };

    it('should authenticate user and return tokens successfully', async () => {
      // Arrange
      mockRequest.body = loginData;
      mockAuthService.login.mockResolvedValue(mockAuthResult);

      // Act
      await authController.login(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockAuthService.login).toHaveBeenCalledWith(loginData.email, loginData.password);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Login successful',
        data: {
          user: mockAuthResult.user,
          accessToken: mockAuthResult.accessToken,
          refreshToken: mockAuthResult.refreshToken,
          expiresIn: mockAuthResult.expiresIn
        }
      });
    });

    it('should set secure cookies when rememberMe is true', async () => {
      // Arrange
      mockRequest.body = { ...loginData, rememberMe: true };
      mockAuthService.login.mockResolvedValue(mockAuthResult);

      // Act
      await authController.login(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refreshToken',
        mockAuthResult.refreshToken,
        expect.objectContaining({
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: expect.any(Number)
        })
      );
    });

    it('should handle invalid credentials error', async () => {
      // Arrange
      mockRequest.body = loginData;
      const authError = new AppError({
        type: ErrorType.AUTHENTICATION_ERROR,
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
      mockAuthService.login.mockRejectedValue(authError);

      // Act & Assert
      await expect(
        authController.login(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(AppError);
    });

    it('should handle account inactive error', async () => {
      // Arrange
      mockRequest.body = loginData;
      const inactiveError = new AppError({
        type: ErrorType.AUTHENTICATION_ERROR,
        message: 'Account is inactive',
        code: 'ACCOUNT_INACTIVE'
      });
      mockAuthService.login.mockRejectedValue(inactiveError);

      // Act & Assert
      await expect(
        authController.login(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(AppError);
    });
  });

  describe('getProfile', () => {
    it('should return user profile successfully', async () => {
      // Arrange
      mockRequest.user = mockUser;

      // Act
      await authController.getProfile(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          user: mockUser
        }
      });
    });

    it('should handle missing user in request', async () => {
      // Arrange
      mockRequest.user = undefined;

      // Act & Assert
      await expect(
        authController.getProfile(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(AppError);
    });
  });

  describe('refreshToken', () => {
    const refreshTokenValue = 'refresh-token-123';

    it('should refresh access token successfully from header', async () => {
      // Arrange
      mockRequest.headers = { authorization: `Bearer ${refreshTokenValue}` };
      const newTokens = {
        accessToken: 'new-access-token',
        expiresIn: 3600
      };
      mockAuthService.refreshToken.mockResolvedValue(newTokens);

      // Act
      await authController.refreshToken(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockAuthService.refreshToken).toHaveBeenCalledWith(refreshTokenValue);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Token refreshed successfully',
        data: newTokens
      });
    });

    it('should refresh access token successfully from cookie', async () => {
      // Arrange
      mockRequest.cookies = { refreshToken: refreshTokenValue };
      const newTokens = {
        accessToken: 'new-access-token',
        expiresIn: 3600
      };
      mockAuthService.refreshToken.mockResolvedValue(newTokens);

      // Act
      await authController.refreshToken(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockAuthService.refreshToken).toHaveBeenCalledWith(refreshTokenValue);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should handle missing refresh token', async () => {
      // Arrange
      mockRequest.headers = {};
      mockRequest.cookies = {};

      // Act & Assert
      await expect(
        authController.refreshToken(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(AppError);
    });

    it('should handle invalid refresh token', async () => {
      // Arrange
      mockRequest.headers = { authorization: `Bearer invalid-token` };
      const tokenError = new AppError({
        type: ErrorType.AUTHENTICATION_ERROR,
        message: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      });
      mockAuthService.refreshToken.mockRejectedValue(tokenError);

      // Act & Assert
      await expect(
        authController.refreshToken(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(AppError);
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      // Arrange
      mockRequest.user = mockUser;
      mockAuthService.logout.mockResolvedValue(true);

      // Act
      await authController.logout(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockAuthService.logout).toHaveBeenCalledWith(mockUser.id);
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('refreshToken');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Logout successful'
      });
    });

    it('should handle logout without authenticated user', async () => {
      // Arrange
      mockRequest.user = undefined;

      // Act & Assert
      await expect(
        authController.logout(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(AppError);
    });
  });

  describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
      // Arrange
      const verificationToken = 'verification-token-123';
      mockRequest.params = { token: verificationToken };
      mockAuthService.verifyEmail.mockResolvedValue(true);

      // Act
      await authController.verifyEmail(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockAuthService.verifyEmail).toHaveBeenCalledWith(verificationToken);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Email verified successfully'
      });
    });

    it('should handle invalid verification token', async () => {
      // Arrange
      const invalidToken = 'invalid-token';
      mockRequest.params = { token: invalidToken };
      const verificationError = new AppError({
        type: ErrorType.AUTHENTICATION_ERROR,
        message: 'Invalid verification token',
        code: 'INVALID_VERIFICATION_TOKEN'
      });
      mockAuthService.verifyEmail.mockRejectedValue(verificationError);

      // Act & Assert
      await expect(
        authController.verifyEmail(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(AppError);
    });
  });

  describe('resetPassword', () => {
    const resetData = {
      token: 'reset-token-123',
      newPassword: 'newpassword123'
    };

    it('should reset password successfully', async () => {
      // Arrange
      mockRequest.body = resetData;
      mockAuthService.resetPassword.mockResolvedValue(true);

      // Act
      await authController.resetPassword(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockAuthService.resetPassword).toHaveBeenCalledWith(
        resetData.token,
        resetData.newPassword
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Password reset successfully'
      });
    });

    it('should handle invalid reset token', async () => {
      // Arrange
      mockRequest.body = { ...resetData, token: 'invalid-token' };
      const resetError = new AppError({
        type: ErrorType.AUTHENTICATION_ERROR,
        message: 'Invalid reset token',
        code: 'INVALID_RESET_TOKEN'
      });
      mockAuthService.resetPassword.mockRejectedValue(resetError);

      // Act & Assert
      await expect(
        authController.resetPassword(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(AppError);
    });
  });
});