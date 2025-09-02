import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import * as dotenv from "dotenv";
import { embedMany } from "ai";
import { randomUUID } from "crypto";
import type { RecordType } from "./types.js";

dotenv.config();

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY!,
});
const model = google.textEmbedding("gemini-embedding-001");

export async function chunk(data: string[]) {
  const text = data.join("\n\n---ARTICLE_SEPARATOR---\n\n");
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1032,
    chunkOverlap: 128,
    separators: ["---ARTICLE_SEPARATOR---", "\n\n", "\n", " ", ""],
  });

  const output = await splitter.createDocuments([text]);
  const texts = output.map((doc) => doc.pageContent);
  return texts;
}

export async function embedData(texts: string[]) {
  let embeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += 100) {
    const batch = texts.slice(i, i + 100);
    const { embeddings: textEmbedding } = await embedMany({
      model,
      values: batch,
      providerOptions: {
        gemini: { dimensions: 3072 },
      },
    });
    embeddings.push(...textEmbedding);
  }
  return embeddings;
}

export async function vectorsData(
  vectors: number[][],
  metaText: string[],
  category: string
) {
  const records = vectors.map((values, i) => ({
    id: randomUUID(),
    values,
    metadata: {
      text: metaText[i] || "",
      category: category || "",
    },
  }));

  return records;
}

export const chunks = (record: RecordType[], batchSize = 100) => {
  const chunks = [];

  for (let i = 0; i < record.length; i += batchSize) {
    chunks.push(record.slice(i, i + batchSize));
  }

  return chunks;
};
