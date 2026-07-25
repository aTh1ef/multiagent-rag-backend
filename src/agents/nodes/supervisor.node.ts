import { getChatModel } from "../../lib/gemini";
import { buildSupervisorPrompt } from "../prompts/supervisor.prompt";
import type { ChatGraphState, ChatGraphUpdate, RouteDecision } from "../state";

const SUPERVISOR_MODEL = "gemini-3.5-flash-lite" as const;
const HISTORY_WINDOW = 6;

export async function supervisorNode(state: ChatGraphState): Promise<ChatGraphUpdate> {
  const model = getChatModel(SUPERVISOR_MODEL, 0);
  const prompt = buildSupervisorPrompt(state.userMessage, state.conversationHistory.slice(-HISTORY_WINDOW));

  const response = await model.invoke(prompt);
  const raw = (typeof response.content === "string" ? response.content : "").trim().toLowerCase();

  let route: RouteDecision = "general";
  if (raw.includes("rag")) route = "rag";
  else if (raw.includes("history")) route = "history_only";

  return { route };
}
