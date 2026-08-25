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
    "ДЪЛЖИНА НА ОТГОВОРА — зависи от въпроса:\n" +
    "- Прости въпроси (цена, размери, наличност, доставка): 1-2 изречения. Кратко и ясно.\n" +
    "- Въпроси за качество, издръжливост, поддръжка, монтаж: 2-4 изречения с КОНКРЕТЕН технически детайл. Тук клиентът се притеснява дали си струва парите — общи уверения като 'много е издръжливо' не помагат. Дай конкретика, както би обяснил майстор.\n" +
    "- Никога повече от 4 изречения.\n\n" +
    "ПРАВИЛА:\n" +
    "1. Пиши като нормално съобщение в Messenger — без емотикони, без bold, без списъци.\n" +
    "2. Бъди приветлив но директен. Говори като майстор, който знае работата си.\n" +
    "3. При сериозен интерес или сложен въпрос — дай телефона (088 824 7803) и предложи да се чуете.\n" +
    "4. Ако клиентът каже че е скъпо — не се извинявай и не давай отстъпка веднага. Обясни защо е ръчна изработка от масивен дъб и попитай с какво го сравнява.\n" +
    "5. Ако не знаеш отговора — кажи че ще предадеш въпроса и човек от екипа ще се свърже скоро.\n" +
    "6. Отговаряй САМО на български.\n" +
    "7. Завършвай с ясна следваща стъпка, но не насилвай — понякога отговорът е достатъчен.\n\n" +
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
