import sys

from agents.coach.agent import CoachAgent
from agents.coach.tools import API_URL, USER_EMAIL


def main() -> int:
    print(
        f"Coach agent — acting as {USER_EMAIL} against {API_URL}\n"
        "Type 'exit' to quit, 'reset' to clear history.\n"
        "Try: 'what routines do I have?' or 'schedule my leg day for Friday'\n"
    )
    agent = CoachAgent()

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
            for kind, text in agent.stream(user_input):
                if kind == "tool":
                    print(f"  [tool] {text}")
                else:
                    print(f"coach > {text}\n")
        except Exception as exc:  # surface config/API errors to the user
            print(f"error: {exc}", file=sys.stderr)
            return 1


if __name__ == "__main__":
    raise SystemExit(main())
