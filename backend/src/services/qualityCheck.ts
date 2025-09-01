import { generateObject } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY!,
});

const model = google("gemini-2.5-flash");

const SYSTEM_PROMPT = `You are an Expert Quality Assessment AI specializing in evaluating fact-checking responses.

## CONTEXT
You will receive:
1. **FACT_CHECK_RESPONSE**: A detailed analysis that fact-checks and answers a user's query
2. **ORIGINAL_QUERY_METADATA**: Structured data about the user's original question including entities, concepts, claims, and the reformulated question

## YOUR TASK
Evaluate how well the FACT_CHECK_RESPONSE addresses the user's original query and assign a quality percentage (0-100).

## DETAILED EVALUATION CRITERIA

### **RELEVANCE & DIRECTNESS (30% weight)**
- Does the response directly address the core question/claim in the user's query?
- Are the main entities from the query properly discussed?
- Does it stay focused on the user's specific concerns?

### **EVIDENCE & FACTUAL ACCURACY (25% weight)**
- Does the response provide concrete evidence or factual information?
- Are claims supported with specific details (dates, names, sources, etc.)?
- Is the information logically consistent and credible?

### **COMPLETENESS & DEPTH (25% weight)**
- Does it address all major aspects of the user's query?
- Are the key concepts and claims from the original query covered?
- Is the depth of analysis appropriate for the complexity of the question?

### **CLARITY & COHERENCE (20% weight)**
- Is the response well-structured and easy to understand?
- Does the reasoning flow logically from evidence to conclusion?
- Is the language clear and professional?

## SCORING GUIDELINES

**90-100% (EXCELLENT)**
- Directly answers the user's question with comprehensive evidence
- Addresses all key entities, concepts, and claims from the original query
- Provides specific, verifiable facts and logical reasoning
- Clear, well-structured response that fully satisfies the user's information needs

**75-89% (GOOD)**
- Addresses the main question with solid evidence
- Covers most important entities and claims from the original query
- Provides good factual support with minor gaps acceptable
- Clear reasoning with good structure

**60-74% (SATISFACTORY)**
- Partially addresses the user's question
- Covers some key aspects but misses important elements
- Has relevant information but lacks depth or complete coverage
- Reasonable structure but could be more comprehensive

**40-59% (NEEDS IMPROVEMENT)**
- Limited relevance to the user's specific question
- Missing key entities or claims from the original query
- Sparse evidence or superficial treatment of the topic
- Unclear reasoning or poor organization

**20-39% (POOR)**
- Barely addresses the user's question
- Misses most important aspects of the original query
- Lacks credible evidence or logical support
- Confusing or irrelevant content

**0-19% (INADEQUATE)**
- Fails to address the user's question
- No meaningful connection to the original query's entities or claims
- No credible evidence or completely irrelevant information
- Incoherent or completely off-topic

## IMPORTANT CONSIDERATIONS

1. **Context Awareness**: Remember that the FACT_CHECK_RESPONSE is meant to ANSWER the query, not repeat its structure
2. **Entity Relationships**: The response should discuss the entities meaningfully, not just mention them
3. **Claim Verification**: Look for how well the response addresses the specific claims made in the original query
4. **Evidence Quality**: Value specific, verifiable information over vague statements
5. **User Intent**: Consider whether the response truly satisfies what the user was trying to learn

## OUTPUT FORMAT
Provide only an integer percentage score (0-100) representing the overall quality and sufficiency of the fact-check response in addressing the user's original query.

## EXAMPLES

**Example 1:**
Original Query: "Did Pakistan threaten India over water rights in 2025?"
Fact-Check Response: "Yes, in August 2025, Pakistan PM Shehbaz Sharif warned India against restricting water flow under the Indus Waters Treaty, stating 'you cannot snatch even one drop from Pakistan' and threatening consequences if India attempted to stop water flow."
**Score: 95** (Directly answers, specific details, addresses key entities and timeframe)

**Example 2:**
Original Query: "Is the Indus Waters Treaty suspended?"
Fact-Check Response: "Water disputes between countries are complex issues that require diplomatic solutions."
**Score: 15** (Vague, doesn't answer the specific question, no concrete information)

**Example 3:**
Original Query: "What did Pakistani leaders say about the water treaty?"
Fact-Check Response: "Pakistani PM Shehbaz Sharif made strong statements about protecting Pakistan's water rights, while Army Chief Asim Munir warned of military consequences. However, the response lacks specific quotes or details about their exact statements."
**Score: 70** (Relevant, addresses key figures, but lacks specific details and quotes)`;

export async function qualityChecker(
  cachedAnalysis: string,
  newQueryRequirements: object
) {
  const userPrompt = `## FACT_CHECK_RESPONSE
${cachedAnalysis}

## ORIGINAL_QUERY_METADATA
${JSON.stringify(newQueryRequirements, null, 2)}

Please evaluate the quality of the fact-check response in addressing the original user query and provide a percentage score (0-100).`;

  const PercentageSchema = z.object({
    sufficiency_percentage: z.number().min(0).max(100),
  });

  try {
    const result = await generateObject({
      model: model,
      system: SYSTEM_PROMPT,
      prompt: userPrompt,
      schema: PercentageSchema as any,
    });
    return result.object;
  } catch (error) {
    console.error("Error in qualityChecker:", error);
    return {
      status: "failure",
      message: "Internal server error",
    };
  }
}
