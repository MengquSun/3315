/**
 * Authentication Context
 * Manages global authentication state and provides auth methods
 */

import { User } from '@/types'
import React, { createContext, useContext, useEffect, useReducer } from 'react'
import toast from 'react-hot-toast'
import { authService } from '../services/authService'

// Authentication state interface
interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

// Authentication actions
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: User }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'AUTH_CLEAR_ERROR' }

// Authentication context interface
interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>
  signup: (email: string, password: string) => Promise<boolean>
  logout: () => void
  clearError: () => void
  refreshToken: () => Promise<boolean>
}

// Initial state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
}

// Authentication reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      }
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      }
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      }
    case 'AUTH_LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      }
    case 'AUTH_CLEAR_ERROR':
      return {
        ...state,
        error: null,
      }
    default:
      return state
  }
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Authentication provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Initialize authentication state on app start
  useEffect(() => {
    const initializeAuth = async () => {
      dispatch({ type: 'AUTH_START' })
      
      try {
        const token = authService.getToken()
        if (!token) {
          dispatch({ type: 'AUTH_FAILURE', payload: 'No token found' })
          return
        }

        // Validate stored token
        const user = await authService.validateToken()
        if (user) {
          dispatch({ type: 'AUTH_SUCCESS', payload: user })
        } else {
          // Token is invalid, try to refresh
          const refreshed = await refreshToken()
          if (!refreshed) {
            dispatch({ type: 'AUTH_FAILURE', payload: 'Session expired' })
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        dispatch({ type: 'AUTH_FAILURE', payload: 'Authentication failed' })
      }
    }

    initializeAuth()
  }, [])

  // Login function
  const login = async (email: string, password: string): Promise<boolean> => {
    dispatch({ type: 'AUTH_START' })
    
    try {
      const result = await authService.login(email, password)
      dispatch({ type: 'AUTH_SUCCESS', payload: result.user })
      toast.success('Welcome back!')
      return true
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Login failed'
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage })
      toast.error(errorMessage)
      return false
    }
  }

  // Signup function
  const signup = async (email: string, password: string): Promise<boolean> => {
    dispatch({ type: 'AUTH_START' })
    
    try {
      const result = await authService.signup(email, password)
      dispatch({ type: 'AUTH_SUCCESS', payload: result.user })
      toast.success('Account created successfully!')
      return true
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Signup failed'
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage })
      toast.error(errorMessage)
      return false
    }
  }

  // Logout function
  const logout = async () => {
    try {
      await authService.logout()
      dispatch({ type: 'AUTH_LOGOUT' })
      toast.success('Logged out successfully')
    } catch (error) {
      // Still logout on client side even if server logout fails
      dispatch({ type: 'AUTH_LOGOUT' })
      console.error('Logout error:', error)
    }
  }

  // Refresh token function
  const refreshToken = async (): Promise<boolean> => {
    try {
      const result = await authService.refreshToken()
      if (result) {
        dispatch({ type: 'AUTH_SUCCESS', payload: result.user })
        return true
      }
      return false
    } catch (error) {
      console.error('Token refresh error:', error)
      return false
    }
  }

  // Clear error function
  const clearError = () => {
    dispatch({ type: 'AUTH_CLEAR_ERROR' })
  }

  const contextValue: AuthContextType = {
    ...state,
    login,
    signup,
    logout,
    clearError,
    refreshToken,
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext