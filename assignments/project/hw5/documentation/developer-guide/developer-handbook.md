# Developer Handbook
**Personal Task Management Application - Technical Guide**

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Development Environment Setup](#development-environment-setup)
3. [Code Organization](#code-organization)
4. [API Reference](#api-reference)
5. [Database Design](#database-design)
6. [Frontend Development](#frontend-development)
7. [Backend Development](#backend-development)
8. [Testing Guidelines](#testing-guidelines)
9. [Deployment & Operations](#deployment--operations)
10. [Contributing Guidelines](#contributing-guidelines)

## Architecture Overview

### System Architecture
The Personal Task Management Application follows a **3-tier layered architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                          │
│                                                                 │
│  React 18 + TypeScript + Vite                                 │
│  ├── Components (UI Elements)                                  │
│  ├── Pages (Route Components)                                  │
│  ├── Context (State Management)                                │
│  ├── Hooks (Business Logic)                                    │
│  └── Services (API Communication)                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                                │
                        ┌───────▼───────┐
                        │  HTTP/HTTPS   │
                        │  REST API     │
                        │  JSON         │
                        └───────┬───────┘
                                │
┌─────────────────────────────────────────────────────────────────┐
│                     BUSINESS LOGIC LAYER                       │
│                                                                 │
│  Node.js + Express + TypeScript                                │
│  ├── Controllers (Request Handling)                            │
│  ├── Services (Business Logic)                                 │
│  ├── Middleware (Cross-cutting Concerns)                       │
│  ├── Routes (API Endpoints)                                    │
│  └── Utils (Helper Functions)                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                                │
                        ┌───────▼───────┐
                        │  Firebase SDK │
                        │  Authentication│
                        └───────┬───────┘
                                │
┌─────────────────────────────────────────────────────────────────┐
│                      DATA PERSISTENCE LAYER                    │
│                                                                 │
│  Firebase Firestore (NoSQL Document Database)                  │
│  ├── Collections (Data Organization)                           │
│  ├── Documents (Data Storage)                                  │
│  ├── Indexes (Query Optimization)                              │
│  └── Security Rules (Access Control)                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Technology Stack

#### Frontend Stack
- **Framework**: React 18.2.0 with Hooks and Functional Components
- **Language**: TypeScript 5.0+ for type safety
- **Build Tool**: Vite 4.4+ for fast development and optimized builds
- **Styling**: CSS Modules with modern CSS features
- **State Management**: React Context API + React Query
- **Routing**: React Router 6.14+ for SPA navigation
- **HTTP Client**: Axios for API communication
- **Form Handling**: React Hook Form for efficient form management
- **Testing**: Vitest + React Testing Library

#### Backend Stack
- **Runtime**: Node.js 18+ LTS
- **Framework**: Express.js 4.18+ for RESTful API
- **Language**: TypeScript 5.1+ for type safety
- **Authentication**: JWT (JSON Web Tokens) with bcrypt
- **Database**: Firebase Firestore (NoSQL)
- **Validation**: Joi for request validation
- **Security**: Helmet, CORS, rate limiting
- **Testing**: Jest with ts-jest
- **Process Management**: PM2 for production

#### Development Tools
- **Package Manager**: npm 8+
- **Linting**: ESLint with TypeScript rules
- **Formatting**: Prettier for consistent code style
- **Version Control**: Git with conventional commits
- **CI/CD**: GitHub Actions (ready for implementation)

## Development Environment Setup

### Prerequisites
- **Node.js**: Version 18.0 or higher
- **npm**: Version 8.0 or higher  
- **Git**: Version 2.30 or higher
- **Firebase Account**: For database and authentication
- **Code Editor**: VS Code recommended with extensions

### Required VS Code Extensions
```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "ms-vscode.vscode-json",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

### Project Setup

#### 1. Clone the Repository
```bash
git clone https://github.com/MengquSun/3315.git
cd 3315/3315/assignments/project/hw3
```

#### 2. Install Dependencies
```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install

# Return to project root
cd ..
```

#### 3. Environment Configuration

##### Backend Environment (.env)
```bash
cd backend
cp .env.example .env
```

```env
# Development Environment
NODE_ENV=development
PORT=3001

# Database Configuration
FIREBASE_PROJECT_ID=your-dev-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com

# JWT Configuration
JWT_SECRET=your-development-jwt-secret-at-least-32-characters
JWT_EXPIRE=24h

# CORS Configuration
FRONTEND_URL=http://localhost:5173

# Security
BCRYPT_ROUNDS=10

# Logging
LOG_LEVEL=debug
```

##### Frontend Environment (.env.development)
```bash
cd ../frontend
```

```env
# Development Frontend Configuration
VITE_API_BASE_URL=http://localhost:3001/api
VITE_APP_NAME=Personal Task Manager (Dev)
VITE_APP_VERSION=1.0.0
```

#### 4. Firebase Setup
1. Create a Firebase project for development
2. Enable Firestore Database
3. Configure Authentication (Email/Password)
4. Generate service account key
5. Update environment variables

### Development Workflow

#### Starting Development Servers
```bash
# Terminal 1: Start backend server
cd backend
npm run dev

# Terminal 2: Start frontend server  
cd frontend
npm run dev
```

#### Development URLs
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **API Health Check**: http://localhost:3001/api/health

## Code Organization

### Project Structure
```
hw3/
├── backend/                    # Node.js/Express API
│   ├── src/
│   │   ├── controllers/        # Request handlers
│   │   │   ├── AuthController.ts
│   │   │   └── TaskController.ts
│   │   ├── services/           # Business logic
│   │   │   ├── AuthService.ts
│   │   │   ├── TaskService.ts
│   │   │   └── DatabaseService.ts
│   │   ├── middleware/         # Express middleware
│   │   │   ├── authMiddleware.ts
│   │   │   ├── errorHandler.ts
│   │   │   └── validationMiddleware.ts
│   │   ├── routes/             # API route definitions
│   │   │   ├── authRoutes.ts
│   │   │   └── taskRoutes.ts
│   │   ├── types/              # TypeScript type definitions
│   │   ├── utils/              # Utility functions
│   │   └── app.ts              # Express application setup
│   ├── tests/                  # Test files
│   ├── package.json            # Dependencies and scripts
│   └── tsconfig.json           # TypeScript configuration
├── frontend/                   # React application
│   ├── src/
│   │   ├── components/         # React components
│   │   │   ├── auth/           # Authentication components
│   │   │   ├── tasks/          # Task management components
│   │   │   ├── layout/         # Layout components
│   │   │   └── common/         # Reusable components
│   │   ├── pages/              # Page components
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── TasksPage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   └── SignupPage.tsx
│   │   ├── services/           # API client services
│   │   │   ├── api.ts
│   │   │   ├── authService.ts
│   │   │   └── taskService.ts
│   │   ├── context/            # React context providers
│   │   │   └── AuthContext.tsx
│   │   ├── hooks/              # Custom React hooks
│   │   ├── types/              # TypeScript interfaces
│   │   ├── utils/              # Utility functions
│   │   ├── styles/             # CSS and styling
│   │   ├── App.tsx             # Main application component
│   │   └── main.tsx            # Application entry point
│   ├── public/                 # Static assets
│   ├── tests/                  # Test files
│   ├── package.json            # Dependencies and scripts
│   └── tsconfig.json           # TypeScript configuration
├── shared/                     # Shared code between frontend/backend
│   └── types.ts                # Common TypeScript interfaces
└── docs/                       # Documentation
    ├── api.md                  # API documentation
    └── setup.md                # Setup instructions
```

### Naming Conventions

#### Files and Directories
- **Components**: PascalCase (e.g., `TaskList.tsx`, `UserProfile.tsx`)
- **Services**: camelCase with Service suffix (e.g., `authService.ts`)
- **Utilities**: camelCase (e.g., `dateUtils.ts`, `validation.ts`)
- **Types**: PascalCase with `.types.ts` suffix (e.g., `Task.types.ts`)
- **Tests**: Same as file being tested with `.test.ts` suffix

#### Code Elements
- **Interfaces**: PascalCase with descriptive names (e.g., `Task`, `User`, `ApiResponse`)
- **Functions**: camelCase with verb-noun pattern (e.g., `createTask`, `validateEmail`)
- **Variables**: camelCase with descriptive names (e.g., `userTasks`, `isLoading`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`, `DEFAULT_PAGE_SIZE`)
- **Enums**: PascalCase (e.g., `TaskPriority`, `UserRole`)

## API Reference

### Authentication Endpoints

#### POST /api/auth/signup
Create a new user account.

**Request Body:**
```typescript
{
  email: string;      // Valid email address
  password: string;   // Minimum 8 characters
  displayName?: string; // Optional display name
}
```

**Response:**
```typescript
{
  success: boolean;
  data: {
    user: {
      id: string;
      email: string;
      displayName: string;
      createdAt: string;
    };
    token: string;
  };
  message: string;
}
```

#### POST /api/auth/login
Authenticate user and receive JWT token.

**Request Body:**
```typescript
{
  email: string;
  password: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  data: {
    user: {
      id: string;
      email: string;
      displayName: string;
      lastLoginAt: string;
    };
    token: string;
  };
  message: string;
}
```

#### POST /api/auth/logout
Logout user (client-side token removal).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```typescript
{
  success: boolean;
  message: string;
}
```

### Task Management Endpoints

#### GET /api/tasks
Retrieve user's tasks with optional filtering.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
```typescript
{
  completed?: boolean;     // Filter by completion status
  priority?: 'low' | 'medium' | 'high'; // Filter by priority
  search?: string;         // Search in title and description
  sortBy?: 'createdAt' | 'dueDate' | 'priority' | 'title';
  sortOrder?: 'asc' | 'desc';
  limit?: number;          // Pagination limit
  offset?: number;         // Pagination offset
}
```

**Response:**
```typescript
{
  success: boolean;
  data: {
    tasks: Task[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  };
}
```

#### POST /api/tasks
Create a new task.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```typescript
{
  title: string;              // Required, non-empty
  description?: string;       // Optional
  dueDate?: string;          // Optional, ISO date string
  priority: 'low' | 'medium' | 'high'; // Default: 'medium'
}
```

**Response:**
```typescript
{
  success: boolean;
  data: {
    task: Task;
  };
  message: string;
}
```

#### PUT /api/tasks/:id
Update an existing task.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```typescript
{
  title?: string;
  description?: string;
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high';
  completed?: boolean;
}
```

#### DELETE /api/tasks/:id
Delete a task.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```typescript
{
  success: boolean;
  message: string;
}
```

### Data Models

#### Task Interface
```typescript
interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string | null;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}
```

#### User Interface
```typescript
interface User {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
  lastLoginAt: string;
}
```

## Database Design

### Firestore Collections

#### users Collection
```typescript
// Document ID: auto-generated user ID
{
  email: string;           // Unique user email
  displayName: string;     // User's display name
  passwordHash: string;    // bcrypt hashed password
  createdAt: Timestamp;    // Account creation date
  lastLoginAt: Timestamp;  // Last login timestamp
  isActive: boolean;       // Account status
}
```

#### tasks Collection
```typescript
// Document ID: auto-generated task ID
{
  title: string;           // Task title (required)
  description: string;     // Task description (optional)
  dueDate: Timestamp | null; // Due date (optional)
  priority: string;        // 'low' | 'medium' | 'high'
  completed: boolean;      // Completion status
  userId: string;          // Reference to user ID
  createdAt: Timestamp;    // Creation timestamp
  updatedAt: Timestamp;    // Last update timestamp
}
```

### Database Indexes

#### Composite Indexes
```javascript
// tasks collection indexes for optimal query performance
[
  {
    fields: ['userId', 'completed', 'createdAt'],
    order: ['ASC', 'ASC', 'DESC']
  },
  {
    fields: ['userId', 'priority', 'dueDate'],
    order: ['ASC', 'ASC', 'ASC']
  },
  {
    fields: ['userId', 'dueDate', 'completed'],
    order: ['ASC', 'ASC', 'ASC']
  }
]
```

### Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Tasks are private to each user
    match /tasks/{taskId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
    }
  }
}
```

## Frontend Development

### Component Architecture

#### Component Hierarchy
```
App
├── AuthProvider (Context)
├── Router
│   ├── ProtectedRoute
│   │   ├── Layout
│   │   │   ├── Header
│   │   │   ├── Sidebar (mobile)
│   │   │   └── Main Content
│   │   │       ├── DashboardPage
│   │   │       ├── TasksPage
│   │   │       │   ├── TaskFilters
│   │   │       │   ├── TaskList
│   │   │       │   │   └── TaskItem
│   │   │       │   └── TaskForm
│   │   │       └── CompletedTasksPage
│   ├── LoginPage
│   └── SignupPage
└── GlobalComponents
    ├── ErrorBoundary
    ├── LoadingSpinner
    └── Modal
```

#### Component Design Patterns

##### 1. Container/Presentation Pattern
```typescript
// Container Component (Smart)
const TasksPageContainer: React.FC = () => {
  const { data: tasks, isLoading, error } = useTasksQuery();
  const { mutate: createTask } = useCreateTaskMutation();
  
  return (
    <TasksPage
      tasks={tasks}
      isLoading={isLoading}
      error={error}
      onCreateTask={createTask}
    />
  );
};

// Presentation Component (Dumb)
interface TasksPageProps {
  tasks: Task[];
  isLoading: boolean;
  error: Error | null;
  onCreateTask: (task: CreateTaskData) => void;
}

const TasksPage: React.FC<TasksPageProps> = ({
  tasks,
  isLoading,
  error,
  onCreateTask
}) => {
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return (
    <div>
      <TaskForm onSubmit={onCreateTask} />
      <TaskList tasks={tasks} />
    </div>
  );
};
```

##### 2. Custom Hooks Pattern
```typescript
// useTaskManagement hook
export const useTaskManagement = () => {
  const queryClient = useQueryClient();
  
  const tasksQuery = useQuery({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  const createTaskMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      toast.success('Task created successfully!');
    },
    onError: (error) => {
      toast.error('Failed to create task');
    },
  });
  
  const updateTaskMutation = useMutation({
    mutationFn: updateTask,
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
    },
  });
  
  return {
    tasks: tasksQuery.data,
    isLoading: tasksQuery.isLoading,
    error: tasksQuery.error,
    createTask: createTaskMutation.mutate,
    updateTask: updateTaskMutation.mutate,
    isCreating: createTaskMutation.isLoading,
    isUpdating: updateTaskMutation.isLoading,
  };
};
```

### State Management Strategy

#### React Context for Authentication
```typescript
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  signup: (userData: SignupData) => Promise<void>;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Implementation details...
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
```

#### React Query for Server State
```typescript
// Query keys factory
export const queryKeys = {
  all: ['tasks'] as const,
  lists: () => [...queryKeys.all, 'list'] as const,
  list: (filters: TaskFilters) => [...queryKeys.lists(), filters] as const,
  details: () => [...queryKeys.all, 'detail'] as const,
  detail: (id: string) => [...queryKeys.details(), id] as const,
};

// Query functions
export const taskQueries = {
  all: (filters?: TaskFilters) =>
    useQuery({
      queryKey: queryKeys.list(filters || {}),
      queryFn: () => fetchTasks(filters),
    }),
  
  detail: (id: string) =>
    useQuery({
      queryKey: queryKeys.detail(id),
      queryFn: () => fetchTask(id),
      enabled: !!id,
    }),
};
```

### Styling Guidelines

#### CSS Modules Structure
```css
/* TaskItem.module.css */
.taskItem {
  display: flex;
  align-items: center;
  padding: 1rem;
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  background: var(--background-color);
  transition: all 0.2s ease;
}

.taskItem:hover {
  border-color: var(--primary-color);
  box-shadow: 0 2px 8px var(--shadow-color);
}

.taskItem--completed {
  opacity: 0.7;
}

.taskItem--completed .taskTitle {
  text-decoration: line-through;
}

.taskTitle {
  flex: 1;
  font-weight: 500;
  color: var(--text-primary);
}

.taskPriority--high {
  border-left: 4px solid var(--error-color);
}

.taskPriority--medium {
  border-left: 4px solid var(--warning-color);
}

.taskPriority--low {
  border-left: 4px solid var(--success-color);
}
```

#### CSS Custom Properties
```css
/* globals.css */
:root {
  /* Colors */
  --primary-color: #3b82f6;
  --secondary-color: #64748b;
  --success-color: #10b981;
  --warning-color: #f59e0b;
  --error-color: #ef4444;
  
  /* Typography */
  --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  
  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  
  /* Layout */
  --max-width: 1200px;
  --sidebar-width: 280px;
  --header-height: 64px;
}
```

## Backend Development

### Controller Pattern
```typescript
// BaseController for common functionality
abstract class BaseController {
  protected handleAsync = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  };
  
  protected sendResponse = (
    res: Response,
    statusCode: number,
    data: any,
    message?: string
  ) => {
    res.status(statusCode).json({
      success: statusCode < 400,
      data,
      message,
      timestamp: new Date().toISOString(),
    });
  };
}

// TaskController implementation
export class TaskController extends BaseController {
  constructor(private taskService: TaskService) {
    super();
  }
  
  public getTasks = this.handleAsync(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const filters = this.parseQueryFilters(req.query);
    
    const tasks = await this.taskService.getUserTasks(userId, filters);
    
    this.sendResponse(res, 200, { tasks }, 'Tasks retrieved successfully');
  });
  
  public createTask = this.handleAsync(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const taskData = req.body;
    
    const task = await this.taskService.createTask(userId, taskData);
    
    this.sendResponse(res, 201, { task }, 'Task created successfully');
  });
  
  private parseQueryFilters(query: any): TaskFilters {
    return {
      completed: query.completed === 'true' ? true : 
                query.completed === 'false' ? false : undefined,
      priority: query.priority,
      search: query.search,
      sortBy: query.sortBy || 'createdAt',
      sortOrder: query.sortOrder || 'desc',
      limit: parseInt(query.limit) || 20,
      offset: parseInt(query.offset) || 0,
    };
  }
}
```

### Service Layer Pattern
```typescript
// TaskService implementation
export class TaskService {
  constructor(private taskRepository: TaskRepository) {}
  
  async getUserTasks(userId: string, filters: TaskFilters): Promise<Task[]> {
    this.validateUserId(userId);
    return await this.taskRepository.findByUserId(userId, filters);
  }
  
  async createTask(userId: string, taskData: CreateTaskData): Promise<Task> {
    this.validateUserId(userId);
    this.validateTaskData(taskData);
    
    const task: Task = {
      id: this.generateTaskId(),
      ...taskData,
      userId,
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    return await this.taskRepository.create(task);
  }
  
  async updateTask(
    userId: string,
    taskId: string,
    updates: UpdateTaskData
  ): Promise<Task> {
    const existingTask = await this.taskRepository.findById(taskId);
    
    if (!existingTask || existingTask.userId !== userId) {
      throw new NotFoundError('Task not found');
    }
    
    const updatedTask: Task = {
      ...existingTask,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    return await this.taskRepository.update(taskId, updatedTask);
  }
  
  private validateUserId(userId: string): void {
    if (!userId || typeof userId !== 'string') {
      throw new ValidationError('Valid user ID is required');
    }
  }
  
  private validateTaskData(taskData: CreateTaskData): void {
    if (!taskData.title || taskData.title.trim().length === 0) {
      throw new ValidationError('Task title is required');
    }
    
    if (taskData.title.length > 200) {
      throw new ValidationError('Task title must be less than 200 characters');
    }
    
    if (taskData.priority && !['low', 'medium', 'high'].includes(taskData.priority)) {
      throw new ValidationError('Priority must be low, medium, or high');
    }
  }
  
  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

### Middleware Implementation
```typescript
// Authentication middleware
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authorization token required',
        },
      });
    }
    
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    
    const user = await userService.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid token',
        },
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired token',
      },
    });
  }
};

// Validation middleware
export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message,
          })),
        },
      });
    }
    
    next();
  };
};
```

## Testing Guidelines

### Testing Strategy
1. **Unit Tests**: Test individual functions and components in isolation
2. **Integration Tests**: Test API endpoints and database interactions
3. **End-to-End Tests**: Test complete user workflows
4. **Performance Tests**: Ensure response times meet requirements

### Frontend Testing

#### Component Testing with React Testing Library
```typescript
// TaskItem.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskItem } from './TaskItem';
import { mockTask } from '../../../test/mocks';

describe('TaskItem', () => {
  const mockOnUpdate = jest.fn();
  const mockOnDelete = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders task information correctly', () => {
    render(
      <TaskItem
        task={mockTask}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );
    
    expect(screen.getByText(mockTask.title)).toBeInTheDocument();
    expect(screen.getByText(mockTask.description)).toBeInTheDocument();
  });
  
  it('calls onUpdate when checkbox is clicked', () => {
    render(
      <TaskItem
        task={mockTask}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );
    
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    
    expect(mockOnUpdate).toHaveBeenCalledWith(mockTask.id, {
      completed: !mockTask.completed,
    });
  });
  
  it('applies completed styling when task is completed', () => {
    const completedTask = { ...mockTask, completed: true };
    
    render(
      <TaskItem
        task={completedTask}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );
    
    const taskTitle = screen.getByText(completedTask.title);
    expect(taskTitle).toHaveClass('task-title--completed');
  });
});
```

#### Custom Hook Testing
```typescript
// useTaskManagement.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { useTaskManagement } from './useTaskManagement';
import * as taskService from '../services/taskService';

jest.mock('../services/taskService');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useTaskManagement', () => {
  it('fetches tasks on mount', async () => {
    const mockTasks = [mockTask];
    (taskService.fetchTasks as jest.Mock).mockResolvedValue(mockTasks);
    
    const { result } = renderHook(() => useTaskManagement(), {
      wrapper: createWrapper(),
    });
    
    await waitFor(() => {
      expect(result.current.tasks).toEqual(mockTasks);
    });
  });
  
  it('creates task successfully', async () => {
    const newTask = { title: 'New Task', description: '' };
    (taskService.createTask as jest.Mock).mockResolvedValue(mockTask);
    
    const { result } = renderHook(() => useTaskManagement(), {
      wrapper: createWrapper(),
    });
    
    await waitFor(() => {
      result.current.createTask(newTask);
    });
    
    expect(taskService.createTask).toHaveBeenCalledWith(newTask);
  });
});
```

### Backend Testing

#### Controller Testing
```typescript
// TaskController.test.ts
import request from 'supertest';
import { app } from '../app';
import { TaskService } from '../services/TaskService';

jest.mock('../services/TaskService');

describe('TaskController', () => {
  const mockTaskService = TaskService as jest.MockedClass<typeof TaskService>;
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('GET /api/tasks', () => {
    it('returns user tasks successfully', async () => {
      const mockTasks = [mockTask];
      mockTaskService.prototype.getUserTasks.mockResolvedValue(mockTasks);
      
      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
      
      expect(response.body).toEqual({
        success: true,
        data: { tasks: mockTasks },
        message: 'Tasks retrieved successfully',
        timestamp: expect.any(String),
      });
    });
    
    it('returns 401 when no token provided', async () => {
      await request(app)
        .get('/api/tasks')
        .expect(401);
    });
  });
  
  describe('POST /api/tasks', () => {
    it('creates task successfully', async () => {
      const taskData = { title: 'New Task', priority: 'medium' };
      mockTaskService.prototype.createTask.mockResolvedValue(mockTask);
      
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', 'Bearer valid-token')
        .send(taskData)
        .expect(201);
      
      expect(response.body.data.task).toEqual(mockTask);
    });
    
    it('returns 400 for invalid task data', async () => {
      const invalidData = { title: '' }; // Empty title
      
      await request(app)
        .post('/api/tasks')
        .set('Authorization', 'Bearer valid-token')
        .send(invalidData)
        .expect(400);
    });
  });
});
```

#### Service Testing
```typescript
// TaskService.test.ts
import { TaskService } from './TaskService';
import { TaskRepository } from '../repositories/TaskRepository';
import { ValidationError } from '../errors';

jest.mock('../repositories/TaskRepository');

describe('TaskService', () => {
  let taskService: TaskService;
  let mockTaskRepository: jest.Mocked<TaskRepository>;
  
  beforeEach(() => {
    mockTaskRepository = new TaskRepository() as jest.Mocked<TaskRepository>;
    taskService = new TaskService(mockTaskRepository);
  });
  
  describe('createTask', () => {
    it('creates task with valid data', async () => {
      const userId = 'user123';
      const taskData = { title: 'Test Task', priority: 'medium' as const };
      const expectedTask = { ...mockTask, ...taskData, userId };
      
      mockTaskRepository.create.mockResolvedValue(expectedTask);
      
      const result = await taskService.createTask(userId, taskData);
      
      expect(result).toEqual(expectedTask);
      expect(mockTaskRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: taskData.title,
          priority: taskData.priority,
          userId,
          completed: false,
        })
      );
    });
    
    it('throws ValidationError for empty title', async () => {
      const userId = 'user123';
      const taskData = { title: '', priority: 'medium' as const };
      
      await expect(
        taskService.createTask(userId, taskData)
      ).rejects.toThrow(ValidationError);
    });
    
    it('throws ValidationError for invalid priority', async () => {
      const userId = 'user123';
      const taskData = { title: 'Test', priority: 'invalid' as any };
      
      await expect(
        taskService.createTask(userId, taskData)
      ).rejects.toThrow(ValidationError);
    });
  });
  
  describe('getUserTasks', () => {
    it('returns user tasks with filters', async () => {
      const userId = 'user123';
      const filters = { completed: false, priority: 'high' };
      const expectedTasks = [mockTask];
      
      mockTaskRepository.findByUserId.mockResolvedValue(expectedTasks);
      
      const result = await taskService.getUserTasks(userId, filters);
      
      expect(result).toEqual(expectedTasks);
      expect(mockTaskRepository.findByUserId).toHaveBeenCalledWith(
        userId,
        filters
      );
    });
  });
});
```

### Integration Testing
```typescript
// tasks.integration.test.ts
import request from 'supertest';
import { app } from '../app';
import { setupTestDb, cleanupTestDb, createTestUser } from '../test/setup';

describe('Tasks API Integration', () => {
  let authToken: string;
  let userId: string;
  
  beforeAll(async () => {
    await setupTestDb();
    const { user, token } = await createTestUser();
    userId = user.id;
    authToken = token;
  });
  
  afterAll(async () => {
    await cleanupTestDb();
  });
  
  describe('Complete task workflow', () => {
    it('creates, reads, updates, and deletes a task', async () => {
      // Create task
      const taskData = {
        title: 'Integration Test Task',
        description: 'Test description',
        priority: 'high',
      };
      
      const createResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(201);
      
      const createdTask = createResponse.body.data.task;
      expect(createdTask.title).toBe(taskData.title);
      
      // Read tasks
      const readResponse = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(readResponse.body.data.tasks).toHaveLength(1);
      
      // Update task
      const updateData = { completed: true };
      
      await request(app)
        .put(`/api/tasks/${createdTask.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);
      
      // Delete task
      await request(app)
        .delete(`/api/tasks/${createdTask.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      // Verify deletion
      const finalResponse = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(finalResponse.body.data.tasks).toHaveLength(0);
    });
  });
});
```

## Deployment & Operations

### Production Build Process

#### Frontend Build
```bash
cd frontend

# Install dependencies
npm ci --production

# Build for production
npm run build

# Verify build
ls -la dist/

# Test build locally
npm run preview
```

#### Backend Build
```bash
cd backend

# Install dependencies
npm ci --production

# Compile TypeScript
npm run build

# Verify build
ls -la dist/

# Test compiled code
node dist/app.js
```

### Environment Configuration

#### Production Environment Variables
```env
# Production Backend (.env)
NODE_ENV=production
PORT=3001

# Database
FIREBASE_PROJECT_ID=task-manager-prod
FIREBASE_CLIENT_EMAIL=service-account@task-manager-prod.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Security
JWT_SECRET=super-secure-production-secret-at-least-32-chars
BCRYPT_ROUNDS=12

# CORS
FRONTEND_URL=https://your-production-domain.com

# Monitoring
LOG_LEVEL=info
```

#### Frontend Production Configuration
```env
# Production Frontend (.env.production)
VITE_API_BASE_URL=https://api.your-domain.com/api
VITE_APP_NAME=Personal Task Manager
VITE_APP_VERSION=1.0.0
```

### Monitoring and Logging

#### Application Logging
```typescript
// Logger configuration
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'task-manager-api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Usage in controllers
export class TaskController {
  async createTask(req: Request, res: Response) {
    try {
      logger.info('Creating task', { userId: req.user.id, taskTitle: req.body.title });
      // ... implementation
    } catch (error) {
      logger.error('Failed to create task', { 
        userId: req.user.id, 
        error: error.message,
        stack: error.stack 
      });
      throw error;
    }
  }
}
```

#### Health Check Endpoints
```typescript
// Health check routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version,
  });
});

app.get('/api/health/detailed', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: await checkDatabaseConnection(),
      auth: await checkAuthService(),
    },
    system: {
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      nodeVersion: process.version,
    },
  };
  
  const overallStatus = Object.values(health.services).every(s => s.status === 'healthy')
    ? 'healthy' : 'unhealthy';
  
  res.status(overallStatus === 'healthy' ? 200 : 503).json({
    ...health,
    status: overallStatus,
  });
});
```

### Performance Optimization

#### Database Query Optimization
```typescript
// Optimized query with proper indexing
class TaskRepository {
  async findByUserId(userId: string, filters: TaskFilters): Promise<Task[]> {
    let query = this.firestore
      .collection('tasks')
      .where('userId', '==', userId);
    
    // Apply filters in order of selectivity
    if (filters.completed !== undefined) {
      query = query.where('completed', '==', filters.completed);
    }
    
    if (filters.priority) {
      query = query.where('priority', '==', filters.priority);
    }
    
    // Apply sorting
    query = query.orderBy(filters.sortBy || 'createdAt', filters.sortOrder || 'desc');
    
    // Apply pagination
    if (filters.limit) {
      query = query.limit(filters.limit);
    }
    
    if (filters.offset) {
      query = query.offset(filters.offset);
    }
    
    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
  }
}
```

#### Frontend Performance Optimization
```typescript
// Code splitting and lazy loading
import { lazy, Suspense } from 'react';

const TasksPage = lazy(() => import('./pages/TasksPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));

function App() {
  return (
    <Router>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/tasks" element={<TasksPage />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

// Memoized components
const TaskItem = memo<TaskItemProps>(({ task, onUpdate, onDelete }) => {
  // Component implementation
}, (prevProps, nextProps) => {
  return prevProps.task.id === nextProps.task.id &&
         prevProps.task.updatedAt === nextProps.task.updatedAt;
});

// Optimized list rendering
const TaskList = ({ tasks }: { tasks: Task[] }) => {
  const virtualizer = useVirtualizer({
    count: tasks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
  });
  
  return (
    <div ref={parentRef} style={{ height: '400px', overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
        {virtualizer.getVirtualItems().map(virtualItem => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: virtualItem.size,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <TaskItem task={tasks[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
};
```

## Contributing Guidelines

### Development Workflow

#### Git Workflow
1. **Feature Branches**: Create feature branches from `main`
2. **Conventional Commits**: Use conventional commit messages
3. **Pull Requests**: All changes must go through pull request review
4. **Testing**: All tests must pass before merging

#### Commit Message Format
```
type(scope): description

body (optional)

footer (optional)
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat(tasks): add task priority filtering

Add ability to filter tasks by priority level (low, medium, high).
Includes frontend UI updates and backend API changes.

Closes #123
```

### Code Review Guidelines

#### Reviewers Should Check
1. **Functionality**: Does the code work as intended?
2. **Code Quality**: Is the code readable and maintainable?
3. **Testing**: Are there adequate tests for the changes?
4. **Performance**: Are there any performance implications?
5. **Security**: Are there any security concerns?
6. **Documentation**: Is documentation updated if needed?

#### Code Review Checklist
- [ ] Code follows project conventions and style guide
- [ ] All tests pass and new tests are added for new functionality
- [ ] No console.log statements or debugging code left behind
- [ ] Error handling is appropriate and comprehensive
- [ ] Performance impact is considered and acceptable
- [ ] Security best practices are followed
- [ ] Documentation is updated where necessary
- [ ] Breaking changes are documented and versioned appropriately

### Release Process

#### Version Numbering (Semantic Versioning)
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

#### Release Checklist
1. **Update Version**: Update package.json versions
2. **Update Changelog**: Document all changes
3. **Run Full Test Suite**: Ensure all tests pass
4. **Build and Test**: Test production builds
5. **Tag Release**: Create git tag with version number
6. **Deploy**: Deploy to production environment
7. **Monitor**: Monitor application after deployment

### Support and Maintenance

#### Issue Reporting
When reporting issues:
1. **Use Issue Templates**: Follow provided templates
2. **Include Context**: Browser, environment, steps to reproduce
3. **Provide Screenshots**: When applicable
4. **Label Appropriately**: Bug, feature request, enhancement, etc.

#### Security Issues
For security vulnerabilities:
1. **Do Not Open Public Issues**: Use private reporting
2. **Contact Maintainers**: Direct email to team
3. **Provide Details**: Clear description and reproduction steps
4. **Allow Time**: Give reasonable time for fix before disclosure

---

**Developer Handbook** | Version 1.0 | Assignment 5 Completion  
**Maintained by**: Development Team  
**Last Updated**: Current Date  
**Next Review**: 6 months post-deployment