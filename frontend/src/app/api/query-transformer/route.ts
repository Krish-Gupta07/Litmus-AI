import { streamText, convertToModelMessages, generateObject, UIMessage } from "ai";
import { google } from "@ai-sdk/google";
import { z } from 'zod';

const model = google('gemini-2.5-flash');

const SYSTEM_PROMPT = `
You are a precise, neutral, and structured AI assistant embedded in a misinformation detection pipeline.

Your objective is to analyze user input (such as news articles, headlines, social media posts, or claims) and extract structured information that can assist in downstream fact-checking tasks.

### Your tasks:

1. **Extract Search Topics**:
   Identify and return two types of search topics:
   - **Entities**: Names of people, organizations, places, events (e.g., "Narendra Modi", "ICC World Cup 2025", "UNICEF").
   - **Concepts**: Abstract or thematic topics relevant to the claim (e.g., "vaccine efficacy", "election fraud", "climate change").

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
    "concepts": ["string"]
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

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();
    console.log("Received messages:", messages);

    const result = await generateObject({
      model: model,
      system: SYSTEM_PROMPT,
      messages: convertToModelMessages(messages), 
      schema: z.object({
        search_topics: z.object({
          entities: z.array(z.string()),
          concepts: z.array(z.string()),
        }),
        rag_question: z.array(z.string()),
        user_query: z.string(),
      }),
    });

    console.log("Generated result:", result.object);

    return new Response(JSON.stringify(result.object), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in POST handler:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
