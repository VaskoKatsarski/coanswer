# CoAnswer

An AI agent that answers customer messages for a small business. It receives questions on Facebook Messenger, answers them in Bulgarian using the Claude API, and sticks to a knowledge base written by the business owner.

It was built for a real use case: my family's handmade oak cooperage (barrels and bathtubs), where most customers ask the same questions about price, sizes, delivery and durability. It currently answers real customer messages on the business's Facebook Page.

## How it works

```
Customer ──> Facebook Messenger ──> POST /webhook (server.js)
                                          │
                                          ▼
                                 answerQuestion() (ai.js)
                                  system prompt + knowledge.txt
                                          │
                                          ▼
                                     Claude API
                                          │
Customer <── Facebook Send API <──────────┘
```

- `server.js` is an Express server with a webhook. `GET /webhook` handles Facebook's verification handshake. `POST /webhook` acknowledges the event immediately (Facebook retries on slow responses), then processes each message in the background, ignoring echoes and delivery or read receipts.
- `ai.js` is the shared core. It loads the knowledge base, builds the system prompt (tone, reply-length rules, when to share the phone number, how to handle price objections), and calls the Claude API.
- `agent.js` is a command-line version for testing answers without Facebook.
- `knowledge.txt` is the knowledge base, one `question | answer` pair per line. It is plain text so the business owner can edit it without touching code.

## Setup

Requires Node.js 18 or newer.

```bash
npm install
cp .env.example .env
```

Fill in `.env`:

| Variable | What it is |
| --- | --- |
| `ANTHROPIC_API_KEY` | API key for the Claude API |
| `PAGE_ACCESS_TOKEN` | Facebook Page access token, used to send replies |
| `VERIFY_TOKEN` | Any string you choose. It must match the value entered in the Facebook App's webhook settings |
| `PORT` | Optional, defaults to 3000 |

## Run

Test the agent locally without Facebook:

```bash
node agent.js "Каква е цената?"
```

Start the webhook server:

```bash
npm start
```

To receive real messages, deploy the server somewhere with a public HTTPS URL (I use Railway), set the same environment variables there, then in the Facebook App's webhook settings enter `https://<your-domain>/webhook` and your `VERIFY_TOKEN`. Subscribe the Page to the `messages` event.

## Adapting it to another business

1. Replace the entries in `knowledge.txt` with the business's real questions and answers.
2. Edit the business description, tone and rules in `buildSystemPrompt()` in `ai.js`.
3. Connect that business's Facebook Page.

## Current limitations

- Messenger only. Viber and WhatsApp are not connected yet.
- It only receives messages sent to the Facebook Page. Messages that arrive in a person's personal Marketplace inbox are not available through the Messenger API.
- The knowledge base is a static file, loaded on every message. There is no conversation memory, so each message is answered on its own.
- Replies are in Bulgarian only.

## Stack

Node.js, Express, the Anthropic SDK, the Facebook Messenger Platform (webhook and Send API), dotenv.
