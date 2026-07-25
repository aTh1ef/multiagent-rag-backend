import { embedQuery } from "../../lib/gemini";
import { getDocumentsIndex } from "../../lib/pinecone";
import { prisma } from "../../lib/prisma";
import type { ChatGraphState, ChatGraphUpdate, RetrievedChunk } from "../state";

const TOP_K = 5;

export async function retrievalNode(state: ChatGraphState): Promise<ChatGraphUpdate> {
  const vector = await embedQuery(state.userMessage);
  const index = getDocumentsIndex().namespace(state.userId);

  const results = await index.query({ vector, topK: TOP_K, includeMetadata: false });
  const matches = results.matches.filter((m) => m.score !== undefined);

  if (matches.length === 0) {
    return { retrievedChunks: [] };
  }

  const chunkRows = await prisma.documentChunk.findMany({
    where: { pineconeVectorId: { in: matches.map((m) => m.id) } },
    include: { document: { select: { originalName: true } } },
  });

  const rowsById = new Map(chunkRows.map((row) => [row.pineconeVectorId, row]));

  const retrievedChunks: RetrievedChunk[] = matches
    .map((match) => {
      const row = rowsById.get(match.id);
      if (!row) return null;
      const chunk: RetrievedChunk = {
        chunkId: row.id,
        documentId: row.documentId,
        documentName: row.document.originalName,
        content: row.content,
        score: match.score ?? 0,
      };
      if (row.pageNumber !== null) chunk.pageNumber = row.pageNumber;
      return chunk;
    })
    .filter((c): c is RetrievedChunk => c !== null);

  return { retrievedChunks };
}
