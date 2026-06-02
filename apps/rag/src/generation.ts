import { AnthropicBedrock } from "@anthropic-ai/bedrock-sdk";
import type { RelevantChunk, RagSource } from "./types.js";

// Claude on AWS Bedrock. Credentials resolve via the standard AWS chain
// (instance role in App Runner, env vars / SSO locally); region from AWS_REGION.
const anthropic = new AnthropicBedrock({
  awsRegion: process.env.AWS_REGION ?? "us-east-1",
});

// Bedrock cross-region inference profile id for Claude Sonnet 4.
const MODEL_ID = "us.anthropic.claude-sonnet-4-20250514-v1:0";

const SYSTEM_PROMPT = `You are a knowledgeable fitness coach and exercise expert. You answer questions about exercises, form, programming, and training.

IMPORTANT RULES:
- Base your answers ONLY on the provided context documents. Do not make up information.
- If the context doesn't contain enough information to fully answer the question, say so honestly.
- When referencing information, mention which exercise and topic it comes from.
- Keep answers concise but thorough. Use bullet points for lists.
- If asked about an exercise not in the context, say you don't have information about that specific exercise.`;

/**
 * Generate an answer using Claude with retrieved context.
 *
 * This is the "generation" step of RAG:
 * 1. Format the retrieved chunks into a context block
 * 2. Send the context + user question to Claude
 * 3. Claude generates an answer grounded in the provided context
 *
 * Without the retrieved context, Claude would rely on its training
 * data (which might be outdated or generic). With context, it gives
 * specific, accurate answers based on your knowledge base.
 */
export async function generateAnswer(
  query: string,
  chunks: RelevantChunk[],
  chatHistory: { role: "user" | "assistant"; content: string }[] = []
): Promise<{ answer: string; sources: RagSource[] }> {
  // Format retrieved chunks into a context block for Claude
  const contextBlock = chunks
    .map(
      (chunk, i) =>
        `[Source ${i + 1}: ${chunk.title} (similarity: ${chunk.similarity.toFixed(2)})]
${chunk.content}`
    )
    .join("\n\n---\n\n");

  // Build the messages array with optional chat history
  const messages: AnthropicBedrock.MessageParam[] = [
    ...chatHistory.map(
      (msg) =>
        ({ role: msg.role, content: msg.content }) as AnthropicBedrock.MessageParam
    ),
    {
      role: "user",
      content: `Here are relevant documents from the exercise knowledge base:

${contextBlock}

---

Based on the above context, please answer this question:
${query}`,
    },
  ];

  // Call Claude via Bedrock
  const response = await anthropic.messages.create({
    model: MODEL_ID,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages,
  });

  const answer =
    response.content[0].type === "text" ? response.content[0].text : "";

  // Build source references for the frontend
  const sources: RagSource[] = chunks.map((chunk) => ({
    chunkId: chunk.id,
    exerciseId: chunk.exerciseId,
    chunkType: chunk.chunkType,
    title: chunk.title,
    similarity: chunk.similarity,
  }));

  return { answer, sources };
}
