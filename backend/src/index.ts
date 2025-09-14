import * as dotenv from "dotenv";
import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
import { transformQuery } from "./services/query-transform.js";
import { getFinalAnswer } from "./services/final-anwer.js";
import { QueueService, startAutoScaling, startMonitoring } from "./services/queue.js";
import analysisRoutes from "./routes/analysis.routes.js";
import { authenticateUser, rateLimit } from "./middleware/auth.js";
import webhookRoutes from "./routes/webhooks.routes.js";
import morgan from "morgan";
import whatsappRoutes from "./bots/whatsapp/routes.js";
import { checkRedisHealth, getRedisStatus, closeRedisConnection } from "./lib/redis.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 4000;

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "https://localhost:3000")
  .split(",")
  .map((origin) => origin.trim());

const corsOptions = {
  origin(origin: string | undefined, cb: (err: Error | null, ok?: boolean) => void) {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true, // if you want to allow cookies or auth headers
};

// Middleware
app.use(cors(corsOptions));
app.options(/(.*)/, cors(corsOptions));
app.use(express.json());
app.use(morgan("dev"));

// Enhanced health check endpoint
app.get("/api/health", async (_req: Request, res: Response) => {
  try {
    const redisHealthy = await checkRedisHealth();
    const queueHealth = await QueueService.getHealthStatus();
    const queueStats = await QueueService.getQueueStats();
    
    const health = {
      status: redisHealthy && queueHealth.status === 'healthy' ? 'ok' : 'degraded',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      services: {
        redis: {
          status: redisHealthy ? 'connected' : 'disconnected',
          ...getRedisStatus(),
        },
        queue: queueHealth,
        metrics: {
          totalJobs: queueStats.totalJobsProcessed + queueStats.totalJobsFailed,
          failureRate: queueStats.failureRate,
          queueUtilization: queueStats.currentQueueUtilization,
        },
      },
    };

    const statusCode = health.status === 'ok' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    console.error("Health check error:", error);
    res.status(503).json({
      status: "error",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      error: "Health check failed",
    });
  }
});

// Legacy endpoints (keeping for backward compatibility)
app.post("/api/query-transform", transformQuery);
// app.post("/api/final-answer", getFinalAnswer);

// New queue-based analysis routes
app.use("/api/analysis", analysisRoutes);

// WhatsApp webhook endpoints
app.use("/api/whatsapp", whatsappRoutes);

// webhook routes
app.use("/api/webhooks", webhookRoutes);

// Queue management endpoints (admin only)
app.get(
  "/api/queue/stats",
  authenticateUser,
  rateLimit(30),
  async (_req: Request, res: Response) => {
    try {
      const stats = await QueueService.getQueueStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      console.error("Error getting queue stats:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to get queue stats" });
    }
  }
);

app.get(
  "/api/queue/health",
  authenticateUser,
  rateLimit(30),
  async (_req: Request, res: Response) => {
    try {
      const health = await QueueService.getHealthStatus();
      res.json({ success: true, data: health });
    } catch (error) {
      console.error("Error getting queue health:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to get queue health" });
    }
  }
);

app.get(
  "/api/queue/metrics",
  authenticateUser,
  rateLimit(30),
  async (_req: Request, res: Response) => {
    try {
      const metrics = QueueService.getPerformanceMetrics();
      res.json({ success: true, data: metrics });
    } catch (error) {
      console.error("Error getting queue metrics:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to get queue metrics" });
    }
  }
);

app.post(
  "/api/queue/clean",
  authenticateUser,
  rateLimit(10),
  async (_req: Request, res: Response) => {
    try {
      await QueueService.cleanOldJobs();
      res.json({ success: true, message: "Queue cleaned successfully" });
    } catch (error) {
      console.error("Error cleaning queue:", error);
      res.status(500).json({ success: false, error: "Failed to clean queue" });
    }
  }
);

app.post(
  "/api/queue/scale",
  authenticateUser,
  rateLimit(5),
  async (req: Request, res: Response) => {
    try {
      const { concurrency } = req.body;
      if (typeof concurrency !== 'number' || concurrency < 1 || concurrency > 10) {
        return res.status(400).json({
          success: false,
          error: "Concurrency must be a number between 1 and 10",
        });
      }
      
      await QueueService.adjustConcurrency(concurrency);
      res.json({ success: true, message: `Concurrency adjusted to ${concurrency}` });
    } catch (error) {
      console.error("Error adjusting concurrency:", error);
      res.status(500).json({ success: false, error: "Failed to adjust concurrency" });
    }
  }
);

app.post(
  "/api/queue/pause",
  authenticateUser,
  rateLimit(5),
  async (_req: Request, res: Response) => {
    try {
      await QueueService.pauseQueue();
      res.json({ success: true, message: "Queue paused successfully" });
    } catch (error) {
      console.error("Error pausing queue:", error);
      res.status(500).json({ success: false, error: "Failed to pause queue" });
    }
  }
);

app.post(
  "/api/queue/resume",
  authenticateUser,
  rateLimit(5),
  async (_req: Request, res: Response) => {
    try {
      await QueueService.resumeQueue();
      res.json({ success: true, message: "Queue resumed successfully" });
    } catch (error) {
      console.error("Error resuming queue:", error);
      res.status(500).json({ success: false, error: "Failed to resume queue" });
    }
  }
);

// Comprehensive monitoring dashboard
app.get(
  "/api/monitoring/dashboard",
  authenticateUser,
  rateLimit(10),
  async (_req: Request, res: Response) => {
    try {
      const [health, stats, metrics, redisStatus] = await Promise.all([
        QueueService.getHealthStatus(),
        QueueService.getQueueStats(),
        QueueService.getPerformanceMetrics(),
        getRedisStatus(),
      ]);

      const dashboard = {
        timestamp: new Date().toISOString(),
        system: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          cpu: process.cpuUsage(),
        },
        redis: redisStatus,
        queue: {
          health,
          stats,
          metrics,
        },
        alerts: generateAlerts(health, stats, redisStatus),
      };

      res.json({ success: true, data: dashboard });
    } catch (error) {
      console.error("Error getting monitoring dashboard:", error);
      res.status(500).json({ success: false, error: "Failed to get monitoring dashboard" });
    }
  }
);

// Helper function to generate alerts
function generateAlerts(health: any, stats: any, redisStatus: any): string[] {
  const alerts: string[] = [];

  if (!redisStatus.isConnected) {
    alerts.push("🚨 Redis connection is down");
  }

  if (health.status === 'unhealthy') {
    alerts.push("🚨 Queue system is unhealthy");
  }

  if (stats.failureRate > 10) {
    alerts.push(`⚠️ High failure rate: ${stats.failureRate}%`);
  }

  if (stats.currentQueueUtilization > 90) {
    alerts.push(`⚠️ Queue utilization is high: ${stats.currentQueueUtilization}%`);
  }

  if (stats.waiting > 50) {
    alerts.push(`⚠️ High number of waiting jobs: ${stats.waiting}`);
  }

  if (redisStatus.circuitBreakerOpen) {
    alerts.push("🚨 Redis circuit breaker is open");
  }

  if (alerts.length === 0) {
    alerts.push("✅ All systems operational");
  }

  return alerts;
}

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong",
  });
});

// 404 handler
// app.use(/(.*)/, (req: Request, res: Response) => {
//   res.status(404).json({
//     success: false,
//     error: "Endpoint not found",
//     path: req.originalUrl,
//   });
// });

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Litmus AI API running at http://localhost:${PORT}`);
  console.log(`📊 Queue system initialized`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  
  // Initialize monitoring and auto-scaling
  try {
    startMonitoring();
    startAutoScaling();
    console.log(`🔄 Auto-scaling and monitoring started`);
  } catch (error) {
    console.error("❌ Failed to start monitoring:", error);
  }
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("🔄 Shutting down server...");
  await QueueService.shutdown();
  await closeRedisConnection();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("🔄 Shutting down server...");
  await QueueService.shutdown();
  await closeRedisConnection();
  process.exit(0);
});
