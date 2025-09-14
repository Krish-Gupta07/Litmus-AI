import * as dotenv from "dotenv";
import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
import { transformQuery } from "./services/query-transform.js";
import { getFinalAnswer } from "./services/final-anwer.js";
import { QueueService } from "./services/queue.js";
import analysisRoutes from "./routes/analysis.routes.js";
import { authenticateUser, rateLimit } from "./middleware/auth.js";
import webhookRoutes from "./routes/webhooks.routes.js";
import morgan from "morgan";
import whatsappRoutes from "./bots/whatsapp/routes.js";

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
app.options("*", cors(corsOptions))
app.use(express.json());
app.use(morgan("dev"));

// Health check endpoint
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
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
// app.use("*", (req: Request, res: Response) => {
//   res.status(404).json({
//     success: false,
//     error: "Endpoint not found",
//     path: req.originalUrl,
//   });
// });

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Litmus AI API running at http://localhost:${PORT}`);
  console.log(`📊 Queue system initialized`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("🔄 Shutting down server...");
  await QueueService.shutdown();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("🔄 Shutting down server...");
  await QueueService.shutdown();
  process.exit(0);
});
