/**
 * Shared TypeScript type definitions for the Personal Task Management Application
 * Used across both frontend and backend components
 */

// User types
export interface User {
  id: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

export interface UserInput {
  email: string;
  password: string;
}

export interface UserSchema extends User {
  passwordHash: string;
  isActive: boolean;
}

// Task types
export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  dueDate?: Date;
  priority: Priority;
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface TaskInput {
  title: string;
  description?: string;
  dueDate?: Date;
  priority: Priority;
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export enum TaskStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  DELETED = 'deleted'
}

// Filter and sorting types
export interface TaskFilter {
  status?: TaskStatus[];
  priority?: Priority[];
  dueDateRange?: DateRange;
  search?: string;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface SortCriteria {
  field: 'dueDate' | 'priority' | 'createdAt' | 'title';
  order: 'asc' | 'desc';
}

export interface TaskCounts {
  active: number;
  completed: number;
  overdue: number;
  total: number;
}

// Authentication types
export interface AuthResult {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Validation types
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationErrors;
}

export interface ValidationErrors {
  [field: string]: string[];
}

// Error types
export enum ErrorType {
  VALIDATION_ERROR = 'validation_error',
  AUTHENTICATION_ERROR = 'authentication_error',
  AUTHORIZATION_ERROR = 'authorization_error',
  NOT_FOUND_ERROR = 'not_found_error',
  DATABASE_ERROR = 'database_error',
  NETWORK_ERROR = 'network_error',
  UNKNOWN_ERROR = 'unknown_error'
}

export interface AppError {
  type: ErrorType;
  message: string;
  code: string;
  details?: any;
  stack?: string;
}

// API request/response interfaces

// Authentication endpoints
export interface SignupRequest {
  email: string;
  password: string;
}

export interface SignupResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// Task endpoints
export interface GetTasksQuery {
  status?: string;
  priority?: string;
  search?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface GetTasksResponse {
  tasks: Task[];
  total: number;
  page: number;
  hasMore: boolean;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  dueDate?: string; // ISO date string
  priority: Priority;
}

export interface CreateTaskResponse {
  task: Task;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  dueDate?: string; // ISO date string
  priority?: Priority;
}

export interface UpdateTaskResponse {
  task: Task;
}

// Database configuration
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username?: string;
  password?: string;
  ssl?: boolean;
  poolSize?: number;
  connectionTimeout?: number;
}

// Query options
export interface QueryOptions {
  sort?: any;
  limit?: number;
  skip?: number;
  select?: string[];
}

// Database statistics
export interface DatabaseStats {
  connectionCount: number;
  activeQueries: number;
  uptime: number;
  version: string;
}

// Application state interfaces (for frontend)
export interface AppState {
  auth: AuthState;
  tasks: TaskState;
  ui: UIState;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface TaskState {
  tasks: Task[];
  completedTasks: Task[];
  filter: TaskFilter;
  sortBy: SortCriteria;
  isLoading: boolean;
  error: string | null;
}

export interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  notifications: Notification[];
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  timestamp: Date;
  read: boolean;
}

// HTTP client configuration
export interface RequestConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers: Record<string, string>;
  data?: any;
  params?: Record<string, any>;
}

export interface ApiError {
  message: string;
  status: number;
  code: string;
  details?: any;
}