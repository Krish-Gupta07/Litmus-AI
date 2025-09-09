import { Pinecone } from "@pinecone-database/pinecone";
import * as dotenv from "dotenv";
import { type RecordType } from "../types/rag.js";

dotenv.config();

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
export const index = pc.index("litmus");

export async function upsertVectors(recordChunks: RecordType[][]) {
  await Promise.all(recordChunks.map((chunk) => index.upsert(chunk)));
  console.log("data upserted successfully");
}

export async function ragQuery(queryVector: number[], category: string) {
  const queryResponse = await index.query({
    vector: queryVector,
    topK: 5,
    filter: { category: category },
    includeValues: false,
    includeMetadata: true,
  });
  return queryResponse;
}
