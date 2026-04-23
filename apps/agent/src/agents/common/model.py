import os

from dotenv import load_dotenv
from langchain_core.language_models.chat_models import BaseChatModel

load_dotenv()

DEFAULT_PROVIDER = "anthropic"
DEFAULT_MODELS = {
    "anthropic": "claude-sonnet-4-6",
    "groq": "llama-3.3-70b-versatile",
    "ollama": "llama3.2",
}


def build_chat_model(temperature: float = 0.7, max_tokens: int = 1024) -> BaseChatModel:
    provider = os.getenv("LLM_PROVIDER", DEFAULT_PROVIDER).lower()
    model = os.getenv("LLM_MODEL") or DEFAULT_MODELS.get(provider)
    if not model:
        raise RuntimeError(f"No default model for provider '{provider}'. Set LLM_MODEL.")

    if provider == "anthropic":
        from langchain_anthropic import ChatAnthropic

        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise RuntimeError("ANTHROPIC_API_KEY is not set.")
        return ChatAnthropic(
            model=model, api_key=api_key, temperature=temperature, max_tokens=max_tokens
        )

    if provider == "groq":
        from langchain_groq import ChatGroq

        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise RuntimeError("GROQ_API_KEY is not set. Get a free key at console.groq.com.")
        return ChatGroq(
            model=model, api_key=api_key, temperature=temperature, max_tokens=max_tokens
        )

    if provider == "ollama":
        from langchain_ollama import ChatOllama

        base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        return ChatOllama(
            model=model, base_url=base_url, temperature=temperature, num_predict=max_tokens
        )

    raise RuntimeError(
        f"Unknown LLM_PROVIDER '{provider}'. Supported: anthropic, groq, ollama."
    )
