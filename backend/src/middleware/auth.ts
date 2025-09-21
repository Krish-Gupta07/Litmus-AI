import type { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
      };
    }
  }
}

export async function authenticateUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId =
      req.headers["x-user-id"] || req.body.userId || req.query.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User ID required",
        message: "Please provide user ID in headers, body, or query parameters",
      });
    }

    if (typeof userId !== "string") {
      return res.status(400).json({
        success: false,
        error: "Invalid user ID format",
        message: "Clerk user ID must be a string",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(500).json({
      success: false,
      error: "Authentication failed",
    });
  }
}

export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId =
      req.headers["x-user-id"] || req.body.userId || req.query.userId;

    if (!userId) {
      return next();
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
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
    console.error("Optional authentication error:", error);
    next();
  }
}

export function rateLimit(requestsPerMinute: number = 60) {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id || req.ip || "anonymous";
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
        error: "Rate limit exceeded",
        message: `Maximum ${requestsPerMinute} requests per minute allowed`,
        retryAfter: Math.ceil((userRequests.resetTime - now) / 1000),
      });
    } else {
      userRequests.count++;
    }

    next();
  };
}

export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    await authenticateUser(req, res, (err) => {
      if (err) return next(err);
    });

    const isAdmin = Boolean(req.user?.email?.includes("admin"));

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: "Admin access required",
      });
    }

    next();
  } catch (error) {
    console.error("Admin authentication error:", error);
    return res.status(500).json({
      success: false,
      error: "Admin authentication failed",
    });
  }
}

export default {
  authenticateUser,
  optionalAuth,
  rateLimit,
  requireAdmin,
};
