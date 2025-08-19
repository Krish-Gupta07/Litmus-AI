import * as dotenv from "dotenv";
import express from "express";
import type { Request, Response, NextFunction } from "express";
import cors from "cors";
import { TransformQuery } from "./services/query-transform.ts";
const router = express.Router();

dotenv.config();
const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json()); 

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

app.post("/api/query-transform", TransformQuery);

app.listen(PORT, () => {
  console.log(`Litmus AI API running at http://localhost:${PORT}`);
});
