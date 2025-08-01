/**
 * Express application setup for Personal Task Management API
 * Implements 3-tier layered architecture with comprehensive middleware
 */

import cors from 'cors';
import dotenv from 'dotenv';
import express, { Application, NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { AppError, ErrorType } from '../shared/types';
import { errorHandler } from './middleware/errorHandler';
import { authRoutes } from './routes/authRoutes';
import { taskRoutes } from './routes/taskRoutes';
import { DatabaseService } from './services/DatabaseService';

// Load environment variables
dotenv.config();

class App {
  public app: Application;
  private databaseService: DatabaseService;

  constructor() {
    this.app = express();
    this.databaseService = new DatabaseService();
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS configuration
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }));

    // Body parsing middleware
    this.app.use(express.json({ limit: process.env.BODY_LIMIT || '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: process.env.BODY_LIMIT || '10mb' }));

    // Logging middleware
    if (process.env.NODE_ENV !== 'test') {
      this.app.use(morgan('combined'));
    }

    // Request timeout middleware
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const timeout = parseInt(process.env.REQUEST_TIMEOUT || '30000');
      res.setTimeout(timeout, () => {
        const error: AppError = {
          type: ErrorType.NETWORK_ERROR,
          message: 'Request timeout',
          code: 'REQUEST_TIMEOUT'
        };
        next(error);
      });
      next();
    });
  }

  private initializeRoutes(): void {
    const apiPrefix = process.env.API_PREFIX || '/api';

    // Health check endpoint
    this.app.get('/health', (req: Request, res: Response) => {
      res.status(200).json({
        success: true,
        message: 'Task Management API is running',
        timestamp: new Date().toISOString(),
        database: this.databaseService.isConnected()
      });
    });

    // API routes
    this.app.use(`${apiPrefix}/auth`, authRoutes);
    this.app.use(`${apiPrefix}/tasks`, taskRoutes);

    // 404 handler for unmatched routes
    this.app.all('*', (req: Request, res: Response, next: NextFunction) => {
      const error: AppError = {
        type: ErrorType.NOT_FOUND_ERROR,
        message: `Route ${req.originalUrl} not found`,
        code: 'ROUTE_NOT_FOUND'
      };
      next(error);
    });
  }

  private initializeErrorHandling(): void {
    this.app.use(errorHandler);
  }

  public async initialize(): Promise<void> {
    try {
      // Initialize database connection
      await this.databaseService.connect();
      console.log('✅ Database connected successfully');
    } catch (error) {
      console.error('❌ Failed to initialize application:', error);
      throw error;
    }
  }

  public async shutdown(): Promise<void> {
    try {
      await this.databaseService.disconnect();
      console.log('✅ Application shutdown complete');
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      throw error;
    }
  }

  public getApp(): Application {
    return this.app;
  }
}

// Create and export app instance
const appInstance = new App();

// Start server if this file is run directly
if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  
  appInstance.initialize()
    .then(() => {
      const server = appInstance.app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📚 API Documentation: http://localhost:${PORT}/health`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      });

      // Graceful shutdown handling
      const gracefulShutdown = async (signal: string) => {
        console.log(`\n📡 Received ${signal}. Starting graceful shutdown...`);
        
        server.close(async () => {
          try {
            await appInstance.shutdown();
            process.exit(0);
          } catch (error) {
            console.error('Error during graceful shutdown:', error);
            process.exit(1);
          }
        });

        // Force shutdown after 10 seconds
        setTimeout(() => {
          console.error('⚠️  Force shutdown after timeout');
          process.exit(1);
        }, 10000);
      };

      process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
      process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    })
    .catch((error) => {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    });
}

export default appInstance;