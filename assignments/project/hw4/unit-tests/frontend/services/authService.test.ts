/**
 * Unit tests for AuthService
 * Tests authentication client-side logic and API integration
 */

import { apiClient } from '../../../hw3/frontend/src/services/api';
import { authService } from '../../../hw3/frontend/src/services/authService';
import {
    AuthResult,
    LoginRequest,
    SignupRequest,
    User
} from '../../../hw3/shared/types';

// Mock the API client
jest.mock('../../../hw3/frontend/src/services/api');
const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
});

describe('AuthService', () => {
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
    localStorageMock.getItem.mockReturnValue(null);
    sessionStorageMock.getItem.mockReturnValue(null);
  });

  describe('signup', () => {
    const signupData: SignupRequest = {
      email: 'newuser@example.com',
      password: 'password123'
    };

    it('should signup user successfully', async () => {
      // Arrange
      mockedApiClient.post.mockResolvedValue({
        data: {
          success: true,
          data: mockAuthResult
        }
      });

      // Act
      const result = await authService.signup(signupData);

      // Assert
      expect(result).toEqual(mockAuthResult);
      expect(mockedApiClient.post).toHaveBeenCalledWith('/api/auth/signup', signupData);
    });

    it('should handle signup validation errors', async () => {
      // Arrange
      const errorResponse = {
        response: {
          status: 400,
          data: {
            success: false,
            error: 'Invalid email format'
          }
        }
      };
      mockedApiClient.post.mockRejectedValue(errorResponse);

      // Act & Assert
      await expect(authService.signup(signupData)).rejects.toEqual(errorResponse);
    });

    it('should handle duplicate email error', async () => {
      // Arrange
      const errorResponse = {
        response: {
          status: 409,
          data: {
            success: false,
            error: 'User already exists'
          }
        }
      };
      mockedApiClient.post.mockRejectedValue(errorResponse);

      // Act & Assert
      await expect(authService.signup(signupData)).rejects.toEqual(errorResponse);
    });

    it('should validate email format before API call', async () => {
      // Arrange
      const invalidSignupData = {
        email: 'invalid-email',
        password: 'password123'
      };

      // Act & Assert
      await expect(authService.signup(invalidSignupData)).rejects.toThrow('Invalid email format');
      expect(mockedApiClient.post).not.toHaveBeenCalled();
    });

    it('should validate password strength before API call', async () => {
      // Arrange
      const weakPasswordData = {
        email: 'test@example.com',
        password: '123'
      };

      // Act & Assert
      await expect(authService.signup(weakPasswordData)).rejects.toThrow('Password must be at least 8 characters');
      expect(mockedApiClient.post).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginData: LoginRequest = {
      email: 'test@example.com',
      password: 'password123',
      rememberMe: false
    };

    it('should login user successfully', async () => {
      // Arrange
      mockedApiClient.post.mockResolvedValue({
        data: {
          success: true,
          data: mockAuthResult
        }
      });

      // Act
      const result = await authService.login(loginData);

      // Assert
      expect(result).toEqual(mockAuthResult);
      expect(mockedApiClient.post).toHaveBeenCalledWith('/api/auth/login', loginData);
    });

    it('should store tokens in sessionStorage when rememberMe is false', async () => {
      // Arrange
      mockedApiClient.post.mockResolvedValue({
        data: {
          success: true,
          data: mockAuthResult
        }
      });

      // Act
      await authService.login(loginData);

      // Assert
      expect(sessionStorageMock.setItem).toHaveBeenCalledWith('accessToken', mockAuthResult.accessToken);
      expect(sessionStorageMock.setItem).toHaveBeenCalledWith('refreshToken', mockAuthResult.refreshToken);
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('should store tokens in localStorage when rememberMe is true', async () => {
      // Arrange
      const rememberMeLoginData = { ...loginData, rememberMe: true };
      mockedApiClient.post.mockResolvedValue({
        data: {
          success: true,
          data: mockAuthResult
        }
      });

      // Act
      await authService.login(rememberMeLoginData);

      // Assert
      expect(localStorageMock.setItem).toHaveBeenCalledWith('accessToken', mockAuthResult.accessToken);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('refreshToken', mockAuthResult.refreshToken);
      expect(sessionStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('should handle invalid credentials error', async () => {
      // Arrange
      const errorResponse = {
        response: {
          status: 401,
          data: {
            success: false,
            error: 'Invalid credentials'
          }
        }
      };
      mockedApiClient.post.mockRejectedValue(errorResponse);

      // Act & Assert
      await expect(authService.login(loginData)).rejects.toEqual(errorResponse);
    });

    it('should handle account inactive error', async () => {
      // Arrange
      const errorResponse = {
        response: {
          status: 403,
          data: {
            success: false,
            error: 'Account is inactive'
          }
        }
      };
      mockedApiClient.post.mockRejectedValue(errorResponse);

      // Act & Assert
      await expect(authService.login(loginData)).rejects.toEqual(errorResponse);
    });
  });

  describe('logout', () => {
    it('should logout user and clear tokens', async () => {
      // Arrange
      mockedApiClient.post.mockResolvedValue({
        data: { success: true }
      });

      // Act
      await authService.logout();

      // Assert
      expect(mockedApiClient.post).toHaveBeenCalledWith('/api/auth/logout');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('accessToken');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('refreshToken');
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('accessToken');
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('refreshToken');
    });

    it('should clear tokens even if API call fails', async () => {
      // Arrange
      mockedApiClient.post.mockRejectedValue(new Error('Network error'));

      // Act
      await authService.logout();

      // Assert
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('accessToken');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('refreshToken');
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('accessToken');
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('refreshToken');
    });
  });

  describe('getCurrentUser', () => {
    it('should get current user profile', async () => {
      // Arrange
      mockedApiClient.get.mockResolvedValue({
        data: {
          success: true,
          data: { user: mockUser }
        }
      });

      // Act
      const result = await authService.getCurrentUser();

      // Assert
      expect(result).toEqual(mockUser);
      expect(mockedApiClient.get).toHaveBeenCalledWith('/api/auth/profile');
    });

    it('should handle unauthorized error', async () => {
      // Arrange
      const errorResponse = {
        response: {
          status: 401,
          data: {
            success: false,
            error: 'Unauthorized'
          }
        }
      };
      mockedApiClient.get.mockRejectedValue(errorResponse);

      // Act & Assert
      await expect(authService.getCurrentUser()).rejects.toEqual(errorResponse);
    });
  });

  describe('refreshToken', () => {
    it('should refresh access token successfully', async () => {
      // Arrange
      const newTokens = {
        accessToken: 'new-access-token',
        expiresIn: 3600
      };
      localStorageMock.getItem.mockReturnValue('refresh-token-123');
      mockedApiClient.post.mockResolvedValue({
        data: {
          success: true,
          data: newTokens
        }
      });

      // Act
      const result = await authService.refreshToken();

      // Assert
      expect(result).toEqual(newTokens);
      expect(mockedApiClient.post).toHaveBeenCalledWith('/api/auth/refresh', {
        refreshToken: 'refresh-token-123'
      });
    });

    it('should get refresh token from sessionStorage if not in localStorage', async () => {
      // Arrange
      const newTokens = {
        accessToken: 'new-access-token',
        expiresIn: 3600
      };
      localStorageMock.getItem.mockReturnValue(null);
      sessionStorageMock.getItem.mockReturnValue('session-refresh-token');
      mockedApiClient.post.mockResolvedValue({
        data: {
          success: true,
          data: newTokens
        }
      });

      // Act
      const result = await authService.refreshToken();

      // Assert
      expect(result).toEqual(newTokens);
      expect(mockedApiClient.post).toHaveBeenCalledWith('/api/auth/refresh', {
        refreshToken: 'session-refresh-token'
      });
    });

    it('should throw error if no refresh token available', async () => {
      // Arrange
      localStorageMock.getItem.mockReturnValue(null);
      sessionStorageMock.getItem.mockReturnValue(null);

      // Act & Assert
      await expect(authService.refreshToken()).rejects.toThrow('No refresh token available');
      expect(mockedApiClient.post).not.toHaveBeenCalled();
    });

    it('should update stored access token after refresh', async () => {
      // Arrange
      const newTokens = {
        accessToken: 'new-access-token',
        expiresIn: 3600
      };
      localStorageMock.getItem.mockReturnValue('refresh-token-123');
      mockedApiClient.post.mockResolvedValue({
        data: {
          success: true,
          data: newTokens
        }
      });

      // Act
      await authService.refreshToken();

      // Assert
      expect(localStorageMock.setItem).toHaveBeenCalledWith('accessToken', 'new-access-token');
    });
  });

  describe('getStoredToken', () => {
    it('should get token from localStorage first', () => {
      // Arrange
      localStorageMock.getItem.mockReturnValue('local-token');
      sessionStorageMock.getItem.mockReturnValue('session-token');

      // Act
      const token = authService.getStoredToken();

      // Assert
      expect(token).toBe('local-token');
      expect(localStorageMock.getItem).toHaveBeenCalledWith('accessToken');
    });

    it('should fall back to sessionStorage if localStorage is empty', () => {
      // Arrange
      localStorageMock.getItem.mockReturnValue(null);
      sessionStorageMock.getItem.mockReturnValue('session-token');

      // Act
      const token = authService.getStoredToken();

      // Assert
      expect(token).toBe('session-token');
      expect(sessionStorageMock.getItem).toHaveBeenCalledWith('accessToken');
    });

    it('should return null if no token is stored', () => {
      // Arrange
      localStorageMock.getItem.mockReturnValue(null);
      sessionStorageMock.getItem.mockReturnValue(null);

      // Act
      const token = authService.getStoredToken();

      // Assert
      expect(token).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when valid token exists', () => {
      // Arrange
      localStorageMock.getItem.mockReturnValue('valid-token');

      // Act
      const isAuth = authService.isAuthenticated();

      // Assert
      expect(isAuth).toBe(true);
    });

    it('should return false when no token exists', () => {
      // Arrange
      localStorageMock.getItem.mockReturnValue(null);
      sessionStorageMock.getItem.mockReturnValue(null);

      // Act
      const isAuth = authService.isAuthenticated();

      // Assert
      expect(isAuth).toBe(false);
    });

    it('should return false for empty token', () => {
      // Arrange
      localStorageMock.getItem.mockReturnValue('');

      // Act
      const isAuth = authService.isAuthenticated();

      // Assert
      expect(isAuth).toBe(false);
    });
  });

  describe('validateEmail', () => {
    it('should validate correct email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'firstname+lastname@example.org'
      ];

      validEmails.forEach(email => {
        expect(() => authService.validateEmail(email)).not.toThrow();
      });
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'plainaddress',
        '@missingdomain.com',
        'missing@.com',
        'two@@domains.com',
        ''
      ];

      invalidEmails.forEach(email => {
        expect(() => authService.validateEmail(email)).toThrow();
      });
    });
  });

  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      const strongPasswords = [
        'Password123!',
        'MySecurePass1',
        'ComplexPassword2023'
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
        ''               // Empty
      ];

      weakPasswords.forEach(password => {
        expect(() => authService.validatePassword(password)).toThrow();
      });
    });
  });
});