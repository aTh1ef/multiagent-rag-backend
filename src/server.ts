import app from "./app";
import { env } from "./config/env";

const server = app.listen(env.PORT, () => {
  console.log(`Backend listening on http://localhost:${env.PORT}`);
});

// Document ingestion runs synchronously within the request and can involve several
// sequential Gemini calls, so allow more headroom than Node's 2-minute default.
server.timeout = 120_000;
