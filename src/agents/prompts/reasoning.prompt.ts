import type { ChatGraphState } from "../state";

const BASE_SYSTEM_PROMPT =
  "You are a helpful assistant embedded in a document Q&A chatbot. Be concise and direct.";

const RAG_GROUNDING_RULE =
  "Answer only using the numbered context chunks below. Cite every chunk you rely on inline using its number in " +
  "square brackets, e.g. [1] or [2][3]. If the answer is not present in the context, say plainly that the " +
  "uploaded documents don't contain that information — do not use outside knowledge or make anything up.";

function formatHistory(history: ChatGraphState["conversationHistory"]): string {
  if (history.length === 0) return "(no prior messages in this session)";
  return history.map((t) => `${t.role}: ${t.content}`).join("\n");
}

function formatChunks(chunks: ChatGraphState["retrievedChunks"]): string {
  return chunks
    .map((chunk, i) => `[${i + 1}] (from "${chunk.documentName}"${chunk.pageNumber ? `, page ${chunk.pageNumber}` : ""})\n${chunk.content}`)
    .join("\n\n");
}

export function buildReasoningMessages(state: ChatGraphState): [string, string][] {
  const historyLimit = state.route === "history_only" ? state.conversationHistory.length : 10;
  const relevantHistory = state.conversationHistory.slice(-historyLimit);

  if (state.route === "rag") {
    const system = `${BASE_SYSTEM_PROMPT}\n\n${RAG_GROUNDING_RULE}`;
    const human = `Conversation so far:\n${formatHistory(relevantHistory)}\n\nContext chunks:\n${formatChunks(
      state.retrievedChunks
    )}\n\nUser question: ${state.userMessage}`;
    return [
      ["system", system],
      ["human", human],
    ];
  }

  const human = `Conversation so far:\n${formatHistory(relevantHistory)}\n\nUser message: ${state.userMessage}`;
  return [
    ["system", BASE_SYSTEM_PROMPT],
    ["human", human],
  ];
}
