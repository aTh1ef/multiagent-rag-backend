import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { ALLOWED_ORIGINS } from "./config/env";
import routes from "./routes";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

// Render (and most PaaS hosts) sit behind a reverse proxy — trust the first hop's
// X-Forwarded-For so req.ip reflects the real client instead of the proxy, which
// rate limiting and any future IP-based logic depend on.
app.set("trust proxy", 1);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow same-server requests (curl, health checks) that send no Origin header at all.
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} is not allowed by CORS`));
      }
    },
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api", routes);

app.use(errorHandler);

export default app;
