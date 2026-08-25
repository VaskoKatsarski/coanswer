import { answerQuestion } from "./ai.js";

async function main() {
  const question = process.argv[2];

  if (!question) {
    console.error('Usage: node agent.js "Your question here"');
    process.exit(1);
  }

  const answer = await answerQuestion(question);
  console.log(answer);
}

main().catch((error) => {
  console.error("Error:", error.message ?? error);
  process.exit(1);
});
