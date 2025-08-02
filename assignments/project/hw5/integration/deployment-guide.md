# Production Deployment Guide
**Personal Task Management Application**

## Overview

This guide provides comprehensive instructions for deploying the Personal Task Management Application to a production environment. The application has been thoroughly tested and is production-ready.

## Prerequisites

### System Requirements
- **Server**: Linux (Ubuntu 20.04+ recommended) or compatible hosting platform
- **Node.js**: Version 18.0 or higher
- **Memory**: Minimum 2GB RAM (4GB recommended)
- **Storage**: Minimum 10GB available space
- **Network**: HTTPS capability with SSL certificate

### Required Accounts & Services
- **Firebase Account**: For Firestore database and authentication
- **Domain Name**: For production URL
- **SSL Certificate**: For HTTPS (Let's Encrypt recommended)
- **Hosting Platform**: Netlify, Vercel, Heroku, or VPS

## Pre-Deployment Checklist

### 1. Environment Preparation ✅
- [ ] Production server provisioned and accessible
- [ ] Node.js 18+ installed on server
- [ ] npm/yarn package manager available
- [ ] Git access configured for code deployment
- [ ] Firewall configured (ports 80, 443, and application port)
- [ ] SSL certificate obtained and configured

### 2. Firebase Configuration ✅
- [ ] Firebase project created for production
- [ ] Firestore database provisioned in production mode
- [ ] Authentication providers configured
- [ ] Security rules configured for production
- [ ] Service account key generated for backend access
- [ ] Firebase configuration values documented

### 3. Application Configuration ✅
- [ ] Environment variables prepared for production
- [ ] Database connection strings configured
- [ ] JWT secrets generated and secured
- [ ] CORS origins configured for production domain
- [ ] Error logging and monitoring configured

## Deployment Steps

### Step 1: Clone and Setup Repository

```bash
# Clone the repository
git clone https://github.com/MengquSun/3315.git
cd 3315/3315/assignments/project/hw3

# Install dependencies
cd backend && npm install
cd ../frontend && npm install
cd ..
```

### Step 2: Configure Environment Variables

#### Backend Environment (.env)
```bash
# Navigate to backend directory
cd backend

# Create production environment file
cat > .env << EOF
# Production Environment Configuration
NODE_ENV=production
PORT=3001

# Database Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=your-firebase-client-email
FIREBASE_PRIVATE_KEY=your-firebase-private-key
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-min-32-chars
JWT_EXPIRE=24h

# CORS Configuration
FRONTEND_URL=https://your-production-domain.com

# Security
BCRYPT_ROUNDS=12

# Logging
LOG_LEVEL=info
EOF
```

#### Frontend Environment (.env.production)
```bash
# Navigate to frontend directory
cd ../frontend

# Create production environment file
cat > .env.production << EOF
# Production Frontend Configuration
VITE_API_BASE_URL=https://your-api-domain.com/api
VITE_APP_NAME=Personal Task Manager
VITE_APP_VERSION=1.0.0
EOF
```

### Step 3: Build Applications

#### Build Backend
```bash
cd backend

# Install dependencies
npm install --production

# Build TypeScript
npm run build

# Verify build
ls -la dist/
```

#### Build Frontend
```bash
cd ../frontend

# Install dependencies
npm install

# Build for production
npm run build

# Verify build
ls -la dist/
```

### Step 4: Database Setup

#### Firebase Firestore Configuration
```javascript
// Firestore Security Rules (Production)
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Tasks are private to each user
    match /tasks/{taskId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}
```

#### Database Indexes
```bash
# Create composite indexes for efficient queries
# (Configure in Firebase Console)

# Index 1: Tasks by user and status
Collection: tasks
Fields: userId (Ascending), completed (Ascending), createdAt (Descending)

# Index 2: Tasks by user and priority
Collection: tasks
Fields: userId (Ascending), priority (Ascending), dueDate (Ascending)

# Index 3: Tasks by user and due date
Collection: tasks
Fields: userId (Ascending), dueDate (Ascending), completed (Ascending)
```

### Step 5: Deploy Backend

#### Option A: Deploy to VPS/Server
```bash
# Copy application to server
rsync -avz --exclude node_modules backend/ user@server:/opt/task-manager/backend/

# On server: Install PM2 for process management
npm install -g pm2

# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'task-manager-api',
      script: 'dist/app.js',
      cwd: '/opt/task-manager/backend',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: '/opt/task-manager/logs/err.log',
      out_file: '/opt/task-manager/logs/out.log',
      log_file: '/opt/task-manager/logs/combined.log',
      time: true
    }
  ]
};
EOF

# Start application
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### Option B: Deploy to Heroku
```bash
# Install Heroku CLI and login
heroku login

# Create Heroku app
heroku create your-app-name-api

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set FIREBASE_PROJECT_ID=your-firebase-project-id
heroku config:set FIREBASE_CLIENT_EMAIL=your-firebase-client-email
heroku config:set FIREBASE_PRIVATE_KEY="your-firebase-private-key"
heroku config:set JWT_SECRET=your-super-secure-jwt-secret

# Deploy
git subtree push --prefix=backend heroku main

# Scale dynos
heroku ps:scale web=1
```

### Step 6: Deploy Frontend

#### Option A: Deploy to Netlify
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy from frontend/dist directory
cd frontend
netlify deploy --prod --dir=dist

# Configure build settings in netlify.toml
cat > netlify.toml << EOF
[build]
  publish = "dist"
  command = "npm run build"

[build.environment]
  VITE_API_BASE_URL = "https://your-api-domain.com/api"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
EOF
```

#### Option B: Deploy to Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd frontend
vercel --prod

# Configure environment variables in Vercel dashboard
# VITE_API_BASE_URL=https://your-api-domain.com/api
```

### Step 7: Configure Reverse Proxy (if using VPS)

#### Nginx Configuration
```nginx
# /etc/nginx/sites-available/task-manager
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    ssl_certificate /path/to/your/certificate.pem;
    ssl_certificate_key /path/to/your/private.key;

    # Frontend
    location / {
        root /opt/task-manager/frontend/dist;
        try_files $uri $uri/ /index.html;
        
        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site and restart nginx
sudo ln -s /etc/nginx/sites-available/task-manager /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Post-Deployment Configuration

### 1. SSL Certificate Setup (Let's Encrypt)
```bash
# Install Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

### 2. Monitoring Setup

#### Application Monitoring
```bash
# Install monitoring tools
npm install -g pm2-logrotate

# Configure log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true
```

#### Health Check Endpoints
```javascript
// Already implemented in backend
// GET /api/health - Basic health check
// GET /api/health/detailed - Detailed system status
```

### 3. Backup Configuration
```bash
# Create backup script for Firebase exports
cat > /opt/task-manager/scripts/backup.sh << EOF
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/task-manager/backups"

# Create backup directory
mkdir -p $BACKUP_DIR

# Export Firestore data (requires Firebase CLI)
firebase firestore:export gs://your-bucket-name/backups/firestore_$DATE

# Log backup completion
echo "Backup completed: $DATE" >> $BACKUP_DIR/backup.log
EOF

# Make executable and add to cron
chmod +x /opt/task-manager/scripts/backup.sh

# Add to crontab (daily backup at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/task-manager/scripts/backup.sh") | crontab -
```

## Production Validation

### 1. Deployment Verification Checklist
- [ ] Frontend loads correctly at production URL
- [ ] Backend API responds to health checks
- [ ] User registration and login work
- [ ] Task operations (create, read, update, delete) function
- [ ] Database connections are stable
- [ ] SSL certificate is valid and properly configured
- [ ] Error logging is capturing issues
- [ ] Performance meets requirements (<2s response times)

### 2. Load Testing
```bash
# Install Artillery for load testing
npm install -g artillery

# Create load test script
cat > load-test.yml << EOF
config:
  target: 'https://your-domain.com'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: "User workflow"
    flow:
      - get:
          url: "/"
      - post:
          url: "/api/auth/login"
          json:
            email: "test@example.com"
            password: "testpassword"
      - get:
          url: "/api/tasks"
EOF

# Run load test
artillery run load-test.yml
```

### 3. Security Validation
```bash
# Run security audit
npm audit --audit-level high

# Test SSL configuration
curl -I https://your-domain.com

# Verify security headers
curl -I https://your-domain.com | grep -E "(X-|Strict-|Content-Security)"
```

## Troubleshooting

### Common Issues and Solutions

#### Frontend Not Loading
```bash
# Check nginx status and logs
sudo systemctl status nginx
sudo tail -f /var/log/nginx/error.log

# Verify frontend build
ls -la /opt/task-manager/frontend/dist/
```

#### Backend API Errors
```bash
# Check PM2 status
pm2 status
pm2 logs task-manager-api

# Check database connection
node -e "console.log(process.env.FIREBASE_PROJECT_ID)"
```

#### Database Connection Issues
```bash
# Verify Firebase configuration
firebase projects:list
firebase use your-project-id

# Check Firestore rules
firebase firestore:rules:get
```

### Performance Issues
```bash
# Monitor server resources
top
htop
df -h

# Check application metrics
pm2 monit
```

## Maintenance Procedures

### Regular Maintenance Tasks
1. **Weekly**: Review application logs and error reports
2. **Monthly**: Update dependencies and security patches
3. **Quarterly**: Performance review and optimization
4. **Annually**: SSL certificate renewal and security audit

### Update Procedures
```bash
# 1. Backup current version
pm2 stop task-manager-api
cp -r /opt/task-manager/backend /opt/task-manager/backup-$(date +%Y%m%d)

# 2. Deploy new version
git pull origin main
npm install --production
npm run build

# 3. Restart application
pm2 restart task-manager-api

# 4. Verify deployment
curl https://your-domain.com/api/health
```

## Support and Monitoring

### Key Metrics to Monitor
- **Response Time**: < 2 seconds for all endpoints
- **Error Rate**: < 1% of all requests
- **Uptime**: > 99.5%
- **Database Response Time**: < 500ms
- **Memory Usage**: < 80% of available
- **CPU Usage**: < 70% average

### Alerting Setup
Configure alerts for:
- Application downtime
- High error rates
- Performance degradation
- Resource utilization thresholds
- SSL certificate expiration

### Log Management
- **Application Logs**: `/opt/task-manager/logs/`
- **Nginx Logs**: `/var/log/nginx/`
- **System Logs**: `/var/log/syslog`

## Emergency Procedures

### Application Rollback
```bash
# Stop current version
pm2 stop task-manager-api

# Restore backup
rm -rf /opt/task-manager/backend
mv /opt/task-manager/backup-YYYYMMDD /opt/task-manager/backend

# Restart application
pm2 start task-manager-api
```

### Database Recovery
```bash
# Restore from backup (example)
firebase firestore:import gs://your-bucket-name/backups/firestore_YYYYMMDD_HHMMSS
```

---

**Deployment Status**: ✅ **Production Ready**  
**Last Updated**: Assignment 5 Completion  
**Next Review**: 30 days post-deployment  
**Support Contact**: Technical Lead Mengqu Sun