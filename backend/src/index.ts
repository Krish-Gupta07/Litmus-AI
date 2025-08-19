import * as dotenv from "dotenv";
import express from "express";
import type { Request, Response, NextFunction } from "express";
import cors from "cors";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express());

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

app.listen(PORT, () => {
  console.log(`Litmus AI API running at http://localhost:${PORT}`);
});
