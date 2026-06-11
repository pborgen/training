"""LangGraph tool-using coach agent.

Explicit StateGraph (rather than langgraph.prebuilt.create_react_agent) so the
agent loop is visible: the model node decides whether to call tools, the tool
node executes them, and control loops back to the model until it produces a
final answer. Conversation memory is handled by a checkpointer keyed on a
thread id.
"""
from __future__ import annotations

import uuid
from collections.abc import Iterator
from datetime import date

from langchain_core.messages import AIMessage, SystemMessage, ToolMessage
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, START, MessagesState, StateGraph
from langgraph.prebuilt import ToolNode, tools_condition

from agents.common.model import build_chat_model
from agents.coach.tools import COACH_TOOLS, USER_EMAIL

SYSTEM_PROMPT = """You are a fitness coach assistant for the PFA training app, \
helping the client {email}. Today's date is {today}.

You have tools to read the exercise catalog, the client's routines, schedule, \
and readiness check-ins, and to schedule workouts. Use them instead of guessing — \
look up real data before answering. When scheduling, find the routine id with \
list_routines first. Be concise and practical."""


class CoachAgent:
    def __init__(self) -> None:
        model = build_chat_model(temperature=0.2, max_tokens=2048)
        self._model = model.bind_tools(COACH_TOOLS)
        self._graph = self._build_graph()
        self._thread_id = str(uuid.uuid4())

    def _build_graph(self):
        def call_model(state: MessagesState) -> dict:
            system = SystemMessage(
                content=SYSTEM_PROMPT.format(email=USER_EMAIL, today=date.today().isoformat())
            )
            response = self._model.invoke([system, *state["messages"]])
            return {"messages": [response]}

        graph = StateGraph(MessagesState)
        graph.add_node("agent", call_model)
        graph.add_node("tools", ToolNode(COACH_TOOLS))
        graph.add_edge(START, "agent")
        graph.add_conditional_edges("agent", tools_condition, {"tools": "tools", END: END})
        graph.add_edge("tools", "agent")
        return graph.compile(checkpointer=MemorySaver())

    def stream(self, user_input: str) -> Iterator[tuple[str, str]]:
        """Run one turn, yielding ("tool", description) and ("reply", text) events."""
        config = {"configurable": {"thread_id": self._thread_id}}
        for update in self._graph.stream(
            {"messages": [("human", user_input)]}, config, stream_mode="updates"
        ):
            for node_output in update.values():
                for message in node_output.get("messages", []):
                    if isinstance(message, AIMessage) and message.tool_calls:
                        for call in message.tool_calls:
                            args = ", ".join(f"{k}={v!r}" for k, v in call["args"].items())
                            yield ("tool", f"{call['name']}({args})")
                    elif isinstance(message, ToolMessage):
                        continue
                    elif isinstance(message, AIMessage):
                        text = (
                            message.content
                            if isinstance(message.content, str)
                            else str(message.content)
                        )
                        if text.strip():
                            yield ("reply", text)

    def reset(self) -> None:
        self._thread_id = str(uuid.uuid4())
