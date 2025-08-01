/**
 * Authentication Service
 * Handles all authentication-related API calls
 */

import {
    ApiResponse,
    AuthResult,
    User
} from '@/types'
import { apiClient, tokenManager } from './api'

class AuthService {
  /**
   * User login
   */
  async login(email: string, password: string): Promise<AuthResult> {
    const response = await apiClient.post<ApiResponse<AuthResult>>('/auth/login', {
      email,
      password,
    })

    if (response.success && response.data) {
      // Store tokens
      tokenManager.setToken(response.data.accessToken)
      tokenManager.setRefreshToken(response.data.refreshToken)
      
      return response.data
    }

    throw new Error(response.error || 'Login failed')
  }

  /**
   * User signup
   */
  async signup(email: string, password: string): Promise<AuthResult> {
    const response = await apiClient.post<ApiResponse<AuthResult>>('/auth/signup', {
      email,
      password,
    })

    if (response.success && response.data) {
      // Store tokens
      tokenManager.setToken(response.data.accessToken)
      tokenManager.setRefreshToken(response.data.refreshToken)
      
      return response.data
    }

    throw new Error(response.error || 'Signup failed')
  }

  /**
   * User logout
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout')
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout API error:', error)
    } finally {
      // Always clear tokens on logout
      tokenManager.clearTokens()
    }
  }

  /**
   * Validate current token
   */
  async validateToken(): Promise<User | null> {
    try {
      const token = tokenManager.getToken()
      if (!token) {
        return null
      }

      const response = await apiClient.get<ApiResponse<{ user: User; valid: boolean }>>('/auth/validate')
      
      if (response.success && response.data?.valid) {
        return response.data.user
      }

      return null
    } catch (error) {
      console.error('Token validation error:', error)
      return null
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<AuthResult | null> {
    try {
      const refreshToken = tokenManager.getRefreshToken()
      if (!refreshToken) {
        return null
      }

      const response = await apiClient.post<ApiResponse<AuthResult>>('/auth/refresh', {
        refreshToken,
      })

      if (response.success && response.data) {
        // Update stored tokens
        tokenManager.setToken(response.data.accessToken)
        tokenManager.setRefreshToken(response.data.refreshToken)
        
        return response.data
      }

      return null
    } catch (error) {
      console.error('Token refresh error:', error)
      // Clear invalid tokens
      tokenManager.clearTokens()
      return null
    }
  }

  /**
   * Get user profile
   */
  async getProfile(): Promise<User> {
    const response = await apiClient.get<ApiResponse<{ user: User }>>('/auth/profile')
    
    if (response.success && response.data) {
      return response.data.user
    }

    throw new Error(response.error || 'Failed to get user profile')
  }

  /**
   * Reset password
   */
  async resetPassword(email: string): Promise<void> {
    const response = await apiClient.post<ApiResponse<void>>('/auth/reset-password', {
      email,
    })

    if (!response.success) {
      throw new Error(response.error || 'Password reset failed')
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!tokenManager.getToken()
  }

  /**
   * Get stored access token
   */
  getToken(): string | null {
    return tokenManager.getToken()
  }

  /**
   * Get stored refresh token
   */
  getRefreshToken(): string | null {
    return tokenManager.getRefreshToken()
  }

  /**
   * Clear all stored tokens
   */
  clearTokens(): void {
    tokenManager.clearTokens()
  }
}

// Export singleton instance
export const authService = new AuthService()
export default authService