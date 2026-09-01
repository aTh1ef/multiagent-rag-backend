# Multi-Agent RAG Backend

An Express API that answers questions about documents you upload, using a multi-agent graph rather than a single retrieval call. A supervisor agent decides how to handle each message, a retrieval agent pulls relevant chunks from a vector store, and a reasoning agent composes the answer.

## How it works

```
request -> auth -> supervisor node -> retrieval node -> reasoning node -> response
                        |                  |
                        |                  +-- Pinecone vector search
                        +-- routes the message: retrieve, reason, or answer directly
```

The graph is built with **LangGraph**, so each node is a discrete step with its own prompt and the routing between them is explicit and testable, instead of one large prompt doing everything.

Documents are uploaded via `multer`, parsed (including `.docx` through `mammoth`), chunked, embedded, and stored in Pinecone. Conversations and message routes are persisted in Postgres through Prisma.

## Tech stack

| Concern | Choice |
|---|---|
| Runtime | Node.js + TypeScript, run with `tsx` |
| API | Express, `express-rate-limit`, `cors`, `cookie-parser` |
| Agents | LangGraph (`@langchain/langgraph`), `@langchain/core` |
| LLM | Google Gemini (`@langchain/google-genai`, `@google/generative-ai`) |
| Vector store | Pinecone |
| Database | PostgreSQL via Prisma (`@prisma/adapter-pg`) |
| Auth | JWT (`jsonwebtoken`) + `bcrypt` password hashing |
| Uploads | `multer`, `mammoth` for Word documents |
| Tests | Vitest |

## Project layout

```
src/
├── app.ts                    # Express app and middleware
├── server.ts                 # Entry point
├── config/env.ts             # Environment validation
├── agents/
│   ├── graph.ts              # LangGraph wiring
│   ├── state.ts              # Shared graph state
│   ├── nodes/                # supervisor, retrieval, reasoning (+ tests)
│   └── prompts/              # One prompt file per agent
├── controllers/              # auth and other route handlers
prisma/
├── schema.prisma
└── migrations/               # init, add_message_route, update_default_gemini_model
docs/architecture.pdf
```

## Running it

Prerequisites: Node.js 18+, a PostgreSQL database, a Pinecone index, and a Gemini API key.

```bash
npm install
```

```bash
cp .env.example .env
```

Fill in the database URL, Pinecone credentials and Gemini key, then set up the schema:

```bash
npm run prisma:migrate
```

Start in watch mode:

```bash
npm run dev
```

Production:

```bash
npm start
```

### Other commands

```bash
npm test
```

```bash
npm run typecheck
```

```bash
npm run prisma:studio
```

## Related

The frontend for this API lives in [`multiagent-rag-frontend`](https://github.com/aTh1ef/multiagent-rag-frontend).

## Known gaps

- Only the supervisor and reasoning nodes have tests; retrieval and the graph wiring are uncovered.
- No streaming — answers return once the full graph run completes.
- Rate limiting is global rather than per-user.
