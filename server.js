import "dotenv/config";
import express from "express";
import { answerQuestion } from "./ai.js";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const SEND_API_URL = "https://graph.facebook.com/v21.0/me/messages";

if (!VERIFY_TOKEN) console.warn("Warning: VERIFY_TOKEN is not set.");
if (!PAGE_ACCESS_TOKEN) console.warn("Warning: PAGE_ACCESS_TOKEN is not set.");

// Facebook webhook verification handshake.
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook verified.");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Incoming Messenger events.
app.post("/webhook", (req, res) => {
  const body = req.body;

  if (body.object !== "page") {
    res.sendStatus(404);
    return;
  }

  // Acknowledge immediately — Facebook expects a fast response and retries on timeout.
  res.status(200).send("EVENT_RECEIVED");

  for (const entry of body.entry ?? []) {
    for (const event of entry.messaging ?? []) {
      handleMessagingEvent(event).catch((error) => {
        console.error("Error handling messaging event:", error);
      });
    }
  }
});

async function handleMessagingEvent(event) {
  // Ignore echoes of the page's own messages, and delivery/read receipts.
  if (event.message?.is_echo) return;
  if (event.delivery || event.read) return;

  const senderPsid = event.sender?.id;
  const messageText = event.message?.text;

  if (!senderPsid || !messageText) return;

  const answer = await answerQuestion(messageText);
  await sendMessage(senderPsid, answer);
}

async function sendMessage(psid, text) {
  const url = `${SEND_API_URL}?access_token=${encodeURIComponent(PAGE_ACCESS_TOKEN)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: { id: psid },
      message: { text },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Facebook Send API error ${response.status}: ${errorBody}`);
  }
}

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
