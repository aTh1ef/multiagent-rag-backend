import { getChatModel } from "../../lib/gemini";
import { buildSupervisorPrompt } from "../prompts/supervisor.prompt";
import type { ChatGraphState, ChatGraphUpdate, RouteDecision } from "../state";

const SUPERVISOR_MODEL = "gemini-3.5-flash-lite" as const;
const HISTORY_WINDOW = 6;

export function parseRouteDecision(rawResponse: string): RouteDecision {
  const raw = rawResponse.trim().toLowerCase();
  if (raw.includes("rag")) return "rag";
  if (raw.includes("history")) return "history_only";
  return "general";
}

export async function supervisorNode(state: ChatGraphState): Promise<ChatGraphUpdate> {
  const model = getChatModel(SUPERVISOR_MODEL, 0);
  const prompt = buildSupervisorPrompt(state.userMessage, state.conversationHistory.slice(-HISTORY_WINDOW));

  const response = await model.invoke(prompt);
  const route = parseRouteDecision(typeof response.content === "string" ? response.content : "");

  return { route };
}
