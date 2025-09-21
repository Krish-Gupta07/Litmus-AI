import { Router } from "express";
import type { Request, Response } from "express";
import { WhatsAppHandler } from "./handler.js";

export const whatsappRoutes = Router();

whatsappRoutes.get("/webhook", (req: Request, res: Response) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log("WhatsApp webhook verified");
    res.status(200).send(challenge);
  } else {
    console.log("WhatsApp webhook verification failed");
    res.status(403).send("Forbidden");
  }
});

whatsappRoutes.post("/webhook", async (req: Request, res: Response) => {
  try {
    console.log(
      "Received WhatsApp webhook:",
      JSON.stringify(req.body, null, 2)
    );

    await WhatsAppHandler.handleMessage(req.body);

    res.status(200).send("OK");
  } catch (error) {
    console.error("Error processing WhatsApp webhook:", error);
    res.status(500).send("Internal Server Error");
  }
});

export default whatsappRoutes;
