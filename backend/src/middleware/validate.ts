import type { Request, Response, NextFunction } from "express";
import { z } from "zod";

export function validateRequest(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        });
      }

      return res.status(500).json({
        success: false,
        error: "Internal validation error",
      });
    }
  };
}

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
          error: "Invalid query parameters",
          details: error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        });
      }

      return res.status(500).json({
        success: false,
        error: "Internal validation error",
      });
    }
  };
}

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
          error: "Invalid URL parameters",
          details: error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        });
      }

      return res.status(500).json({
        success: false,
        error: "Internal validation error",
      });
    }
  };
}

export const commonSchemas = {
  pagination: z.object({
    page: z
      .string()
      .transform((val) => parseInt(val))
      .pipe(z.number().min(1))
      .optional()
      .default("1"),
    limit: z
      .string()
      .transform((val) => parseInt(val))
      .pipe(z.number().min(1).max(100))
      .optional()
      .default("10"),
  }),

  userId: z.object({
    userId: z
      .string()
      .transform((val) => parseInt(val))
      .pipe(z.number().int().positive()),
  }),

  jobId: z.object({
    jobId: z.string().min(1),
  }),

  analysisRequest: z
    .object({
      url: z.string().url().optional(),
      text: z.string().min(1).optional(),
      userId: z.number().int().positive(),
    })
    .refine((data) => data.url || data.text, {
      message: "Either URL or text must be provided",
    }),
};

export default {
  validateRequest,
  validateQuery,
  validateParams,
  commonSchemas,
};
