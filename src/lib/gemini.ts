import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { env, AllowedGeminiModel } from "../config/env";

export function getChatModel(model: AllowedGeminiModel, temperature = 0.2) {
  return new ChatGoogleGenerativeAI({
    apiKey: env.GEMINI_API_KEY,
    model,
    temperature,
  });
}

export const EMBEDDING_DIMENSION = 768;

const EMBEDDING_MODEL = env.GEMINI_EMBEDDING_MODEL;
const EMBED_BATCH_SIZE = 100;
const GENERATIVE_LANGUAGE_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

// The @google/generative-ai / @langchain/google-genai SDKs predate Gemini's current embedding
// models (gemini-embedding-001+) and don't support `outputDimensionality` or per-request `model`
// in batch calls, so we talk to the REST API directly to get 768-dim vectors matching the
// Pinecone index (gemini-embedding-001 defaults to 3072 dimensions otherwise).
async function callGeminiApi<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${GENERATIVE_LANGUAGE_BASE_URL}/${path}?key=${env.GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Gemini API error (${res.status}) on ${path}: ${errorBody}`);
  }

  return res.json() as Promise<T>;
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

interface BatchEmbedResponse {
  embeddings: { values: number[] }[];
}

interface EmbedResponse {
  embedding: { values: number[] };
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const results: number[][] = [];

  for (const batch of chunk(texts, EMBED_BATCH_SIZE)) {
    const response = await callGeminiApi<BatchEmbedResponse>(`models/${EMBEDDING_MODEL}:batchEmbedContents`, {
      requests: batch.map((text) => ({
        model: `models/${EMBEDDING_MODEL}`,
        content: { parts: [{ text }] },
        outputDimensionality: EMBEDDING_DIMENSION,
      })),
    });
    results.push(...response.embeddings.map((e) => e.values));
  }

  return results;
}

export async function embedQuery(text: string): Promise<number[]> {
  const response = await callGeminiApi<EmbedResponse>(`models/${EMBEDDING_MODEL}:embedContent`, {
    content: { parts: [{ text }] },
    outputDimensionality: EMBEDDING_DIMENSION,
  });
  return response.embedding.values;
}
