import * as dotenv from "dotenv";
import { Exa } from "exa-js";
import type { TransformedQuery } from "./types.js";

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
    console.log(searchData.searchTopics.entities[i]);
    const result = await exa.searchAndContents(
      `${entities[i]} ${concepts[j]}`,
      {
        text: true,
        type: "auto",
        numResults: 2,
        context: true,
      }
    );
    console.log(JSON.stringify(result, null, 2));
    allResults.push(result);
  }

  for (let k = 0, i = 0; i < 3 && k < 3; i++, k++) {
    const result = await exa.searchAndContents(`${entities[i]} ${claims[k]}`, {
      text: true,
      type: "auto",
      numResults: 2,
      context: true,
    });
    console.log(JSON.stringify(result, null, 2));
    allResults.push(result);
  }

  return allResults;
}

export function extractSourceLinks(exaResults: any[]): string[] {
  return exaResults
    .flatMap((result) => result.results?.map((item: any) => item.url) || [])
    .filter(Boolean);
}
