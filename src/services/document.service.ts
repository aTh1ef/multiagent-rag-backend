import { prisma } from "../lib/prisma";
import { getDocumentsIndex } from "../lib/pinecone";
import { HttpError } from "../middleware/errorHandler";

export async function listDocuments(userId: string) {
  return prisma.document.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function deleteDocument(userId: string, documentId: string) {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: { chunks: { select: { pineconeVectorId: true } } },
  });

  if (!document || document.userId !== userId) {
    throw new HttpError(404, "Document not found");
  }

  const vectorIds = document.chunks.map((c) => c.pineconeVectorId);
  if (vectorIds.length > 0) {
    const index = getDocumentsIndex();
    await index.namespace(userId).deleteMany({ ids: vectorIds });
  }

  await prisma.document.delete({ where: { id: documentId } });
}
