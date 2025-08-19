import * as dotenv from "dotenv";
import { Exa } from "exa-js";

dotenv.config();

const exaKey: string | undefined = process.env.EXA_API_KEY;
if (!exaKey) {
  throw new Error("Missing EXA_API_KEY in environment variables");
}

const exa = new Exa(exaKey);

const searchData = {
  searchTopics: {
    entities: [
      "ISRO",
      "Chandrayaan-4",
      "Pragyan-2 rover",
      "Satish Dhawan Space Centre",
      "Shackleton crater",
    ],
    concepts: [
      "lunar south pole exploration",
      "water ice on the Moon",
      "lunar regolith drilling technology",
      "space mission budget and funding",
    ],
    claims: [
      "The Pragyan-2 rover's drill can penetrate up to 2 meters of lunar regolith.",
      "The primary objective of the Chandrayaan-4 mission is to search for water ice.",
      "The mission's official budget is ₹600 crore.",
      "Final ground tests for the mission have been successfully completed.",
    ],
  },
  ragQuestion:
    "What are the primary objectives, technical specifications (including the Pragyan-2 rover's capabilities), exploration target (Shackleton crater), and official budget of ISRO's Chandrayaan-4 mission?",
};

const entities: string[] = searchData.searchTopics.entities;
const concepts: string[] = searchData.searchTopics.concepts;
const claims: string[] = searchData.searchTopics.claims;

async function runExa(): Promise<void> {
  for (let i = 0, j = 0; i < 4 && j < 4; i++, j++) {
    console.log(searchData.searchTopics.entities[i]);
    const result = await exa.searchAndContents(
      `${entities[i]} ${concepts[j]}`,
      {
        text: true,
        type: "auto",
        numResults: 1,
        context: true,
      }
    );
    console.log(JSON.stringify(result, null, 2));
  }

  for (let k = 0, i = 0; i < 4 && k < 4; i++, k++) {
    const result = await exa.searchAndContents(`${entities[i]} ${claims[k]}`, {
      text: true,
      type: "auto",
      numResults: 1,
      context: true,
    });
    console.log(JSON.stringify(result, null, 2));
  }
}

runExa();
