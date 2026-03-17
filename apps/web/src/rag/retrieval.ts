import { searchSimilarChunks } from "../db.js";
import type { RelevantChunk } from "./types.js";

/**
 * Retrieve the most relevant knowledge chunks for a user's query.
 *
 * Uses PostgreSQL full-text search (tsvector/tsquery) to find
 * chunks whose content matches the query terms. This replaces
 * vector embeddings with built-in PostgreSQL text search —
 * no external API needed.
 */
export async function retrieveRelevantChunks(
  query: string,
  topK: number = 5,
  minSimilarity: number = 0
): Promise<RelevantChunk[]> {
  const results = await searchSimilarChunks(query, topK);
  return results.filter(chunk => chunk.similarity >= minSimilarity) as RelevantChunk[];
}
