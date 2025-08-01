/**
 * Global Error Handler Middleware
 * Centralized error handling for the Express application
 */

import { NextFunction, Request, Response } from 'express';
import { AppError, ErrorType } from '../../shared/types';

/**
 * Global error handling middleware
 * Must be the last middleware in the chain
 */
export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log error for debugging
  console.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Handle AppError instances
  if (error instanceof Error && 'type' in error) {
    const appError = error as AppError;
    const statusCode = getStatusCodeFromErrorType(appError.type);
    
    res.status(statusCode).json({
      success: false,
      error: appError.message,
      code: appError.code,
      ...(process.env.NODE_ENV === 'development' && {
        details: appError.details,
        stack: appError.stack
      })
    });
    return;
  }

  // Handle validation errors from Joi or other validators
  if (error.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: error.details || error.message
    });
    return;
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      error: 'Invalid token',
      code: 'INVALID_TOKEN'
    });
    return;
  }

  if (error.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      error: 'Token expired',
      code: 'TOKEN_EXPIRED'
    });
    return;
  }

  // Handle syntax errors (malformed JSON)
  if (error instanceof SyntaxError && 'body' in error) {
    res.status(400).json({
      success: false,
      error: 'Invalid JSON in request body',
      code: 'INVALID_JSON'
    });
    return;
  }

  // Handle request timeout
  if (error.code === 'REQUEST_TIMEOUT') {
    res.status(408).json({
      success: false,
      error: 'Request timeout',
      code: 'REQUEST_TIMEOUT'
    });
    return;
  }

  // Handle payload too large
  if (error.type === 'entity.too.large') {
    res.status(413).json({
      success: false,
      error: 'Request payload too large',
      code: 'PAYLOAD_TOO_LARGE'
    });
    return;
  }

  // Handle Firebase specific errors
  if (error.code && error.code.startsWith('auth/')) {
    res.status(400).json({
      success: false,
      error: 'Authentication error',
      code: 'FIREBASE_AUTH_ERROR',
      details: error.message
    });
    return;
  }

  if (error.code && error.code.startsWith('firestore/')) {
    res.status(500).json({
      success: false,
      error: 'Database error',
      code: 'FIRESTORE_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
    return;
  }

  // Handle generic HTTP errors
  if (error.status || error.statusCode) {
    const statusCode = error.status || error.statusCode;
    res.status(statusCode).json({
      success: false,
      error: error.message || 'HTTP Error',
      code: `HTTP_${statusCode}`
    });
    return;
  }

  // Handle unexpected errors
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message,
    code: 'INTERNAL_SERVER_ERROR',
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack
    })
  });
};

/**
 * Map AppError types to HTTP status codes
 */
function getStatusCodeFromErrorType(errorType: ErrorType): number {
  switch (errorType) {
    case ErrorType.VALIDATION_ERROR:
      return 400;
    case ErrorType.AUTHENTICATION_ERROR:
      return 401;
    case ErrorType.AUTHORIZATION_ERROR:
      return 403;
    case ErrorType.NOT_FOUND_ERROR:
      return 404;
    case ErrorType.DATABASE_ERROR:
      return 500;
    case ErrorType.NETWORK_ERROR:
      return 503;
    case ErrorType.UNKNOWN_ERROR:
    default:
      return 500;
  }
}

/**
 * Not found handler for undefined routes
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error: AppError = {
    type: ErrorType.NOT_FOUND_ERROR,
    message: `Route ${req.originalUrl} not found`,
    code: 'ROUTE_NOT_FOUND'
  };
  
  next(error);
};

/**
 * Async error wrapper for route handlers
 * Catches async errors and passes them to error handler
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Create AppError helper function
 */
export const createError = (
  type: ErrorType,
  message: string,
  code: string,
  details?: any
): AppError => {
  return {
    type,
    message,
    code,
    details
  };
};