import * as dotenv from "dotenv";
import { Exa } from "exa-js";
import type { TransformedQuery } from "../types/exa.js";

dotenv.config();

const exaKey: string | undefined = process.env.EXA_API_KEY;
if (!exaKey) {
  throw new Error("Missing EXA_API_KEY in environment variables");
}

const exa = new Exa(exaKey);

export async function runExa(searchData: TransformedQuery): Promise<any[]> {
  const entities: string[] = searchData.searchTopics.entities;
  const concepts: string[] = searchData.searchTopics.concepts;
  const claims: string[] = searchData.searchTopics.claims;
  const allResults: any[] = [];

  for (let i = 0, j = 0; i < 2 && j < 2; i++, j++) {
    if (!entities[i] || !concepts[j]) continue;
    const query = `${entities[i]} ${concepts[j]}`;
    console.log(searchData.searchTopics.entities[i]);
    try {
      const result = await exa.searchAndContents(query, {
        text: true,
        type: "auto",
        numResults: 2,
        context: true,
      });
      console.log(JSON.stringify(result, null, 2));
      allResults.push(result);
    } catch (err) {
      console.error("Exa entity+concept query failed:", err);
    }
  }

  for (let k = 0, i = 0; i < 3 && k < 3; i++, k++) {
    if (!entities[i] || !claims[k]) continue;
    const query = `${entities[i]} ${claims[k]}`;
    try {
      const result = await exa.searchAndContents(query, {
        text: true,
        type: "auto",
        numResults: 2,
        context: true,
      });
      console.log(JSON.stringify(result, null, 2));
      allResults.push(result);
    } catch (err) {
      console.error("Exa entity+claim query failed:", err);
    }
  }

  return allResults;
}

export function extractSourceLinks(exaResults: any[]): string[] {
  return exaResults
    .flatMap((result) => result.results?.map((item: any) => item.url) || [])
    .filter(Boolean);
}

export function exaFilter(exa: any[]) {
  let exaData: string[] = [];
  for (let i = 0; i < exa.length; i++) {
    exaData.push(exa[i].context);
  }
  return exaData;
}