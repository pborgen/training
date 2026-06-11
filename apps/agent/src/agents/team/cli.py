import sys

from agents.common.api import API_URL, USER_EMAIL
from agents.team.supervisor import CoachingTeam


def main() -> int:
    print(
        f"Coaching team — acting as {USER_EMAIL} against {API_URL}\n"
        "A supervisor routes each question to specialists: planning, nutrition, "
        "recovery, progress.\n"
        "Type 'exit' to quit, 'reset' to clear history.\n"
        "Try: 'should I train hard today?' or 'review my progress and tweak my plan'\n"
    )
    team = CoachingTeam()

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
            team.reset()
            print("(history cleared)\n")
            continue

        try:
            for kind, payload in team.stream(user_input):
                if kind == "specialist":
                    title, text = payload
                    print(f"  [{title}] {text}\n")
                elif kind == "reply":
                    print(f"coach > {payload}\n")
        except Exception as exc:  # surface config/API errors to the user
            print(f"error: {exc}", file=sys.stderr)
            return 1


if __name__ == "__main__":
    raise SystemExit(main())
