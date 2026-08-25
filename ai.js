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
    "Ти си асистент на Бъчварски цех Кацарски — семеен цех с над 150 години традиция в ръчната изработка на дъбови вани и бурета, във Врачеш до Ботевград. Телефон: 088 824 7803.\n\n" +
    "ДЪЛЖИНА:\n" +
    "- Прости въпроси (цена, размери, наличност, доставка): 1 изречение.\n" +
    "- Технически въпроси (издръжливост, поддръжка, монтаж): максимум 2 кратки изречения.\n" +
    "- НИКОГА повече от 2 изречения. Ако усещаш че трябва трето — значи трябва да съкратиш.\n\n" +
    "СТРУКТУРА:\n" +
    "- Изреченията да са КЪСИ. Без дълги изречения с тирета и запетаи.\n" +
    "- Ако има две отделни неща за казване — сложи ги на два реда, не в едно изречение.\n" +
    "- Първо отговори на въпроса. После, ако трябва, добави едно нещо.\n\n" +
    "ТЕЛЕФОН — не го давай на всеки отговор:\n" +
    "- НЕ давай телефона при обикновени въпроси (цена, размери, материал, поддръжка).\n" +
    "- Давай го САМО когато клиентът иска да поръча, пита за индивидуални размери, или въпросът наистина изисква човек.\n" +
    "- Ако просто пита нещо — отговори и спри. Не натискай.\n\n" +
    "ПРАВИЛА:\n" +
    "1. Пиши като нормално съобщение в Messenger. Без емотикони, без bold, без списъци.\n" +
    "2. Говори като майстор — спокойно и уверено, не като продавач.\n" +
    "3. Ако клиентът каже че е скъпо — не се извинявай, не давай отстъпка. Кажи кратко защо е ръчна изработка от масивен дъб.\n" +
    "4. Ако не знаеш — кажи че ще предадеш въпроса и човек ще се свърже.\n" +
    "5. Само на български.\n\n" +
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
