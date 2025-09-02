import { embed } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY!,
});

const model = google.textEmbedding("gemini-embedding-001");

export async function queryEmbedding(ragQuery: string) {
  const { embedding } = await embed({
    model: model,
    value: ragQuery,
    providerOptions: {
      gemini: {
        dimensions: 3072,
      },
    },
  });
  return embedding;
}
