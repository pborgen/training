"""The supervisor that orchestrates the coaching team.

Hand-rolled StateGraph (rather than a prebuilt supervisor) so the routing loop is
visible, matching the explicit style of the single coach agent:

    START -> supervisor -> (one specialist) -> supervisor -> ... -> finalize -> END

The supervisor reads the conversation and routes the turn to ONE specialist at a
time, accumulating their notes, until it decides the question is fully answered
(FINISH). A finalize node then returns the answer directly if a single specialist
handled it, or synthesizes the notes into one coherent reply when several did.

Conversation memory lives in the CLI (full history is passed in each turn), so the
graph itself is stateless across turns — its state exists only for one user turn.
"""
from __future__ import annotations

from collections.abc import Iterator
from typing import Annotated, Literal, TypedDict

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage
from langgraph.graph import END, START, StateGraph
from pydantic import BaseModel, Field

from agents.common.model import build_chat_model
from agents.team.specialists import Specialist, build_specialists

# Hard cap on specialist hops per turn so a confused supervisor can't loop forever.
MAX_HOPS = 4

RouteName = Literal["planning", "nutrition", "recovery", "progress", "FINISH"]


class Route(BaseModel):
    """The supervisor's routing decision for the next step."""

    next: RouteName = Field(description="Which specialist acts next, or FINISH if done.")
    reason: str = Field(description="One short sentence on why.")


class Note(TypedDict):
    name: str
    title: str
    content: str


class TeamState(TypedDict):
    # Conversation passed in for this turn (history + latest human message).
    messages: Annotated[list[BaseMessage], lambda a, b: a + b]
    notes: Annotated[list[Note], lambda a, b: a + b]
    route: str
    hops: int
    final: str


def _supervisor_prompt(specialists: dict[str, Specialist]) -> str:
    roster = "\n".join(f"- {s.name}: {s.description}" for s in specialists.values())
    return (
        "You are the supervisor of a fitness coaching team for the PFA training app. "
        "Given the conversation and any notes already gathered from specialists, decide "
        "which ONE specialist should act next, or FINISH once the client's question is "
        "fully addressed.\n\n"
        f"Specialists:\n{roster}\n\n"
        "Rules: route to a specialist only when its expertise is genuinely needed and it "
        "hasn't already covered this turn. Prefer the minimal number of specialists — many "
        "questions need only one. Choose FINISH as soon as the gathered notes can answer "
        "the client."
    )


def _notes_digest(notes: list[Note]) -> str:
    if not notes:
        return "(no specialist has acted yet this turn)"
    return "\n\n".join(f"[{n['title']}]\n{n['content']}" for n in notes)


class CoachingTeam:
    """Multi-agent coaching team with a routing supervisor and four specialists."""

    def __init__(self) -> None:
        self._specialists = build_specialists()
        self._router = build_chat_model(temperature=0).with_structured_output(Route)
        self._synthesizer = build_chat_model(temperature=0.3, max_tokens=2048)
        self._sup_prompt = _supervisor_prompt(self._specialists)
        self._graph = self._build_graph()
        self._history: list[BaseMessage] = []

    # --- graph construction -------------------------------------------------

    def _build_graph(self):
        graph = StateGraph(TeamState)
        graph.add_node("supervisor", self._supervisor_node)
        for name in self._specialists:
            graph.add_node(name, self._make_specialist_node(name))
        graph.add_node("finalize", self._finalize_node)

        graph.add_edge(START, "supervisor")
        graph.add_conditional_edges(
            "supervisor",
            lambda state: state["route"],
            {**{name: name for name in self._specialists}, "finalize": "finalize"},
        )
        for name in self._specialists:
            graph.add_edge(name, "supervisor")
        graph.add_edge("finalize", END)
        return graph.compile()

    def _supervisor_node(self, state: TeamState) -> dict:
        if state.get("hops", 0) >= MAX_HOPS:
            return {"route": "finalize"}
        digest = _notes_digest(state.get("notes", []))
        prompt = [
            SystemMessage(content=self._sup_prompt),
            *state["messages"],
            SystemMessage(content=f"Notes gathered so far this turn:\n{digest}"),
        ]
        decision: Route = self._router.invoke(prompt)
        route = "finalize" if decision.next == "FINISH" else decision.next
        return {"route": route}

    def _make_specialist_node(self, name: str):
        specialist = self._specialists[name]

        def node(state: TeamState) -> dict:
            result = specialist.graph.invoke({"messages": state["messages"]})
            answer = ""
            for message in reversed(result["messages"]):
                if isinstance(message, AIMessage) and isinstance(message.content, str):
                    if message.content.strip():
                        answer = message.content
                        break
            note: Note = {"name": name, "title": specialist.title, "content": answer}
            # Surface the specialist's note back into the shared transcript so the next
            # specialist (and the supervisor) can build on it.
            tagged = AIMessage(content=f"[{specialist.title}] {answer}")
            return {"notes": [note], "messages": [tagged], "hops": state.get("hops", 0) + 1}

        return node

    def _finalize_node(self, state: TeamState) -> dict:
        notes = state.get("notes", [])
        if not notes:
            return {"final": "I wasn't able to find a specialist to help with that."}
        if len(notes) == 1:
            return {"final": notes[0]["content"]}
        # Several specialists contributed — weave their notes into one reply.
        user_msg = next(
            (m.content for m in reversed(state["messages"]) if isinstance(m, HumanMessage)),
            "",
        )
        prompt = [
            SystemMessage(
                content=(
                    "You are the lead coach. Combine the specialists' notes below into one "
                    "clear, cohesive answer for the client. Don't mention the team or the "
                    "individual specialists — speak as one coach. Keep it concise."
                )
            ),
            HumanMessage(
                content=f"Client asked: {user_msg}\n\nSpecialist notes:\n{_notes_digest(notes)}"
            ),
        ]
        reply = self._synthesizer.invoke(prompt)
        text = reply.content if isinstance(reply.content, str) else str(reply.content)
        return {"final": text}

    # --- public API ---------------------------------------------------------

    def stream(self, user_input: str) -> Iterator[tuple[str, object]]:
        """Run one turn. Yields ("route", reason-str), ("specialist", (title, text)),
        and finally ("reply", text). History is updated with the final reply."""
        turn_messages = [*self._history, HumanMessage(content=user_input)]
        seen_notes = 0
        final = ""
        for update in self._graph.stream(
            {"messages": turn_messages, "notes": [], "hops": 0, "route": "", "final": ""},
            stream_mode="values",
        ):
            notes = update.get("notes", [])
            if len(notes) > seen_notes:
                for note in notes[seen_notes:]:
                    yield ("specialist", (note["title"], note["content"]))
                seen_notes = len(notes)
            if update.get("final"):
                final = update["final"]

        self._history.append(HumanMessage(content=user_input))
        self._history.append(AIMessage(content=final))
        yield ("reply", final)

    def reset(self) -> None:
        self._history.clear()

    def run(self, user_input: str, history: list[dict] | None = None) -> dict:
        """Stateless single turn for server use. `history` is a list of
        {"role": "user"|"assistant", "content": str} from prior turns. Returns
        {"answer": str, "specialists": [{"name","title","content"}, ...]}. Safe to
        call concurrently — no instance state is mutated."""
        prior: list[BaseMessage] = []
        for m in history or []:
            content = m.get("content", "")
            if m.get("role") == "assistant":
                prior.append(AIMessage(content=content))
            else:
                prior.append(HumanMessage(content=content))
        turn_messages = [*prior, HumanMessage(content=user_input)]
        result = self._graph.invoke(
            {"messages": turn_messages, "notes": [], "hops": 0, "route": "", "final": ""}
        )
        specialists = [
            {"name": n["name"], "title": n["title"], "content": n["content"]}
            for n in result.get("notes", [])
        ]
        return {"answer": result.get("final", ""), "specialists": specialists}
