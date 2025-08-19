import axios from "axios";
import * as cheerio from "cheerio";
import { chromium } from "playwright";
import type { Page } from "playwright";
import { BROWSER_HEADERS } from "../lib/constants.js";

const scrapeUrl =
  "https://www.republicworld.com/cricket/daava-hai-nahi-hoga-ex-csk-star-recalls-operation-sindoor-claims-india-vs-pakistan-asia-cup-2025-match-will-not-happen";

interface ScrapeResult {
  title: string;
  body: string;
}

export async function scrape(
  scrapeUrl: string
): Promise<ScrapeResult | undefined> {
  const locatorTweet = "div.tweet-content.media-body";
  const locatorGeneric = "body";
  let pageData: ScrapeResult;
  const possibleTwtUrls = [
    "https://x.com",
    "https://twitter.com",
    "https://mobile.twitter.com",
    "https://mobile.x.com",
  ];

  try {
    const isTwtUrl = possibleTwtUrls.some((url) => scrapeUrl.startsWith(url));

    if (isTwtUrl) {
      const twtId = scrapeUrl.split("/").slice(3).join("/"); // slices the url contents after the domain

      pageData = await scrapeWithPlaywright(
        `https://nitter.net/${twtId}`,
        locatorTweet
      );
    } else {
      pageData = await scrapeWithAxios(scrapeUrl);

      if (pageData.body.length < 50) {
        pageData = await scrapeWithPlaywright(scrapeUrl, locatorGeneric);
      }
    }

    console.log("Scraped data:", pageData);
    return pageData;
  } catch (err) {
    console.warn("Axios failed, falling back to Playwright:", err);
    return undefined;
  }
}

async function scrapeWithAxios(url: string): Promise<ScrapeResult> {
  let title = "";
  let articleBody = "";

  try {
    const response = await axios.get(url, {
      headers: BROWSER_HEADERS,
    });

    const html: string = response.data;
    const $ = cheerio.load(html);
    $("script, style, noscript, svg, footer, header, nav").remove();
    title = $("h1").text().trim();
    articleBody = $("body").text().trim().replace(/\s+/g, " ");

    if (!articleBody || articleBody.length < 50) {
      throw new Error("Axios/cheerio scraping returned empty or invalid body");
    }

    console.log("--- SCRAPED WITH AXIOS ---");
    const randTime: number = Math.random() * (5000 - 1000) + 1000;
    setTimeout(() => {
      console.log("Please wait while we process your request.");
    }, randTime);
    return { title, body: articleBody };
  } catch (error) {
    console.error("Error scraping the article:", error);
    return { title: "Error", body: "Failed to scrape with Axios" };
  }
}

async function scrapeWithPlaywright(
  url: string,
  locatorVar: string
): Promise<ScrapeResult> {
  let pageData: string[] = [];

  try {
    const browser = await chromium.launch({ headless: false, timeout: 8000 });
    const context = await browser.newContext();
    const page: Page = await context.newPage();

    await page.goto(url);
    await page.waitForLoadState("domcontentloaded");
    pageData = await page.locator(locatorVar).allInnerTexts();
    await browser.close();

    console.log("--- SCRAPED WITH PLAYWRIGHT ---");
  } catch (error) {
    console.error("An error occurred:", error);
  } finally {
    const body = pageData.join(" ").trim();
    const randTime = Math.random() * (5000 - 1000) + 1000;
    await delay(randTime);

    return {
      title: "",
      body,
    };
  }
}

scrape(scrapeUrl);

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
