import { EXERCISE_KNOWLEDGE } from "./knowledge.js";
import { insertKnowledgeChunk, getKnowledgeChunkCount } from "../db.js";

/**
 * Seed the knowledge base by inserting all exercise knowledge chunks
 * into the database with full-text search indexing.
 *
 * Uses PostgreSQL tsvector/tsquery for retrieval instead of
 * vector embeddings — no external embedding API needed.
 */
export async function seedKnowledgeBase(): Promise<{ chunksProcessed: number }> {
  let processed = 0;

  for (const chunk of EXERCISE_KNOWLEDGE) {
    const id = `${chunk.exerciseId}-${chunk.chunkType}`;
    console.log(`  Indexing: ${chunk.title}...`);

    await insertKnowledgeChunk(id, chunk.exerciseId, chunk.chunkType, chunk.title, chunk.content);
    processed++;
  }

  const total = await getKnowledgeChunkCount();
  console.log(`Seeding complete: ${processed} chunks processed, ${total} total in database.`);
  return { chunksProcessed: processed };
}
