import postgres from "postgres";

let _sql: postgres.Sql | null = null;

function sql(): postgres.Sql {
  if (!_sql) {
    const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    if (!url) throw new Error("POSTGRES_URL is not set");
    _sql = postgres(url);
  }
  return _sql;
}

/* ── RAG Tables ────────────────────────────── */

export async function ensureRagTables() {
  await sql()`
    CREATE TABLE IF NOT EXISTS exercise_knowledge (
      id TEXT PRIMARY KEY,
      exercise_id TEXT NOT NULL,
      chunk_type TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      content_tsv TSVECTOR,
      created_at TIMESTAMPTZ DEFAULT now()
    )
  `;
  await sql()`CREATE INDEX IF NOT EXISTS idx_knowledge_tsv ON exercise_knowledge USING GIN (content_tsv)`;
  await sql()`
    CREATE TABLE IF NOT EXISTS rag_chat_history (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL REFERENCES profiles(email),
      session_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      sources JSONB DEFAULT '[]',
      created_at TIMESTAMPTZ DEFAULT now()
    )
  `;
  // Migration: drop old vector column if it exists
  try { await sql()`ALTER TABLE exercise_knowledge DROP COLUMN IF EXISTS embedding`; } catch {};
}

export async function getKnowledgeChunkCount(): Promise<number> {
  const rows = await sql()`SELECT count(*)::int AS n FROM exercise_knowledge`;
  return rows[0].n as number;
}

export async function insertKnowledgeChunk(
  id: string, exerciseId: string, chunkType: string, title: string, content: string
) {
  await sql()`
    INSERT INTO exercise_knowledge (id, exercise_id, chunk_type, title, content, content_tsv)
    VALUES (${id}, ${exerciseId}, ${chunkType}, ${title}, ${content},
            to_tsvector('english', ${title} || ' ' || ${content}))
    ON CONFLICT (id) DO UPDATE SET
      content = EXCLUDED.content,
      content_tsv = to_tsvector('english', EXCLUDED.title || ' ' || EXCLUDED.content)
  `;
}

export async function getAllKnowledgeChunks() {
  const rows = await sql()`
    SELECT id, exercise_id, chunk_type, title, content, created_at
    FROM exercise_knowledge
    ORDER BY exercise_id, chunk_type
  `;
  return rows.map(r => ({
    id: r.id as string,
    exerciseId: r.exercise_id as string,
    chunkType: r.chunk_type as string,
    title: r.title as string,
    content: r.content as string,
    createdAt: r.created_at as string,
  }));
}

export async function getKnowledgeChunk(id: string) {
  const rows = await sql()`
    SELECT id, exercise_id, chunk_type, title, content, created_at
    FROM exercise_knowledge WHERE id = ${id}
  `;
  if (!rows.length) return null;
  const r = rows[0];
  return {
    id: r.id as string,
    exerciseId: r.exercise_id as string,
    chunkType: r.chunk_type as string,
    title: r.title as string,
    content: r.content as string,
    createdAt: r.created_at as string,
  };
}

export async function updateKnowledgeChunk(id: string, title: string, content: string) {
  await sql()`
    UPDATE exercise_knowledge
    SET title = ${title}, content = ${content},
        content_tsv = to_tsvector('english', ${title} || ' ' || ${content})
    WHERE id = ${id}
  `;
}

export async function deleteKnowledgeChunk(id: string) {
  await sql()`DELETE FROM exercise_knowledge WHERE id = ${id}`;
}

export async function searchSimilarChunks(query: string, topK: number) {
  const rows = await sql()`
    SELECT id, exercise_id, chunk_type, title, content,
           ts_rank(content_tsv, websearch_to_tsquery('english', ${query})) AS similarity
    FROM exercise_knowledge
    WHERE content_tsv @@ websearch_to_tsquery('english', ${query})
    ORDER BY similarity DESC
    LIMIT ${topK}
  `;
  return rows.map(r => ({
    id: r.id as string,
    exerciseId: r.exercise_id as string,
    chunkType: r.chunk_type as string,
    title: r.title as string,
    content: r.content as string,
    similarity: r.similarity as number,
    createdAt: r.created_at as string,
  }));
}

export async function saveChatMessage(
  id: string, email: string, sessionId: string, role: string, content: string, sources: unknown[] = []
) {
  const sourcesJson = JSON.stringify(sources);
  await sql()`
    INSERT INTO rag_chat_history (id, email, session_id, role, content, sources)
    VALUES (${id}, ${email}, ${sessionId}, ${role}, ${content}, ${sourcesJson}::jsonb)
  `;
}

export async function getChatHistory(email: string, sessionId: string) {
  const rows = await sql()`
    SELECT * FROM rag_chat_history
    WHERE email = ${email} AND session_id = ${sessionId}
    ORDER BY created_at ASC
  `;
  return rows.map(r => ({
    id: r.id as string,
    role: r.role as string,
    content: r.content as string,
    sources: r.sources as unknown[],
    createdAt: r.created_at as string,
  }));
}
