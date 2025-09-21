import { generateObject } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";
import { SYSTEM_PROMPT as sysPrompt } from "../lib/constants.js";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY!,
});

const model = google("gemini-2.5-flash");

const SYSTEM_PROMPT = sysPrompt;

export async function getFinalAnswer(
  transformedQuery?: any,
  contextData?: string[]
) {
  try {
    const queryData = transformedQuery;
    const contextInfo = contextData!;
    const prompt = `Query Metadata: ${JSON.stringify(
      queryData
    )} Context Data: ${contextInfo.join(", ")}`;
    console.log("Final Prompt:", prompt);

    const ResponseSchema = z.object({
      title: z.string(),
      reasoning: z.string(),
    });

    const response = await generateObject({
      model: model,
      system: SYSTEM_PROMPT,
      prompt: prompt,
      schema: ResponseSchema as any,
    }).then((result) => result.object);

    const result = {
      success: true,
      payload: {
        title: response.title,
        description: response.reasoning,
      },
    };

    console.log("Final Answer Result:", result);
    return result;
  } catch (error) {
    console.error("Error in GetFinalAnswer:", error);
    return {
      status: "failure",
      message: "Internal server error",
    };
  }
}
