# System Architecture Design
**Personal Task Management Application**

## Executive Summary

This document outlines the high-level software architecture for the Personal Task Management Application, a web-based single-user task management system. The architecture follows a **3-Tier Layered Architecture** pattern optimized for simplicity, maintainability, and the specific requirements outlined in Assignment 1.

## Architecture Pattern Selection

### Chosen Architecture: 3-Tier Layered Architecture

**Rationale:**
- **Simplicity**: Aligns with single-user application scope
- **Maintainability**: Clear separation of concerns for solo development
- **Performance**: Direct data access without network overhead of microservices
- **Technology Fit**: Works well with modern web frameworks (React + Backend API + Database)

### Architecture Layers

#### 1. Presentation Layer (Frontend)
**Technologies**: React.js with responsive CSS framework
**Responsibilities**:
- User interface rendering and interaction
- Client-side routing and navigation
- Form validation and user feedback
- State management for UI components
- Authentication token storage and management

**Components**:
- Authentication components (Login, Signup)
- Task management components (TaskList, TaskForm, TaskItem)
- Layout components (Header, Navigation, Footer)
- Utility components (Loading, Error handling)

#### 2. Business Logic Layer (Backend API)
**Technologies**: Node.js with Express.js framework
**Responsibilities**:
- RESTful API endpoints
- Business rule enforcement
- User authentication and authorization
- Data validation and sanitization
- Task operations (CRUD)
- Sorting and filtering logic

**API Endpoints**:
```
Authentication:
POST /api/auth/signup
POST /api/auth/login
POST /api/auth/logout

Tasks:
GET /api/tasks
POST /api/tasks
PUT /api/tasks/:id
DELETE /api/tasks/:id
PATCH /api/tasks/:id/complete
```

#### 3. Data Access Layer (Database)
**Technologies**: Firebase Firestore (NoSQL) or PostgreSQL (SQL)
**Responsibilities**:
- Data persistence and retrieval
- Data integrity constraints
- Backup and recovery
- Performance optimization (indexing)

**Data Models**:
- Users collection/table
- Tasks collection/table
- Session management (if using SQL)

## System Architecture Diagram

```
┌─────────────────────────────────────────┐
│           PRESENTATION LAYER            │
│                                         │
│  ┌─────────────┐  ┌─────────────────┐  │
│  │    Auth     │  │   Task Mgmt     │  │
│  │ Components  │  │   Components    │  │
│  └─────────────┘  └─────────────────┘  │
│                                         │
│         React.js Frontend               │
└─────────────────┬───────────────────────┘
                  │ HTTPS/REST API
┌─────────────────▼───────────────────────┐
│           BUSINESS LOGIC LAYER          │
│                                         │
│  ┌─────────────┐  ┌─────────────────┐  │
│  │    Auth     │  │     Task        │  │
│  │   Service   │  │    Service      │  │
│  └─────────────┘  └─────────────────┘  │
│                                         │
│         Node.js/Express API             │
└─────────────────┬───────────────────────┘
                  │ Database Queries
┌─────────────────▼───────────────────────┐
│            DATA ACCESS LAYER            │
│                                         │
│  ┌─────────────┐  ┌─────────────────┐  │
│  │    Users    │  │     Tasks       │  │
│  │ Collection  │  │   Collection    │  │
│  └─────────────┘  └─────────────────┘  │
│                                         │
│       Firebase Firestore / PostgreSQL  │
└─────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- **Framework**: React.js v18+
- **Styling**: CSS Modules or Styled Components
- **State Management**: React Context API + useReducer
- **HTTP Client**: Axios
- **Routing**: React Router v6

### Backend
- **Runtime**: Node.js v18+
- **Framework**: Express.js v4+
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Joi or express-validator
- **CORS**: cors middleware

### Database
- **Primary Option**: Firebase Firestore
  - Advantages: Real-time sync, built-in authentication, easy deployment
- **Alternative**: PostgreSQL with Prisma ORM
  - Advantages: Strong consistency, complex querying, data relationships

### Deployment
- **Frontend**: Vercel or Netlify
- **Backend**: Railway, Render, or Heroku
- **Database**: Firebase (managed) or Railway PostgreSQL

## Security Considerations

### Authentication & Authorization
- JWT-based authentication with secure token storage
- Password hashing using bcrypt
- Token expiration and refresh mechanisms
- HTTPS enforcement for all communications

### Data Protection
- Input validation and sanitization
- SQL injection prevention (if using SQL database)
- XSS protection with Content Security Policy
- CORS configuration for API access control

## Performance Optimization

### Frontend
- Component lazy loading
- Image optimization
- Bundle size optimization with code splitting
- Efficient re-rendering with React.memo and useMemo

### Backend
- Database query optimization
- Response caching for frequently accessed data
- Pagination for large task lists
- API rate limiting

### Database
- Proper indexing on frequently queried fields
- Connection pooling (if using SQL)
- Query optimization and monitoring

## Scalability Considerations

### Current Architecture Benefits
- **Vertical Scaling**: Easy to increase server resources
- **Horizontal Scaling**: Frontend can be served from CDN
- **Database Scaling**: Firebase auto-scales, PostgreSQL can be optimized

### Future Migration Path
- **Microservices**: Can split authentication and task services
- **Caching Layer**: Redis can be added for session management
- **API Gateway**: Can be introduced for advanced routing and security

## Non-Functional Requirements Alignment

### Usability
- Clean separation allows focused UI development
- Component-based architecture enables consistent UX

### Performance
- Direct database access minimizes latency
- Stateless API design supports efficient caching
- Frontend optimization strategies built into architecture

### Reliability
- Database-backed persistence ensures data durability
- JWT authentication provides secure session management
- Error handling at each layer prevents cascade failures

### Compatibility
- Responsive frontend design supports all devices
- RESTful API ensures broad client compatibility
- Progressive Web App capabilities for mobile experience

## Development Workflow Integration

This architecture supports the project timeline from Assignment 1:

- **Phase 2 (Current)**: Architecture design and component specification
- **Phase 3**: Layer-by-layer development (Database → API → Frontend)
- **Phase 4**: Integration testing and deployment
- **Phase 5**: Performance optimization and final submission

## Conclusion

The 3-Tier Layered Architecture provides an optimal balance of simplicity, maintainability, and performance for the Personal Task Management Application. This design directly addresses all functional and non-functional requirements while supporting the solo development timeline and future scalability needs.