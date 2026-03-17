import { query } from "@anthropic-ai/claude-agent-sdk";

async function main() {
  console.log("Starting agent...");

  for await (const message of query({
    prompt: "Hello! What can you help me with?",
    options: {
      allowedTools: ["Read", "Glob", "Grep"],
      maxTurns: 1,
    },
  })) {
    if ("result" in message) {
      console.log(message.result);
    }
  }
}

main().catch(console.error);
