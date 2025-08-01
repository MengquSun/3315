# Assignment 3: Core Implementation & Integration
**Personal Task Management Application - Development Phase**

## Project Overview

This directory contains the complete implementation of the Personal Task Management Application following the 3-tier layered architecture designed in Assignment 2.

## Repository Structure

```
hw3/
├── README.md                          # This file - setup and documentation
├── backend/                           # Node.js/Express API
│   ├── src/
│   │   ├── controllers/              # API controllers
│   │   ├── services/                 # Business logic services
│   │   ├── models/                   # Database models
│   │   ├── middleware/               # Express middleware
│   │   ├── routes/                   # API routes
│   │   ├── utils/                    # Utility functions
│   │   └── app.ts                    # Express app setup
│   ├── package.json                  # Backend dependencies
│   ├── tsconfig.json                 # TypeScript configuration
│   └── .env.example                  # Environment variables template
├── frontend/                         # React.js application
│   ├── src/
│   │   ├── components/               # React components
│   │   │   ├── auth/                # Authentication components
│   │   │   ├── tasks/               # Task management components
│   │   │   ├── layout/              # Layout components
│   │   │   └── common/              # Utility components
│   │   ├── services/                # API client services
│   │   ├── types/                   # TypeScript type definitions
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── context/                 # React context providers
│   │   ├── utils/                   # Utility functions
│   │   ├── styles/                  # CSS and styling
│   │   ├── App.tsx                  # Main app component
│   │   └── index.tsx                # React app entry point
│   ├── public/                      # Static assets
│   ├── package.json                 # Frontend dependencies
│   └── tsconfig.json                # TypeScript configuration
├── shared/                          # Shared types and utilities
│   └── types.ts                     # Common TypeScript interfaces
├── docs/                            # Documentation
│   ├── api.md                       # API documentation
│   ├── setup.md                     # Setup instructions
│   └── deployment.md                # Deployment guide
├── scripts/                         # Development scripts
│   ├── setup.sh                     # Initial setup script
│   └── start-dev.sh                 # Development startup script
├── team-report.md                   # Team progress report
└── sprint-review.md                 # Sprint review summary
```

## Technology Stack

### Backend
- **Runtime**: Node.js v18+
- **Framework**: Express.js v4+
- **Database**: Firebase Firestore
- **Authentication**: JWT (JSON Web Tokens)
- **Language**: TypeScript
- **Testing**: Jest

### Frontend
- **Framework**: React.js v18+
- **Language**: TypeScript
- **Styling**: CSS Modules
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Routing**: React Router v6
- **Testing**: React Testing Library

### Development Tools
- **Package Manager**: npm
- **Build Tool**: Vite (frontend), tsc (backend)
- **Linting**: ESLint
- **Formatting**: Prettier

## Quick Start

### Prerequisites
- Node.js v18 or later
- npm v8 or later
- Firebase account (for database)

### Setup Instructions

1. **Clone and Navigate**
   ```bash
   cd hw3
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your Firebase configuration
   npm run dev
   ```

3. **Frontend Setup** (in new terminal)
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Access Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

## Features Implemented

### ✅ Authentication
- [x] User signup with email/password
- [x] User login with JWT authentication
- [x] Secure logout functionality
- [x] Protected routes and auth middleware

### ✅ Task Management
- [x] Create new tasks with title, description, due date, priority
- [x] View all active tasks in a responsive list
- [x] Edit existing task details
- [x] Mark tasks as complete
- [x] Delete tasks with confirmation
- [x] View completed tasks separately

### ✅ Task Organization
- [x] Sort tasks by due date and priority
- [x] Filter tasks by status and priority
- [x] Search tasks by title/description
- [x] Task count indicators

### ✅ User Interface
- [x] Responsive design (mobile-first)
- [x] Intuitive navigation
- [x] Loading states and error handling
- [x] Clean, modern design
- [x] Accessibility considerations

### ✅ Performance & Security
- [x] JWT-based authentication
- [x] Input validation and sanitization
- [x] Error boundaries and handling
- [x] Optimized API calls
- [x] Secure password hashing

## API Endpoints

### Authentication
```
POST /api/auth/signup    # User registration
POST /api/auth/login     # User login
POST /api/auth/logout    # User logout
GET  /api/auth/profile   # Get user profile
```

### Tasks
```
GET    /api/tasks              # Get user's tasks
POST   /api/tasks              # Create new task
PUT    /api/tasks/:id          # Update task
DELETE /api/tasks/:id          # Delete task
PATCH  /api/tasks/:id/complete # Mark task complete
GET    /api/tasks/completed    # Get completed tasks
```

## Development Guidelines

### Code Standards
- Use TypeScript for all new code
- Follow the component interfaces from Assignment 2
- Implement comprehensive error handling
- Write unit tests for services and components
- Use consistent naming conventions

### Git Workflow
- Commit frequently with descriptive messages
- Use feature branches for major changes
- Include tests with new features
- Update documentation for API changes

### Testing Strategy
- Unit tests for business logic services
- Component tests for UI elements
- Integration tests for API endpoints
- Manual testing across devices

## Assignment 3 Completion

### 📋 Deliverables Status

| Deliverable | Status | Location |
|-------------|--------|----------|
| **Repository Submission** | ✅ Complete | hw3/ directory |
| **Core Implementation** | ✅ Complete | backend/ & frontend/ |
| **Integration** | ✅ Complete | Working full-stack app |
| **Documentation** | ✅ Complete | docs/ & README files |
| **Team Report** | ✅ Complete | team-report.md |
| **Sprint Review** | ✅ Complete | sprint-review.md |

### 🎯 Requirements Traceability

All Assignment 1 functional and non-functional requirements have been implemented:

- **User Accounts**: Signup, login, logout ✅
- **Task Management**: Full CRUD operations ✅
- **Task Viewing**: List, filter, sort capabilities ✅
- **Usability**: Intuitive interface, no tutorial needed ✅
- **Performance**: Sub-2-second response times ✅
- **Reliability**: Secure data storage with JWT ✅
- **Compatibility**: Responsive design, cross-browser ✅

## Next Steps (Assignment 4)

The application is ready for testing and deployment phase:

1. **Comprehensive Testing**: Unit, integration, and user acceptance testing
2. **Performance Optimization**: Bundle optimization, caching strategies
3. **Production Deployment**: Hosting setup and environment configuration
4. **Final Documentation**: User guide and maintenance documentation

## Team Information

**Developer**: Mengqu Sun  
**Timeline**: Phase 3 Implementation (July 24-29, 2025)  
**Status**: Core Features Implemented ✅  
**Next Milestone**: Application Deployed & Stable (July 31, 2025)

For technical questions or setup issues, refer to the detailed documentation in the `docs/` directory or the implementation guides in each component directory.