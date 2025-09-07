import { chunk, embedData, vectorsData, chunks } from "../services/rag.js";
import { ragQuery, upsertVectors } from "../lib/pinecone.js";
import {
  userQuery,
  RAG_SCORE_THRESHOLD,
  QUALITY_SCORE_THRESHOLD,
} from "../lib/constants.js";
import { queryEmbedding } from "../services/ragQuery.js";
import { getFinalAnswer } from "../services/final-anwer.js";
import { qualityChecker } from "../services/qualityCheck.js";
import { transformQuery as queryTransformer } from "../services/query-transform.js";
import { runExa, extractSourceLinks, exaFilter } from "../services/exa.js";

const cache = true;

async function litmus() {
  try {
    if (cache) {
      const cacheWay = await cacheRoute();
      if (cacheWay.success) {
        return cacheWay;
      } else {
        return await noCacheRoute();
      }
    } else {
      return await noCacheRoute();
    }
  } catch (error) {
    console.error("Error in litmus:", error);
    throw error;
  }
}

async function cacheRoute() {
  const startTime = Date.now();
  try {
    const transformedQuery = await queryTransformer(userQuery);
    const queryEmbedder = await queryEmbedding(
      transformedQuery?.ragQuestion || ""
    );
    const ragResults = await ragQuery(queryEmbedder, transformedQuery.category);

    let metadata: string[] = [];
    if ("matches" in ragResults) {
      for (let i = 0; i < ragResults.matches.length; i++) {
        const textValue = ragResults.matches[i]?.metadata?.text;
        metadata.push(typeof textValue === "string" ? textValue : "");
      }
    } else {
      console.error("Failed to find matches in RAG");
    }

    if (ragResults.matches[0]?.score! > RAG_SCORE_THRESHOLD) {
      const response = await getFinalAnswer(transformedQuery, metadata);
      let finalResponse: string;
      if ("payload" in response && response.payload) {
        finalResponse = response.payload.description;
      } else {
        console.error("GetFinalAnswer failed:", response);
        throw new Error("Failed to get final answer from GetFinalAnswer");
      }
      const qualityCheck = await qualityChecker(
        finalResponse,
        transformedQuery
      );
      let checkResult: number;
      if ("sufficiency_percentage" in qualityCheck) {
        checkResult = qualityCheck.sufficiency_percentage;
      } else {
        console.error("qualityCheck failed:", qualityCheck);
        throw new Error("Failed to get result from quality checker");
      }
      const processingTime = Date.now() - startTime;
      if (checkResult > QUALITY_SCORE_THRESHOLD) {
        return {
          success: true,
          data: finalResponse,
          sources: null,
          credibility: checkResult,
          userQuery: transformedQuery.userQuery,
          processingTime,
        };
      } else {
        return {
          success: false,
          data: null,
          sources: null,
          credibility: null,
          userQuery: transformedQuery.userQuery,
          processingTime,
        };
      }
    } else {
      const processingTime = Date.now() - startTime;
      return {
        success: false,
        data: null,
        sources: null,
        credibility: null,
        userQuery: transformedQuery.userQuery,
        processingTime,
      };
    }
  } catch (error) {
    console.error("Error in cacheRoute:", error);
    throw error;
  }
}

async function noCacheRoute() {
  const startTime = Date.now();
  try {
    const transformedQuery = await queryTransformer(userQuery);
    const category = transformedQuery.category;

    const exa = await runExa(transformedQuery);
    const sourceLinks = extractSourceLinks(exa);
    const exaData = exaFilter(exa);
    const chunking = await chunk(exaData);
    const embedding = await embedData(chunking);
    const addDataToVectors = await vectorsData(embedding, chunking, category);
    const chunkingVectors = chunks(addDataToVectors);
    await upsertVectors(chunkingVectors);

    const queryEmbedder = await queryEmbedding(transformedQuery?.ragQuestion);
    const ragResults = await ragQuery(queryEmbedder, transformedQuery.category);

    let metadata: string[] = [];
    if ("matches" in ragResults) {
      for (let i = 0; i < ragResults.matches.length; i++) {
        const textValue = ragResults.matches[i]?.metadata?.text;
        metadata.push(typeof textValue === "string" ? textValue : "");
      }
    } else {
      console.error("Failed to find matches in RAG");
    }

    const response = await getFinalAnswer(transformedQuery, metadata);
    let finalResponse: string;
    if ("payload" in response && response.payload) {
      finalResponse = response.payload.description;
    } else {
      console.error("GetFinalAnswer failed:", response);
      throw new Error("Failed to get final answer from GetFinalAnswer");
    }
    const qualityCheck = await qualityChecker(finalResponse, transformedQuery);
    let checkResult: number;
    if ("sufficiency_percentage" in qualityCheck) {
      checkResult = qualityCheck.sufficiency_percentage;
    } else {
      console.error("qualityCheck failed:", qualityCheck);
      throw new Error("Failed to get result from quality checker");
    }
    const processingTime = Date.now() - startTime;
    return {
      success: true,
      data: finalResponse,
      sources: sourceLinks,
      credibility: checkResult,
      userQuery: transformedQuery.userQuery,
      processingTime,
    };
  } catch (error) {
    console.error("Error in noCacheRoute:", error);
    throw error;
  }
}

litmus()
  .then((result) => console.log("Final Result:", result))
  .catch(console.error);
