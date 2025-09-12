import axios from "axios";
import * as dotenv from "dotenv";
import { Exa } from "exa-js";
import * as cheerio from "cheerio";
import { chromium } from "playwright";
import type { Page } from "playwright";
import { BROWSER_HEADERS } from "../lib/constants.js";

dotenv.config();

const EXA_API_KEY: string | undefined = process.env.EXA_API_KEY;
if (!EXA_API_KEY) {
  throw new Error("Missing EXA_API_KEY. Please set it in your environment.");
}

const exa = new Exa(EXA_API_KEY);
interface ScrapeResult {
  title: string;
  body: string;
}

export async function scrape(
  scrapeUrl: string
): Promise<ScrapeResult | undefined> {
  const locatorTweet = ".tweet-content";
  const locatorGeneric = "body";

  const possibleTwtUrls = [
    "https://x.com",
    "https://twitter.com",
    "https://mobile.twitter.com",
    "https://mobile.x.com",
  ];

  function isValidScrape(data: ScrapeResult, minLength = 10): boolean {
    // -> Function to check if the return output is a valid scrape or not
    return Boolean(data?.body && data.body.trim().length >= minLength);
  }

  try {
    const isTwitterUrl = possibleTwtUrls.some((url) =>
      scrapeUrl.startsWith(url)
    );

    if (isTwitterUrl) {
      // --- Twitter case ---
      const twtId = scrapeUrl.split("/").slice(3).join("/");
      try {
        const pageData: ScrapeResult = await scrapeWithPlaywright(
          `https://nitter.net/${twtId}`,
          locatorTweet
        );
        if (isValidScrape(pageData, 20)) {
          console.log("Scraped Twitter via Nitter");
          return pageData;
        }
        console.warn("Nitter returned empty/short body");
      } catch (err) {
        console.error("Twitter scrape failed:", err);
      }
      return undefined; // Twitter has no further fallback
    } else {
      // --- Generic website case ---
      try {
        const axiosData = await scrapeWithAxios(scrapeUrl);
        if (isValidScrape(axiosData)) {
          console.log("Scraped successfully with Axios");
          return axiosData;
        }
        console.warn("Axios invalid, trying Exa...");
      } catch (err) {
        console.warn("Axios failed:", err);
      }

      try {
        const exaData = await scrapeWithExa(scrapeUrl);
        if (isValidScrape(exaData)) {
          console.log("Scraped successfully with Exa");
          return exaData;
        }
        console.warn("Exa invalid, trying Playwright...");
      } catch (err) {
        console.warn("Exa failed:", err);
      }

      try {
        const pwData = await scrapeWithPlaywright(scrapeUrl, locatorGeneric);
        if (isValidScrape(pwData)) {
          console.log("Scraped successfully with Playwright");
          return pwData;
        }
        console.warn("Playwright invalid");
      } catch (err) {
        console.error("Playwright failed:", err);
      }

      console.error("All scraping methods failed");
      return undefined;
    }
  } catch (err) {
    console.error("Unexpected scrape error:", err);
    return undefined;
  }
}

async function scrapeWithAxios(url: string): Promise<ScrapeResult> {
  let title = "";
  let articleBody = "";

  const response = await axios.get(url, {
    headers: BROWSER_HEADERS,
    timeout: 10_000,
    maxRedirects: 5,
    validateStatus: (s) => s >= 200 && s < 400,
  });

  const html: string = response.data;
  const $ = cheerio.load(html);
  $("script, style, noscript, svg, footer, header, nav").remove();
  title = $("title").text().trim() || $("h1").first().text().trim();
  articleBody = $("body").text().trim().replace(/\s+/g, " ");

  if (!articleBody || articleBody.length < 50) {
    throw new Error("Axios/cheerio scraping returned empty or invalid body");
  }

  console.log("--- SCRAPED WITH AXIOS ---");
  const randTime: number = Math.random() * (5000 - 1000) + 1000;
  await delay(randTime);
  console.log("Please wait while we process your request.");

  return { title, body: articleBody };
}

async function scrapeWithExa(url: string): Promise<ScrapeResult> {
  const result = await exa.getContents([url], {
    text: true,
    context: true,
  });
  const data = result.results?.[0]?.text ?? "";
  const cleanData = data
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[#/\\]+/g, " ");

  if (!cleanData || cleanData.length < 50) {
    throw new Error("Exa scraping returned empty or invalid body");
  }
  const randTime: number = Math.random() * (5000 - 1000) + 1000;
  await delay(randTime);
  return { title: "", body: cleanData };
}

async function scrapeWithPlaywright(
  url: string,
  locatorVar: string
): Promise<ScrapeResult> {
  const browser = await chromium.launch({ headless: false });
  try {
    const context = await browser.newContext();
    const page: Page = await context.newPage();

    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.waitForSelector(locatorVar, {
      state: "visible",
      timeout: 10000,
    });

    const pageData = await page.locator(locatorVar).allInnerTexts();
    const body = pageData.join("\n\n").trim();

    if (!body || body.length < 20) {
      throw new Error("Playwright scraping returned empty or invalid body");
    }

    console.log("--- SCRAPED WITH PLAYWRIGHT ---");
    console.log(body);
    return { title: "", body };
  } finally {
    await browser.close();
  }
}

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}