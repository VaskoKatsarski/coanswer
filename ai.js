import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Anthropic from "@anthropic-ai/sdk";

const here = path.dirname(fileURLToPath(import.meta.url));
const KNOWLEDGE_PATH = path.join(here, "knowledge.txt");

export function loadKnowledgeBase(filePath = KNOWLEDGE_PATH) {
  const lines = fs.readFileSync(filePath, "utf-8").split("\n");
  return lines
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && line.includes("|"))
    .map((line) => {
      const [question, answer] = line.split("|").map((part) => part.trim());
      return `Q: ${question}\nA: ${answer}`;
    })
    .join("\n\n");
}

export function buildSystemPrompt(knowledgeBase) {
  return (
    "You're answering customer questions for a Bulgarian cooperage (workshop making handmade oak baths and barrels). " +
    "Use the knowledge base below to answer. If you don't know, say so and tell the customer a human will follow up. " +
    "Be friendly and respond in Bulgarian.\n\n" +
    `Knowledge base:\n${knowledgeBase}`
  );
}

const client = new Anthropic();

export async function answerQuestion(question) {
  const knowledgeBase = loadKnowledgeBase();

  const response = await client.messages.create({
    model: "claude-opus-5",
    max_tokens: 1024,
    system: buildSystemPrompt(knowledgeBase),
    messages: [{ role: "user", content: question }],
  });

  return response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");
}
