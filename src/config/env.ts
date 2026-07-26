import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is required"),
  GEMINI_EMBEDDING_MODEL: z.string().default("gemini-embedding-001"),
  PINECONE_API_KEY: z.string().min(1, "PINECONE_API_KEY is required"),
  PINECONE_INDEX_NAME: z.string().min(1, "PINECONE_INDEX_NAME is required"),
  FRONTEND_ORIGIN: z.string().default("http://localhost:3000"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:");
  console.error(parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment configuration. Check backend/.env against .env.example.");
}

export const env = parsed.data;

// Supports a comma-separated list so both a production domain and a Vercel preview URL
// (or www/non-www variants) can be allowed without opening CORS up to "*".
export const ALLOWED_ORIGINS = env.FRONTEND_ORIGIN.split(",").map((origin) => origin.trim());

// Gemini free-tier model availability has proven inconsistent across API keys/projects:
// gemini-2.5-pro and gemini-2.5-flash-lite returned permanent (limit: 0) errors on one key,
// and gemini-2.5-flash itself ("no longer available to new users") was blocked on another.
// The gemini-3.x family has been the one consistently working tier across every key tested,
// so the picker standardizes on that instead of mixing generations.
export const ALLOWED_GEMINI_MODELS = ["gemini-3.5-flash-lite", "gemini-3.5-flash", "gemini-3.6-flash"] as const;

export type AllowedGeminiModel = (typeof ALLOWED_GEMINI_MODELS)[number];

export const DEFAULT_GEMINI_MODEL: AllowedGeminiModel = "gemini-3.5-flash";
