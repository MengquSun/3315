# Setup Instructions
**Personal Task Management Application**

## Prerequisites

- **Node.js**: Version 18 or higher
- **npm**: Version 8 or higher (comes with Node.js)
- **Firebase Account**: For database and authentication

## Quick Start

### 1. Automated Setup

Run the setup script to automatically configure both frontend and backend:

```bash
cd hw3
chmod +x scripts/setup.sh
./scripts/setup.sh
```

### 2. Manual Setup

If you prefer manual setup or the script doesn't work:

#### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your Firebase configuration
npm run build
```

#### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env if needed (optional)
npm run build
```

## Configuration

### Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing one
3. Enable Firestore Database
4. Go to Project Settings > Service Accounts
5. Generate a new private key
6. Update `backend/.env` with your Firebase credentials:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-private-key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
```

### Environment Variables

#### Backend (.env)
```env
# Server Configuration
PORT=3001
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
# ... other Firebase credentials

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
```

#### Frontend (.env)
```env
# API Configuration
VITE_API_URL=http://localhost:3001/api

# Application Configuration
VITE_APP_NAME=Task Management App
```

## Development

### Start Development Servers

#### Option 1: Automated Start
```bash
chmod +x scripts/start-dev.sh
./scripts/start-dev.sh
```

#### Option 2: Manual Start
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

## Build for Production

### Backend
```bash
cd backend
npm run build
npm start
```

### Frontend
```bash
cd frontend
npm run build
npm run preview
```

## Troubleshooting

### Common Issues

1. **Firebase Connection Error**
   - Verify your Firebase credentials in `backend/.env`
   - Ensure Firestore is enabled in your Firebase project

2. **Port Already in Use**
   - Change ports in environment files
   - Kill existing processes: `pkill -f "node"`

3. **CORS Errors**
   - Verify `CORS_ORIGIN` in backend `.env` matches frontend URL

4. **Build Errors**
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   - Ensure Node.js version is 18+

### Logs and Debugging

- Backend logs: Check console output or `backend/logs/app.log`
- Frontend logs: Check browser console
- Enable debug mode: Set `NODE_ENV=development` and `LOG_LEVEL=debug`

## Testing

### Manual Testing Checklist

- [ ] User can sign up with email/password
- [ ] User can log in with valid credentials
- [ ] User can create a new task
- [ ] User can edit task details
- [ ] User can mark task as complete
- [ ] User can delete a task
- [ ] User can filter and search tasks
- [ ] Application works on mobile devices
- [ ] Application works across browsers

### API Testing

Use tools like Postman or curl to test API endpoints:

```bash
# Health check
curl http://localhost:3001/health

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## Deployment

See `docs/deployment.md` for production deployment instructions.

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the API documentation in `docs/api.md`
3. Examine the browser console for frontend errors
4. Check server logs for backend errors