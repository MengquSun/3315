/**
 * Validation Middleware
 * Request validation using Joi schemas
 */

import { NextFunction, Request, Response } from 'express';
import Joi from 'joi';
import { Priority } from '../../shared/types';

export class ValidationMiddleware {
  
  /**
   * Validate task input data
   */
  public static validateTaskInput = (req: Request, res: Response, next: NextFunction): void => {
    const schema = Joi.object({
      title: Joi.string().trim().min(1).max(200).required()
        .messages({
          'string.empty': 'Title is required',
          'string.min': 'Title cannot be empty',
          'string.max': 'Title must be less than 200 characters',
          'any.required': 'Title is required'
        }),
      description: Joi.string().trim().max(1000).allow('').optional()
        .messages({
          'string.max': 'Description must be less than 1000 characters'
        }),
      dueDate: Joi.date().iso().optional().allow(null)
        .messages({
          'date.format': 'Due date must be a valid ISO date format'
        }),
      priority: Joi.string().valid(...Object.values(Priority)).required()
        .messages({
          'any.only': 'Priority must be one of: low, medium, high',
          'any.required': 'Priority is required'
        })
    });

    const { error } = schema.validate(req.body);
    
    if (error) {
      const validationErrors: { [key: string]: string[] } = {};
      
      error.details.forEach(detail => {
        const field = detail.path[0] as string;
        if (!validationErrors[field]) {
          validationErrors[field] = [];
        }
        validationErrors[field].push(detail.message);
      });

      res.status(400).json({
        success: false,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: validationErrors
      });
      return;
    }

    next();
  };

  /**
   * Validate task update input data
   */
  public static validateTaskUpdateInput = (req: Request, res: Response, next: NextFunction): void => {
    const schema = Joi.object({
      title: Joi.string().trim().min(1).max(200).optional()
        .messages({
          'string.empty': 'Title cannot be empty',
          'string.min': 'Title cannot be empty',
          'string.max': 'Title must be less than 200 characters'
        }),
      description: Joi.string().trim().max(1000).allow('').optional()
        .messages({
          'string.max': 'Description must be less than 1000 characters'
        }),
      dueDate: Joi.date().iso().optional().allow(null)
        .messages({
          'date.format': 'Due date must be a valid ISO date format'
        }),
      priority: Joi.string().valid(...Object.values(Priority)).optional()
        .messages({
          'any.only': 'Priority must be one of: low, medium, high'
        })
    }).min(1); // At least one field must be provided

    const { error } = schema.validate(req.body);
    
    if (error) {
      const validationErrors: { [key: string]: string[] } = {};
      
      error.details.forEach(detail => {
        const field = detail.path[0] as string || 'general';
        if (!validationErrors[field]) {
          validationErrors[field] = [];
        }
        validationErrors[field].push(detail.message);
      });

      res.status(400).json({
        success: false,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: validationErrors
      });
      return;
    }

    next();
  };

  /**
   * Validate authentication input data
   */
  public static validateAuthInput = (req: Request, res: Response, next: NextFunction): void => {
    const schema = Joi.object({
      email: Joi.string().email().required()
        .messages({
          'string.email': 'Please provide a valid email address',
          'any.required': 'Email is required'
        }),
      password: Joi.string().min(6).max(128).required()
        .messages({
          'string.min': 'Password must be at least 6 characters',
          'string.max': 'Password must be less than 128 characters',
          'any.required': 'Password is required'
        }),
      rememberMe: Joi.boolean().optional()
    });

    const { error } = schema.validate(req.body);
    
    if (error) {
      const validationErrors: { [key: string]: string[] } = {};
      
      error.details.forEach(detail => {
        const field = detail.path[0] as string;
        if (!validationErrors[field]) {
          validationErrors[field] = [];
        }
        validationErrors[field].push(detail.message);
      });

      res.status(400).json({
        success: false,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: validationErrors
      });
      return;
    }

    next();
  };

  /**
   * Validate query parameters for getting tasks
   */
  public static validateTaskQuery = (req: Request, res: Response, next: NextFunction): void => {
    const schema = Joi.object({
      status: Joi.string().valid('active', 'completed', 'deleted').optional(),
      priority: Joi.string().valid(...Object.values(Priority)).optional(),
      search: Joi.string().trim().max(100).optional(),
      sortBy: Joi.string().valid('dueDate', 'priority', 'createdAt', 'title').optional(),
      order: Joi.string().valid('asc', 'desc').optional(),
      page: Joi.number().integer().min(1).optional(),
      limit: Joi.number().integer().min(1).max(100).optional()
    });

    const { error } = schema.validate(req.query);
    
    if (error) {
      const validationErrors: { [key: string]: string[] } = {};
      
      error.details.forEach(detail => {
        const field = detail.path[0] as string;
        if (!validationErrors[field]) {
          validationErrors[field] = [];
        }
        validationErrors[field].push(detail.message);
      });

      res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        code: 'VALIDATION_ERROR',
        details: validationErrors
      });
      return;
    }

    next();
  };

  /**
   * Generic validation middleware factory
   */
  public static validateSchema = (schema: Joi.ObjectSchema, source: 'body' | 'query' | 'params' = 'body') => {
    return (req: Request, res: Response, next: NextFunction): void => {
      const data = source === 'body' ? req.body : source === 'query' ? req.query : req.params;
      const { error } = schema.validate(data);
      
      if (error) {
        const validationErrors: { [key: string]: string[] } = {};
        
        error.details.forEach(detail => {
          const field = detail.path[0] as string;
          if (!validationErrors[field]) {
            validationErrors[field] = [];
          }
          validationErrors[field].push(detail.message);
        });

        res.status(400).json({
          success: false,
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: validationErrors
        });
        return;
      }

      next();
    };
  };

  /**
   * Validate MongoDB ObjectId format
   */
  public static validateObjectId = (paramName: string = 'id') => {
    return (req: Request, res: Response, next: NextFunction): void => {
      const id = req.params[paramName];
      
      // For Firebase, we'll accept any non-empty string as a valid ID
      if (!id || typeof id !== 'string' || id.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: `Invalid ${paramName} format`,
          code: 'INVALID_ID_FORMAT'
        });
        return;
      }

      next();
    };
  };

  /**
   * Sanitize input data
   */
  public static sanitizeInput = (req: Request, res: Response, next: NextFunction): void => {
    // Recursively trim string values
    const sanitize = (obj: any): any => {
      if (typeof obj === 'string') {
        return obj.trim();
      }
      if (Array.isArray(obj)) {
        return obj.map(sanitize);
      }
      if (obj && typeof obj === 'object') {
        const sanitized: any = {};
        for (const [key, value] of Object.entries(obj)) {
          sanitized[key] = sanitize(value);
        }
        return sanitized;
      }
      return obj;
    };

    if (req.body) {
      req.body = sanitize(req.body);
    }
    if (req.query) {
      req.query = sanitize(req.query);
    }

    next();
  };
}