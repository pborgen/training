/** A chunk of exercise knowledge to be embedded and stored */
export interface KnowledgeChunk {
  exerciseId: string;
  chunkType: "overview" | "muscles" | "form" | "mistakes" | "alternatives" | "programming";
  title: string;
  content: string;
}

/** A stored chunk with its ID and optional embedding */
export interface StoredChunk extends KnowledgeChunk {
  id: string;
  createdAt: string;
}

/** A chunk retrieved via similarity search, with its score */
export interface RelevantChunk extends StoredChunk {
  similarity: number;
}

/** A single message in a RAG chat session */
export interface RagMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources: RagSource[];
  createdAt: string;
}

/** A source reference attached to an assistant message */
export interface RagSource {
  chunkId: string;
  exerciseId: string;
  chunkType: string;
  title: string;
  similarity: number;
}

/** The response from the RAG chat endpoint */
export interface RagChatResponse {
  answer: string;
  sources: RagSource[];
  sessionId: string;
}
