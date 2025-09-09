import express from "express";
import type { Request, Response } from "express";
import { scrape } from "../services/scraper.js";
import webhookRoutes from './webhooks.routes.js';

const router = express.Router();

type AnalyzeInput = {
  url?: string;
  text?: string;
};

router.post("/analyze", async (req: Request, res: Response) => {
  try {
    const { url, text } = req.body as AnalyzeInput; // this needs zod validation

    if (!url && !text) {
      return res.status(400).json({
        status: "failure",
        message: "Provide either 'url' or 'text'",
      });
    }

    const result = await scrape(url || text || "");

    if (!result) {
      return res.status(404).json({
        status: "failure",
        message: "No content found at the provided URL",
      });
    }

    const { title, body } = result;

    return res.status(200).json({
      status: "success",
      payload: {
        title: title || "No title found",
        body: body || "No content found",
      },
      message: "Content analyzed successfully",
    });
  } catch (error) {
    console.error("Error in /analyze route:", error);
    return res
      .status(500)
      .json({ status: "failure", message: "Internal server error" });
  }
});

// webhook routes
router.use('/webhooks', webhookRoutes);

export default router;
