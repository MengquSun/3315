# Component Specifications & Interface Definitions
**Personal Task Management Application**

This document defines the key software components, modules, and interfaces for the Personal Task Management Application, providing detailed specifications for the development phase.

## Architecture Overview

Based on the 3-Tier Layered Architecture, components are organized into three main layers:

```
┌─────────────────────────────────────────┐
│           Frontend Components           │
│  (Presentation Layer)                   │
├─────────────────────────────────────────┤
│            Backend Services             │
│  (Business Logic Layer)                 │
├─────────────────────────────────────────┤
│           Database Models               │
│  (Data Access Layer)                    │
└─────────────────────────────────────────┘
```

## 1. Frontend Components (React.js)

### 1.1 Authentication Components

#### AuthContext
**Purpose**: Global authentication state management  
**Type**: React Context Provider

**Interface**:
```typescript
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
}
```

**Props**: None (Provider)  
**State**:
- `user`: Current user object
- `isAuthenticated`: Authentication status
- `isLoading`: Loading state for auth operations

#### LoginForm
**Purpose**: User authentication interface  
**Type**: React Functional Component

**Interface**:
```typescript
interface LoginFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  redirectTo?: string;
}

interface LoginFormState {
  email: string;
  password: string;
  rememberMe: boolean;
  isSubmitting: boolean;
  errors: ValidationErrors;
}
```

**Methods**:
- `handleSubmit()`: Form submission handler
- `validateForm()`: Client-side validation
- `resetForm()`: Clear form fields

#### SignupForm
**Purpose**: User registration interface  
**Type**: React Functional Component

**Interface**:
```typescript
interface SignupFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

interface SignupFormState {
  email: string;
  password: string;
  confirmPassword: string;
  isSubmitting: boolean;
  errors: ValidationErrors;
}
```

### 1.2 Task Management Components

#### TaskList
**Purpose**: Display list of tasks with filtering/sorting  
**Type**: React Functional Component

**Interface**:
```typescript
interface TaskListProps {
  tasks: Task[];
  filter: TaskFilter;
  sortBy: SortCriteria;
  onTaskUpdate: (task: Task) => void;
  onTaskDelete: (taskId: string) => void;
  onTaskComplete: (taskId: string) => void;
}

interface TaskListState {
  selectedTasks: string[];
  isLoading: boolean;
  error: string | null;
}
```

**Methods**:
- `handleTaskSelect()`: Multi-select functionality
- `handleBulkActions()`: Bulk operations
- `refreshTasks()`: Reload task list

#### TaskItem
**Purpose**: Individual task display with actions  
**Type**: React Functional Component

**Interface**:
```typescript
interface TaskItemProps {
  task: Task;
  isSelected?: boolean;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onComplete: (taskId: string) => void;
  onSelect?: (taskId: string, selected: boolean) => void;
}
```

**Methods**:
- `handleQuickEdit()`: Inline editing
- `formatDueDate()`: Date display formatting
- `getPriorityColor()`: Priority styling

#### TaskForm
**Purpose**: Create/edit task interface  
**Type**: React Functional Component

**Interface**:
```typescript
interface TaskFormProps {
  task?: Task; // undefined for new task
  isOpen: boolean;
  onSave: (task: TaskInput) => Promise<void>;
  onCancel: () => void;
}

interface TaskFormState {
  title: string;
  description: string;
  dueDate: Date | null;
  priority: Priority;
  isSubmitting: boolean;
  errors: ValidationErrors;
}
```

**Methods**:
- `validateTask()`: Form validation
- `handleSave()`: Save task handler
- `resetForm()`: Clear/reset form

#### TaskFilter
**Purpose**: Filter and sort controls  
**Type**: React Functional Component

**Interface**:
```typescript
interface TaskFilterProps {
  currentFilter: TaskFilter;
  currentSort: SortCriteria;
  onFilterChange: (filter: TaskFilter) => void;
  onSortChange: (sort: SortCriteria) => void;
  taskCounts: TaskCounts;
}

interface TaskCounts {
  active: number;
  completed: number;
  overdue: number;
  total: number;
}
```

### 1.3 Layout Components

#### AppLayout
**Purpose**: Main application layout with navigation  
**Type**: React Functional Component

**Interface**:
```typescript
interface AppLayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
}
```

**Features**:
- Responsive navigation
- Mobile hamburger menu
- User profile dropdown
- Notification area

#### Header
**Purpose**: Application header with user controls  
**Type**: React Functional Component

**Interface**:
```typescript
interface HeaderProps {
  user: User;
  onMenuToggle: () => void;
  onLogout: () => void;
}
```

#### Sidebar
**Purpose**: Navigation sidebar  
**Type**: React Functional Component

**Interface**:
```typescript
interface SidebarProps {
  isOpen: boolean;
  currentPath: string;
  onClose: () => void;
}
```

### 1.4 Utility Components

#### LoadingSpinner
**Purpose**: Loading state indicator  
**Type**: React Functional Component

**Interface**:
```typescript
interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
}
```

#### ErrorBoundary
**Purpose**: Error handling and display  
**Type**: React Class Component

**Interface**:
```typescript
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{error: Error}>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}
```

#### Modal
**Purpose**: Modal dialog component  
**Type**: React Functional Component

**Interface**:
```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large';
}
```

## 2. Backend Services (Node.js/Express)

### 2.1 Authentication Service

#### AuthService
**Purpose**: Handle all authentication operations  
**Type**: Service Class

**Interface**:
```typescript
class AuthService {
  signup(email: string, password: string): Promise<User>;
  login(email: string, password: string): Promise<AuthResult>;
  logout(token: string): Promise<void>;
  validateToken(token: string): Promise<User>;
  refreshToken(refreshToken: string): Promise<AuthResult>;
  resetPassword(email: string): Promise<void>;
  
  private hashPassword(password: string): Promise<string>;
  private verifyPassword(password: string, hash: string): Promise<boolean>;
  private generateTokens(user: User): AuthTokens;
}

interface AuthResult {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
```

**Dependencies**:
- `bcrypt`: Password hashing
- `jsonwebtoken`: JWT token generation
- `DatabaseService`: User data access

### 2.2 Task Service

#### TaskService
**Purpose**: Handle all task-related business logic  
**Type**: Service Class

**Interface**:
```typescript
class TaskService {
  createTask(userId: string, taskData: TaskInput): Promise<Task>;
  getTasks(userId: string, filter?: TaskFilter): Promise<Task[]>;
  getTaskById(userId: string, taskId: string): Promise<Task>;
  updateTask(userId: string, taskId: string, updates: Partial<TaskInput>): Promise<Task>;
  deleteTask(userId: string, taskId: string): Promise<void>;
  completeTask(userId: string, taskId: string): Promise<Task>;
  getCompletedTasks(userId: string, limit?: number): Promise<Task[]>;
  
  private validateTaskData(taskData: TaskInput): ValidationResult;
  private applyFilter(tasks: Task[], filter: TaskFilter): Task[];
  private sortTasks(tasks: Task[], sortBy: SortCriteria): Task[];
}

interface TaskInput {
  title: string;
  description?: string;
  dueDate?: Date;
  priority: Priority;
}

interface TaskFilter {
  status?: TaskStatus[];
  priority?: Priority[];
  dueDateRange?: DateRange;
  search?: string;
}
```

**Dependencies**:
- `DatabaseService`: Task data access
- `ValidationService`: Input validation

### 2.3 API Controllers

#### AuthController
**Purpose**: Handle authentication HTTP requests  
**Type**: Express Controller

**Interface**:
```typescript
class AuthController {
  signup(req: Request, res: Response): Promise<void>;
  login(req: Request, res: Response): Promise<void>;
  logout(req: Request, res: Response): Promise<void>;
  refresh(req: Request, res: Response): Promise<void>;
  profile(req: Request, res: Response): Promise<void>;
  
  private handleError(error: Error, res: Response): void;
  private sendAuthResponse(res: Response, authResult: AuthResult): void;
}
```

#### TaskController
**Purpose**: Handle task HTTP requests  
**Type**: Express Controller

**Interface**:
```typescript
class TaskController {
  getTasks(req: Request, res: Response): Promise<void>;
  createTask(req: Request, res: Response): Promise<void>;
  updateTask(req: Request, res: Response): Promise<void>;
  deleteTask(req: Request, res: Response): Promise<void>;
  completeTask(req: Request, res: Response): Promise<void>;
  getCompletedTasks(req: Request, res: Response): Promise<void>;
  
  private validateRequest(req: Request): ValidationResult;
  private extractUserId(req: Request): string;
  private buildFilter(query: any): TaskFilter;
}
```

### 2.4 Middleware

#### AuthMiddleware
**Purpose**: JWT token validation  
**Type**: Express Middleware

**Interface**:
```typescript
interface AuthMiddleware {
  authenticate(req: Request, res: Response, next: NextFunction): Promise<void>;
  authorize(roles: string[]): RequestHandler;
  
  extractToken(req: Request): string | null;
  validateToken(token: string): Promise<User>;
}
```

#### ValidationMiddleware
**Purpose**: Request validation  
**Type**: Express Middleware

**Interface**:
```typescript
interface ValidationMiddleware {
  validateTaskInput(req: Request, res: Response, next: NextFunction): void;
  validateAuthInput(req: Request, res: Response, next: NextFunction): void;
  validateQueryParams(schema: any): RequestHandler;
}
```

## 3. Database Layer

### 3.1 Data Models

#### User Model
**Purpose**: User data structure and operations  
**Type**: Database Model

**Schema**:
```typescript
interface UserSchema {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
}

class UserModel {
  static create(userData: UserInput): Promise<User>;
  static findById(id: string): Promise<User | null>;
  static findByEmail(email: string): Promise<User | null>;
  static update(id: string, updates: Partial<UserInput>): Promise<User>;
  static delete(id: string): Promise<void>;
  
  static indexes = ['email', 'createdAt'];
}
```

#### Task Model
**Purpose**: Task data structure and operations  
**Type**: Database Model

**Schema**:
```typescript
interface TaskSchema {
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

class TaskModel {
  static create(taskData: TaskInput): Promise<Task>;
  static findById(id: string): Promise<Task | null>;
  static findByUserId(userId: string, filter?: TaskFilter): Promise<Task[]>;
  static update(id: string, updates: Partial<TaskInput>): Promise<Task>;
  static delete(id: string): Promise<void>;
  static markComplete(id: string): Promise<Task>;
  
  static indexes = ['userId', 'status', 'dueDate', 'priority', 'createdAt'];
}
```

### 3.2 Database Service

#### DatabaseService
**Purpose**: Database connection and operations  
**Type**: Service Class

**Interface**:
```typescript
class DatabaseService {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  
  // Generic CRUD operations
  findOne<T>(collection: string, criteria: any): Promise<T | null>;
  findMany<T>(collection: string, criteria: any, options?: QueryOptions): Promise<T[]>;
  createOne<T>(collection: string, data: any): Promise<T>;
  updateOne<T>(collection: string, id: string, updates: any): Promise<T>;
  deleteOne(collection: string, id: string): Promise<void>;
  
  // Transaction support
  withTransaction<T>(operation: () => Promise<T>): Promise<T>;
  
  // Health checks
  isConnected(): boolean;
  getStats(): DatabaseStats;
}

interface QueryOptions {
  sort?: any;
  limit?: number;
  skip?: number;
  select?: string[];
}
```

## 4. Shared Types & Interfaces

### 4.1 Common Types

```typescript
// User types
interface User {
  id: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

// Task types
interface Task {
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

enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

enum TaskStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  DELETED = 'deleted'
}

// Utility types
interface ValidationResult {
  isValid: boolean;
  errors: ValidationErrors;
}

interface ValidationErrors {
  [field: string]: string[];
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
```

### 4.2 API Contracts

#### Authentication Endpoints
```typescript
// POST /api/auth/signup
interface SignupRequest {
  email: string;
  password: string;
}

interface SignupResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// POST /api/auth/login
interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}
```

#### Task Endpoints
```typescript
// GET /api/tasks
interface GetTasksQuery {
  status?: string;
  priority?: string;
  search?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

interface GetTasksResponse {
  tasks: Task[];
  total: number;
  page: number;
  hasMore: boolean;
}

// POST /api/tasks
interface CreateTaskRequest {
  title: string;
  description?: string;
  dueDate?: string; // ISO date string
  priority: Priority;
}

interface CreateTaskResponse {
  task: Task;
}
```

## 5. Integration Specifications

### 5.1 Frontend-Backend Communication

#### HTTP Client Configuration
```typescript
interface ApiClient {
  baseURL: string;
  timeout: number;
  headers: {
    'Content-Type': 'application/json';
    'Authorization'?: string;
  };
  
  // Interceptors
  requestInterceptor: (config: RequestConfig) => RequestConfig;
  responseInterceptor: (response: Response) => Response;
  errorInterceptor: (error: ApiError) => Promise<ApiError>;
}
```

#### State Management Integration
```typescript
// Redux/Context integration
interface AppState {
  auth: AuthState;
  tasks: TaskState;
  ui: UIState;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface TaskState {
  tasks: Task[];
  completedTasks: Task[];
  filter: TaskFilter;
  sortBy: SortCriteria;
  isLoading: boolean;
  error: string | null;
}
```

### 5.2 Database Integration

#### Connection Configuration
```typescript
interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username?: string;
  password?: string;
  ssl?: boolean;
  poolSize?: number;
  connectionTimeout?: number;
}
```

## 6. Error Handling Strategy

### 6.1 Error Types
```typescript
enum ErrorType {
  VALIDATION_ERROR = 'validation_error',
  AUTHENTICATION_ERROR = 'authentication_error',
  AUTHORIZATION_ERROR = 'authorization_error',
  NOT_FOUND_ERROR = 'not_found_error',
  DATABASE_ERROR = 'database_error',
  NETWORK_ERROR = 'network_error',
  UNKNOWN_ERROR = 'unknown_error'
}

interface AppError {
  type: ErrorType;
  message: string;
  code: string;
  details?: any;
  stack?: string;
}
```

### 6.2 Error Handling Components
```typescript
interface ErrorHandler {
  handleError(error: AppError): void;
  logError(error: AppError): void;
  notifyUser(error: AppError): void;
  reportError(error: AppError): void;
}
```

## 7. Performance Considerations

### 7.1 Frontend Optimization
- **Code Splitting**: Lazy load components
- **Memoization**: React.memo for expensive renders
- **Virtual Scrolling**: For large task lists
- **Debouncing**: Search and filter inputs

### 7.2 Backend Optimization
- **Caching**: Redis for session and frequent queries
- **Database Indexing**: Optimized queries
- **Pagination**: Limit data transfer
- **Connection Pooling**: Efficient database connections

### 7.3 Database Optimization
- **Indexes**: On frequently queried fields
- **Query Optimization**: Efficient database queries
- **Data Archiving**: Move old completed tasks

## Implementation Notes

This component specification provides the foundation for Phase 3 development. Each component includes:

- **Clear Interface Contracts**: TypeScript interfaces for type safety
- **Dependency Mapping**: Understanding of component relationships
- **Error Handling**: Consistent error management strategy
- **Performance Considerations**: Built-in optimization strategies

The modular design supports the solo development approach while maintaining code quality and scalability for future enhancements.