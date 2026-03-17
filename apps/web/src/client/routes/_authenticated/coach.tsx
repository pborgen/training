import { useState, useRef, useEffect } from "react";
import { useRagStatus, useRagChat } from "../../hooks/useRagChat";
import { triggerRagSeed, type RagChatResponse } from "../../api";
import { useAuth } from "../../auth";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: RagChatResponse["sources"];
}

export function CoachPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const { data: status, refetch: refetchStatus } = useRagStatus();
  const chatMutation = useRagChat();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [expandedSources, setExpandedSources] = useState<Set<number>>(new Set());
  const [seeding, setSeeding] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSeed() {
    setSeeding(true);
    try {
      await triggerRagSeed();
      await refetchStatus();
    } catch (e) {
      alert("Seeding failed: " + (e as Error).message);
    } finally {
      setSeeding(false);
    }
  }

  async function handleSend() {
    const msg = input.trim();
    if (!msg || chatMutation.isPending) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: msg }]);

    try {
      const result = await chatMutation.mutateAsync({ message: msg, sessionId });
      setSessionId(result.sessionId);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: result.answer, sources: result.sources },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
    }
  }

  function toggleSources(idx: number) {
    setExpandedSources((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  if (!status) return (
    <div className="skeleton-page">
      <div className="skeleton skeleton-heading" />
      <div className="skeleton skeleton-card" />
      <div className="skeleton skeleton-card-sm" />
    </div>
  );

  if (!status.seeded) {
    return (
      <div className="coach-empty">
        <h2>Exercise Coach</h2>
        <p>The knowledge base hasn't been set up yet. It needs to be seeded with exercise data before you can ask questions.</p>
        <p style={{ fontSize: "0.9rem", color: "var(--muted)" }}>
          This will embed {66} exercise knowledge chunks using OpenAI's embedding model and store them in pgvector for similarity search.
        </p>
        {isAdmin ? (
          <button className="btn-primary" onClick={handleSeed} disabled={seeding}>
            {seeding ? "Seeding... (this takes ~30s)" : "Seed Knowledge Base"}
          </button>
        ) : (
          <p style={{ color: "var(--muted)" }}>Ask an admin to seed the knowledge base.</p>
        )}
      </div>
    );
  }

  return (
    <div className="coach-container">
      <div className="coach-header">
        <h2>Exercise Coach</h2>
        <div className="coach-header-right">
          <span className="coach-chip">{status.chunkCount} chunks indexed</span>
          <label className="coach-toggle">
            <input type="checkbox" checked={showDebug} onChange={(e) => setShowDebug(e.target.checked)} />
            Show sources
          </label>
        </div>
      </div>

      <div className="coach-messages">
        {messages.length === 0 && (
          <div className="coach-welcome">
            <p><strong>Ask me anything about exercises!</strong></p>
            <p>Try questions like:</p>
            <div className="coach-suggestions">
              {[
                "What muscles does the deadlift target?",
                "How do I fix knee cave during squats?",
                "What's a good substitute for the hack squat?",
                "How should I program hip thrusts for glute growth?",
              ].map((q) => (
                <button key={q} className="coach-suggestion" onClick={() => { setInput(q); }}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`coach-msg coach-msg-${msg.role}`}>
            {msg.role === "assistant" && <div className="coach-avatar">P</div>}
            <div className="coach-msg-label">{msg.role === "user" ? "You" : "Coach"}</div>
            <div className="coach-msg-content">{msg.content}</div>
            {msg.sources && msg.sources.length > 0 && (showDebug || expandedSources.has(i)) && (
              <div className="coach-sources">
                <div className="coach-sources-title" onClick={() => toggleSources(i)}>
                  Sources ({msg.sources.length} chunks retrieved)
                </div>
                {msg.sources.map((s, j) => (
                  <div key={j} className="coach-source">
                    <span className="coach-source-title">{s.title}</span>
                    <span className="coach-source-score">{(s.similarity * 100).toFixed(0)}% match</span>
                  </div>
                ))}
              </div>
            )}
            {msg.sources && msg.sources.length > 0 && !showDebug && !expandedSources.has(i) && (
              <button className="coach-sources-toggle" onClick={() => toggleSources(i)}>
                View {msg.sources.length} sources
              </button>
            )}
          </div>
        ))}

        {chatMutation.isPending && (
          <div className="coach-msg coach-msg-assistant">
            <div className="coach-avatar">P</div>
            <div className="coach-msg-label">Coach</div>
            <div className="coach-msg-content coach-typing">Thinking...</div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form
        className="coach-input-bar"
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Ask about exercises, form, programming..."
          disabled={chatMutation.isPending}
          rows={3}
          autoFocus
        />
        <button type="submit" className="btn-primary" disabled={chatMutation.isPending || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
