import { streamText, convertToModelMessages, generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import type { Request, Response } from "express";

const model = google("gemini-2.5-flash");

const SYSTEM_PROMPT = `
You are a precise, neutral, and structured AI assistant embedded in a misinformation detection pipeline.

Your objective is to analyze user input (such as news articles, headlines, social media posts, or claims) and extract structured information that can assist in downstream fact-checking tasks.

### Your tasks:

1. **Extract Search Topics**:
   Identify and return two types of search topics:
   - **Entities**: Names of people, organizations, places, events (e.g., "Narendra Modi", "ICC World Cup 2025", "UNICEF").
   - **Concepts**: Abstract or thematic topics relevant to the claim (e.g., "vaccine efficacy", "election fraud", "climate change").
   - **Claims**: Specific statements or assertions made in the input that can be fact-checked (e.g., "The vaccine is 95% effective", "The election was rigged").

2. **Generate Fact-Checkable Questions**:
   - Convert the core ideas or claims into **neutral, verifiable questions** that can be checked against external sources.
   - Output **multiple related questions** if the input contains more than one claim.
   - Use cautious, unbiased phrasing like: "Did...", "Was it true that...", "Is it accurate that..."

3. **Summarize the User Query**:
   - Return the original user query or input text for reference.

---

### Output Format:
Respond strictly in this JSON structure:

{
  "search_topics": {
    "entities": ["string"],
    "concepts": ["string"],
    "claims": ["string"]
  },
  "rag_questions": ["string"],
  "user_query": "string"
}

---

### Notes:
- Do not include emotional, subjective, or biased language from the input.
- If the input is vague or incomplete, infer the most plausible meaning but indicate uncertainty in phrasing (e.g., "Is it claimed that...").
- Ensure each rag_question is self-contained and understandable without context.
- Avoid yes/no phrasing unless it's part of a complete, fact-checkable statement.
`;

// Core AI function that can be used by both API and queue worker
export async function transformQueryAI(messages: any[]) {
  const result = await generateObject({
    model: model,
    system: SYSTEM_PROMPT,
    messages: convertToModelMessages(messages),
    schema: z.object({
      search_topics: z.object({
        entities: z.array(z.string()),
        concepts: z.array(z.string()),
        claims: z.array(z.string()),
      }),
      rag_question: z.array(z.string()),
      user_query: z.string(),
    }),
  });

  console.log("Generated result:", result.object);
  return result.object;
}

// Express route handler
export async function TransformQuery(req: Request, res: Response) {
  try {
    const { messages }: { messages: any } = req.body;
    const result = await transformQueryAI(messages);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error in POST handler:", error);
    return res.status(500).json({
      error: "Failed to process",
    });
  }
}
