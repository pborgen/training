import sys

from agents.chatbot.agent import ChatbotAgent


def main() -> int:
    print("Chatbot agent — type 'exit' to quit, 'reset' to clear history.\n")
    agent = ChatbotAgent()

    while True:
        try:
            user_input = input("you > ").strip()
        except (EOFError, KeyboardInterrupt):
            print()
            return 0

        if not user_input:
            continue
        if user_input.lower() in {"exit", "quit"}:
            return 0
        if user_input.lower() == "reset":
            agent.reset()
            print("(history cleared)\n")
            continue

        try:
            reply = agent.send(user_input)
        except Exception as exc:  # surface config/API errors to the user
            print(f"error: {exc}", file=sys.stderr)
            return 1

        print(f"bot > {reply}\n")


if __name__ == "__main__":
    raise SystemExit(main())
