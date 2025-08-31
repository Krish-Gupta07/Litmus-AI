import type { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
      };
    }
  }
}

/**
 * Authentication middleware
 * Verifies user exists and adds user info to request
 */
export async function authenticateUser(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.headers['x-user-id'] || req.body.userId || req.query.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID required',
        message: 'Please provide user ID in headers, body, or query parameters',
      });
    }

    const userIdNum = parseInt(userId as string);
    
    if (isNaN(userIdNum)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID format',
      });
    }

    // Check if user exists in database
    const user = await prisma.user.findUnique({
      where: { id: userIdNum },
      select: {
        id: true,
        email: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Add user info to request
    req.user = user;
    next();

  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication failed',
    });
  }
}

/**
 * Optional authentication middleware
 * Adds user info if provided, but doesn't require it
 */
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.headers['x-user-id'] || req.body.userId || req.query.userId;
    
    if (!userId) {
      return next(); // Continue without user info
    }

    const userIdNum = parseInt(userId as string);
    
    if (isNaN(userIdNum)) {
      return next(); // Continue without user info
    }

    // Check if user exists in database
    const user = await prisma.user.findUnique({
      where: { id: userIdNum },
      select: {
        id: true,
        email: true,
      },
    });

    if (user) {
      req.user = user;
    }

    next();

  } catch (error) {
    console.error('Optional authentication error:', error);
    next(); // Continue even if auth fails
  }
}

/**
 * Rate limiting middleware (basic implementation)
 */
export function rateLimit(requestsPerMinute: number = 60) {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id || req.ip || 'anonymous';
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute

    const userRequests = requests.get(userId.toString());

    if (!userRequests || now > userRequests.resetTime) {
      // Reset or initialize
      requests.set(userId.toString(), {
        count: 1,
        resetTime: now + windowMs,
      });
    } else if (userRequests.count >= requestsPerMinute) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        message: `Maximum ${requestsPerMinute} requests per minute allowed`,
        retryAfter: Math.ceil((userRequests.resetTime - now) / 1000),
      });
    } else {
      userRequests.count++;
    }

    next();
  };
}

/**
 * Admin authentication middleware
 */
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    // First authenticate user
    await authenticateUser(req, res, (err) => {
      if (err) return next(err);
    });

    // Check if user is admin (you can add an isAdmin field to your User model)
    // For now, we'll use a simple check - you can modify this based on your needs
    const isAdmin = req.user?.email?.includes('admin') || req.user?.id === 1;
    
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required',
      });
    }

    next();

  } catch (error) {
    console.error('Admin authentication error:', error);
    return res.status(500).json({
      success: false,
      error: 'Admin authentication failed',
    });
  }
}

export default {
  authenticateUser,
  optionalAuth,
  rateLimit,
  requireAdmin,
};
