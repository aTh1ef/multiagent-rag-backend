import { prisma } from "../lib/prisma";
import { embedTexts } from "../lib/gemini";
import { getDocumentsIndex } from "../lib/pinecone";
import { extractText } from "../utils/textExtraction";
import { splitIntoChunks } from "../utils/chunking";

const BATCH_SIZE = 100;

interface PendingChunk {
  chunkIndex: number;
  pageNumber?: number;
  content: string;
}

function batch<T>(items: T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    batches.push(items.slice(i, i + size));
  }
  return batches;
}

export async function processDocument(
  userId: string,
  file: { buffer: Buffer; originalname: string; mimetype: string; size: number }
) {
  const document = await prisma.document.create({
    data: {
      userId,
      originalName: file.originalname,
      mimeType: file.mimetype,
      fileSizeBytes: file.size,
      status: "PROCESSING",
    },
  });

  const upsertedVectorIds: string[] = [];

  try {
    const pages = await extractText(file.buffer, file.mimetype);

    const pendingChunks: PendingChunk[] = [];
    let chunkIndex = 0;
    for (const page of pages) {
      for (const content of splitIntoChunks(page.text)) {
        pendingChunks.push({ chunkIndex: chunkIndex++, pageNumber: page.pageNumber, content });
      }
    }

    if (pendingChunks.length === 0) {
      throw new Error("No extractable text found in this document");
    }

    const index = getDocumentsIndex().namespace(userId);

    for (const chunkBatch of batch(pendingChunks, BATCH_SIZE)) {
      const vectors = await embedTexts(chunkBatch.map((c) => c.content));

      const records = chunkBatch.map((chunk, i) => ({
        id: `${document.id}-${chunk.chunkIndex}`,
        values: vectors[i],
        metadata: {
          userId,
          documentId: document.id,
          documentName: file.originalname,
          chunkIndex: chunk.chunkIndex,
          ...(chunk.pageNumber !== undefined ? { pageNumber: chunk.pageNumber } : {}),
        },
      }));

      await index.upsert({ records });
      upsertedVectorIds.push(...records.map((r) => r.id));

      await prisma.documentChunk.createMany({
        data: chunkBatch.map((chunk, i) => ({
          documentId: document.id,
          userId,
          pineconeVectorId: records[i].id,
          chunkIndex: chunk.chunkIndex,
          pageNumber: chunk.pageNumber,
          content: chunk.content,
        })),
      });
    }

    const pageNumbers = pages.map((p) => p.pageNumber).filter((n): n is number => n !== undefined);

    return prisma.document.update({
      where: { id: document.id },
      data: {
        status: "COMPLETED",
        pageCount: pageNumbers.length > 0 ? Math.max(...pageNumbers) : null,
        chunkCount: pendingChunks.length,
      },
    });
  } catch (err) {
    if (upsertedVectorIds.length > 0) {
      await getDocumentsIndex()
        .namespace(userId)
        .deleteMany({ ids: upsertedVectorIds })
        .catch(() => {});
    }

    const message = err instanceof Error ? err.message : "Failed to process document";
    await prisma.document.update({
      where: { id: document.id },
      data: { status: "FAILED", errorMessage: message },
    });

    throw err;
  }
}
