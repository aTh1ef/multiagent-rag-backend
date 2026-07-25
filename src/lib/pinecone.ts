import { Pinecone } from "@pinecone-database/pinecone";
import { env } from "../config/env";

export const pinecone = new Pinecone({ apiKey: env.PINECONE_API_KEY });

export function getDocumentsIndex() {
  return pinecone.index(env.PINECONE_INDEX_NAME);
}
