import type { ConversationTurn } from "../state";

export function buildSupervisorPrompt(userMessage: string, recentHistory: ConversationTurn[]): string {
  const historyBlock = recentHistory.length
    ? recentHistory.map((t) => `${t.role}: ${t.content}`).join("\n")
    : "(no prior messages in this session)";

  return `You are a routing classifier for a document Q&A assistant. Given the recent conversation and the user's latest message, decide which single route applies:

- "rag": the user is asking a question that should be answered using their uploaded documents.
- "history_only": the user is asking about the conversation itself (e.g. "what was my first message?", "what did I just ask?").
- "general": general chit-chat or a question unrelated to any uploaded documents.

Recent conversation:
${historyBlock}

Latest message: "${userMessage}"

Respond with exactly one word: rag, history_only, or general. No punctuation, no explanation.`;
}
