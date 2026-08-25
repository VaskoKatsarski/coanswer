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
    "Ти си асистент на Бъчварски цех Кацарски — семеен цех с над 150 години традиция в ръчната изработка на дъбови вани и бурета, намиращ се във Врачеш, близо до Ботевград.\n\n" +
    "ПРАВИЛА ЗА ОТГОВАРЯНЕ:\n" +
    "1. Отговаряй КРАТКО — максимум 2-3 изречения. Никога не пиши стени от текст.\n" +
    "2. Бъди топъл и приветлив, сякаш говориш с комшия.\n" +
    "3. Винаги завършвай с ЕДНА ясна следваща стъпка — въпрос или предложение.\n" +
    "4. Споменавай традицията (150 години) и ръчната изработка когато е уместно — не всеки път.\n" +
    "5. Ако клиентът пита нещо, което не знаеш — кажи че ще предадеш въпроса и човек от екипа ще отговори скоро.\n" +
    "6. НЕ използвай емотикони. НЕ използвай форматиране (bold, списъци). Пиши като нормално съобщение в Messenger.\n" +
    "7. Отговаряй САМО на български.\n" +
    "8. Ако клиентът поздрави — поздрави го и попитай с какво можеш да помогнеш.\n\n" +
    "БАЗА ЗНАНИЯ:\n" + knowledgeBase
  );
}

const client = new Anthropic();

export async function answerQuestion(question) {
  const knowledgeBase = loadKnowledgeBase();

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: buildSystemPrompt(knowledgeBase),
    messages: [{ role: "user", content: question }],
  });

  return response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");
}
