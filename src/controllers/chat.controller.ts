import { Request, Response } from "express";
import { z } from "zod";
import * as chatService from "../services/chat.service";
import { runChatGraph } from "../agents/graph";
import { HttpError } from "../middleware/errorHandler";
import { DEFAULT_GEMINI_MODEL } from "../config/env";

const createSessionSchema = z.object({
  title: z.string().min(1).optional(),
  model: z.string().optional(),
});

const updateSessionSchema = z.object({
  model: z.string(),
});

const sendMessageSchema = z.object({
  content: z.string().min(1, "Message content is required"),
});

export async function createSession(req: Request, res: Response) {
  const body = createSessionSchema.parse(req.body);
  const session = await chatService.createSession(req.user!.userId, body.title, body.model);
  res.status(201).json(session);
}

export async function listSessions(req: Request, res: Response) {
  const sessions = await chatService.listSessions(req.user!.userId);
  res.status(200).json({ sessions });
}

export async function getSession(req: Request, res: Response) {
  const session = await chatService.getOwnedSession(req.user!.userId, String(req.params.id));
  res.status(200).json(session);
}

export async function updateSession(req: Request, res: Response) {
  const body = updateSessionSchema.parse(req.body);
  const session = await chatService.updateSessionModel(req.user!.userId, String(req.params.id), body.model);
  res.status(200).json(session);
}

export async function deleteSession(req: Request, res: Response) {
  await chatService.deleteSession(req.user!.userId, String(req.params.id));
  res.status(204).send();
}

export async function listMessages(req: Request, res: Response) {
  const messages = await chatService.listMessages(req.user!.userId, String(req.params.id));
  res.status(200).json({ messages });
}

export async function sendMessage(req: Request, res: Response) {
  const userId = req.user!.userId;
  const sessionId = String(req.params.id);
  const body = sendMessageSchema.parse(req.body);

  const session = await chatService.getOwnedSession(userId, sessionId);
  const conversationHistory = await chatService.loadHistory(sessionId);

  // Guards against sessions created before a model was removed from the allowlist (e.g. a
  // Gemini model that stopped being available on this API key/project after the session existed).
  const model = chatService.isAllowedModel(session.model) ? session.model : DEFAULT_GEMINI_MODEL;

  const result = await runChatGraph({
    userId,
    sessionId,
    userMessage: body.content,
    model,
    conversationHistory,
  });

  if (!result.finalAnswer) {
    throw new HttpError(500, "The assistant did not produce a response");
  }

  const { userMessage, assistantMessage } = await chatService.saveTurn(
    sessionId,
    body.content,
    result.finalAnswer,
    result.citations,
    result.route ?? "general"
  );

  res.status(200).json({ userMessage, assistantMessage });
}
