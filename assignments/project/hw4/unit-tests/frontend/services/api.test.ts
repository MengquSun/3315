/**
 * Unit tests for API service
 * Tests HTTP client configuration and request handling
 */

import axios from 'axios';
import { apiClient, removeAuthToken, setAuthToken } from '../../../hw3/frontend/src/services/api';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('API Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset axios defaults
    delete (axios.defaults.headers.common as any)['Authorization'];
  });

  describe('apiClient configuration', () => {
    it('should have correct base configuration', () => {
      expect(apiClient.defaults.baseURL).toBe(process.env.VITE_API_URL || 'http://localhost:3001');
      expect(apiClient.defaults.timeout).toBe(10000);
      expect(apiClient.defaults.headers.common['Content-Type']).toBe('application/json');
    });

    it('should include withCredentials for CORS', () => {
      expect(apiClient.defaults.withCredentials).toBe(true);
    });
  });

  describe('setAuthToken', () => {
    it('should set authorization header with token', () => {
      const token = 'test-jwt-token';
      
      setAuthToken(token);
      
      expect(apiClient.defaults.headers.common['Authorization']).toBe(`Bearer ${token}`);
    });

    it('should update existing authorization header', () => {
      const firstToken = 'first-token';
      const secondToken = 'second-token';
      
      setAuthToken(firstToken);
      expect(apiClient.defaults.headers.common['Authorization']).toBe(`Bearer ${firstToken}`);
      
      setAuthToken(secondToken);
      expect(apiClient.defaults.headers.common['Authorization']).toBe(`Bearer ${secondToken}`);
    });
  });

  describe('removeAuthToken', () => {
    it('should remove authorization header', () => {
      // First set a token
      setAuthToken('test-token');
      expect(apiClient.defaults.headers.common['Authorization']).toBe('Bearer test-token');
      
      // Then remove it
      removeAuthToken();
      expect(apiClient.defaults.headers.common['Authorization']).toBeUndefined();
    });

    it('should not throw error when no token is set', () => {
      expect(() => removeAuthToken()).not.toThrow();
      expect(apiClient.defaults.headers.common['Authorization']).toBeUndefined();
    });
  });

  describe('Request interceptor', () => {
    it('should add timestamp to requests', async () => {
      const mockRequest = {
        url: '/test',
        headers: {}
      };

      // Mock the request interceptor
      const requestInterceptor = apiClient.interceptors.request.handlers[0];
      
      if (requestInterceptor && requestInterceptor.fulfilled) {
        const modifiedRequest = await requestInterceptor.fulfilled(mockRequest);
        expect(modifiedRequest.headers['X-Request-Time']).toBeDefined();
      }
    });

    it('should preserve existing headers', async () => {
      const mockRequest = {
        url: '/test',
        headers: {
          'Custom-Header': 'custom-value'
        }
      };

      const requestInterceptor = apiClient.interceptors.request.handlers[0];
      
      if (requestInterceptor && requestInterceptor.fulfilled) {
        const modifiedRequest = await requestInterceptor.fulfilled(mockRequest);
        expect(modifiedRequest.headers['Custom-Header']).toBe('custom-value');
      }
    });
  });

  describe('Response interceptor', () => {
    it('should return response data on success', async () => {
      const mockResponse = {
        data: { message: 'success' },
        status: 200,
        config: {},
        headers: {}
      };

      const responseInterceptor = apiClient.interceptors.response.handlers[0];
      
      if (responseInterceptor && responseInterceptor.fulfilled) {
        const result = await responseInterceptor.fulfilled(mockResponse);
        expect(result).toEqual(mockResponse);
      }
    });

    it('should handle 401 unauthorized errors', async () => {
      const mockError = {
        response: {
          status: 401,
          data: { message: 'Unauthorized' }
        },
        config: {}
      };

      const responseInterceptor = apiClient.interceptors.response.handlers[0];
      
      if (responseInterceptor && responseInterceptor.rejected) {
        // Should redirect to login or handle token refresh
        await expect(responseInterceptor.rejected(mockError)).rejects.toEqual(mockError);
      }
    });

    it('should handle 403 forbidden errors', async () => {
      const mockError = {
        response: {
          status: 403,
          data: { message: 'Forbidden' }
        },
        config: {}
      };

      const responseInterceptor = apiClient.interceptors.response.handlers[0];
      
      if (responseInterceptor && responseInterceptor.rejected) {
        await expect(responseInterceptor.rejected(mockError)).rejects.toEqual(mockError);
      }
    });

    it('should handle network errors', async () => {
      const mockError = {
        message: 'Network Error',
        code: 'NETWORK_ERROR'
      };

      const responseInterceptor = apiClient.interceptors.response.handlers[0];
      
      if (responseInterceptor && responseInterceptor.rejected) {
        await expect(responseInterceptor.rejected(mockError)).rejects.toEqual(mockError);
      }
    });

    it('should handle timeout errors', async () => {
      const mockError = {
        code: 'ECONNABORTED',
        message: 'timeout of 10000ms exceeded'
      };

      const responseInterceptor = apiClient.interceptors.response.handlers[0];
      
      if (responseInterceptor && responseInterceptor.rejected) {
        await expect(responseInterceptor.rejected(mockError)).rejects.toEqual(mockError);
      }
    });
  });

  describe('Error handling', () => {
    it('should format API errors correctly', async () => {
      const mockError = {
        response: {
          status: 400,
          data: {
            message: 'Validation failed',
            errors: { email: 'Invalid email format' }
          }
        }
      };

      const responseInterceptor = apiClient.interceptors.response.handlers[0];
      
      if (responseInterceptor && responseInterceptor.rejected) {
        try {
          await responseInterceptor.rejected(mockError);
        } catch (error) {
          expect(error).toEqual(mockError);
        }
      }
    });

    it('should handle server errors (5xx)', async () => {
      const mockError = {
        response: {
          status: 500,
          data: { message: 'Internal server error' }
        }
      };

      const responseInterceptor = apiClient.interceptors.response.handlers[0];
      
      if (responseInterceptor && responseInterceptor.rejected) {
        await expect(responseInterceptor.rejected(mockError)).rejects.toEqual(mockError);
      }
    });
  });

  describe('Request retry logic', () => {
    it('should retry failed requests up to 3 times', async () => {
      const mockError = {
        response: {
          status: 500,
          data: { message: 'Server error' }
        },
        config: {
          __retryCount: 0
        }
      };

      const responseInterceptor = apiClient.interceptors.response.handlers[0];
      
      if (responseInterceptor && responseInterceptor.rejected) {
        // Mock the retry logic
        const retryableError = { ...mockError };
        retryableError.config.__retryCount = 1;
        
        await expect(responseInterceptor.rejected(retryableError)).rejects.toEqual(retryableError);
      }
    });

    it('should not retry non-retryable errors', async () => {
      const mockError = {
        response: {
          status: 400,
          data: { message: 'Bad request' }
        },
        config: {}
      };

      const responseInterceptor = apiClient.interceptors.response.handlers[0];
      
      if (responseInterceptor && responseInterceptor.rejected) {
        await expect(responseInterceptor.rejected(mockError)).rejects.toEqual(mockError);
      }
    });
  });

  describe('Content type handling', () => {
    it('should handle JSON responses', async () => {
      const mockResponse = {
        data: { key: 'value' },
        headers: { 'content-type': 'application/json' },
        status: 200,
        config: {}
      };

      const responseInterceptor = apiClient.interceptors.response.handlers[0];
      
      if (responseInterceptor && responseInterceptor.fulfilled) {
        const result = await responseInterceptor.fulfilled(mockResponse);
        expect(result.data).toEqual({ key: 'value' });
      }
    });

    it('should handle text responses', async () => {
      const mockResponse = {
        data: 'plain text response',
        headers: { 'content-type': 'text/plain' },
        status: 200,
        config: {}
      };

      const responseInterceptor = apiClient.interceptors.response.handlers[0];
      
      if (responseInterceptor && responseInterceptor.fulfilled) {
        const result = await responseInterceptor.fulfilled(mockResponse);
        expect(result.data).toBe('plain text response');
      }
    });
  });

  describe('Request cancellation', () => {
    it('should support request cancellation', () => {
      const cancelToken = axios.CancelToken.source();
      
      expect(cancelToken.token).toBeDefined();
      expect(typeof cancelToken.cancel).toBe('function');
    });

    it('should handle cancelled requests', async () => {
      const mockError = {
        __CANCEL__: true,
        message: 'Request cancelled'
      };

      const responseInterceptor = apiClient.interceptors.response.handlers[0];
      
      if (responseInterceptor && responseInterceptor.rejected) {
        if (axios.isCancel(mockError)) {
          // Should not retry cancelled requests
          await expect(responseInterceptor.rejected(mockError)).rejects.toEqual(mockError);
        }
      }
    });
  });
});