import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

/**
 * Generic validation middleware using Zod schemas
 */
export function validateRequest(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      
      return res.status(500).json({
        success: false,
        error: 'Internal validation error',
      });
    }
  };
}

/**
 * Validate query parameters
 */
export function validateQuery(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.query);
      req.query = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      
      return res.status(500).json({
        success: false,
        error: 'Internal validation error',
      });
    }
  };
}

/**
 * Validate URL parameters
 */
export function validateParams(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.params);
      req.params = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid URL parameters',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      
      return res.status(500).json({
        success: false,
        error: 'Internal validation error',
      });
    }
  };
}

/**
 * Common validation schemas
 */
export const commonSchemas = {
  // Pagination schema
  pagination: z.object({
    page: z.string().transform(val => parseInt(val)).pipe(z.number().min(1)).optional().default('1'),
    limit: z.string().transform(val => parseInt(val)).pipe(z.number().min(1).max(100)).optional().default('10'),
  }),

  // User ID schema
  userId: z.object({
    userId: z.string().transform(val => parseInt(val)).pipe(z.number().int().positive()),
  }),

  // Job ID schema
  jobId: z.object({
    jobId: z.string().min(1),
  }),

  // Analysis request schema
  analysisRequest: z.object({
    url: z.string().url().optional(),
    text: z.string().min(1).optional(),
    userId: z.number().int().positive(),
  }).refine(data => data.url || data.text, {
    message: 'Either URL or text must be provided',
  }),
};

export default {
  validateRequest,
  validateQuery,
  validateParams,
  commonSchemas,
};
