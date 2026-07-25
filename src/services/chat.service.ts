import { prisma } from "../lib/prisma";
import { HttpError } from "../middleware/errorHandler";
import { ALLOWED_GEMINI_MODELS, AllowedGeminiModel, DEFAULT_GEMINI_MODEL } from "../config/env";
import type { ConversationTurn, Citation, RouteDecision } from "../agents/state";

export function isAllowedModel(model: unknown): model is AllowedGeminiModel {
  return typeof model === "string" && (ALLOWED_GEMINI_MODELS as readonly string[]).includes(model);
}

export async function createSession(userId: string, title?: string, model?: string) {
  return prisma.chatSession.create({
    data: {
      userId,
      title: title?.trim() || "New Chat",
      model: isAllowedModel(model) ? model : DEFAULT_GEMINI_MODEL,
    },
  });
}

export async function listSessions(userId: string) {
  return prisma.chatSession.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getOwnedSession(userId: string, sessionId: string) {
  const session = await prisma.chatSession.findUnique({ where: { id: sessionId } });
  if (!session || session.userId !== userId) {
    throw new HttpError(404, "Chat session not found");
  }
  return session;
}

export async function updateSessionModel(userId: string, sessionId: string, model: string) {
  await getOwnedSession(userId, sessionId);
  if (!isAllowedModel(model)) {
    throw new HttpError(400, `Unsupported model. Allowed: ${ALLOWED_GEMINI_MODELS.join(", ")}`);
  }
  return prisma.chatSession.update({ where: { id: sessionId }, data: { model } });
}

export async function deleteSession(userId: string, sessionId: string) {
  await getOwnedSession(userId, sessionId);
  await prisma.chatSession.delete({ where: { id: sessionId } });
}

export async function listMessages(userId: string, sessionId: string) {
  await getOwnedSession(userId, sessionId);
  return prisma.message.findMany({
    where: { sessionId },
    orderBy: { sequence: "asc" },
  });
}

// Bounds how much conversation gets pulled into the LLM prompt for very long-running sessions.
// 200 messages (100 turns) is generous for a personal-scale app while keeping prompt size and
// DB read cost predictable regardless of how old or long a session gets.
const MAX_HISTORY_MESSAGES = 200;

export async function loadHistory(sessionId: string): Promise<ConversationTurn[]> {
  const messages = await prisma.message.findMany({
    where: { sessionId },
    orderBy: { sequence: "desc" },
    take: MAX_HISTORY_MESSAGES,
  });

  return messages.reverse().map((m) => ({
    role: m.role === "USER" ? "user" : "assistant",
    content: m.content,
    createdAt: m.createdAt.toISOString(),
  }));
}

export async function saveTurn(
  sessionId: string,
  userContent: string,
  assistantContent: string,
  citations: Citation[],
  route: RouteDecision
) {
  const last = await prisma.message.findFirst({
    where: { sessionId },
    orderBy: { sequence: "desc" },
    select: { sequence: true },
  });

  const nextSequence = (last?.sequence ?? 0) + 1;

  const [userMessage, assistantMessage] = await prisma.$transaction([
    prisma.message.create({
      data: { sessionId, role: "USER", content: userContent, sequence: nextSequence },
    }),
    prisma.message.create({
      data: {
        sessionId,
        role: "ASSISTANT",
        content: assistantContent,
        citations: citations.length > 0 ? (citations as unknown as object) : undefined,
        route,
        sequence: nextSequence + 1,
      },
    }),
    prisma.chatSession.update({ where: { id: sessionId }, data: { updatedAt: new Date() } }),
  ]);

  return { userMessage, assistantMessage };
}
