import { generateObject } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY!,
});

const model = google("gemini-2.5-flash");

const transformSchema = z.object({
  searchTopics: z.object({
    entities: z.array(z.string()),
    concepts: z.array(z.string()),
    claims: z.array(z.string()),
  }),
  ragQuestion: z.string(),
  userQuery: z.string(),
  category: z.enum([
    "Politics",
    "Health",
    "Science",
    "Technology",
    "Economics",
    "Sports",
    "Entertainment",
    "Environment",
    "Education",
    "Social Issues",
    "Breaking News",
    "Historical Claims",
    "Statistics",
    "Government Policy",
    "International Affairs",
    "Other",
  ]),
});

const SYSTEM_PROMPT = `
You are a precise, neutral, and structured AI assistant embedded in a misinformation detection pipeline.

Your objective is to analyze user input (such as news articles, headlines, social media posts, or claims) and extract structured information that can assist in downstream fact-checking tasks.

### Your tasks:

1. **Extract Search Topics**:
   Identify and return two types of search topics:
   - **Entities**: Names of people, organizations, places, events (e.g., "Narendra Modi", "ICC World Cup 2025", "UNICEF").
   - **Concepts**: Abstract or thematic topics relevant to the claim (e.g., "vaccine efficacy", "election fraud", "climate change").
   - **Claims**: Specific statements or assertions made in the input that can be fact-checked (e.g., "The vaccine is 95% effective", "The election was rigged").

2. **Generate Fact-Checkable Question**:
   - Convert the core idea or most important claim into **one neutral, verifiable question** that can be checked against external sources.
   - Focus on the most significant claim that needs fact-checking.
   - Use cautious, unbiased phrasing like: "Did...", "Was it true that...", "Is it accurate that..."

3. **Summarize the User Query**:
   - Return the original user query or input text for reference.

4. **Categorize Content**:
   - Classify the input into the single most relevant category that helps with fact-checking prioritization.
   - Choose exactly ONE from these categories: "Politics", "Health", "Science", "Technology", "Economics", "Sports", "Entertainment", "Environment", "Education", "Social Issues", "Breaking News", "Historical Claims", "Statistics", "Government Policy", "International Affairs", "Other"
   - Select the primary domain that best represents the core subject matter of the claim.

---

### Output Format:
Respond strictly in this JSON structure:

{
  searchTopics: {
    entities: ["string"];
    concepts: ["string"];
    claims: ["string"];
  };
  ragQuestion: "string";
  userQuery: "string";
  category: "string";
};

---

### Notes:
- Do not include emotional, subjective, or biased language from the input.
- If the input is vague or incomplete, infer the most plausible meaning but indicate uncertainty in phrasing (e.g., "Is it claimed that...").
- Ensure each ragQuestion is self-contained and understandable without context.
- Avoid yes/no phrasing unless it's part of a complete, fact-checkable statement.
`;

export async function transformQuery(query: string) {
  try {
    const result = await generateObject({
      model: model,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: query }],
      schema: transformSchema as any,
    });

    return result.object;
  } catch (error) {
    console.error("Error in transformQuery:", error);
    return {
      success: false,
      error: "Failed to process query transformation",
    };
  }
}
