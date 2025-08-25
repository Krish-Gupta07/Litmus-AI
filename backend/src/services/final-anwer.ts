import type { Request, Response } from "express";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

const model = google("gemini-2.5-flash");

const SYSTEM_PROMPT = `You are an advanced AI fact-checking assistant.

Your job is to assess the factual accuracy of user-submitted queries using the structured query data and relevant context information provided to you.

---

## INPUT

You will receive two inputs:

### 1. Query Metadata:
{
    "search_topics": {
      "entities": [String],    // Named entities mentioned in the query
      "concepts": [String],     // Key concepts related to the query
      "claims": [String]       // Specific claims made in the query
    },
    "rag_question": [String],  // Reformulated fact-checkable versions of the user's query
    "user_query": "String"     // Original user query
}

### 2. Context Data:
[
  "Relevant factual sentence 1.",
  "Relevant factual sentence 2.",
  "More retrieved evidence or context..."
]

This context will contain the most relevant information retrieved using the reformulated questions. It may contain named entities, dates, locations, and factual details.

---

## YOUR TASK

Using both the structured query data and the factual context, evaluate the factuality of the original user query.

You must:

1. Determine if the query is factually correct, false, or misleading.
2. Base your judgment solely on the provided context.
3. Use the metadata (entities, concepts, and reformulated questions) to better understand the query's intent.
4. Clearly explain in details your verdict with a concise, fact-based reasoning.

---

## OUTPUT FORMAT

Return a JSON object in the following format:

{
  "verdict": "true | false | misleading | unverifiable | yes | no | maybe",  // One of these options based on your assessment
  "reasoning": "A clear, concise detailed explanation that explains the decision based strictly on the context provided. Use named entities, timeframes, or facts from the context to justify your conclusion."
}

---

## IMPORTANT GUIDELINES

- Do not include narrative, emotional, or stylistic writing.
- Your answer should directly address the user's original query.
- Be neutral, fact-based, and professional.
- Only output the JSON response. Do not include any other text.

---`;

export async function GetFinalAnswer(req: Request, res: Response) {
  try {
    // const { messages }: { messages: any } = req.body;

    // Forward the request to the TransformQuery endpoint
    // const transformResponse = await axios.post(
    //   "http://localhost:4000/api/query-transform",
    //   { messages }
    // );

    // Stored transformed query
    const transformedQuery = {
      search_topics: {
        entities: ["United States", "China"],
        concepts: ["trade war", "economic sanctions"],
        claims: [
          "The United States and China are currently in a full-scale trade war.",
        ],
      },
      rag_question: [
        "Are the United States and China currently engaged in a trade war?",
      ],
      user_query:
        "Is there an ongoing trade war between the US and China right now?",
    };

    const contextData = [
      "As of August 2025, trade tensions between the U.S. and China have significantly eased.",
      "While both countries maintain some tariffs, they have signed a new economic cooperation agreement in early 2025.",
      "There are no new sanctions or aggressive economic measures being taken by either side currently.",
    ]; // This should be replaced with actual retrieved context data;

    // Combine transformedQuery and contextData to create the prompt as a string
    const prompt = `Query Metadata: ${JSON.stringify(
      transformedQuery
    )} Context Data: ${contextData.join(", ")}`;
    console.log("Final Prompt:", prompt);

    const response = await generateObject({
      model: model,
      system: SYSTEM_PROMPT,
      prompt: prompt,
      schema: z.object({
        verdict: z.enum([
          "true",
          "false",
          "misleading",
          "unverifiable",
          "yes",
          "no",
          "maybe",
        ]),
        reasoning: z.string(),
      } as const),
    }).then((result) => result.object);

    return res.status(200).json({
      success: true,
      payload: {
        title: response.verdict,
        description: response.reasoning,
      },
    });
  } catch (error) {
    console.error("Error in /final-answer route:", error);
    return res.status(500).json({
      status: "failure",
      message: "Internel server error",
    });
  }
}
