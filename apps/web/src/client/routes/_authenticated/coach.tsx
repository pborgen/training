import { useState, useRef, useEffect } from "react";
import { useCoachTeam } from "../../hooks/useCoachTeam";
import type { TeamSpecialist } from "../../api";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  specialists?: TeamSpecialist[];
}

export function CoachPage() {
  const chatMutation = useCoachTeam();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
        { role: "assistant", content: result.answer, specialists: result.specialists },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
    }
  }

  function toggle(idx: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  return (
    <div className="coach-container">
      <div className="coach-header">
        <h2>Coaching Team</h2>
        <div className="coach-header-right">
          <span className="coach-chip">planning · nutrition · recovery · progress</span>
        </div>
      </div>

      <div className="coach-messages">
        {messages.length === 0 && (
          <div className="coach-welcome">
            <p><strong>Your coaching team is ready.</strong></p>
            <p>A supervisor routes each question to the right specialists. Try:</p>
            <div className="coach-suggestions">
              {[
                "Should I train hard today or take it easy?",
                "How much protein should I be eating for my goal?",
                "Review my recent progress and find any plateaus",
                "Plan my training week and schedule it",
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
            {msg.specialists && msg.specialists.length > 0 && (
              <>
                <button className="coach-sources-toggle" onClick={() => toggle(i)}>
                  {expanded.has(i) ? "Hide" : "Show"} team breakdown ({msg.specialists.length}{" "}
                  {msg.specialists.length === 1 ? "specialist" : "specialists"})
                </button>
                {expanded.has(i) && (
                  <div className="coach-sources">
                    {msg.specialists.map((s, j) => (
                      <div key={j} className="coach-source" style={{ flexDirection: "column", alignItems: "flex-start", gap: "0.25rem" }}>
                        <span className="coach-source-title">{s.title}</span>
                        <span style={{ color: "var(--muted)", fontSize: "0.85rem", whiteSpace: "pre-wrap" }}>{s.content}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        ))}

        {chatMutation.isPending && (
          <div className="coach-msg coach-msg-assistant">
            <div className="coach-avatar">P</div>
            <div className="coach-msg-label">Coach</div>
            <div className="coach-msg-content coach-typing">The team is conferring...</div>
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
          placeholder="Ask about training, nutrition, recovery, or your progress..."
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
