export type {
  KnowledgeChunk,
  StoredChunk,
  RelevantChunk,
  RagMessage,
  RagSource,
  RagChatResponse,
} from "./types.js";

export { EXERCISE_KNOWLEDGE } from "./knowledge.js";
export { seedKnowledgeBase } from "./embeddings.js";
export { retrieveRelevantChunks } from "./retrieval.js";
export { generateAnswer } from "./generation.js";
export {
  ensureRagTables,
  getKnowledgeChunkCount,
  getAllKnowledgeChunks,
  getKnowledgeChunk,
  insertKnowledgeChunk,
  updateKnowledgeChunk,
  deleteKnowledgeChunk,
  searchSimilarChunks,
  saveChatMessage,
  getChatHistory,
} from "./db.js";
