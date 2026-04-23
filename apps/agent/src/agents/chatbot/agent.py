from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

from agents.common.model import build_chat_model

SYSTEM_PROMPT = (
    "You are a friendly, concise assistant for the PFA training app. "
    "Answer questions clearly and ask for clarification when the request is ambiguous."
)


class ChatbotAgent:
    def __init__(self, system_prompt: str = SYSTEM_PROMPT) -> None:
        self._history: list[BaseMessage] = []
        self._prompt = ChatPromptTemplate.from_messages(
            [
                SystemMessage(content=system_prompt),
                MessagesPlaceholder("history"),
                ("human", "{input}"),
            ]
        )
        self._chain = self._prompt | build_chat_model()

    def send(self, user_input: str) -> str:
        response = self._chain.invoke({"history": self._history, "input": user_input})
        reply = response.content if isinstance(response.content, str) else str(response.content)
        self._history.append(HumanMessage(content=user_input))
        self._history.append(AIMessage(content=reply))
        return reply

    def reset(self) -> None:
        self._history.clear()
